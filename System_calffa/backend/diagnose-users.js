// Diagnostic: Check user accounts and barangay assignments
// Run: node diagnose-users.js

const pool = require('./db');

async function diagnose() {
  try {
    console.log('🔍 Diagnosing User Accounts...\n');

    // Check all users with their roles and barangay assignments
    console.log('1️⃣ Checking all officers/non-farmer users:');
    const [users] = await pool.execute(
      `SELECT id, full_name, phone_number, role, barangay_id FROM farmers WHERE role IN ('president', 'treasurer', 'auditor', 'agriculturist', 'admin') ORDER BY id ASC`
    );
    console.log(`   Total officer/admin users: ${users.length}`);
    users.forEach((user, i) => {
      const hasBarangay = user.barangay_id ? '✅' : '❌';
      console.log(`   ${i + 1}. ID: ${user.id}, Name: ${user.full_name}, Role: ${user.role}, Barangay ID: ${user.barangay_id || 'NONE'} ${hasBarangay}`);
    });

    // Check specifically for President
    console.log('\n2️⃣ Checking for President role:');
    const [presidents] = await pool.execute(
      `SELECT id, full_name, phone_number, role, barangay_id FROM farmers WHERE role = 'president'`
    );
    if (presidents.length > 0) {
      presidents.forEach((pres, i) => {
        console.log(`   ${i + 1}. Name: ${pres.full_name}, Role: ${pres.role}, Barangay ID: ${pres.barangay_id || 'NONE'} ${pres.barangay_id ? '✅' : '❌'}`);
      });
    } else {
      console.log(`   ❌ No President found in database!`);
    }

    // Check barangays
    console.log('\n3️⃣ Checking barangays:');
    const [barangays] = await pool.execute(
      `SELECT id, barangay_name FROM barangays ORDER BY id ASC LIMIT 10`
    );
    console.log(`   Total barangays: ${barangays.length}`);
    barangays.forEach((b, i) => {
      console.log(`   ${i + 1}. ID: ${b.id}, Name: ${b.barangay_name}`);
    });

    await pool.end();
    console.log('\n✅ Diagnosis complete!');
  } catch (err) {
    console.error('❌ Diagnosis failed:', err.message);
    process.exit(1);
  }
}

diagnose();
