# Firebase Cloud Functions + Cloud SQL Setup Guide

## Overview

This guide covers setting up **Firebase Cloud Functions** (backend) to securely connect to **Firebase Cloud SQL** PostgreSQL database.

---

## 📋 Architecture

```
┌─────────────────┐
│  React App      │
│  (Frontend)     │
└────────┬────────┘
         │
         │ HTTPS Calls
         │ (Secure)
         │
┌────────▼────────────────────┐
│  Cloud Functions            │
│  (Backend Layer)            │
│  - Database Connection      │
│  - Query Execution          │
│  - Authorization Checks     │
└────────┬────────────────────┘
         │
         │ Unix Socket / SSL
         │ (Private)
         │
┌────────▼────────────────────┐
│  Cloud SQL PostgreSQL       │
│  - Products Database        │
│  - Audit Logs               │
│  - Backups                  │
└─────────────────────────────┘
```

**Benefits:**
- ✅ Never expose database credentials to frontend
- ✅ Secure SQL injection protection
- ✅ Rate limiting & authentication
- ✅ Private network connection (Unix socket)
- ✅ Automatic scaling
- ✅ Firestore integration

---

## 🚀 Step 1: Set Up Cloud Functions

### 1.1 Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase logout # If needed to switch accounts
firebase login
```

### 1.2 Create Functions Directory

```bash
cd /path/to/qa-generator
firebase init functions
```

When prompted:
- Choose **TypeScript** for language
- Accept ESLint setup
- **Don't** overwrite existing files

### 1.3 Install Dependencies

```bash
cd functions
npm install pg
npm install --save-dev @types/pg
```

**functions/package.json should include:**
```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "pg": "^8.11.3"
  },
  "devDependencies": {
    "@types/pg": "^8.11.5"
  }
}
```

### 1.4 Directory Structure

```
functions/
├── src/
│   ├── index.ts              # Entry point
│   └── cloudSqlFunctions.ts  # PostgreSQL functions
├── .env.local                # Local environment vars
├── package.json
└── tsconfig.json
```

---

## 🔐 Step 2: Configure Environment Variables

### 2.1 Local Development (.env.local)

Create `functions/.env.local`:

```env
# Cloud SQL Connection
DB_INSTANCE=project-id:region:qa-generator-db
DB_HOST=/cloudsql/project-id:region:qa-generator-db
DB_USER=qa_app
DB_PASSWORD=your_secure_password_here
DB_NAME=qa_generator
DB_PORT=5432

# Firebase
FIREBASE_PROJECT_ID=your-project-id
```

### 2.2 Production Environment Variables

Set in Firebase Console:

```bash
# Via Firebase CLI
firebase functions:config:set cloudsql.instance="project-id:region:qa-generator-db"
firebase functions:config:set cloudsql.user="qa_app"
firebase functions:config:set cloudsql.password="your_secure_password"
firebase functions:config:set cloudsql.database="qa_generator"
```

Or in Firebase Console:
1. Go to **Cloud Functions** → Choose a function
2. Click **Runtime settings**
3. Add environment variables

---

## 📝 Step 3: Copy Cloud Functions Code

### 3.1 Copy Files

Copy the provided files to your functions directory:
- `functions/src/index.ts` - Entry point
- `functions/src/cloudSqlFunctions.ts` - All functions

### 3.2 File Contents

The files include these Cloud Functions:

#### CRUD Operations
- `getAllProducts()` - Get all active products
- `getProductById()` - Get single product
- `addProduct()` - Create new product
- `updateProduct()` - Update product
- `deleteProduct()` - Soft delete product
- `restoreProduct()` - Restore deleted product

#### Query Functions
- `searchProducts()` - Search by name/manufacturer
- `getExpiringProducts()` - Get products expiring soon
- `getProductsByCategory()` - Filter by category
- `getLowStockProducts()` - Get low stock items

#### Analytics
- `getProductStats()` - Aggregate statistics
- `bulkImportProducts()` - Import multiple products

#### Utilities
- `testConnection()` - Test database connection

---

## 🧪 Step 4: Test Locally

### 4.1 Start Emulator Suite

```bash
firebase emulators:start --only functions,firestore
```

This starts:
- Functions Emulator (port 5001)
- Firestore Emulator (port 8080)

### 4.2 Test Function from React

```typescript
import { connectFunctionsEmulator } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';

const functions = getFunctions();

