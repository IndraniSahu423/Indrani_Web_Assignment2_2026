require("dotenv").config();
const { Pool } = require('pg');

async function migrateDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('\n=== MIGRATING DATABASE TO RBAC SCHEMA ===\n');

    await pool.query('BEGIN');

    // 1. Add new columns to users table
    console.log('1. Adding new columns to users table...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
    `);
    console.log('✅ Users table updated');

    // 2. Make domain_id nullable for superadmin
    console.log('\n2. Making domain_id nullable...');
    await pool.query(`
      ALTER TABLE users 
      ALTER COLUMN domain_id DROP NOT NULL
    `);
    console.log('✅ domain_id is now nullable');

    // 3. Add solution column to queries table
    console.log('\n3. Adding solution column to queries table...');
    await pool.query(`
      ALTER TABLE queries 
      ADD COLUMN IF NOT EXISTS solution TEXT
    `);
    console.log('✅ Queries table updated');

    // 4. Update status check constraint
    console.log('\n4. Updating status constraint...');
    await pool.query(`
      ALTER TABLE queries DROP CONSTRAINT IF EXISTS queries_status_check
    `);
    await pool.query(`
      ALTER TABLE queries 
      ADD CONSTRAINT queries_status_check 
      CHECK (status IN ('open', 'in_progress', 'needs_info', 'resolved', 'closed'))
    `);
    console.log('✅ Status constraint updated');

    // 5. Update roles carefully
    console.log('\n5. Updating roles...');
    
    // Check existing roles
    const existingRoles = await pool.query(`SELECT name FROM roles`);
    const roleNames = existingRoles.rows.map(r => r.name);
    console.log('   Existing roles:', roleNames.join(', '));
    
    // Rename member to student
    if (roleNames.includes('member') && !roleNames.includes('student')) {
      await pool.query(`UPDATE roles SET name = 'student' WHERE name = 'member'`);
      console.log('   ✅ Renamed member → student');
    }
    
    // Add missing roles
    if (!roleNames.includes('superadmin')) {
      await pool.query(`INSERT INTO roles (name) VALUES ('superadmin')`);
      console.log('   ✅ Added superadmin role');
    }
    
    if (!roleNames.includes('coordinator')) {
      await pool.query(`INSERT INTO roles (name) VALUES ('coordinator')`);
      console.log('   ✅ Added coordinator role');
    }
    
    if (!roleNames.includes('student') && !roleNames.includes('member')) {
      await pool.query(`INSERT INTO roles (name) VALUES ('student')`);
      console.log('   ✅ Added student role');
    }
    
    console.log('✅ Roles updated');

    // 6. Create superadmin user
    console.log('\n6. Creating superadmin user...');
    const superadminRole = await pool.query(`SELECT id FROM roles WHERE name = 'superadmin'`);
    
    const existingSuperadmin = await pool.query(`SELECT id FROM users WHERE email = 'superadmin@ecell.iitb.ac.in'`);
    
    if (existingSuperadmin.rowCount === 0) {
      await pool.query(`
        INSERT INTO users (name, email, password_hash, role_id, domain_id, is_active)
        VALUES (
          'Superadmin',
          'superadmin@ecell.iitb.ac.in',
          '***REMOVED***',
          $1,
          NULL,
          TRUE
        )
      `, [superadminRole.rows[0].id]);
      console.log('✅ Superadmin created');
    } else {
      console.log('✅ Superadmin already exists');
    }

    // 7. Update existing users to student role
    console.log('\n7. Updating existing users to student role...');
    const studentRole = await pool.query(`SELECT id FROM roles WHERE name = 'student'`);
    const updated = await pool.query(`
      UPDATE users 
      SET role_id = $1 
      WHERE email != 'superadmin@ecell.iitb.ac.in'
      AND role_id NOT IN (SELECT id FROM roles WHERE name IN ('superadmin', 'admin', 'coordinator'))
    `, [studentRole.rows[0].id]);
    console.log(`✅ Updated ${updated.rowCount} users to student role`);

    await pool.query('COMMIT');

    console.log('\n=== MIGRATION COMPLETE ===');
    console.log('\n🎉 Database successfully migrated to RBAC schema!');
    console.log('\nSuperadmin Credentials:');
    console.log('  Email: superadmin@ecell.iitb.ac.in');
    console.log('  Password: ***REMOVED***');
    console.log('\nYour existing account:');
    console.log('  Email: ***REMOVED***');
    console.log('  Role: student (can submit queries)');
    console.log('\n✅ Server is ready! Run: npm run dev');
    console.log('==============================\n');

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('\n❌ Migration failed:', err.message);
    console.error('\nFull error:');
    console.error(err);
  } finally {
    await pool.end();
  }
}

migrateDatabase();
