// Database service — PostgreSQL powered
import pool from './pool';

// ── Company type ──
export interface Company {
  id?: number;
  name: string;
  logo?: Buffer | string;  // Binary image data or base64 string
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt?: string;
}

// ── Product type ──
export interface Product {
  id: number | string;
  uniqueId: string;
  name: string;
  batch: string;
  mfg: string;
  expiry: string;
  shortUrl: string;
  manufacturer?: string;
  manufacturerAddress?: string;
  technicalName?: string;
  registrationNumber?: string;
  packingSize?: string;
  manufacturerLicence?: string;
  imageUrl?: string;
  hazardSymbol?: string; // e.g. '☠️ Toxic', '🔥 Flammable'
  owner_uid?: string;
  active?: string; // 'Y' or 'N'
}

// ── User type ──
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  uid: string;
  email: string;
  password: string; // hashed
  createdAt: string;
  companyId?: number;
  companyName?: string;
  companyLogo?: string;
  companyAddress?: string;
  role?: UserRole;
}

// ── Helper: map a DB row to Product ──
function rowToProduct(row: any): Product {
  return {
    id: row.id,
    uniqueId: row.unique_id,
    name: row.name,
    batch: row.batch,
    mfg: row.mfg,
    expiry: row.expiry,
    shortUrl: row.short_url,
    manufacturer: row.manufacturer,
    manufacturerAddress: row.manufacturer_address,
    technicalName: row.technical_name,
    registrationNumber: row.registration_number,
    packingSize: row.packing_size,
    manufacturerLicence: row.manufacturer_licence,
    imageUrl: row.image_url,
    hazardSymbol: row.hazard_symbol,
    owner_uid: row.owner_uid,
    active: row.active || 'Y',
  };
}

// ── Products ──
export async function getProducts(companyName?: string): Promise<Product[]> {
  if (companyName) {
    const { rows } = await pool.query(
      `SELECT p.* FROM products p
       JOIN users u ON p.owner_uid = u.uid
       WHERE p.active = 'Y' AND u.company_name = $1
       ORDER BY p.id`,
      [companyName]
    );
    return rows.map(rowToProduct);
  }
  const { rows } = await pool.query("SELECT * FROM products WHERE active = 'Y' ORDER BY id");
  return rows.map(rowToProduct);
}

export async function getTrashProducts(companyName?: string): Promise<Product[]> {
  if (companyName) {
    const { rows } = await pool.query(
      `SELECT p.* FROM products p
       JOIN users u ON p.owner_uid = u.uid
       WHERE p.active = 'N' AND u.company_name = $1
       ORDER BY p.id`,
      [companyName]
    );
    return rows.map(rowToProduct);
  }
  const { rows } = await pool.query("SELECT * FROM products WHERE active = 'N' ORDER BY id");
  return rows.map(rowToProduct);
}

export async function getProductByUniqueId(uniqueId: string): Promise<Product | undefined> {
  const { rows } = await pool.query('SELECT * FROM products WHERE unique_id = $1', [uniqueId]);
  return rows.length > 0 ? rowToProduct(rows[0]) : undefined;
}

