# Database Setup & Configuration

This directory contains all database setup scripts and documentation for QA Generator.

## 📁 Files

### Setup Scripts

- **`postgres_setup.sql`** - Complete PostgreSQL schema setup
  - Tables, indexes, views, stored procedures
  - Sample data
  - Audit trail system
  - Run this after creating the database

- **`setup_postgres.sh`** - Automated setup script for PostgreSQL
  - Interactive database creation
  - Automatic schema installation
  - Works on macOS, Linux, and Windows (WSL/Git Bash)
  - Run this first!

### Documentation

- **`POSTGRES_SETUP.md`** - Complete PostgreSQL setup guide
  - Step-by-step installation
  - Connection troubleshooting
  - Security best practices
  - Backup & restore procedures

- **`QUICK_REFERENCE.md`** - SQL query reference
  - Common queries for data operations
  - Analytics and reporting queries
  - Performance optimization tips
  - Troubleshooting commands

### Database Adapters

- **`postgres.ts`** - Node.js PostgreSQL adapter (in `src/services/`)
  - Drop-in replacement for Firebase
  - All methods compatible with existing code
  - Automatic snake_case ↔ camelCase conversion

---

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Make script executable
chmod +x database/setup_postgres.sh

# Run interactive setup
./database/setup_postgres.sh
```

This will:
1. Check PostgreSQL installation
2. Ask for database credentials
3. Create database (if not exists)
4. Run complete schema setup
5. Insert sample data

### Option 2: Manual Setup

```bash
# 1. Create database
psql -U postgres
CREATE DATABASE qa_generator;
\q

# 2. Run setup script
psql -U postgres -d qa_generator -f database/postgres_setup.sql

# 3. Verify
psql -U postgres -d qa_generator
SELECT COUNT(*) FROM products;
\q
```

---

## 📊 Database Schema

### Tables

**`products`** - Main products table
- 13 core fields (name, batch, mfg, expiry, etc.)
- Auto-timestamp fields (created_at, updated_at)
- Soft delete support (deleted_at)
- Optimized indexes for searches

**`products_audit`** - Change history
- Tracks all INSERT, UPDATE, DELETE operations
- Stores before/after values (JSONB)
- Useful for compliance and debugging

### Views

**`v_active_products`** - All non-deleted products
```sql
SELECT * FROM v_active_products ORDER BY created_at DESC;
```

**`v_expiring_products`** - Products expiring within 3 months
```sql
SELECT * FROM v_expiring_products ORDER BY expiry;
```

**`v_products_by_manufacturer`** - Product counts by manufacturer
```sql
SELECT * FROM v_products_by_manufacturer;
```

### Indexes

- `unique_id` - Fast product lookup by unique identifier
- `manufacturer` - Filter products by manufacturer
- `created_at` - Sort/filter by creation date
- Composite index for common queries

---

## 🔧 Configuration

### Update Your .env.local

```env
# PostgreSQL Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qa_generator
DB_USER=postgres
DB_PASSWORD=your_password

# Full connection string
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/qa_generator
```

### Install Node.js Dependencies

```bash
npm install pg
```

### Update Your App

To use PostgreSQL instead of Firebase:

```typescript
// src/services/database.ts
import { pgService } from './postgres';

export const db = pgService;
```

---

## 📝 Common Operations

### Insert a Product

```sql
INSERT INTO products (
  unique_id, name, batch, mfg, expiry, 
  manufacturer, packing_size
) VALUES (
  '1704067200000',
  'Paracetamol 500mg',
  'BATCH-2024-001',
  '01/2024',
  '12/2025',
  'ABC Pharma',
  '10 tablets'
);
```

### Search Products

```sql
-- By name
SELECT * FROM products WHERE name ILIKE '%paracetamol%';

-- By manufacturer
SELECT * FROM products WHERE manufacturer = 'ABC Pharma';

-- By date range
SELECT * FROM products 
WHERE created_at >= '2024-01-01' 
AND created_at < '2024-02-01';
```

### Delete/Restore

```sql
-- Soft delete
UPDATE products SET deleted_at = NOW() WHERE unique_id = '1704067200000';

-- Restore
UPDATE products SET deleted_at = NULL WHERE unique_id = '1704067200000';

-- Or use stored procedures
SELECT * FROM delete_product('1704067200000');
SELECT * FROM restore_product('1704067200000');
```

---

## 💡 Usage Examples

### From React/Node.js

```typescript
import { pgService } from 'src/services/postgres';

