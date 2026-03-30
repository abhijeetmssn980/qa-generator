import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Ensure binary data is handled correctly
const Pool = pg.Pool;

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'admin',
    });

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});

// Add a type parser for bytea to handle binary data
pg.types.setTypeParser(
  pg.types.builtins.BYTEA,
  'binary',
  (buf) => buf
);

export default pool;