export async function addProduct(product: Product): Promise<Product> {
  const { rows } = await pool.query(
    `INSERT INTO products (unique_id, name, batch, mfg, expiry, short_url, manufacturer, manufacturer_address, technical_name, registration_number, packing_size, manufacturer_licence, image_url, hazard_symbol, owner_uid)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      product.uniqueId,
      product.name,
      product.batch,
      product.mfg,
      product.expiry,
      product.shortUrl,
      product.manufacturer || null,
      product.manufacturerAddress || null,
      product.technicalName || null,
      product.registrationNumber || null,
      product.packingSize || null,
      product.manufacturerLicence || null,
      product.imageUrl || null,
      product.hazardSymbol || null,
      product.owner_uid || null,
    ]
  );
  return rowToProduct(rows[0]);
}

export async function updateProduct(uniqueId: string, updates: Partial<Product>): Promise<Product | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  const columnMap: Record<string, string> = {
    name: 'name',
    batch: 'batch',
    mfg: 'mfg',
    expiry: 'expiry',
    shortUrl: 'short_url',
    manufacturer: 'manufacturer',
    manufacturerAddress: 'manufacturer_address',
    technicalName: 'technical_name',
    registrationNumber: 'registration_number',
    packingSize: 'packing_size',
    manufacturerLicence: 'manufacturer_licence',
    imageUrl: 'image_url',
    hazardSymbol: 'hazard_symbol',
  };

  for (const [key, col] of Object.entries(columnMap)) {
    if (key in updates) {
      fields.push(`${col} = $${i++}`);
      values.push((updates as any)[key]);
    }
  }

  if (fields.length === 0) return null;

  values.push(uniqueId);
  const { rows } = await pool.query(
    `UPDATE products SET ${fields.join(', ')} WHERE unique_id = $${i} RETURNING *`,
    values
  );
  return rows.length > 0 ? rowToProduct(rows[0]) : null;
}

export async function deleteProduct(uniqueId: string): Promise<boolean> {
  const result = await pool.query("UPDATE products SET active = 'N' WHERE unique_id = $1", [uniqueId]);
  return (result.rowCount ?? 0) > 0;
}

export async function restoreProduct(uniqueId: string): Promise<boolean> {
  const result = await pool.query("UPDATE products SET active = 'Y' WHERE unique_id = $1", [uniqueId]);
  return (result.rowCount ?? 0) > 0;
}

export async function permanentDeleteProduct(uniqueId: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM products WHERE unique_id = $1', [uniqueId]);
  return (result.rowCount ?? 0) > 0;
}

// ── Companies ──
export async function addCompany(company: Company): Promise<Company> {
  const { rows } = await pool.query(
    `INSERT INTO companies (name, logo, address, phone, email, website)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, logo, address, phone, email, website, created_at`,
    [company.name, company.logo || null, company.address || null, company.phone || null, company.email || null, company.website || null]
  );
  return {
    id: rows[0].id,
    name: rows[0].name,
    logo: rows[0].logo ? `/api/companies/${rows[0].id}/logo` : undefined,
    address: rows[0].address,
    phone: rows[0].phone,
    email: rows[0].email,
    website: rows[0].website,
    createdAt: rows[0].created_at,
  };
}

export async function getCompanyByName(name: string): Promise<Company | undefined> {
  const { rows } = await pool.query('SELECT * FROM companies WHERE name = $1', [name]);
  if (rows.length === 0) return undefined;
  return {
    id: rows[0].id,
    name: rows[0].name,
    logo: rows[0].logo ? `/api/companies/${rows[0].id}/logo` : undefined,
    address: rows[0].address,
    phone: rows[0].phone,
    email: rows[0].email,
    website: rows[0].website,
    createdAt: rows[0].created_at,
  };
}

export async function getCompanyById(id: number): Promise<Company | undefined> {
  const { rows } = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
  if (rows.length === 0) return undefined;
  // Don't return logo buffer in JSON - use URL instead
  return {
    id: rows[0].id,
    name: rows[0].name,
    logo: rows[0].logo ? `/api/companies/${rows[0].id}/logo` : undefined,
    address: rows[0].address,
    phone: rows[0].phone,
    email: rows[0].email,
    website: rows[0].website,
    createdAt: rows[0].created_at,
  };
}

export async function getAllCompanies(): Promise<Company[]> {
  const { rows } = await pool.query('SELECT * FROM companies ORDER BY name');
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    logo: row.logo ? `/api/companies/${row.id}/logo` : undefined,
    address: row.address,
    phone: row.phone,
    email: row.email,
    website: row.website,
    createdAt: row.created_at,
  }));
}

export async function updateCompany(id: number, updates: Partial<Company>): Promise<Company | null> {
  const fields = [];
  const values = [];
  let i = 1;

  const columnMap: Record<string, string> = {
    name: 'name',
    logo: 'logo',
    address: 'address',
    phone: 'phone',
    email: 'email',
    website: 'website',
  };

  for (const [key, col] of Object.entries(columnMap)) {
    if (key in updates) {
      fields.push(`${col} = $${i++}`);
      values.push((updates as any)[key]);
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE companies SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  
  if (rows.length === 0) return null;
  
  return {
    id: rows[0].id,
    name: rows[0].name,
    logo: rows[0].logo ? `/api/companies/${rows[0].id}/logo` : undefined,
    address: rows[0].address,
    phone: rows[0].phone,
    email: rows[0].email,
    website: rows[0].website,
    createdAt: rows[0].created_at,
  };
}

export async function updateCompanyLogo(id: number, logoBuffer: Buffer): Promise<boolean> {
  try {
    console.log('[DB] updateCompanyLogo - ID:', id, 'Buffer size:', logoBuffer.length);
    const result = await pool.query('UPDATE companies SET logo = $1 WHERE id = $2', [logoBuffer, id]);
    console.log('[DB] updateCompanyLogo - Rows affected:', result.rowCount);
    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    console.error('[DB] updateCompanyLogo error:', err);
    throw err;
  }
}

export async function getCompanyLogo(id: number): Promise<Buffer | null> {
  try {
    const { rows } = await pool.query('SELECT logo FROM companies WHERE id = $1', [id]);
    console.log('[DB] getCompanyLogo - ID:', id, 'Has data:', !!rows[0]?.logo);
    if (rows.length === 0 || !rows[0].logo) return null;
    return rows[0].logo;
  } catch (err) {
    console.error('[DB] getCompanyLogo error:', err);
    throw err;
  }
}

export async function deleteCompany(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM companies WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// ── Users ──
export async function findUserByEmail(email: string): Promise<User | undefined> {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (rows.length === 0) return undefined;
  return {
    uid: rows[0].uid,
    email: rows[0].email,
    password: rows[0].password,
    createdAt: rows[0].created_at,
    companyId: rows[0].company_id,
    companyName: rows[0].company_name,
    companyLogo: rows[0].company_logo,
    companyAddress: rows[0].company_address,
    role: rows[0].role || 'user',
  };
}

export async function addUser(user: User): Promise<User> {
  await pool.query(
    'INSERT INTO users (uid, email, password, company_id, company_name, company_logo, company_address, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [user.uid, user.email, user.password, user.companyId || null, user.companyName || null, user.companyLogo || null, user.companyAddress || null, user.role || 'user']
  );
  return user;
}
