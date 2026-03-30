#!/bin/bash

# Test Logo Upload Script for Local Development

API_URL="http://localhost:3001"

echo "🚀 Testing Logo Upload Locally"
echo "================================"

# Step 1: Login to get token
echo -e "\n1️⃣  Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123456"}')

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Token received: ${TOKEN:0:20}..."

# Step 2: Create a test image
echo -e "\n2️⃣  Creating test PNG image..."
LOGO_PATH="/tmp/test-logo.png"

# Create a minimal 1x1 PNG file using base64
# This is a valid PNG file
printf '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a\x00\x00\x00\x0d\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90\x77\x53\x64\x00\x00\x00\x0c\x49\x44\x41\x54\x08\x99\x63\xf8\x0f\x00\x00\x01\x01\x00\x00\x4a\xb1\xb6\xb3\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82' > "$LOGO_PATH"

ls -lh "$LOGO_PATH"
file "$LOGO_PATH"

# Step 3: Upload logo
echo -e "\n3️⃣  Uploading logo to company ID 1..."
UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/upload-logo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "logo=@$LOGO_PATH" \
  -F "companyId=1")

echo "Upload Response:"
echo "$UPLOAD_RESPONSE" | jq '.' 2>/dev/null || echo "$UPLOAD_RESPONSE"

# Step 4: Verify logo was saved
echo -e "\n4️⃣  Fetching company info..."
COMPANY_RESPONSE=$(curl -s -X GET "$API_URL/api/companies/1" \
  -H "Authorization: Bearer $TOKEN")

echo "Company Response:"
echo "$COMPANY_RESPONSE" | jq '.' 2>/dev/null || echo "$COMPANY_RESPONSE"

# Step 5: Download the uploaded logo
echo -e "\n5️⃣  Downloading uploaded logo..."
curl -s -X GET "$API_URL/api/companies/1/logo" \
  -H "Authorization: Bearer $TOKEN" \
  -o "/tmp/downloaded-logo.png"

if [ -f "/tmp/downloaded-logo.png" ]; then
  SIZE=$(wc -c < "/tmp/downloaded-logo.png")
  echo "✅ Logo downloaded successfully. Size: $SIZE bytes"
  file "/tmp/downloaded-logo.png"
else
  echo "❌ Failed to download logo"
fi

echo -e "\n✅ Test complete!"
