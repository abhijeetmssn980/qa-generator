# Local Testing Guide for Logo Upload

## Quick Setup Options

### Option 1: Test Against Production (Fastest)
If you don't have local PostgreSQL, test against the production API directly:

```bash
# Get token from production
TOKEN=$(curl -s -X POST 'https://qa-generator-test-production.up.railway.app/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.com","password":"admin123456"}' | jq -r '.token')

echo "Token: $TOKEN"

# Upload logo to production
curl -X POST 'https://qa-generator-test-production.up.railway.app/api/auth/upload-logo' \
  -H "Authorization: Bearer $TOKEN" \
  -F "logo=@/path/to/your/logo.png" \
  -F "companyId=1"
```

### Option 2: Install PostgreSQL Locally (macOS)

#### Using Homebrew:
```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create default database
createdb postgres
```

#### Using Docker (if you prefer):
```bash
docker pull postgres:15
docker run --name postgres-qa -e POSTGRES_PASSWORD=admin -p 5432:5432 -d postgres:15
```

### Option 3: Use Railway Database (Recommended for Production)

Use your existing Railway PostgreSQL database for local development:

1. Get your DATABASE_URL from Railway dashboard
2. Add to .env:
   ```
   DATABASE_URL=postgresql://user:pass@host:port/dbname
   ```
3. Remove individual DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD settings

---

## Testing Steps

### 1. Start the Local Development Server

```bash
cd "/Users/abhijeetmasson/Documents/Harjinder project/qa-generator"
npm install  # if not already done
npm run dev:api
```

This starts the API server on http://localhost:3001

### 2. Run the Test Script (Optional)

```bash
chmod +x test-logo-upload.sh
./test-logo-upload.sh
```

### 3. Manual Testing with curl

#### Step 1: Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123456"}' | jq
```

#### Step 2: Copy the token from response

#### Step 3: Upload a Logo
```bash
curl -X POST http://localhost:3001/api/auth/upload-logo \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "logo=@/path/to/your/logo.png" \
  -F "companyId=1" | jq
```

#### Step 4: Verify by Getting Company Info
```bash
curl -X GET http://localhost:3001/api/companies/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq
```

#### Step 5: Download the Saved Logo
```bash
curl -X GET http://localhost:3001/api/companies/1/logo \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  --output downloaded-logo.png
```

---

## Debugging the UTF-8 Error

If you still get the "invalid byte sequence for encoding UTF8" error:

### Check Server Logs
Look for detailed error messages in the terminal where `npm run dev:api` is running. You should see:
```
[UPLOAD-LOGO] File received: logo.png (12345 bytes)
[DB] updateCompanyLogo - ID: 1, Buffer size: 12345
[DB] Hex string length: ...
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| PostgreSQL not running | Start with `brew services start postgresql` |
| Port 3001 already in use | Kill existing process: `lsof -ti:3001 \| xargs kill -9` |
| Database doesn't exist | Create with: `createdb postgres` |
| Connection refused | Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env |
| "invalid byte sequence" | Check that file is actually a valid image file |

### Create a Test Image
```bash
# Use an existing image
cp /path/to/your/image.png /tmp/test-logo.png

# Or create a minimal PNG
printf '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a\x00\x00\x00\x0d\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90\x77\x53\x64\x00\x00\x00\x0c\x49\x44\x41\x54\x08\x99\x63\xf8\x0f\x00\x00\x01\x01\x00\x00\x4a\xb1\xb6\xb3\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82' > /tmp/test-logo.png
```

---

## Expected Success Response

```json
{
  "message": "Logo uploaded successfully",
  "companyId": 1,
  "companyName": "AP Demo Company"
}
```

## Troubleshooting Tips

1. **Always check the server terminal** for detailed error messages
2. **Verify the token is valid** with the `/api/auth/me` endpoint
3. **Check file type**: `file /path/to/logo.png` should show "image data"
4. **Check file size**: Should not exceed 2MB
5. **Verify company exists**: `curl http://localhost:3001/api/companies/1 -H "Authorization: Bearer TOKEN"`

---

## Next Steps After Local Testing

Once local testing works:
1. Push code to GitHub
2. Deploy via Railway CI/CD
3. Test on production
4. Monitor logs in Railway dashboard

