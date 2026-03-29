import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { findUserByEmail, addUser, getProducts, addProduct } from './db';
import pool from './pool';

// Demo users with different companies
const DEMO_USERS = [
  {
    email: 'admin@frontline.com',
    password: 'admin123456',
    companyName: 'Frontline Company',
    companyAddress: '',
    role: 'admin',
  },
  {
    email: 'demo@frontline.com',
    password: 'demo123456',
    companyName: 'Frontline Company',
    companyAddress: '',
    role: 'user',
  },
  {
    email: 'demo@example.com',
    password: 'demo123456',
    companyName: 'Example Pharma',
    companyAddress: '123 Medical Lane, Delhi, India',
    role: 'user',
  },
  {
    email: 'admin@compound.com',
    password: 'admin123456',
    companyName: 'Compound Chemicals',
    companyAddress: '456 Chemistry Road, Mumbai, India',
    role: 'admin',
  },
];

// Sample products from src/data/products.json
const SAMPLE_PRODUCTS = [
  {
    uniqueId: '881946515',
    name: 'ETIUS',
    batch: 'FASPO647',
    mfg: '08/25',
    expiry: '07/27',
    shortUrl: 'qr-1.in/a.php?x=57afe',
    manufacturer: 'Sample Manufacturer',
    manufacturerAddress: '123 Industrial Area',
    technicalName: 'Emamectin Benzoate 5% SG',
    registrationNumber: 'CIR-1B7889/2021-Emamectin Benzoate (SG) (4325)-2288',
    packingSize: '1 KG',
    manufacturerLicence: 'PB/AGRI/PP/2021/4',
  },
];

async function seed() {
  // 1. Seed demo users with companies and roles
  for (const demoUser of DEMO_USERS) {
    const existing = await findUserByEmail(demoUser.email);
    if (!existing) {
      const hashed = await bcrypt.hash(demoUser.password, 10);
      await addUser({
        uid: uuidv4(),
        email: demoUser.email,
        password: hashed,
        createdAt: new Date().toISOString(),
        companyName: demoUser.companyName,
        companyAddress: demoUser.companyAddress,
        role: (demoUser as any).role || 'user',
      });
      console.log(`✅ User created: ${demoUser.email} / ${demoUser.password} (Role: ${(demoUser as any).role || 'user'}, Company: ${demoUser.companyName})`);
    }
  }

  // 2. Seed products if table is empty
  const products = await getProducts();
  if (products.length === 0) {
    for (const p of SAMPLE_PRODUCTS) {
      await addProduct({ id: 0, ...p, owner_uid: undefined });
    }
    console.log(`✅ Seeded ${SAMPLE_PRODUCTS.length} sample products`);
  } else {
    console.log(`Products already exist (${products.length}), skipping seed`);
  }

  await pool.end();
}

seed().catch(console.error);
