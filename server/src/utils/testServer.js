require("dotenv").config();

console.log('\n=== SERVER CONFIGURATION CHECK ===\n');

console.log('Environment Variables:');
console.log('- PORT:', process.env.PORT || '5000 (default)');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');

console.log('\nChecking dependencies...');

try {
  require('express');
  console.log('✅ express');
} catch (e) {
  console.log('❌ express - Run: npm install');
}

try {
  require('pg');
  console.log('✅ pg');
} catch (e) {
  console.log('❌ pg - Run: npm install');
}

try {
  require('bcryptjs');
  console.log('✅ bcryptjs');
} catch (e) {
  console.log('❌ bcryptjs - Run: npm install');
}

try {
  require('jsonwebtoken');
  console.log('✅ jsonwebtoken');
} catch (e) {
  console.log('❌ jsonwebtoken - Run: npm install');
}

try {
  require('nodemailer');
  console.log('✅ nodemailer');
} catch (e) {
  console.log('❌ nodemailer - Run: npm install nodemailer');
}

console.log('\nChecking database connection...');

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Database connection successful');
    return pool.query('SELECT COUNT(*) FROM users');
  })
  .then((result) => {
    console.log(`✅ Found ${result.rows[0].count} users in database`);
    console.log('\n=== ALL CHECKS PASSED ===');
    console.log('You can now start the server with: npm run dev\n');
    pool.end();
  })
  .catch((err) => {
    console.log('❌ Database error:', err.message);
    console.log('\nPlease follow DATABASE_SETUP.md to setup the database\n');
    pool.end();
  });
