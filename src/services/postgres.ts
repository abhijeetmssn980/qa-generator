// PostgreSQL Adapter for QA Generator Database Service
// This can be used as an alternative to Firebase
// Note: This is for backend/Node.js usage, not React frontend

import type { Pool } from 'pg';

export type Product = {
  id?: number;
  unique_id: string;
  name: string;
  batch: string;
  mfg: string;
  expiry: string;
  short_url?: string;
  manufacturer?: string;
  manufacturer_address?: string;
  technical_name?: string;
  registration_number?: string;
  packing_size?: string;
  manufacturer_licence?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

class PostgreSQLService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'qa_generator',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async initialize(): Promise<void> {
    try {
      const result = await this.pool.query('SELECT NOW()');
      console.log('Connected to PostgreSQL:', result.rows[0]);
    } catch (error) {
      console.error('Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  async getAllProducts(): Promise<Product[]> {
    try {
      const query = `
        SELECT * FROM v_active_products 
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query);
      return result.rows.map(this.snakeToCamel) as Product[];
    } catch (error) {
      console.error('Failed to get all products:', error);
      throw error;
    }
  }

  async getProductById(uniqueId: string): Promise<Product | null> {
    try {
      const query = `
        SELECT * FROM products 
        WHERE unique_id = $1 AND deleted_at IS NULL
      `;
      const result = await this.pool.query(query, [uniqueId]);
      if (result.rows.length === 0) return null;
      return this.snakeToCamel(result.rows[0]) as Product;
    } catch (error) {
      console.error('Failed to get product by id:', error);
      throw error;
    }
  }

  async addProduct(product: Product): Promise<Product> {
    const query = `
      INSERT INTO products (
        unique_id, name, batch, mfg, expiry, short_url,
        manufacturer, manufacturer_address, technical_name,
        registration_number, packing_size, manufacturer_licence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      product.unique_id,
      product.name,
      product.batch,
      product.mfg,
      product.expiry,
      product.short_url,
      product.manufacturer,
      product.manufacturer_address,
      product.technical_name,
      product.registration_number,
      product.packing_size,
      product.manufacturer_licence,
    ];

    try {
      const result = await this.pool.query(query, values);
      return this.snakeToCamel(result.rows[0]) as Product;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error(`Product with unique_id ${product.unique_id} already exists`);
      }
      console.error('Failed to add product:', error);
      throw error;
    }
  }

  async updateProduct(
    uniqueId: string,
    updates: Partial<Product>
  ): Promise<Product | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'unique_id' && key !== 'created_at') {
        const snakeKey = this.camelToSnake(key);
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return this.getProductById(uniqueId);

    values.push(uniqueId);
    const query = `
      UPDATE products 
      SET ${fields.join(', ')}
      WHERE unique_id = $${paramCount} AND deleted_at IS NULL
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      if (result.rows.length === 0) return null;
      return this.snakeToCamel(result.rows[0]) as Product;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  }

  async deleteProduct(uniqueId: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM delete_product($1)`,
        [uniqueId]
      );
      return result.rows[0]?.status === 'SUCCESS';
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const searchQuery = `
        SELECT * FROM products 
        WHERE deleted_at IS NULL
        AND (
          name ILIKE $1
          OR manufacturer ILIKE $1
          OR technical_name ILIKE $1
          OR batch ILIKE $1
        )
        ORDER BY created_at DESC
      `;
      const searchTerm = `%${query}%`;
      const result = await this.pool.query(searchQuery, [searchTerm]);
      return result.rows.map(this.snakeToCamel) as Product[];
    } catch (error) {
      console.error('Failed to search products:', error);
      throw error;
    }
  }

  async getProductsByManufacturer(manufacturer: string): Promise<Product[]> {
    try {
      const query = `
        SELECT * FROM products 
        WHERE manufacturer = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [manufacturer]);
      return result.rows.map(this.snakeToCamel) as Product[];
    } catch (error) {
      console.error('Failed to get products by manufacturer:', error);
      throw error;
    }
  }

  async getExpiringProducts(daysFromNow: number = 90): Promise<Product[]> {
    try {
      const query = `
        SELECT * FROM v_expiring_products 
        WHERE TO_DATE(expiry, 'MM/YYYY') <= CURRENT_DATE + $1
        ORDER BY expiry ASC
      `;
      const result = await this.pool.query(query, [`${daysFromNow} days`]);
      return result.rows.map(this.snakeToCamel) as Product[];
    } catch (error) {
      console.error('Failed to get expiring products:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<{
    totalProducts: number;
    activeProducts: number;
    deletedProducts: number;
    totalManufacturers: number;
  }> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active,
          COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted,
          COUNT(DISTINCT manufacturer) as manufacturers
        FROM products
      `;
      const result = await this.pool.query(query);
      const row = result.rows[0];

      return {
        totalProducts: parseInt(row.total),
        activeProducts: parseInt(row.active),
        deletedProducts: parseInt(row.deleted),
        totalManufacturers: parseInt(row.manufacturers),
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      throw error;
    }
  }

  async closeConnection(): Promise<void> {
    await this.pool.end();
  }

  // Helper: Convert snake_case to camelCase
  private snakeToCamel(obj: any): any {
    const result: any = {};
    Object.keys(obj).forEach((key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      result[camelKey] = obj[key];
    });
    return result;
  }

  // Helper: Convert camelCase to snake_case
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}

export const pgService = new PostgreSQLService();