// Only in development
if (process.env.NODE_ENV === 'development') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Call function
const getAllProducts = httpsCallable(functions, 'getAllProducts');
const products = await getAllProducts({});
```

### 4.3 Manual Testing

```bash
# Install curl (or use Postman)
curl -X POST http://localhost:5001/your-project/us-central1/getAllProducts \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 🚀 Step 5: Deploy to Production

### 5.1 Pre-Deploy Checklist

- [ ] Cloud SQL PostgreSQL instance created
- [ ] Database schema installed
- [ ] Connection string configured
- [ ] Environment variables set in Firebase Console
- [ ] Cloud Functions API enabled in Google Cloud Console

### 5.2 Deploy

```bash
# Deploy only functions
firebase deploy --only functions

# Deploy with output
firebase deploy --only functions --debug

# Deploy specific function
firebase deploy --only functions:getAllProducts
```

### 5.3 Verify Deployment

```bash
# List deployed functions
firebase functions:list

# View logs
firebase functions:log

# Test function
firebase functions:call getAllProducts
```

---

## 📊 Step 6: Monitor in Production

### 6.1 View Logs

**Firebase Console:**
1. Go to **Cloud Functions**
2. Click function name
3. Go to **Logs** tab

**Or via CLI:**
```bash
firebase functions:log

# Filter by function
firebase functions:log --limit 50 getAllProducts
```

### 6.2 Performance Metrics

In Cloud Console (not Firebase):
1. Go to **Cloud Functions**
2. Click function name
3. **Metrics** tab shows:
   - Execution count
   - Error rate
   - P99 latency
   - Memory usage

### 6.3 Set Up Alerts

1. Cloud Console → Cloud Monitoring
2. Create alert policy
3. Condition: Cloud Functions > Error count > threshold
4. Notification: Email/Slack

---

## 🔒 Step 7: Security & Authorization

### 7.1 Add Authentication Check

Edit `cloudSqlFunctions.ts`:

```typescript
export const getAllProducts = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be logged in'
    );
  }

  // Optional: Check user role
  const claims = context.auth.token;
  if (claims.role !== 'admin' && claims.role !== 'manager') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Insufficient permissions'
    );
  }

  // Rest of function...
});
```

### 7.2 Rate Limiting

Use `express-rate-limit` middleware:

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';
import * as express from 'express';

const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

### 7.3 Input Validation

```typescript
import * as joi from 'joi';

// Validate product data
const productSchema = joi.object({
  unique_id: joi.string().required(),
  name: joi.string().required(),
  manufacturer: joi.string().required(),
  quantity: joi.number().min(0).required(),
  // ... more fields
});

export const addProduct = functions.https.onCall(async (data, context) => {
  const { error, value } = productSchema.validate(data);
  if (error) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      error.details[0].message
    );
  }
  // Use validated value...
});
```

---

## ⚙️ Advanced Configuration

### Connection Pooling

The provided code uses `pg.Pool` for connection management:

```typescript
const pool = new Pool({
  max: 10,                    // Max connections in pool
  idleTimeoutMillis: 30000,   // Close idle connection after 30s
  connectionTimeoutMillis: 2000, // Fail if can't get connection in 2s
});
```

For Cloud Functions:
```typescript
// Use Unix socket (recommended for Cloud Functions)
host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,

// Or direct TCP connection (with SSL)
host: process.env.DB_HOST,
port: 5432,
ssl: true,
```

### Retry Logic

