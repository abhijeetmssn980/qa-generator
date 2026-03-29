# PostgreSQL Database Setup Guide

## Quick Start

### Option 1: Automated Setup (Recommended)

#### macOS
```bash
# Make script executable
chmod +x database/setup_postgres.sh

# Run setup
./database/setup_postgres.sh
```

#### Linux
```bash
# Make script executable
chmod +x database/setup_postgres.sh

# Run setup
./database/setup_postgres.sh
```

#### Windows (Using Git Bash or WSL)
```bash
bash database/setup_postgres.sh
```

---

## Option 2: Manual Setup

### Step 1: Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Run installer and follow prompts
- Note the password you set for the `postgres` user

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE qa_generator;

# Exit
\q
```

### Step 3: Run Setup Script

```bash
# Option A: Run entire script at once
psql -U postgres -d qa_generator -f database/postgres_setup.sql

# Option B: Copy-paste commands into psql
psql -U postgres -d qa_generator
# Then paste contents of postgres_setup.sql
\q
```

### Step 4: Verify Setup

```bash
psql -U postgres -d qa_generator

# Check tables
\dt

# Check views
\dv

# Count records
SELECT COUNT(*) FROM products;

\q
```

---

## Connection Setup in Your App

### Using Node.js (with pg package)

```bash
npm install pg
```

**Create a connection file:**
```javascript
// src/services/postgres.ts
import { Client } from 'pg';

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'qa_generator',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

export default client;
```

### Update .env.local

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=qa_generator
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/qa_generator
```

---

## Database Schema

### Products Table Structure

```
Column Name              | Type         | Constraints
-----------------------------------------------------
id                      | SERIAL       | PRIMARY KEY
unique_id               | VARCHAR(50)  | NOT NULL, UNIQUE
name                    | VARCHAR(255) | NOT NULL
batch                   | VARCHAR(100) | NOT NULL
mfg                     | VARCHAR(50)  | NOT NULL
expiry                  | VARCHAR(50)  | NOT NULL
short_url               | VARCHAR(500) | 
manufacturer            | VARCHAR(255) | 
manufacturer_address    | TEXT         | 
technical_name          | VARCHAR(255) | 
registration_number     | VARCHAR(100) | 
packing_size            | VARCHAR(100) | 
manufacturer_licence    | VARCHAR(100) | 
created_at              | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP
updated_at              | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP
deleted_at              | TIMESTAMP    | NULL (for soft deletes)
```

---

## Common Operations

### Insert a Product

```sql
INSERT INTO products (
  unique_id, name, batch, mfg, expiry, short_url,
  manufacturer, manufacturer_address, technical_name,
  registration_number, packing_size, manufacturer_licence
) VALUES (
  '1704067200000',
  'Product Name',
  'BATCH-2024-001',
  '01/2024',
  '12/2025',
  'https://example.com/p1',
  'Manufacturer Inc',
  '123 Main St, City, Country',
  'Technical Name',
  'REG-2024-12345',
  '500ml',
  'LIC-2024-98765'
);
```

### Get All Active Products

```sql
SELECT * FROM v_active_products ORDER BY created_at DESC;
```

### Find Expiring Products

```sql
SELECT * FROM v_expiring_products ORDER BY expiry;
```

### Search by Manufacturer

```sql
SELECT * FROM products 
WHERE manufacturer ILIKE '%manufacturer_name%' 
AND deleted_at IS NULL;
```

### Search by Product Name

```sql
SELECT * FROM products 
WHERE name ILIKE '%product_name%' 
AND deleted_at IS NULL;
```

### Soft Delete a Product

```sql
SELECT * FROM delete_product('unique_id_here');
```

### Restore Deleted Product

```sql
SELECT * FROM restore_product('unique_id_here');
```

### Get Products by Date Range

```sql
SELECT * FROM products 
WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'
AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### Get Audit History

```sql
SELECT * FROM products_audit 
WHERE product_id = 1 
ORDER BY changed_at DESC;
```

---

## Backup and Restore

### Backup Full Database

```bash
pg_dump -U postgres qa_generator > backup_qa_generator.sql
```

### Backup Specific Table

```bash
pg_dump -U postgres -t products qa_generator > backup_products.sql
```

### Restore from Backup

```bash
psql -U postgres qa_generator < backup_qa_generator.sql
```

### Scheduled Backup (Linux Cron)

```bash
# Edit crontab
crontab -e

