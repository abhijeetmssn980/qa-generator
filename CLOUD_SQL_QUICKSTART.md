# Firebase Cloud SQL Quick Start (5-Step Implementation)

## What You're Building

A secure React app connected to **Firebase Cloud SQL** PostgreSQL:
- React frontend (your app)
- Firebase Cloud Functions backend (secure database access)
- Google Cloud SQL PostgreSQL database (managed, scalable)

```
React App → Cloud Functions → Cloud SQL PostgreSQL
```

---

## ✅ Step 1: Create Cloud SQL Instance (10 mins)

### 1.1 Go to Google Cloud Console

```
https://console.cloud.google.com/sql?project=YOUR_PROJECT_ID
```

### 1.2 Click "Create Instance" → PostgreSQL

**Configuration:**
- Instance ID: `qa-generator-db`
- Password: Generate strong password
- Version: PostgreSQL 15
- Region: `us-central1` (or your region)
- Machine type: Shared core (development)

### 1.3 Wait for Creation

Takes 2-5 minutes. You'll see green checkmark when done.

### 1.4 Copy Connection Details

Click instance → Overview tab:
- **Instance connection name:** `project-id:region:qa-generator-db`
- **Public IP:** (if needed)

---

## ✅ Step 2: Initialize Database Schema (5 mins)

### 2.1 Create Database

In Cloud SQL instance → Databases tab:
- Click "Create database"
- Name: `qa_generator`
- Click Create

### 2.2 Run Setup Script

**Open Cloud SQL Editor:**
1. Click instance
2. SQL Editor tab
3. Copy entire contents of `database/postgres_setup.sql`
4. Run

Or use Cloud Shell:
```bash
gcloud sql connect qa-generator-db \
  --user=postgres \
  --database=qa_generator < database/postgres_setup.sql
```

### 2.3 Create App User

Run in SQL Editor:
```sql
CREATE ROLE qa_app WITH LOGIN PASSWORD 'your_secure_password';
GRANT CONNECT ON DATABASE qa_generator TO qa_app;
GRANT USAGE ON SCHEMA public TO qa_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO qa_app;
```

---

## ✅ Step 3: Set Up Cloud Functions (10 mins)

### 3.1 Initialize Functions

```bash
cd /path/to/qa-generator
firebase init functions
# Choose TypeScript
# Accept ESLint
```

### 3.2 Install Dependencies

```bash
cd functions
npm install pg
npm install --save-dev @types/pg
```

### 3.3 Create Function Files

Copy these files to your `functions/src/`:
- `functions/src/index.ts`
- `functions/src/cloudSqlFunctions.ts`

(Already provided)

### 3.4 Set Environment Variables

In Firebase Console:
1. Go to **Cloud Functions**
2. Select a function
3. Click **Runtime settings**
4. Add environment variables:

```
DB_INSTANCE = project-id:region:qa-generator-db
DB_USER = qa_app
DB_PASSWORD = your_secure_password
DB_NAME = qa_generator
DB_HOST = /cloudsql/project-id:region:qa-generator-db
```

---

## ✅ Step 4: Connect React Frontend (5 mins)

### 4.1 Update Database Service

Use the provided `src/services/cloudsql.ts`:

```typescript
// In Dashboard.tsx
import { cloudSqlDb } from '../services/cloudsql';

useEffect(() => {
  const loadProducts = async () => {
    const products = await cloudSqlDb.getAllProducts();
    setAllProducts(products);
  };
  loadProducts();
}, []);
```

### 4.2 Update Product Operations

```typescript
// Adding product
const newProduct = await cloudSqlDb.addProduct({
  unique_id: Date.now().toString(),
  name: "Product Name",
  // ... other fields
});

// Viewing product
const product = await cloudSqlDb.getProductById(uniqueId);

// Deleting product
await cloudSqlDb.deleteProduct(uniqueId);
```

---

## ✅ Step 5: Deploy to Production (5 mins)

### 5.1 Deploy Cloud Functions

```bash
firebase deploy --only functions
```

### 5.2 Enable in Google Cloud

1. Go to Cloud Console
2. Enable **Cloud Functions API** (if not enabled)
3. Enable **Cloud SQL Admin API**

### 5.3 Test Connection

In React:
```typescript
const testConnection = await cloudSqlDb.testConnection();
console.log('✓ Connected!' if testConnection else '✗ Failed');
```

---

## 🎯 What's Now Working

- ✅ React app talking to Cloud Functions
- ✅ Cloud Functions securely accessing PostgreSQL
- ✅ All product data stored in Cloud SQL
- ✅ QR codes scanning and querying database
- ✅ Add/Edit/Delete operations persisting to database
- ✅ Automatic backups (Cloud SQL feature)

---

## 📊 Available Cloud Functions

All callable from React:

```typescript
// Read operations
cloudSqlDb.getAllProducts()           // Get all products
cloudSqlDb.getProductById(id)         // Get one product
cloudSqlDb.searchProducts(query)      // Search
cloudSqlDb.getExpiringProducts(days)  // Expiring soon
cloudSqlDb.getProductsByCategory(cat) // By category
cloudSqlDb.getLowStockProducts(num)   // Low stock

// Write operations
cloudSqlDb.addProduct(product)        // Create
cloudSqlDb.updateProduct(id, updates) // Update
cloudSqlDb.deleteProduct(id)          // Delete
cloudSqlDb.restoreProduct(id)         // Restore deleted

// Analytics
cloudSqlDb.getProductStats()          // Aggregate stats

// Admin
cloudSqlDb.bulkImportProducts(array)  // Bulk import
cloudSqlDb.testConnection()           // Test DB
```

---

## 💰 Monthly Cost Estimate

| Component | Cost |
|-----------|------|
| Cloud SQL (Shared core, 10GB) | ~$15 |
| Cloud SQL Backup | ~$2 |
| Cloud Functions (free tier covers ~2M calls) | $0 |
| Firebase Firestore (fallback, free tier) | $0 |
| **Total** | **~$17** |

---

## 🚨 Troubleshooting

**Functions won't deploy?**
```bash
firebase deploy --only functions --debug
# Check output for errors
# Usually: Missing APIs or permissions
```

**Can't connect to database?**
```bash
# Test from Cloud Shell
gcloud sql connect qa-generator-db --user=postgres

# Or check logs
firebase functions:log
```

**Timeout errors?**
```typescript
// Increase timeout in cloudsql.ts
pool.query('SELECT 1', { timeout: 30000 })
```

---

## 📈 Next Steps (Optional)

1. **Add Authentication**
   - Set up Firebase Auth
   - Add user checks in functions

2. **Enable Firestore Backup**
   - Firestore Console → Backups
   - Enable scheduled backups

3. **Set Up Monitoring**
   - Cloud Monitoring dashboard
   - Email alerts for errors

4. **Optimize Performance**
   - Add indexes to frequently queried columns
   - Enable query caching
   - Adjust machine type for production

5. **Scale to Production**
   - Move to Standard machine type
   - Enable multi-zone high availability
   - Set up read replicas

---

## 📖 Full Documentation

- [Firebase Cloud SQL Setup](./FIREBASE_CLOUDSQL_SETUP.md) - Detailed configuration
- [Cloud Functions Setup](./CLOUD_FUNCTIONS_SETUP.md) - Backend deployment
- [Database Schema](./DATABASE_SCHEMA.md) - Table structure
- [PostgreSQL Quick Reference](./database/QUICK_REFERENCE.md) - SQL examples

---

## ✨ Architecture Summary

```
YOUR COMPUTER          GOOGLE CLOUD
┌────────────────┐    ┌──────────────────────┐
│  Your React    │    │  Google Cloud        │
│  App (Web)     │    │  ┌────────────────┐  │
│                │───→│  │Cloud Functions │  │
│ - Dashboard    │    │  │ (Backend)      │  │
│ - QR Scanner   │←───│  └────────────────┤  │
│ - Add Product  │    │       │           │  │
│ - View Product │    │       ↓           │  │
└────────────────┘    │  ┌────────────────┐  │
                      │  │  Cloud SQL     │  │
                      │  │  PostgreSQL    │  │
                      │  │                │  │
                      │  │ - Products     │  │
                      │  │ - Audit Logs   │  │
                      │  │ - Backups      │  │
                      │  └────────────────┘  │
                      └──────────────────────┘
```

**Flow:**
1. User scans QR code → App loads product ID from hash
2. React calls `getProductById()` Cloud Function
3. Function queries PostgreSQL database
4. Data returned to React
5. UI renders product details

---

## 🎓 Learning Resources

- [Cloud SQL Best Practices](https://cloud.google.com/sql/docs/best-practices)
- [Cloud Functions Quotas](https://firebase.google.com/docs/functions/quotas)
- [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mod)
- [PostgreSQL Troubleshooting](https://www.postgresql.org/docs/current/index.html)

---

## ✅ Quick Checklist

Before deploying:

- [ ] Cloud SQL PostgreSQL instance created
- [ ] Database schema imported
- [ ] App user created with permissions
- [ ] Cloud Functions initialized
- [ ] Environment variables set
- [ ] `pg` package installed
- [ ] `cloudsql.ts` imported in React
- [ ] Cloud Functions deployed
- [ ] Connection test passed
- [ ] Product operations working

---

**Ready to Deploy!** 🚀

Run this to test:
```bash
firebase emulators:start --only functions
```

Then when ready:
```bash
firebase deploy --only functions
```

Need help? Check the full documentation files above!
