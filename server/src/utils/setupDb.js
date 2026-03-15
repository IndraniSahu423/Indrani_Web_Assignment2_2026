const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  // Parse DATABASE_URL
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ecell_portal';
  
  console.log('\n=== DATABASE SETUP ===');
  console.log('Connection string:', dbUrl.replace(/:[^:@]+@/, ':****@'));
  
  const pool = new Pool({
    connectionString: dbUrl,
  });

  try {
    console.log('\n1. Testing connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully!');
    
    console.log('\n2. Checking if tables exist...');
    const tableCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (tableCheck.rowCount > 0) {
      console.log('⚠️  Tables already exist. Do you want to recreate them?');
      console.log('   This will DELETE all existing data!');
      console.log('   To proceed, manually run the schema.sql file.');
      await pool.end();
      return;
    }
    
    console.log('\n3. Creating tables...');
    const schemaPath = path.join(__dirname, '..', 'config', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('✅ Tables created!');
    
    console.log('\n4. Verifying setup...');
    const roleCheck = await pool.query('SELECT COUNT(*) FROM roles');
    const domainCheck = await pool.query('SELECT COUNT(*) FROM domains');
    const userCheck = await pool.query('SELECT COUNT(*) FROM users');
    
    console.log(`   - Roles: ${roleCheck.rows[0].count}`);
    console.log(`   - Domains: ${domainCheck.rows[0].count}`);
    console.log(`   - Users: ${userCheck.rows[0].count}`);
    
    console.log('\n✅ Database setup complete!');
    console.log('\n=== SUPERADMIN CREDENTIALS ===');
    console.log('Email: superadmin@ecell.iitb.ac.in');
    console.log('Password: ***REMOVED***');
    console.log('==============================\n');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if PostgreSQL is running');
    console.error('2. Verify DATABASE_URL in .env file');
    console.error('3. Make sure the database exists:');
    console.error('   - Open pgAdmin or psql');
    console.error('   - Create database: CREATE DATABASE "E-Cell_Portal";');
    console.error('4. Check username and password are correct');
  } finally {
    await pool.end();
  }
}

setupDatabase();