```typescript
async function executeWithRetry(query, params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await pool.query(query, params);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Connection Health Check

```typescript
async function healthCheck() {
  try {
    const result = await pool.query('SELECT 1');
    return { healthy: true, status: 'OK' };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

// Periodic health check
setInterval(healthCheck, 60000); // Every minute
```

---

## 🐛 Troubleshooting

### Connection Timeout

**Error:** `timeout expired`

**Solution:**
```typescript
// Increase connection timeout
const pool = new Pool({
  connectionTimeoutMillis: 10000, // 10 seconds
  // ...
});

// Or check network connectivity
firebase functions:log
```

### Authentication Failed

**Error:** `error: role "qa_app" does not exist`

**Solution:**
```bash
# Create user in Cloud SQL
gcloud sql connect qa-generator-db --user=postgres
CREATE ROLE qa_app WITH LOGIN PASSWORD 'password';
GRANT CONNECT ON DATABASE qa_generator TO qa_app;
```

### Function Won't Deploy

**Error:** `exceeds maximum code size`

**Solution:**
- Split into multiple files
- Use code splitting
- Minify dependencies

```bash
# Check function size
ls -lh functions/lib/index.js

# Optimize
npm prune --production
```

### Slow Queries

**Error:** Functions timeout or run slow

**Solution:**
```typescript
// Add query timeout
const result = await pool.query({
  text: 'SELECT * FROM products',
  timeout: 5000, // 5 second timeout
});

// Or create indexes (in Cloud SQL)
CREATE INDEX idx_product_name ON products(name);
CREATE INDEX idx_expiry_date ON products(expiry_date);
```

---

## 📈 Performance Optimization

### 1. Use Connection Pooling ✓ (Already configured)

### 2. Add Database Indexes

```sql
-- Run in Cloud SQL
CREATE INDEX idx_active_products ON products(is_active);
CREATE INDEX idx_category ON products(category);
CREATE INDEX idx_manufacturer ON products(manufacturer);
CREATE INDEX idx_expiry_date ON products(expiry_date);
```

### 3. Use Views Instead of Complex Queries

```typescript
// Simple view query
SELECT * FROM v_active_products

// vs Complex query
SELECT * FROM products 
WHERE is_active = true 
AND quantity > 0 
ORDER BY created_at DESC
```

### 4. Cache Results

```typescript
import * as NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

export const getAllProducts = functions.https.onCall(async (data, context) => {
  const cached = cache.get('all_products');
  if (cached) return cached;

  const result = await pool.query('SELECT * FROM v_active_products');
  cache.set('all_products', result.rows);
  return result.rows;
});
```

### 5. Pagination for Large Result Sets

```typescript
export const getAllProducts = functions.https.onCall(
  async (data: { page?: number; limit?: number }, context) => {
    const page = data.page || 1;
    const limit = Math.min(data.limit || 20, 100); // Max 100
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT * FROM v_active_products ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return {
      data: result.rows,
      page,
      limit,
      hasMore: result.rows.length === limit,
    };
  }
);
```

---

## 📚 Useful Commands

```bash
# Deploy
firebase deploy --only functions

# Test locally
firebase emulators:start --only functions

# View logs
firebase functions:log
firebase functions:log getAllProducts

# List functions
firebase functions:list

# Call specific function
firebase functions:call getAllProducts

# Delete function
firebase functions:delete getAllProducts

# Get function details
firebase functions:info getAllProducts

# Download Cloud SQL logs
gcloud sql operations list --instance=qa-generator-db
```

---

## 🔗 Integration with React

Update your React app to use Cloud Functions instead of direct database:

```typescript
// src/services/database.ts
import { cloudSqlDb } from './cloudsql';

export const db = {
  async initialize() {
    // Test connection
    return await cloudSqlDb.testConnection();
  },

  async getAllProducts() {
    return cloudSqlDb.getAllProducts();
  },

  async getProductById(id: string) {
    return cloudSqlDb.getProductById(id);
  },

  async addProduct(product: any) {
    return cloudSqlDb.addProduct(product);
  },

  // ... other methods
};
```

Then in Dashboard.tsx:
```typescript
useEffect(() => {
  const loadProducts = async () => {
    try {
      const products = await db.getAllProducts();
      setAllProducts(products);
    } catch (error) {
      console.error('Error:', error);
      // Fallback to JSON
    }
  };

  loadProducts();
}, []);
```

---

## 🎯 Deployment Checklist

- [ ] Firebase project has Cloud Functions API enabled
- [ ] Cloud SQL PostgreSQL instance created
- [ ] Database schema installed
- [ ] Cloud Functions source code in `functions/src/`
- [ ] Environment variables configured in Firebase Console
- [ ] `pg` package added to `functions/package.json`
- [ ] Functions tested locally with emulator
- [ ] Firestore indexes created if needed
- [ ] Security rules configured
- [ ] Monitoring/alerts set up
- [ ] Backups configured for Cloud SQL
- [ ] Team has access to Firebase Console

---

## 📖 Documentation Links

- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Cloud Functions for Firebase](https://firebase.google.com/docs/functions/get-started)
- [Cloud SQL](https://cloud.google.com/sql/docs)
- [PostgreSQL Client Node.js](https://node-postgres.com/)
- [Firebase Functions TypeScript](https://firebase.google.com/docs/functions/typescript)

---

**Status:** Production Ready  
**Last Updated:** 2024-01-29  
**Cloud SQL + Functions Integrated** 🚀
