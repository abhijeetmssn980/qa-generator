import pool from './pool.ts';

async function resetUsersData() {
  try {
    console.log('🔄 Updating existing users with company_id...');

    // First, ensure companies exist
    const { rows: companyRows } = await pool.query('SELECT id, name FROM companies');
    console.log('Companies:', companyRows);

    const apDemoId = companyRows.find((r: any) => r.name === 'AP Demo Company')?.id;
    const pharmaId = companyRows.find((r: any) => r.name === 'Pharma Solutions Ltd')?.id;

    if (!apDemoId || !pharmaId) {
      console.error('❌ Companies not found');
      process.exit(1);
    }

    console.log(`  AP Demo Company ID: ${apDemoId}`);
    console.log(`  Pharma Solutions Ltd ID: ${pharmaId}`);

    // Update AP Demo users
    await pool.query(
      `UPDATE users SET company_id = $1 
       WHERE email IN ('admin@demo.com', 'editor@demo.com', 'viewer@demo.com')`,
      [apDemoId]
    );
    console.log('✅ Updated AP Demo users');

    // Update Pharma admin
    await pool.query(
      `UPDATE users SET company_id = $1 
       WHERE email = 'admin@pharma.com'`,
      [pharmaId]
    );
    console.log('✅ Updated Pharma admin user');

    // Verify
    const { rows: users } = await pool.query('SELECT uid, email, company_id FROM users');
    console.log('\n✅ Final users:');
    console.table(users);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

resetUsersData();
