const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = '***REMOVED***';
  const hash = await bcrypt.hash(password, 10);
  console.log('\n=== SUPERADMIN CREDENTIALS ===');
  console.log('Email: superadmin@ecell.iitb.ac.in');
  console.log('Password:', password);
  console.log('\nPassword Hash (use in schema.sql):');
  console.log(hash);
  console.log('\n==============================\n');
}

generateHash();
