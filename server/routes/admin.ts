import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware';
import pool from '../pool';
import { getLockedUsers, unlockUser, lockUser, getAllUsers } from '../db';
import { generateSqlDump, runDailyBackup } from '../backup';

const router = Router();

// GET /api/admin/export-sql — export full DB as .sql (admin only)
router.get('/export-sql', authenticateToken, requireRole('admin'), async (_req: Request, res: Response) => {
  try {
    const sql = await generateSqlDump();
    const filename = `db-export-${new Date().toISOString().slice(0, 10)}.sql`;
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(sql);
  } catch (err) {
    console.error('SQL export error:', err);
    res.status(500).json({ error: 'Failed to export database' });
  }
});

// POST /api/admin/backup-now — trigger the daily S3 backup immediately (admin only)
router.post('/backup-now', authenticateToken, requireRole('admin'), async (_req: Request, res: Response) => {
  try {
    await runDailyBackup();
    res.json({ message: 'Backup completed' });
  } catch (err) {
    console.error('Manual backup error:', err);
    res.status(500).json({ error: 'Backup failed' });
  }
});

// GET /api/admin/users — list all users (admin only)
router.get('/users', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const companyId = decoded?.companyId ? Number(decoded.companyId) : undefined;
    const users = await getAllUsers(companyId);
    res.json({ users });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users/:uid/lock — manually lock a user (admin only)
router.post('/users/:uid/lock', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    // get email from uid
    const { rows } = await pool.query('SELECT email FROM users WHERE uid = $1', [uid]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    await lockUser(rows[0].email);
    res.json({ message: 'User locked successfully' });
  } catch (err) {
    console.error('Lock user error:', err);
    res.status(500).json({ error: 'Failed to lock user' });
  }
});

// GET /api/admin/locked-users — list all locked user accounts (admin only)
router.get('/locked-users', authenticateToken, requireRole('admin'), async (_req: Request, res: Response) => {
  try {
    const users = await getLockedUsers();
    res.json({ users });
  } catch (err) {
    console.error('Get locked users error:', err);
    res.status(500).json({ error: 'Failed to fetch locked users' });
  }
});

// POST /api/admin/users/:uid/unlock — unlock a user account (admin only)
router.post('/users/:uid/unlock', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    await unlockUser(uid);
    res.json({ message: 'User unlocked successfully' });
  } catch (err) {
    console.error('Unlock user error:', err);
    res.status(500).json({ error: 'Failed to unlock user' });
  }
});

export default router;
