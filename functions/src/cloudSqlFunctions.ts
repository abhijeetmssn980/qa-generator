// functions/src/cloudSqlFunctions.ts
// Firebase Cloud Functions for Cloud SQL PostgreSQL database operations
// Deploy with: firebase deploy --only functions

import * as functions from 'firebase-functions';
import { Pool } from 'pg';

// Initialize connection pool for Cloud SQL
const pool = new Pool({
  host:
    process.env.DB_HOST || `/cloudsql/${process.env.DB_INSTANCE}`,
  user: process.env.DB_USER || 'qa_app',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'qa_generator',
  port: parseInt(process.env.DB_PORT || '5432'),
  // For Cloud Functions with Unix socket (recommended)
  // host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
  // For direct TCP connection (less secure)
  // host: process.env.DB_HOST,
  // port: 5432,
  // ssl: true, // Enable SSL for production
});

interface Product {
  unique_id: string;
  name: string;
  manufacturer: string;
  quantity: number;
  unit: string;
  batch_number: string;
  manufacturing_date: string;
  expiry_date: string;
  price: number;
  description: string;
  category: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get all active products
 */
export const getAllProducts = functions.https.onCall(async (data, context) => {
  try {
    // Optional: Verify user is authenticated
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
    // }

    const result = await pool.query(
      'SELECT * FROM v_active_products ORDER BY created_at DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch products'
    );
  }
});

/**
 * Get product by ID
 */
export const getProductById = functions.https.onCall(
  async (data: { uniqueId: string }, context) => {
    try {
      const { uniqueId } = data;
      if (!uniqueId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'uniqueId is required'
        );
      }

      const result = await pool.query(
        'SELECT * FROM products WHERE unique_id = $1 AND is_active = true',
        [uniqueId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to fetch product'
      );
    }
  }
);

/**
 * Add new product
 */
export const addProduct = functions.https.onCall(
  async (data: Product, context) => {
    try {
      const {
        unique_id,
        name,
        manufacturer,
        quantity,
        unit,
        batch_number,
        manufacturing_date,
        expiry_date,
        price,
        description,
        category,
      } = data;

      // Validation
      if (
        !unique_id ||
        !name ||
        !manufacturer ||
        !batch_number ||
        !expiry_date
      ) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Missing required fields'
        );
      }

      const result = await pool.query(
        `INSERT INTO products (
          unique_id, name, manufacturer, quantity, unit, batch_number,
          manufacturing_date, expiry_date, price, description, category, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
        RETURNING *`,
        [
          unique_id,
          name,
          manufacturer,
          quantity || 0,
          unit || 'units',
          batch_number,
          manufacturing_date || new Date().toISOString(),
          expiry_date,
          price || 0,
          description || '',
          category || 'General',
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error adding product:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to add product'
      );
    }
  }
);

/**
 * Update product
 */
export const updateProduct = functions.https.onCall(
  async (
    data: { uniqueId: string; updates: Partial<Product> },
    context
  ) => {
    try {
      const { uniqueId, updates } = data;
      if (!uniqueId || !updates) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'uniqueId and updates are required'
        );
      }

      // Build dynamic UPDATE query
      const fields = Object.keys(updates)
        .filter((key) => !['unique_id', 'created_at'].includes(key))
        .map((key, idx) => `${key} = $${idx + 1}`);

      if (fields.length === 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'No valid fields to update'
        );
      }

      const values = Object.values(updates).filter(
        (_, idx) =>
          !['unique_id', 'created_at'].includes(Object.keys(updates)[idx])
      );

      const result = await pool.query(
        `UPDATE products SET ${fields.join(
          ', '
        )}, updated_at = NOW() WHERE unique_id = $${fields.length + 1} RETURNING *`,
        [...values, uniqueId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error updating product:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to update product'
      );
    }
  }
);

/**
 * Delete product (soft delete)
 */
export const deleteProduct = functions.https.onCall(
  async (data: { uniqueId: string }, context) => {
    try {
      const { uniqueId } = data;
      if (!uniqueId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'uniqueId is required'
        );
      }

      await pool.query(
        'UPDATE products SET is_active = false, updated_at = NOW() WHERE unique_id = $1',
        [uniqueId]
      );

      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to delete product'
      );
    }
  }
);

/**
 * Search products by name or manufacturer
 */
