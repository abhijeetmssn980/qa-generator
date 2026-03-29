# PostgreSQL - Quick Reference Guide

## Connection

```bash
# Connect to database
psql -U postgres -d qa_generator

# Connect with password prompt
psql -U postgres -d qa_generator -W

# Connect remotely
psql -h 192.168.1.100 -p 5432 -U postgres -d qa_generator
```

---

## Data Queries

### View All Products

```sql
-- All products (including deleted)
SELECT * FROM products ORDER BY created_at DESC;

-- Only active products
SELECT * FROM v_active_products ORDER BY created_at DESC;

-- With limited columns
SELECT id, unique_id, name, batch, manufacturer, created_at 
FROM v_active_products 
ORDER BY created_at DESC;
```

### Search Products

```sql
-- By name (case-insensitive)
SELECT * FROM products 
WHERE name ILIKE '%paracetamol%' AND deleted_at IS NULL;

-- By manufacturer
SELECT * FROM products 
WHERE manufacturer = 'ABC Pharmaceuticals Ltd' AND deleted_at IS NULL;

-- By batch
SELECT * FROM products 
WHERE batch = 'BATCH-2024-001' AND deleted_at IS NULL;

-- By unique_id
SELECT * FROM products WHERE unique_id = '1704067200000';

-- By registration number
SELECT * FROM products 
WHERE registration_number = 'CDSCO-2024-12345' AND deleted_at IS NULL;
```

### Date Range Queries

```sql
-- Products created last 7 days
SELECT * FROM products 
WHERE created_at >= NOW() - INTERVAL '7 days'
AND deleted_at IS NULL
ORDER BY created_at DESC;

-- Products created in January 2024
SELECT * FROM products 
WHERE DATE_TRUNC('month', created_at) = '2024-01-01'::date
AND deleted_at IS NULL;

-- Products expiring soon (within 3 months)
SELECT * FROM v_expiring_products 
ORDER BY expiry ASC;

-- Count products by month
SELECT 
  DATE_TRUNC('month', created_at)::date as month,
  COUNT(*) as product_count
FROM products
WHERE deleted_at IS NULL
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

### Analytics Queries

```sql
-- Total products (by status)
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active,
  COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted
FROM products;

-- Products by manufacturer
SELECT 
  manufacturer,
  COUNT(*) as total,
  COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active
FROM products
GROUP BY manufacturer
ORDER BY total DESC;

-- Most recent products
SELECT id, unique_id, name, created_at 
FROM v_active_products 
ORDER BY created_at DESC 
LIMIT 10;

-- Products by packing size
SELECT 
  packing_size,
  COUNT(*) as count
FROM v_active_products
WHERE packing_size IS NOT NULL
GROUP BY packing_size
ORDER BY count DESC;

-- Products statistics
SELECT 
  COUNT(*) as total_products,
  COUNT(DISTINCT manufacturer) as num_manufacturers,
  COUNT(DISTINCT batch) as num_batches,
  MIN(created_at) as oldest_product,
  MAX(created_at) as newest_product
FROM v_active_products;
```

---

## Insert/Update Operations

### Add New Product

```sql
-- Using INSERT statement
INSERT INTO products (
  unique_id, name, batch, mfg, expiry, short_url,
  manufacturer, manufacturer_address, technical_name,
  registration_number, packing_size, manufacturer_licence
) VALUES (
  '1704412800000',
  'Aspirin 100mg',
  'BATCH-2024-005',
  '05/2024',
  '05/2026',
  'https://qagen.com/p5',
  'Medical Corp',
  '999 Healthcare Avenue, Chennai, India',
  'Acetylsalicylic Acid',
  'CDSCO-2024-44444',
  '10 tablets',
  'PHARM-2024-44444'
);

-- Using stored procedure
SELECT * FROM add_product(
  '1704412800000',
  'Aspirin 100mg',
  'BATCH-2024-005',
  '05/2024',
  '05/2026',
  'https://qagen.com/p5',
  'Medical Corp',
  '999 Healthcare Avenue, Chennai, India',
  'Acetylsalicylic Acid',
  'CDSCO-2024-44444',
  '10 tablets',
  'PHARM-2024-44444'
);
```

### Update Product

```sql
-- Update specific fields
UPDATE products 
SET name = 'Paracetamol Syrup', packing_size = '100ml'
WHERE unique_id = '1704067200000';

-- Update manufacturer address
UPDATE products 
SET manufacturer_address = '456 New Street, New Delhi'
WHERE manufacturer = 'ABC Pharmaceuticals Ltd';

-- Update expiry date
UPDATE products 
SET expiry = '06/2026'
WHERE batch = 'BATCH-2024-001';

-- Bulk update from another table or condition
UPDATE products 
SET packing_size = 'Standard Pack'
WHERE packing_size IS NULL;
```

### Delete Operations

```sql
-- Soft delete (using stored procedure)
SELECT * FROM delete_product('1704067200000');

-- Soft delete directly
UPDATE products 
SET deleted_at = CURRENT_TIMESTAMP
WHERE unique_id = '1704067200000';

-- Restore deleted product
SELECT * FROM restore_product('1704067200000');

