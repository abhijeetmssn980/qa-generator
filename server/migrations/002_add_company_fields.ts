// Add company fields to users table
import pool from '../pool';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add company columns to users table
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS company_logo VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS company_address TEXT;
    `);

    // Add owner_uid to products table to scope by user
    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS owner_uid VARCHAR(100);
    `);

    await client.query('COMMIT');
    console.log('✅ Migration 002: Company fields added successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration 002 failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
