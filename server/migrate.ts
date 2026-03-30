// Run this once to create tables in PostgreSQL
import pool from './pool';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Companies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id                SERIAL PRIMARY KEY,
        name              VARCHAR(255) UNIQUE NOT NULL,
        logo              VARCHAR(500),
        address           TEXT,
        phone             VARCHAR(20),
        email             VARCHAR(255),
        website           VARCHAR(255),
        created_at        TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        uid               VARCHAR(100) PRIMARY KEY,
        email             VARCHAR(255) UNIQUE NOT NULL,
        password          VARCHAR(255) NOT NULL,
        company_id        INTEGER REFERENCES companies(id),
        company_name      VARCHAR(255),
        company_logo      VARCHAR(500),
        company_address   TEXT,
        role              VARCHAR(50) DEFAULT 'viewer',
        created_at        TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id                    SERIAL PRIMARY KEY,
        unique_id             VARCHAR(100) UNIQUE NOT NULL,
        name                  VARCHAR(255) NOT NULL,
        batch                 VARCHAR(100),
        mfg                   VARCHAR(100),
        expiry                VARCHAR(100),
        short_url             VARCHAR(255),
        manufacturer          VARCHAR(255),
        manufacturer_address  TEXT,
        technical_name        VARCHAR(255),
        registration_number   VARCHAR(255),
        packing_size          VARCHAR(100),
        manufacturer_licence  VARCHAR(255),
        image_url             VARCHAR(500),
        hazard_symbol         VARCHAR(100),
        owner_uid             VARCHAR(100) REFERENCES users(uid),
        active                VARCHAR(1) DEFAULT 'Y',
        created_at            TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
