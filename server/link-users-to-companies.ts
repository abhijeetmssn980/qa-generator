import pool from './pool.ts';

async function linkAllUsersToCompanies() {
  try {
    console.log('🔄 Linking all users to companies...');

    // Get all users without company_id
    const { rows: usersWithoutCompany } = await pool.query(
      'SELECT uid, email, company_name FROM users WHERE company_id IS NULL'
    );
    
    if (usersWithoutCompany.length === 0) {
      console.log('✅ All users already linked to companies');
      process.exit(0);
    }

    console.log(`Found ${usersWithoutCompany.length} users without company_id:`, usersWithoutCompany);

    // For each user, find or create their company
    for (const user of usersWithoutCompany) {
      let companyName = user.company_name || 'Default Company';
      
      // Try to find existing company
      const { rows: companies } = await pool.query(
        'SELECT id FROM companies WHERE name = $1',
        [companyName]
      );

      let companyId: number;
      if (companies.length > 0) {
        companyId = companies[0].id;
      } else {
        // Create new company
        const result = await pool.query(
          'INSERT INTO companies (name) VALUES ($1) RETURNING id',
          [companyName]
        );
        companyId = result.rows[0].id;
        console.log(`  Created company "${companyName}" with ID ${companyId}`);
      }

      // Link user to company
      await pool.query(
        'UPDATE users SET company_id = $1 WHERE uid = $2',
        [companyId, user.uid]
      );
      console.log(`  ✅ Linked ${user.email} to company ${companyName} (ID: ${companyId})`);
    }

    // Verify
    const { rows: allUsers } = await pool.query(
      'SELECT uid, email, company_id, company_name FROM users ORDER BY email'
    );
    console.log('\n✅ All users with company linking:');
    console.table(allUsers);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

linkAllUsersToCompanies();