# Add this line to backup daily at 2 AM
0 2 * * * pg_dump -U postgres qa_generator > /backups/qa_generator_$(date +\%Y\%m\%d).sql
```

---

## Performance Optimization

### Current Indexes

The setup includes optimized indexes for:
- `unique_id` - Primary product lookup
- `manufacturer` - Filtering by manufacturer
- `created_at` - Sorting by date
- Composite index on `(manufacturer, created_at)`

### Check Index Usage

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as "Index Scans",
  idx_tup_read as "Tuples Read",
  idx_tup_fetch as "Tuples Fetched"
FROM pg_stat_user_indexes
WHERE tablename = 'products'
ORDER BY idx_scan DESC;
```

### Analyze Query Performance

```sql
EXPLAIN ANALYZE
SELECT * FROM products WHERE manufacturer = 'ABC Pharma' AND deleted_at IS NULL;
```

---

## Security Best Practices

### Create Application User (Not Using postgres)

```sql
-- Connect as postgres
psql -U postgres

-- Create role for application
CREATE ROLE qa_generator_app WITH LOGIN PASSWORD 'secure_password_123';

-- Grant permissions
GRANT CONNECT ON DATABASE qa_generator TO qa_generator_app;
GRANT USAGE ON SCHEMA public TO qa_generator_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO qa_generator_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO qa_generator_app;

-- Exit
\q
```

### Update Connection String

```env
DATABASE_URL=postgresql://qa_generator_app:secure_password_123@localhost:5432/qa_generator
```

### Enable SSL Connection (Production)

```env
DATABASE_URL=postgresql://qa_generator_app:password@localhost:5432/qa_generator?sslmode=require
```

---

## Troubleshooting

### Connection Refused

**Problem:** `psql: could not connect to server: Connection refused`

**Solution:**
```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Start PostgreSQL
brew services start postgresql@15  # macOS
sudo systemctl start postgresql  # Linux
```

### Database Already Exists

**Problem:** `ERROR: database "qa_generator" already exists`

**Solution:**
```bash
# Connect and drop existing database
psql -U postgres
DROP DATABASE IF EXISTS qa_generator;
CREATE DATABASE qa_generator;
\q

# Then run setup script
psql -U postgres -d qa_generator -f database/postgres_setup.sql
```

### Permission Denied

**Problem:** `permission denied for schema public`

**Solution:**
```bash
psql -U postgres -d qa_generator

-- Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

\q
```

### Slow Queries

```sql
-- Check slow queries (requires logging)
SELECT query, mean_exec_time FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;

-- Rebuild indexes if needed
REINDEX DATABASE qa_generator;

-- Vacuum and analyze
VACUUM ANALYZE products;
```

---

## Useful psql Commands

| Command | Purpose |
|---------|---------|
| `\dt` | List all tables |
| `\dv` | List all views |
| `\di` | List all indexes |
| `\d tablename` | Show table structure |
| `\l` | List all databases |
| `\du` | List all users |
| `\z` | Show permissions |
| `\x` | Toggle expanded display |
| `\timing` | Show query execution time |
| `\q` | Quit psql |

---

## Integration with Your React App

Once PostgreSQL is set up, update your database service to use it:

```typescript
// src/services/database.ts

class DatabaseService {
  async addProduct(product: Product): Promise<Product> {
    // Instead of Firebase, call your backend API
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return response.json();
  }
  
  async getAllProducts(): Promise<Product[]> {
    const response = await fetch('/api/products');
    return response.json();
  }
  
  // ... other methods
}
```

---

## Support & Resources

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- psql Manual: https://www.postgresql.org/docs/current/app-psql.html
- SQL Tutorial: https://www.postgresql.org/docs/current/tutorial.html
- Performance Guide: https://wiki.postgresql.org/wiki/Performance_Optimization
- Backup Guide: https://www.postgresql.org/docs/current/backup.html
