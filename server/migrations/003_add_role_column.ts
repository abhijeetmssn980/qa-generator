// Add role column to users table
import pool from '../pool';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add role column to users table
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
    `);

    await client.query('COMMIT');
    console.log('✅ Migration 003: Role column added successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration 003 failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
