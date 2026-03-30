import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { findUserByEmail, addUser } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'qa-generator-secret-key-2026';

// Logo upload setup
const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local = path.dirname(__filename_local);
const uploadsDir = path.join(__dirname_local, '..', '..', 'uploads', 'logos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `logo-${uuidv4().slice(0, 8)}${ext}`);
  },
});
const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed (png, jpg, svg, webp)'));
  },
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { uid: user.uid, email: user.email, companyName: user.companyName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        uid: user.uid,
        email: user.email,
        companyName: user.companyName,
        companyLogo: user.companyLogo,
        companyAddress: user.companyAddress,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/signup — [DISABLED] Regular signup not allowed
router.post('/signup', async (req, res) => {
  try {
    return res.status(403).json({
      error: 'Self-registration is disabled. Contact your administrator to create an account.',
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/create-user — Admin only endpoint to create new users
router.post('/create-user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify admin token
    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { uid: string; email: string };
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if user is admin
    const adminUser = await findUserByEmail(decoded.email);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create users' });
    }

    // Create new user
    const { email, password, companyId, companyName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validate role
    const validRoles = ['admin', 'editor', 'viewer'];
    const assignedRole = validRoles.includes(role) ? role : 'viewer';

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      uid: uuidv4(),
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      companyId: companyId || undefined,
      companyName: companyName || 'My Company',
      companyLogo: undefined,
      companyAddress: undefined,
      role: assignedRole as 'admin' | 'editor' | 'viewer',
    };

    await addUser(newUser);

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        uid: newUser.uid,
        email: newUser.email,
        companyName: newUser.companyName,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error('Create user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me — verify token and return user info
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { uid: string; email: string };
    const user = await findUserByEmail(decoded.email);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        uid: user.uid,
        email: user.email,
        companyName: user.companyName,
        companyLogo: user.companyLogo,
        companyAddress: user.companyAddress,
        role: user.role,
      },
    });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// POST /api/auth/upload-logo — upload a company logo image
router.post('/upload-logo', logoUpload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the URL that can be used as companyLogo
    const logoUrl = `http://localhost:${process.env.PORT || 3001}/uploads/logos/${req.file.filename}`;
    return res.json({ url: logoUrl });
  } catch (err: any) {
    console.error('Logo upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload logo' });
  }
});

export default router;
