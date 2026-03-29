## PostgreSQL Adapter (Backend Only)

The `postgres.ts` file is for **backend/Node.js usage only**, not for the React frontend.

### Usage in Backend

If you have a Node.js/Express backend:

1. **Install dependencies:**
```bash
npm install pg
npm install --save-dev @types/node
```

2. **Import and use:**
```typescript
import { pgService } from 'src/services/postgres';

// Initialize when server starts
await pgService.initialize();

// Use in your API routes
app.get('/api/products', async (req, res) => {
  const products = await pgService.getAllProducts();
  res.json(products);
});
```

3. **Configure environment:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qa_generator
DB_USER=postgres
DB_PASSWORD=your_password
```

### For React Frontend

The React app currently uses **Firebase**. To connect React to PostgreSQL:

**Option 1: Via API Backend**
1. Create Express backend with PostgreSQL (using postgres.ts)
2. React calls your backend API
3. Backend queries PostgreSQL

**Option 2: Direct Connection in React**
Not recommended - exposes database credentials to client

**Recommended Architecture:**
```
React App → API Backend (Node.js) → PostgreSQL Database
```

### Installation Check

If you get errors about `pg` or `process`:

1. Install Node.js types:
```bash
npm install --save-dev @types/node
```

2. Add to tsconfig.json:
```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

3. Install PostgreSQL driver:
```bash
npm install pg
```

Then the postgres.ts file will work correctly in your backend.
