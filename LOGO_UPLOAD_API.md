# Logo Upload API Documentation

## Overview
The `/api/auth/upload-logo` endpoint allows authenticated users to upload company logos that are stored as binary data (BYTEA) in the PostgreSQL database.

## Endpoint Details

### POST `/api/auth/upload-logo`

**Authentication Required:** Yes (Bearer JWT Token)

**Request Headers:**
- `Authorization: Bearer <JWT_TOKEN>` (Required)
- `Content-Type: multipart/form-data` (Automatic with FormData)

**Request Body (multipart/form-data):**
- `logo` (file): The image file to upload (PNG, JPG, JPEG, SVG, WebP)
- `companyId` (number): The ID of the company to associate with the logo

**Constraints:**
- Max file size: 2MB
- Allowed formats: PNG, JPG, JPEG, SVG, WebP
- User must be authenticated
- User must either own the company or be an admin

**Success Response (200):**
```json
{
  "message": "Logo uploaded successfully",
  "companyId": 3,
  "companyName": "AP Demo Company"
}
```

**Error Responses:**

| Status | Error | Reason |
|--------|-------|--------|
| 400 | "No file uploaded" | File is missing from request |
| 400 | "Company ID is required" | companyId not provided |
| 401 | "Authentication required" | Missing Bearer token |
| 401 | "Invalid or expired token" | Invalid JWT token |
| 401 | "User not found" | JWT user not found in database |
| 403 | "You do not have permission to upload a logo for this company" | User not authorized for this company |
| 404 | "Company not found" | Company ID doesn't exist |
| 500 | "Failed to save logo to database" | Database error |

## Usage Examples

### cURL Example (with Bearer Token)
```bash
curl -X POST 'https://qa-generator-test-production.up.railway.app/api/auth/upload-logo' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJkZW1vLWFkbWluLTAwMSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJjb21wYW55TmFtZSI6IkFQIERlbW8gQ29tcGFueSIsImlhdCI6MTc3NDg3MzcyMCwiZXhwIjoxNzc0OTQzNTAwfQ.xYZ...' \
  -F 'logo=@/path/to/logo.png' \
  -F 'companyId=3'
```

### JavaScript/Fetch Example
```typescript
async function uploadLogo(file: File, companyId: number) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('logo', file);
  formData.append('companyId', String(companyId));

  const response = await fetch('https://qa-generator-test-production.up.railway.app/api/auth/upload-logo', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}
```

### Python Example
```python
import requests

def upload_logo(file_path: str, company_id: int, token: str):
    url = 'https://qa-generator-test-production.up.railway.app/api/auth/upload-logo'
    headers = {'Authorization': f'Bearer {token}'}
    
    with open(file_path, 'rb') as f:
        files = {'logo': f}
        data = {'companyId': company_id}
        response = requests.post(url, headers=headers, files=files, data=data)
    
    return response.json()

# Usage
result = upload_logo('/path/to/logo.png', 3, 'your-jwt-token')
print(result)
```

## Retrieving the Uploaded Logo

### GET `/api/companies/:id/logo`

Retrieved the stored logo as binary image data.

**Authentication:** Not required (public access)

**Response:**
- Content-Type: Automatically detected (image/png, image/jpeg, image/webp, image/svg+xml)
- Body: Binary image data
- Cache-Control: public, max-age=3600

**Example:**
```bash
curl https://qa-generator-test-production.up.railway.app/api/companies/3/logo --output logo.png
```

```html
<!-- Display logo in HTML -->
<img src="https://qa-generator-test-production.up.railway.app/api/companies/3/logo" alt="Company Logo">
```

## Database Schema

The company logos are stored in the `companies` table:

```sql
CREATE TABLE companies (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(255) UNIQUE NOT NULL,
  logo              BYTEA,                    -- Binary image data
  address           TEXT,
  phone             VARCHAR(20),
  email             VARCHAR(255),
  website           VARCHAR(255),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

The `logo` column uses PostgreSQL's BYTEA (binary data) type to store actual image files.

## Key Features

✅ **Secure**: JWT authentication required
✅ **Authorized**: Users can only upload for their own company (unless admin)
✅ **Type-Safe**: TypeScript interfaces for Company with logo Buffer
✅ **Auto-Detection**: Retrieved logos are served with correct MIME type
✅ **Optimized**: Binary data storage (BYTEA) instead of base64 strings
✅ **Cached**: Client-side caching headers for retrieved logos
✅ **Logging**: Comprehensive debug logging for troubleshooting

## Migration Notes

If upgrading from VARCHAR to BYTEA:
- The migration automatically runs on server startup
- Existing VARCHAR logo URLs will be lost (consider backing up first)
- New logos will be stored as binary data
- Retrieved logos are automatically detected and served with correct MIME type

## Testing

### Step 1: Get an Authentication Token

```bash
curl -X POST https://qa-generator-test-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123456"}'
```

Response will include a JWT token.

### Step 2: Upload a Logo

```bash
curl -X POST https://qa-generator-test-production.up.railway.app/api/auth/upload-logo \
  -H "Authorization: Bearer <TOKEN_FROM_STEP_1>" \
  -F "logo=@logo.png" \
  -F "companyId=1"
```

### Step 3: Retrieve the Logo

```bash
curl https://qa-generator-test-production.up.railway.app/api/companies/1/logo --output downloaded-logo.png
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No file uploaded" | Ensure the file field is named `logo` and the file is being sent |
| "Company ID is required" | Add `companyId` to the form data |
| "Invalid or expired token" | Token may have expired. Re-login to get a new token |
| "You do not have permission..." | User doesn't own the company. Only admins can upload for other companies |
| "File too large" | Logo exceeds 2MB limit. Compress or reduce image size |
| "Only image files are allowed" | File format not supported. Use PNG, JPG, JPEG, SVG, or WebP |

