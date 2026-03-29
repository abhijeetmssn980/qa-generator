# Firebase Setup Guide for QA Generator

## How to Enable Firebase for Direct Database Access from React

Your app is now configured to use Firebase as a direct backend database. Here's how to set it up:

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or select an existing one
3. Give it a name (e.g., "QA-Generator")
4. Accept the terms and click **"Create project"**
5. Wait for the project to initialize

### Step 2: Get Your Firebase Credentials

1. In the Firebase Console, click the **Settings icon** (⚙️) → **Project Settings**
2. Go to the **"Service accounts"** tab (or use Web SDK from General tab)
3. For React/Web apps, use the **Web SDK** option:
   - Click **"Web"** icon (</> )
   - Register your app with a name like "QA-Generator-Web"
   - Copy the config object that appears

The config will look like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxx",
  authDomain: "qa-generator-xxxxx.firebaseapp.com",
  projectId: "qa-generator-xxxxx",
  storageBucket: "qa-generator-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

### Step 3: Enable Firestore Database

1. In Firebase Console, go to **"Build"** → **"Firestore Database"**
2. Click **"Create Database"**
3. Choose region closest to you
4. Start in **"Production Mode"** (we'll configure security rules next)

### Step 4: Set Security Rules

1. In Firestore, go to the **"Rules"** tab
2. Replace the rules with this (allows public read/write for testing):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{document=**} {
      allow read, write;
    }
  }
}
```

**⚠️ IMPORTANT:** This allows anyone to access your data. For production, add proper authentication.

### Step 5: Add Your Credentials to .env.local

1. Open `.env.local` in your project
2. Replace the placeholder values with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=qa-generator-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=qa-generator-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=qa-generator-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxx
```

3. **Save the file**

### Step 6: Restart Your Dev Server

```bash
npm run dev
```

Your app will automatically detect the Firebase config and start using Firebase! 🎉

## How It Works

- **Products are now stored in Firebase Firestore** (cloud database)
- **Add Product**: When you click "Add Products" and submit, data goes directly to Firebase
- **View Products**: Products are automatically fetched from Firebase on app load
- **Fallback**: If Firebase isn't configured, the app uses local JSON data

## Testing It

1. Start the dev server
2. Navigate to **"Add Products"**
3. Fill in the form and click **"Add Product"**
4. Go to the **"Products List"** page - you should see your product
5. Check **Firebase Firestore Console** → Collections → **"products"** - your data should be there!

## Future: Switch to Amazon DB

When you're ready to use Amazon DynamoDB or RDS:
1. Replace the methods in `src/services/database.ts`
2. Update them to make API calls to your Amazon backend
3. All components will continue working without changes!

## Troubleshooting

**Products not saving?**
- Check browser console (F12 → Console tab) for errors
- Verify `.env.local` has correct credentials
- Check Firebase Firestore rules allow writes

**"Firebase not configured" message?**
- Make sure `.env.local` is filled with real Firebase credentials
- Restart dev server after updating `.env.local`
- Check that environment variables are loaded: `import.meta.env.VITE_FIREBASE_PROJECT_ID`

**Data not appearing in Firestore?**
- Check Firebase Console → Firestore → Collections → products
- Verify security rules aren't blocking writes
- Check browser console for errors

---

✨ Your app is now connected to a real database! You can add and view products from anywhere.
