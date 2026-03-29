-- QA Generator - PostgreSQL Database Setup Script
-- Created: 2024-01-01
-- Description: Complete schema setup for QA Generator application

-- =====================================================
-- 1. CREATE EXTENSION (if needed)
-- =====================================================

-- Create UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =====================================================
-- 2. CREATE PRODUCTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  unique_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  batch VARCHAR(100) NOT NULL,
  mfg VARCHAR(50) NOT NULL,
  expiry VARCHAR(50) NOT NULL,
  short_url VARCHAR(500),
  manufacturer VARCHAR(255),
  manufacturer_address TEXT,
  technical_name VARCHAR(255),
  registration_number VARCHAR(100),
  packing_size VARCHAR(100),
  manufacturer_licence VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  -- Constraints
  CONSTRAINT check_expiry_format CHECK (expiry ~ '^\d{2}/\d{4}$'),
  CONSTRAINT check_mfg_format CHECK (mfg ~ '^\d{2}/\d{4}$')
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for unique_id searches (primary lookup)
CREATE INDEX IF NOT EXISTS idx_products_unique_id ON products(unique_id);

-- Index for manufacturer filtering
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON products(manufacturer);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_products_manufacturer_created ON products(manufacturer, created_at DESC);


-- =====================================================
-- 4. CREATE AUDIT TABLE (for tracking changes)
-- =====================================================

