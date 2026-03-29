# Firebase Cloud SQL + PostgreSQL Setup Guide

## Overview

You're using **Firebase Cloud SQL** - Google's managed PostgreSQL service that integrates seamlessly with Firebase.

This guide explains how to:
1. Set up Cloud SQL PostgreSQL instance
2. Connect to it from your React app
3. Use the database schema we created

---

## 📋 Prerequisites

- [x] Firebase project created
- [x] PostgreSQL schema ready (in `database/postgres_setup.sql`)
- [ ] Cloud SQL instance created
- [ ] Connection configured in Firebase

---

## 🚀 Step 1: Enable Cloud SQL in Firebase

### 1.1 Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **SQL** in the left menu
4. Click **Create Instance**

### 1.2 Create PostgreSQL Instance

1. Choose **PostgreSQL**
2. Configure:
   - **Instance ID:** `qa-generator-db`
   - **Password:** Generate strong password (save it!)
   - **Database version:** PostgreSQL 15
   - **Region:** Same as your Firebase region (e.g., `us-central1`)
   - **Zonal availability:** Single zone (for dev)
   - **Machine type:** Shared core (for dev)

3. Click **Create Instance**
4. Wait for creation (2-5 minutes)

### 1.3 Get Connection Details

After instance is created:
1. Click on instance name
2. Go to **Overview** tab
3. Note these details:
   - **Instance connection name:** (e.g., `project:region:qa-generator-db`)
   - **Public IP address:** (if accessing from internet)
   - **Private IP address:** (if accessing from Cloud Functions)

---

## 📊 Step 2: Set Up Database Schema

### 2.1 Connect via Cloud Console

1. In Cloud SQL instance, go to **Databases** tab
2. Click **Create database**
3. Name: `qa_generator`
4. Character set: `UTF8`
5. Click **Create**

### 2.2 Run Setup Script

**Option A: Using gcloud CLI**

```bash
# Upload and run setup script
gcloud sql connect qa-generator-db --user=postgres --database=qa_generator < database/postgres_setup.sql
```

**Option B: Using Cloud SQL Proxy + psql**

```bash
# Install Cloud SQL Proxy
# macOS: brew install cloud-sql-proxy

# Start proxy in terminal 1
cloud-sql-proxy "project-id:region:qa-generator-db" --port=5432

# In terminal 2, run setup
psql -h localhost -U postgres -d qa_generator -f database/postgres_setup.sql
```

**Option C: Using Cloud Console SQL Editor**

1. In Cloud SQL instance, go to **SQL Editor** tab
2. Copy contents of `database/postgres_setup.sql`
3. Paste and execute

---

## 🔑 Step 3: Create Users & Set Permissions

### 3.1 Create Application User

```sql
-- Create application user (not using default postgres)
CREATE ROLE qa_app WITH LOGIN PASSWORD 'strong_password_123';

-- Grant permissions
GRANT CONNECT ON DATABASE qa_generator TO qa_app;
GRANT USAGE ON SCHEMA public TO qa_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO qa_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO qa_app;
```

### 3.2 Create Firebase Service Account

1. Go to Firebase Console → Project Settings
2. Service Accounts tab
3. Click "Generate new private key"
4. Save the JSON file (keep it safe!)

---

## 🔌 Step 4: Connect from Your App

### 4.1 Update `.env.local`

```env
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
...existing Firebase config...

# Cloud SQL Connection
DB_HOST=your_instance_connection_name  # e.g., project:region:instance
DB_PORT=5432
DB_USER=qa_app
DB_PASSWORD=strong_password_123
DB_NAME=qa_generator
DATABASE_URL=postgresql://qa_app:password@/qa_generator?host=/cloudsql/project:region:instance

# For public IP (if not using Cloud Functions)
DATABASE_URL=postgresql://qa_app:password@your_public_ip:5432/qa_generator
```

### 4.2 Option A: Use Cloud Functions (Recommended)

Create a Node.js backend with Cloud Functions:

```typescript
// functions/api/products.ts
import functions from 'firebase-functions';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || '/cloudsql/project:region:instance',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
});

export const getAllProducts = functions.https.onCall(async () => {
  const result = await pool.query('SELECT * FROM v_active_products ORDER BY created_at DESC');
  return result.rows;
});

export const addProduct = functions.https.onCall(async (data) => {
  const result = await pool.query(
    `INSERT INTO products (...) VALUES (...) RETURNING *`,
    [data.unique_id, data.name, ...]
  );
  return result.rows[0];
});
```

Then call from React:
```typescript
import { httpsCallable } from 'firebase/functions';

const getAllProducts = httpsCallable(functions, 'getAllProducts');
const products = await getAllProducts();
```

### 4.3 Option B: Direct Connection from React (Less Secure)

Only for development - NOT recommended for production.

```typescript
// src/services/database.ts
import { Pool } from 'pg';

const pool = new Pool({
  host: import.meta.env.VITE_DB_HOST,
  user: import.meta.env.VITE_DB_USER,
  password: import.meta.env.VITE_DB_PASSWORD,
  database: import.meta.env.VITE_DB_NAME,
});

export async function getAllProducts() {
  const result = await pool.query('SELECT * FROM v_active_products');
  return result.rows;
}
```

