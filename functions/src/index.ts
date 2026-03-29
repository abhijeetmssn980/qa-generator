// functions/src/index.ts
// Firebase Cloud Functions Entry Point

import * as admin from 'firebase-admin';
import {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getExpiringProducts,
  getProductsByCategory,
  getLowStockProducts,
  getProductStats,
  testConnection,
  restoreProduct,
  bulkImportProducts,
} from './cloudSqlFunctions';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export all functions
export {
  // Product CRUD
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  
  // Queries
  searchProducts,
  getExpiringProducts,
  getProductsByCategory,
  getLowStockProducts,
  getProductStats,
  
  // Utilities
  testConnection,
  restoreProduct,
  bulkImportProducts,
};