CREATE TABLE IF NOT EXISTS products_audit (
  audit_id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  unique_id VARCHAR(50),
  action VARCHAR(10),
  old_values JSONB,
  new_values JSONB,
  changed_by VARCHAR(255),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_products_audit_product_id ON products_audit(product_id);
CREATE INDEX IF NOT EXISTS idx_products_audit_changed_at ON products_audit(changed_at DESC);


-- =====================================================
-- 5. CREATE FUNCTIONS FOR AUDIT LOGGING
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON products;
CREATE TRIGGER trigger_update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_products_updated_at();


-- =====================================================
-- 6. SAMPLE DATA (Remove in Production)
-- =====================================================

-- Clear existing sample data
DELETE FROM products WHERE batch LIKE 'BATCH-SAMPLE-%';

-- Insert sample products
INSERT INTO products (
  unique_id, name, batch, mfg, expiry, short_url,
  manufacturer, manufacturer_address, technical_name,
  registration_number, packing_size, manufacturer_licence
) VALUES
(
  '1704067200000',
  'Paracetamol 500mg',
  'BATCH-SAMPLE-001',
  '01/2024',
  '12/2025',
  'https://qagen.com/p1',
  'ABC Pharmaceuticals Ltd',
  '123 Medical Street, New Delhi, Delhi 110001, India',
  'Acetaminophen',
  'CDSCO-2024-12345',
  '10 tablets',
  'PHARM-2024-98765'
),
(
  '1704153600000',
  'Amoxicillin 250mg',
  'BATCH-SAMPLE-002',
  '02/2024',
  '02/2026',
  'https://qagen.com/p2',
  'XYZ Pharma',
  '456 Drug Avenue, Mumbai, Maharashtra 400001, India',
  'Amoxicillin Trihydrate',
  'CDSCO-2024-54321',
  '20 capsules',
  'PHARM-2024-11111'
),
(
  '1704240000000',
  'Ibuprofen 200mg',
  'BATCH-SAMPLE-003',
  '03/2024',
  '03/2026',
  'https://qagen.com/p3',
  'Global Health Solutions',
  '789 Wellness Blvd, Bangalore, Karnataka 560001, India',
  'Ibuprofen',
  'CDSCO-2024-98765',
  '15 tablets',
  'PHARM-2024-22222'
),
(
  '1704326400000',
  'Vitamin C 1000mg',
  'BATCH-SAMPLE-004',
  '04/2024',
  '04/2026',
  'https://qagen.com/p4',
  'Nutrition Plus Pharma',
  '321 Health Lane, Hyderabad, Telangana 500001, India',
  'Ascorbic Acid',
  'CDSCO-2024-11111',
  '30 tablets',
  'PHARM-2024-33333'
);

-- =====================================================
-- 7. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active products (not deleted)
CREATE OR REPLACE VIEW v_active_products AS
SELECT * FROM products WHERE deleted_at IS NULL;

-- View for expiring products (within 3 months)
CREATE OR REPLACE VIEW v_expiring_products AS
SELECT 
  * 
FROM products 
WHERE 
  deleted_at IS NULL
  AND TO_DATE(expiry, 'MM/YYYY') <= CURRENT_DATE + INTERVAL '3 months';

-- View for products by manufacturer
CREATE OR REPLACE VIEW v_products_by_manufacturer AS
SELECT 
  manufacturer,
  COUNT(*) as total_products,
  COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_products,
  MIN(created_at) as first_product_date,
  MAX(created_at) as last_product_date
FROM products
GROUP BY manufacturer
ORDER BY total_products DESC;


-- =====================================================
-- 8. CREATE STORED PROCEDURES
-- =====================================================

-- Procedure to add a product
CREATE OR REPLACE FUNCTION add_product(
  p_unique_id VARCHAR(50),
  p_name VARCHAR(255),
  p_batch VARCHAR(100),
  p_mfg VARCHAR(50),
  p_expiry VARCHAR(50),
  p_short_url VARCHAR(500),
  p_manufacturer VARCHAR(255),
  p_manufacturer_address TEXT,
  p_technical_name VARCHAR(255),
  p_registration_number VARCHAR(100),
  p_packing_size VARCHAR(100),
  p_manufacturer_licence VARCHAR(100)
) RETURNS TABLE (
  product_id INTEGER,
  status VARCHAR(50),
  message TEXT
) AS $$
BEGIN
  INSERT INTO products (
    unique_id, name, batch, mfg, expiry, short_url,
    manufacturer, manufacturer_address, technical_name,
    registration_number, packing_size, manufacturer_licence
  ) VALUES (
    p_unique_id, p_name, p_batch, p_mfg, p_expiry, p_short_url,
    p_manufacturer, p_manufacturer_address, p_technical_name,
    p_registration_number, p_packing_size, p_manufacturer_licence
  );
  
  RETURN QUERY SELECT 
    id,
    'SUCCESS'::VARCHAR(50),
    'Product added successfully'::TEXT
  FROM products 
  WHERE unique_id = p_unique_id
  LIMIT 1;
  
EXCEPTION WHEN unique_violation THEN
  RETURN QUERY SELECT 
    NULL::INTEGER,
    'ERROR'::VARCHAR(50),
    'Product with this unique_id already exists'::TEXT;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 
    NULL::INTEGER,
    'ERROR'::VARCHAR(50),
    'Failed to add product: ' || SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql;


-- Procedure to soft delete a product
CREATE OR REPLACE FUNCTION delete_product(p_unique_id VARCHAR(50))
RETURNS TABLE (
  status VARCHAR(50),
  message TEXT
) AS $$
BEGIN
  UPDATE products 
  SET deleted_at = CURRENT_TIMESTAMP 
  WHERE unique_id = p_unique_id AND deleted_at IS NULL;
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      'SUCCESS'::VARCHAR(50),
      'Product deleted successfully'::TEXT;
  ELSE
    RETURN QUERY SELECT 
      'ERROR'::VARCHAR(50),
      'Product not found'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;


-- Procedure to restore a deleted product
CREATE OR REPLACE FUNCTION restore_product(p_unique_id VARCHAR(50))
RETURNS TABLE (
  status VARCHAR(50),
  message TEXT
) AS $$
BEGIN
  UPDATE products 
  SET deleted_at = NULL 
  WHERE unique_id = p_unique_id AND deleted_at IS NOT NULL;
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      'SUCCESS'::VARCHAR(50),
      'Product restored successfully'::TEXT;
  ELSE
    RETURN QUERY SELECT 
      'ERROR'::VARCHAR(50),
      'Deleted product not found'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 9. UTILITY QUERIES
-- =====================================================

-- Query: Count total products
-- SELECT COUNT(*) as total_products FROM products;

-- Query: Count active products
-- SELECT COUNT(*) as active_products FROM v_active_products;

-- Query: Find expiring products
-- SELECT * FROM v_expiring_products ORDER BY expiry;

-- Query: Search products by name
-- SELECT * FROM products WHERE name ILIKE '%paracetamol%' AND deleted_at IS NULL;

-- Query: Search products by manufacturer
-- SELECT * FROM products WHERE manufacturer = 'ABC Pharmaceuticals Ltd' AND deleted_at IS NULL;

-- Query: Get products created in last 7 days
-- SELECT * FROM products WHERE created_at >= NOW() - INTERVAL '7 days' ORDER BY created_at DESC;

-- Query: Get audit history for a product
-- SELECT * FROM products_audit WHERE product_id = 1 ORDER BY changed_at DESC;


-- =====================================================
-- 10. GRANT PERMISSIONS (Optional - Adjust as needed)
-- =====================================================

-- Uncomment and modify based on your security requirements
-- CREATE ROLE qa_generator_app WITH LOGIN PASSWORD 'secure_password_here';
-- GRANT CONNECT ON DATABASE qa_generator TO qa_generator_app;
-- GRANT USAGE ON SCHEMA public TO qa_generator_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON products TO qa_generator_app;
-- GRANT SELECT ON v_active_products, v_expiring_products, v_products_by_manufacturer TO qa_generator_app;


-- =====================================================
-- 11. BACKUP AND RESTORE COMMANDS
-- =====================================================

-- Backup full database:
-- pg_dump -U postgres qa_generator > qa_generator_backup.sql

-- Backup only products table:
-- pg_dump -U postgres -t products qa_generator > products_backup.sql

-- Restore from backup:
-- psql -U postgres qa_generator < qa_generator_backup.sql


-- =====================================================
-- 12. VERIFICATION QUERIES
-- =====================================================

-- Check if schema is created successfully
SELECT 
  tablename,
  CASE 
    WHEN tablename = 'products' THEN '✓ Products table created'
    WHEN tablename = 'products_audit' THEN '✓ Audit table created'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('products', 'products_audit');

-- Display table structure
\d products

-- Display all indexes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'products';

-- Display all views
SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname LIKE 'v_%';

-- Count records
SELECT COUNT(*) as total_records FROM products;
SELECT COUNT(*) as active_records FROM v_active_products;