---

## 🔐 Security Best Practices

### 1. Use Private IP (Cloud Functions)
- Access Cloud SQL from Cloud Functions using private IP
- More secure, no internet exposure
- Automatic network setup

### 2. Use SSL Connection
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

### 3. Set Up Cloud SQL Auth Proxy
- Encrypts all traffic
- Requires authentication
- Best for remote access

```bash
# Start proxy
cloud-sql-proxy project:region:instance \
  --port=5432 \
  --use-cloud-sql-connector
```

### 4. Firewall Rules
1. Go to Cloud SQL instance → Connections
2. Set allowed IP addresses (restrict access)
3. Don't allow `0.0.0.0/0` in production

---

## ✅ Verification

### Test Connection from CLI

```bash
# Using Cloud SQL Proxy
cloud-sql-proxy project:region:instance -- --port=5432 &
psql -h localhost -U qa_app -d qa_generator

# Or direct if public IP enabled
psql -h your_public_ip -U qa_app -d qa_generator
```

### Test Connection from React

```typescript
import { db } from './services/database';

async function test() {
  try {
    const products = await db.getAllProducts();
    console.log('✓ Connected!', products);
  } catch (error) {
    console.error('✗ Connection failed:', error);
  }
}
```

---

## 💰 Cost Optimization

### Development
- Use **Shared core** machine  (~$10/month)
- Single zone availability
- 10GB storage

### Production
- Use **Standard machine** (n1-standard-1+)
- High availability (multi-zone)
- Automated backups
- Read replicas for scaling

### Estimate
- Shared core: ~$10/month
- Standard (1 vCPU): ~$30/month
- Add: Storage ($0.18/GB), Backups, IP

---

## 🚀 Deployment

### Deploy to Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy Cloud Functions
firebase deploy --only functions

# Your function endpoints are live!
```

### With Vercel/Netlify Backend

If using external backend:

```bash
# Deploy backend separately
# Update DATABASE_URL in production environment

# React app just calls backend API
```

---

## 📊 Monitoring & Logs

### Monitor Performance
- Cloud Console → Cloud SQL → Monitoring
- Check CPU, connections, queries per second
- Set up alerts

### View Logs
```bash
# Streaming logs
gcloud sql operations list --instance=qa-generator-db

# Query logs (if enabled)
SELECT query, calls, mean_exec_time FROM pg_stat_statements LIMIT 10;
```

### Slow Query Logs
```sql
-- Enable slow query logging
ALTER DATABASE qa_generator SET log_min_duration_statement = 1000;  -- 1 second
```

---

## 🔄 Data Migration

### Export from Firebase Firestore
```bash
# Export collection
firebase firestore:export ./backup
```

### Import to Cloud SQL
```bash
# Transform and import data
gcloud sql import sql qa-generator-db gs://your-bucket/data.sql
```

---

## 📚 Useful Commands

```bash
# List instances
gcloud sql instances list

# Connect
gcloud sql connect qa-generator-db --user=postgres

# Export database
gcloud sql export sql qa-generator-db gs://bucket/backup.sql \
  --database=qa_generator

# Create backup
gcloud sql backups create --instance=qa-generator-db

# List backups
gcloud sql backups list --instance=qa-generator-db

# Restore from backup
gcloud sql backups restore BACKUP_ID --backup-instance qa-generator-db
```

---

## 🐛 Troubleshooting

### Can't Connect - SSL Error
```env
# Add to connection string
?sslmode=disable  # Development only
?sslmode=require  # Production
```

### Connection Timeout
1. Check firewall rules allowed your IP
2. Check password is correct
3. Check database exists
4. Check user has permissions

### High Latency
1. Use private IP with Cloud Functions
2. Enable cloud SQL connector
3. Check machine type (shared → standard)
4. Add read replicas

### Out of Connections
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Adjust max connections
ALTER SYSTEM SET max_connections = 200;
SELECT pg_reload_conf();
```

---

## 📖 Documentation Links

- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [PostgreSQL on Cloud SQL](https://cloud.google.com/sql/docs/postgres)
- [Cloud SQL Proxy](https://cloud.google.com/sql/docs/postgres/cloud-sql-proxy)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Database Schema](./DATABASE_SCHEMA.md)
- [PostgreSQL Quick Reference](./database/QUICK_REFERENCE.md)

---

## ✨ Next Steps

1. ✅ Create Cloud SQL PostgreSQL instance
2. ✅ Run `database/postgres_setup.sql` to create schema
3. ✅ Create application user & set permissions
4. ✅ Configure connection in `.env.local`
5. ✅ Set up Cloud Functions backend (recommended)
6. ✅ Deploy and test
7. ✅ Monitor performance

---

**Status:** Production Ready  
**Last Updated:** 2024-01-29  
**Firebase + PostgreSQL powered** 🚀
