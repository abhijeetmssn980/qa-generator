// src/services/cloudsql.ts
// Firebase Cloud SQL connection service for React
// Use this with Cloud Functions backend (recommended) or Firebase Extensions

import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';

export interface Product {
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

// Initialize Firebase Functions
const functions = getFunctions();

// Enable emulator in development if needed
// if (process.env.NODE_ENV === 'development') {
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

/**
 * Cloud SQL Database Service
 * Uses Firebase Cloud Functions as backend to securely access PostgreSQL
 */
export const cloudSqlDb = {
  /**
   * Get all active products
   */
  getAllProducts: async (): Promise<Product[]> => {
    try {
      const callable = httpsCallable(functions, 'getAllProducts');
      const result = await callable({});
      return result.data as Product[];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Get product by ID
   */
  getProductById: async (uniqueId: string): Promise<Product | null> => {
    try {
      const callable = httpsCallable(functions, 'getProductById');
      const result = await callable({ uniqueId });
      return (result.data as Product) || null;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  /**
   * Add new product
   */
  addProduct: async (product: Omit<Product, 'created_at' | 'updated_at'>): Promise<Product> => {
    try {
      const callable = httpsCallable(functions, 'addProduct');
      const result = await callable(product);
      return result.data as Product;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  /**
   * Update product
   */
  updateProduct: async (uniqueId: string, updates: Partial<Product>): Promise<Product> => {
    try {
      const callable = httpsCallable(functions, 'updateProduct');
      const result = await callable({ uniqueId, updates });
      return result.data as Product;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  /**
   * Delete product (soft delete)
   */
  deleteProduct: async (uniqueId: string): Promise<boolean> => {
    try {
      const callable = httpsCallable(functions, 'deleteProduct');
      await callable({ uniqueId });
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  /**
   * Search products
   */
  searchProducts: async (query: string): Promise<Product[]> => {
    try {
      const callable = httpsCallable(functions, 'searchProducts');
      const result = await callable({ query });
      return result.data as Product[];
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  /**
   * Get expiring products
   */
  getExpiringProducts: async (daysThreshold: number = 30): Promise<Product[]> => {
    try {
      const callable = httpsCallable(functions, 'getExpiringProducts');
      const result = await callable({ daysThreshold });
      return result.data as Product[];
    } catch (error) {
      console.error('Error fetching expiring products:', error);
      throw error;
    }
  },

  /**
   * Check connection status
   */
  testConnection: async (): Promise<boolean> => {
    try {
      const callable = httpsCallable(functions, 'testConnection');
      const result = await callable({});
      return result.data as boolean;
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  },
};

export default cloudSqlDb;
