import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import * as XLSX from 'xlsx';
import {
  getProducts,
  getTrashProducts,
  getProductByUniqueId,
  addProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  permanentDeleteProduct,
  findUserByEmail,
} from '../db';
import type { Request, Response, NextFunction } from 'express';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'qa-generator-secret-key-2026';

// Multer: store uploaded file in memory
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Auth middleware — sets req.user with uid, email, role
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { uid: string; email: string };
    (req as any).user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Role-check helper: loads full user from DB to get role, then checks against allowed roles
function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const decoded = (req as any).user;
      if (!decoded?.email) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const user = await findUserByEmail(decoded.email);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      const role = user.role || 'viewer';
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ error: 'You do not have permission to perform this action' });
      }
      (req as any).userRole = role;
      return next();
    } catch (err) {
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

// GET /api/products — list products filtered by user's company
router.get('/', authenticate, async (_req, res) => {
  try {
    const decoded = (_req as any).user;
    const user = decoded?.email ? await findUserByEmail(decoded.email) : null;
    const companyName = user?.companyName || undefined;
    const products = await getProducts(companyName);
    return res.json({ products });
  } catch (err) {
    console.error('Get products error:', err);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/trash/list — get soft-deleted products filtered by company (MUST come before /:uniqueId)
router.get('/trash/list', authenticate, async (_req, res) => {
  try {
    const decoded = (_req as any).user;
    const user = decoded?.email ? await findUserByEmail(decoded.email) : null;
    const companyName = user?.companyName || undefined;
    const products = await getTrashProducts(companyName);
    return res.json({ products });
  } catch (err) {
    console.error('Get trash error:', err);
    return res.status(500).json({ error: 'Failed to fetch trash' });
  }
});

// GET /api/products/:uniqueId — get single product
router.get('/:uniqueId', async (_req, res) => {
  try {
    const product = await getProductByUniqueId(_req.params.uniqueId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json({ product });
  } catch (err) {
    console.error('Get product error:', err);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products — add a new product (admin or editor only)
router.post('/', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const body = req.body;
    const user = (req as any).user;
    const product = {
      id: body.id || Date.now(),
      uniqueId: body.uniqueId || uuidv4().replace(/-/g, '').slice(0, 9),
      name: body.name,
      batch: body.batch,
      mfg: body.mfg,
      expiry: body.expiry,
      shortUrl: body.shortUrl || `qr-1.in/a.php?x=${uuidv4().slice(0, 5)}`,
      manufacturer: body.manufacturer,
      manufacturerAddress: body.manufacturerAddress,
      technicalName: body.technicalName,
      registrationNumber: body.registrationNumber,
      packingSize: body.packingSize,
      manufacturerLicence: body.manufacturerLicence,
      imageUrl: body.imageUrl,
      hazardSymbol: body.hazardSymbol,
      owner_uid: user.uid,
    };

    const saved = await addProduct(product);
    return res.status(201).json({ product: saved });
  } catch (err) {
    console.error('Add product error:', err);
    return res.status(500).json({ error: 'Failed to add product' });
  }
});

// PUT /api/products/:uniqueId — update a product (admin or editor only)
router.put('/:uniqueId', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const updated = await updateProduct(req.params.uniqueId as string, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json({ product: updated });
  } catch (err) {
    console.error('Update product error:', err);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:uniqueId — soft delete a product (set active='N')
router.delete('/:uniqueId', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const deleted = await deleteProduct(req.params.uniqueId as string);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json({ message: 'Product moved to trash' });
  } catch (err) {
    console.error('Delete product error:', err);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST /api/products/:uniqueId/restore — restore a soft-deleted product
router.post('/:uniqueId/restore', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const restored = await restoreProduct(req.params.uniqueId as string);
    if (!restored) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json({ message: 'Product restored' });
  } catch (err) {
    console.error('Restore product error:', err);
    return res.status(500).json({ error: 'Failed to restore product' });
  }
});

// DELETE /api/products/:uniqueId/permanent — permanently delete
router.delete('/:uniqueId/permanent', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await permanentDeleteProduct(req.params.uniqueId as string);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json({ message: 'Product permanently deleted' });
  } catch (err) {
    console.error('Permanent delete error:', err);
    return res.status(500).json({ error: 'Failed to permanently delete product' });
  }
});

// GET /api/products/search?q=query — search products
router.get('/search', authenticate, async (req, res) => {
  try {
    const query = (req.query.q as string || '').toLowerCase();
    const allProducts = await getProducts();
    const products = allProducts.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.manufacturer?.toLowerCase().includes(query) ||
        p.technicalName?.toLowerCase().includes(query)
    );
    return res.json({ products });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
});

// POST /api/products/bulk-upload — bulk import from Excel (admin only)
router.post('/bulk-upload', authenticate, requireRole('admin'), upload.single('file'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse the Excel file from memory buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ error: 'Excel file has no sheets' });
    }

    const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Excel file has no data rows' });
    }

    // Normalise header keys (trim, lowercase) for flexible matching
    const normalise = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const headerMap: Record<string, string> = {
      productname: 'name',
      name: 'name',
      batchnumber: 'batch',
      batch: 'batch',
      batchno: 'batch',
      manufacturingdate: 'mfg',
      mfgdate: 'mfg',
      mfg: 'mfg',
      expirydate: 'expiry',
      expiry: 'expiry',
      exp: 'expiry',
      shorturl: 'shortUrl',
      url: 'shortUrl',
      manufacturer: 'manufacturer',
      manufactureraddress: 'manufacturerAddress',
      address: 'manufacturerAddress',
      technicalname: 'technicalName',
      technical: 'technicalName',
      registrationnumber: 'registrationNumber',
      regno: 'registrationNumber',
      registration: 'registrationNumber',
      packingsize: 'packingSize',
      packing: 'packingSize',
      manufacturerlicence: 'manufacturerLicence',
      licence: 'manufacturerLicence',
      license: 'manufacturerLicence',
    };

    const results = { inserted: 0, skipped: 0, errors: [] as string[] };

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const mapped: Record<string, string> = {};

      // Map Excel columns to product fields
      for (const key of Object.keys(raw)) {
        const norm = normalise(key);
        const field = headerMap[norm];
        if (field) {
          mapped[field] = String(raw[key]).trim();
        }
      }

      // Require at least a product name
      if (!mapped.name) {
        results.errors.push(`Row ${i + 2}: Missing product name — skipped`);
        results.skipped++;
        continue;
      }

      try {
        await addProduct({
          id: Date.now() + i,
          uniqueId: uuidv4().replace(/-/g, '').slice(0, 9),
          name: mapped.name,
          batch: mapped.batch || '',
          mfg: mapped.mfg || '',
          expiry: mapped.expiry || '',
          shortUrl: mapped.shortUrl || `qr-1.in/a.php?x=${uuidv4().slice(0, 5)}`,
          manufacturer: mapped.manufacturer || undefined,
          manufacturerAddress: mapped.manufacturerAddress || undefined,
          technicalName: mapped.technicalName || undefined,
          registrationNumber: mapped.registrationNumber || undefined,
          packingSize: mapped.packingSize || undefined,
          manufacturerLicence: mapped.manufacturerLicence || undefined,
          owner_uid: user.uid,
        });
        results.inserted++;
      } catch (err: any) {
        results.errors.push(`Row ${i + 2}: ${err.message}`);
        results.skipped++;
      }
    }

    return res.json({
      message: `Imported ${results.inserted} products, ${results.skipped} skipped`,
      inserted: results.inserted,
      skipped: results.skipped,
      errors: results.errors,
      totalRows: rows.length,
    });
  } catch (err) {
    console.error('Bulk upload error:', err);
    return res.status(500).json({ error: 'Failed to process Excel file' });
  }
});

export default router;
