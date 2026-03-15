require("dotenv").config();
const { Pool } = require('pg');

async function verifyDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('\n=== DATABASE VERIFICATION ===\n');

    // Check roles
    const roles = await pool.query('SELECT name FROM roles ORDER BY name');
    console.log('Roles:', roles.rows.map(r => r.name).join(', '));
    
    const expectedRoles = ['admin', 'coordinator', 'student', 'superadmin'];
    const hasAllRoles = expectedRoles.every(role => 
      roles.rows.some(r => r.name === role)
    );
    
    if (!hasAllRoles) {
      console.log('❌ Missing roles! Expected:', expectedRoles.join(', '));
      console.log('   Run the schema.sql file in pgAdmin');
    } else {
      console.log('✅ All roles present');
    }

    // Check domains
    const domains = await pool.query('SELECT name FROM domains ORDER BY name');
    console.log('\nDomains:', domains.rows.map(d => d.name).join(', '));

    // Check users
    const users = await pool.query(`
      SELECT u.name, u.email, r.name as role 
      FROM users u 
      JOIN roles r ON r.id = u.role_id
    `);
    console.log('\nUsers:');
    users.rows.forEach(u => {
      console.log(`  - ${u.name} (${u.email}) - Role: ${u.role}`);
    });

    // Check if superadmin exists
    const superadmin = users.rows.find(u => u.role === 'superadmin');
    if (superadmin) {
      console.log('\n✅ Superadmin account exists');
      console.log('   Email:', superadmin.email);
      console.log('   Password: ***REMOVED***');
    } else {
      console.log('\n❌ Superadmin not found!');
      console.log('   Run the schema.sql file in pgAdmin to create it');
    }

    // Check table structure
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    const hasIsActive = columns.rows.some(c => c.column_name === 'is_active');
    const hasCreatedBy = columns.rows.some(c => c.column_name === 'created_by');
    
    if (!hasIsActive || !hasCreatedBy) {
      console.log('\n❌ Users table is missing new columns!');
      console.log('   You need to run the updated schema.sql');
      console.log('   Missing:', !hasIsActive ? 'is_active' : '', !hasCreatedBy ? 'created_by' : '');
    } else {
      console.log('\n✅ Users table has all required columns');
    }

    // Check queries table
    const queryColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'queries'
    `);
    
    const hasSolution = queryColumns.rows.some(c => c.column_name === 'solution');
    const hasNeedsInfo = await pool.query(`
      SELECT 1 FROM pg_constraint 
      WHERE conname LIKE '%queries_status_check%' 
      AND consrc LIKE '%needs_info%'
    `).catch(() => ({ rowCount: 0 }));
    
    if (!hasSolution) {
      console.log('\n❌ Queries table missing solution column!');
      console.log('   Run the updated schema.sql');
    } else {
      console.log('✅ Queries table has solution column');
    }

    console.log('\n=== VERIFICATION COMPLETE ===\n');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

verifyDatabase();