// Initialize
await pgService.initialize();

// Get all products
const products = await pgService.getAllProducts();

// Add product
const newProduct = await pgService.addProduct({
  unique_id: '1704067200000',
  name: 'Aspirin',
  batch: 'BATCH-001',
  mfg: '01/2024',
  expiry: '12/2025'
});

// Search
const results = await pgService.searchProducts('paracetamol');

// Get expiring products (within 90 days)
const expiring = await pgService.getExpiringProducts(90);

// Statistics
const stats = await pgService.getStatistics();
```

---

## 🔒 Security

### Create App User (Not Using postgres)

```bash
psql -U postgres -d qa_generator

CREATE ROLE qa_app WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE qa_generator TO qa_app;
GRANT USAGE ON SCHEMA public TO qa_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO qa_app;
\q
```

### Enable SSL (Production)

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

---

## 📦 Backup & Restore

### Backup

```bash
# Full database
pg_dump -U postgres qa_generator > backup.sql

# Just products table
pg_dump -U postgres -t products qa_generator > products_backup.sql

# With compression
pg_dump -U postgres qa_generator | gzip > backup.sql.gz
```

### Restore

```bash
# From backup
psql -U postgres qa_generator < backup.sql

# From compressed
gunzip -c backup.sql.gz | psql -U postgres qa_generator
```

### Automated Daily Backup (Linux Cron)

```bash
# Edit crontab
crontab -e

# Add this line for 2 AM daily backup
0 2 * * * pg_dump -U postgres qa_generator > /backups/qa_gen_$(date +\%Y\%m\%d).sql
```

---

## 🐛 Troubleshooting

### Connection Issues

```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Start PostgreSQL
brew services start postgresql@15  # macOS
sudo systemctl start postgresql  # Linux
```

### Database Already Exists

```bash
psql -U postgres
DROP DATABASE IF EXISTS qa_generator;
CREATE DATABASE qa_generator;
\q

# Then run setup again
psql -U postgres -d qa_generator -f database/postgres_setup.sql
```

### Permission Issues

```bash
psql -U postgres -d qa_generator
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
\q
```

### Check Query Performance

```sql
EXPLAIN ANALYZE 
SELECT * FROM products WHERE manufacturer = 'ABC Pharma';
```

---

## 📚 Documentation

- **[POSTGRES_SETUP.md](./POSTGRES_SETUP.md)** - Complete setup guide
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - SQL commands reference
- **[DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)** - Full schema documentation

---

## 🔄 Migration from Firebase to PostgreSQL

1. **Export from Firebase:**
   ```bash
   # Use Firebase Console or Admin SDK to export data
   ```

2. **Transform data format:**
   ```bash
   # Convert camelCase to snake_case if needed
   ```

3. **Import to PostgreSQL:**
   ```bash
   psql -U postgres -d qa_generator -c "COPY products(...) FROM STDIN WITH CSV" < data.csv
   ```

4. **Update database adapter:**
   ```typescript
   // Switch from Firebase to PostgreSQL
   import { pgService } from './postgres';
   export const db = pgService;
   ```

---

## 📊 Performance Tips

1. **Use indexes** - Already configured for `unique_id`, `manufacturer`, `created_at`
2. **Archive old data** - Move deleted products to archive table
3. **Vacuum regularly** - Run `VACUUM ANALYZE` weekly
4. **Monitor slow queries** - Use `EXPLAIN ANALYZE` for optimization
5. **Connection pooling** - Already implemented in postgres.ts

---

## 🚢 Deployment

### Docker

```dockerfile
FROM postgres:15
COPY postgres_setup.sql /docker-entrypoint-initdb.d/
ENV POSTGRES_DB=qa_generator
ENV POSTGRES_PASSWORD=password
```

### AWS RDS

1. Create PostgreSQL RDS instance
2. Update connection string in `.env.local`
3. Run setup script against RDS endpoint
4. Enable automated backups

### Railway/Render

Automatic schema creation on first deploy

---

## 📞 Support

For issues or questions:
1. Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for common queries
2. Review [POSTGRES_SETUP.md](./POSTGRES_SETUP.md) for installation help
3. Check PostgreSQL logs: `SELECT pg_read_file('pg_log/...');`

---

**Last Updated:** 2024-01-01  
**PostgreSQL Version:** 15+  
**Application:** QA Generator