export const searchProducts = functions.https.onCall(
  async (data: { query: string }, context) => {
    try {
      const { query } = data;
      if (!query || query.trim().length === 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'query is required'
        );
      }

      const searchTerm = `%${query}%`;
      const result = await pool.query(
        `SELECT * FROM products 
        WHERE is_active = true AND (
          name ILIKE $1 OR 
          manufacturer ILIKE $1 OR 
          category ILIKE $1 OR 
          batch_number ILIKE $1
        )
        ORDER BY created_at DESC`,
        [searchTerm]
      );

      return result.rows;
    } catch (error) {
      console.error('Error searching products:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to search products'
      );
    }
  }
);

/**
 * Get products expiring soon
 */
export const getExpiringProducts = functions.https.onCall(
  async (data: { daysThreshold?: number }, context) => {
    try {
      const daysThreshold = data.daysThreshold || 30;

      const result = await pool.query(
        `SELECT * FROM v_expiring_products 
        WHERE expiry_date <= NOW() + INTERVAL '1 day' * $1
        ORDER BY expiry_date ASC`,
        [daysThreshold]
      );

      return result.rows;
    } catch (error) {
      console.error('Error fetching expiring products:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to fetch expiring products'
      );
    }
  }
);

/**
 * Get products by category
 */
export const getProductsByCategory = functions.https.onCall(
  async (data: { category: string }, context) => {
    try {
      const { category } = data;
      if (!category) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'category is required'
        );
      }

      const result = await pool.query(
        'SELECT * FROM products WHERE category = $1 AND is_active = true ORDER BY name ASC',
        [category]
      );

      return result.rows;
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to fetch products'
      );
    }
  }
);

/**
 * Get low stock products
 */
export const getLowStockProducts = functions.https.onCall(
  async (data: { threshold?: number }, context) => {
    try {
      const threshold = data.threshold || 10;

      const result = await pool.query(
        'SELECT * FROM products WHERE quantity <= $1 AND is_active = true ORDER BY quantity ASC',
        [threshold]
      );

      return result.rows;
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to fetch low stock products'
      );
    }
  }
);

/**
 * Get product statistics
 */
export const getProductStats = functions.https.onCall(
  async (data, context) => {
    try {
      const result = await pool.query(`
        SELECT
          COUNT(*) as total_products,
          SUM(quantity) as total_quantity,
          COUNT(DISTINCT category) as total_categories,
          COUNT(DISTINCT manufacturer) as total_manufacturers,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price,
          SUM(quantity * price) as total_value
        FROM products WHERE is_active = true
      `);

      return result.rows[0];
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to fetch statistics'
      );
    }
  }
);

/**
 * Test database connection
 */
export const testConnection = functions.https.onCall(
  async (data, context) => {
    try {
      const result = await pool.query('SELECT NOW()');
      return {
        success: true,
        timestamp: result.rows[0].now,
      };
    } catch (error) {
      console.error('Connection test failed:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Database connection failed'
      );
    }
  }
);

/**
 * Restore deleted product
 */
export const restoreProduct = functions.https.onCall(
  async (data: { uniqueId: string }, context) => {
    try {
      const { uniqueId } = data;
      if (!uniqueId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'uniqueId is required'
        );
      }

      const result = await pool.query(
        'UPDATE products SET is_active = true, updated_at = NOW() WHERE unique_id = $1 RETURNING *',
        [uniqueId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error restoring product:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to restore product'
      );
    }
  }
);

/**
 * Bulk import products
 */
export const bulkImportProducts = functions.https.onCall(
  async (data: { products: Product[] }, context) => {
    try {
      const { products } = data;
      if (!Array.isArray(products) || products.length === 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'products array is required'
        );
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        for (const product of products) {
          await client.query(
            `INSERT INTO products (
              unique_id, name, manufacturer, quantity, unit, batch_number,
              manufacturing_date, expiry_date, price, description, category, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
            ON CONFLICT (unique_id) DO UPDATE SET
              name = $2, manufacturer = $3, quantity = $4, unit = $5,
              batch_number = $6, manufacturing_date = $7, expiry_date = $8,
              price = $9, description = $10, category = $11`,
            [
              product.unique_id,
              product.name,
              product.manufacturer,
              product.quantity || 0,
              product.unit || 'units',
              product.batch_number,
              product.manufacturing_date || new Date().toISOString(),
              product.expiry_date,
              product.price || 0,
              product.description || '',
              product.category || 'General',
            ]
          );
        }

        await client.query('COMMIT');
        return { success: true, imported: products.length };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error bulk importing:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to import products'
      );
    }
  }
);