-- Hard delete (PERMANENT - be careful!)
DELETE FROM products WHERE unique_id = '1704067200000';

-- Delete all deleted products older than 30 days
DELETE FROM products 
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '30 days';
```

---

## Batch Operations

### Bulk Insert

```sql
-- Insert multiple products at once
INSERT INTO products (
  unique_id, name, batch, mfg, expiry, manufacturer, packing_size
) VALUES
  ('1704499200000', 'Product A', 'BATCH-2024-06', '06/2024', '06/2026', 'Pharma A', '10 tabs'),
  ('1704585600000', 'Product B', 'BATCH-2024-07', '07/2024', '07/2026', 'Pharma B', '20 tabs'),
  ('1704672000000', 'Product C', 'BATCH-2024-08', '08/2024', '08/2026', 'Pharma C', '30 tabs');
```

### Bulk Update

```sql
-- Update multiple products by condition
UPDATE products 
SET packing_size = 'Updated Pack'
WHERE manufacturer IN ('Pharma A', 'Pharma B', 'Pharma C');
```

### Copy from CSV

```sql
-- Create CSV file first (products.csv)
COPY products(
  unique_id, name, batch, mfg, expiry, manufacturer, packing_size
)
FROM '/path/to/products.csv' 
WITH (FORMAT csv, HEADER true, DELIMITER ',');
```

---

## Views

### Available Views

```sql
-- Active products only
SELECT * FROM v_active_products;

-- Expiring products (within 3 months)
SELECT * FROM v_expiring_products;

-- Products grouped by manufacturer
SELECT * FROM v_products_by_manufacturer;
```

---

## Audit Trail

### View Change History

```sql
-- Get audit history for a product
SELECT * FROM products_audit 
WHERE product_id = 1 
ORDER BY changed_at DESC;

-- View all changes on specific date
SELECT * FROM products_audit 
WHERE DATE(changed_at) = '2024-01-15'
ORDER BY changed_at DESC;

-- Count changes by action type
SELECT 
  action,
  COUNT(*) as count
FROM products_audit
GROUP BY action
ORDER BY count DESC;
```

---

## Index Management

### Check Indexes

```sql
-- List all indexes on products table
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'products';

-- Check index usage
SELECT 
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE relname = 'products'
ORDER BY idx_scan DESC;
```

### Rebuild Indexes

```sql
-- Rebuild all indexes
REINDEX DATABASE qa_generator;

-- Rebuild specific table indexes
REINDEX TABLE products;

-- Vacuum and analyze
VACUUM ANALYZE products;
```

---

## Performance

### Explain Query Plan

```sql
-- See how PostgreSQL executes the query
EXPLAIN SELECT * FROM products WHERE manufacturer = 'ABC Pharma';

-- More detailed analysis
EXPLAIN ANALYZE SELECT * FROM products WHERE manufacturer = 'ABC Pharma';
```

### Slow Queries

```sql
-- Find slow queries (requires pg_stat_statements)
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Clear statistics
SELECT pg_stat_statements_reset();
```

---

## Database Maintenance

### Cleanup

```sql
-- Analyze database for optimization
ANALYZE;

-- Remove unused data
VACUUM FULL;

-- Both (recommended weekly)
VACUUM ANALYZE;
```

### Statistics

```sql
-- Database size
SELECT 
  datname,
  pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database
WHERE datname = 'qa_generator';

-- Table size
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index size
SELECT 
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## Common Errors & Fixes

### Deadlock

```sql
-- Check active connections
SELECT pid, usename, application_name, state FROM pg_stat_activity;

-- Kill specific connection
SELECT pg_terminate_backend(pid);
```

### Out of Disk Space

```sql
-- Find largest tables
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;
```

### Lock Issues

```sql
-- Check locks
SELECT 
  l.pid,
  l.mode,
  l.granted,
  a.usename,
  a.query
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid;
```

---

## Command-Line Shortcuts

```bash
# List available databases
psql -U postgres -l

# Execute query from file
psql -U postgres -d qa_generator -f query.sql

# Execute single query
psql -U postgres -d qa_generator -c "SELECT COUNT(*) FROM products;"

# Export to CSV
psql -U postgres -d qa_generator -c "COPY v_active_products TO STDOUT WITH CSV HEADER" > products.csv

# Import from CSV
psql -U postgres -d qa_generator -c "COPY products(...) FROM STDIN WITH CSV" < data.csv
```

---

## Pro Tips

1. **Always use soft deletes** - Use `deleted_at` instead of permanent deletion
2. **Use views** - Pre-defined views simplify common queries
3. **Index frequently searched columns** - Already done for `unique_id`, `manufacturer`, `created_at`
4. **Regular backups** - Set up automated daily backups
5. **Monitor performance** - Use `EXPLAIN ANALYZE` to optimize slow queries
6. **Use transactions** - For multi-step operations to ensure consistency
7. **ILIKE for case-insensitive search** - Better user experience

---

## Get Help

```sql
-- Get help on any command
\h SELECT
\h INSERT
\h UPDATE
\h DELETE

-- Show all available commands
\?

-- Describe table
\d products
```
