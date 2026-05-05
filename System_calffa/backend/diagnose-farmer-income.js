// Diagnostic: Check farmer income records and farmer links
// Run: node diagnose-farmer-income.js

const pool = require('./db');

async function diagnose() {
  try {
    console.log('🔍 Diagnosing Farmer Income Records...\n');

    // Check income records in database
    console.log('1️⃣ Checking farmer_income_records table:');
    const [incomeRecords] = await pool.execute(
      `SELECT id, farmer_id, status, created_at FROM farmer_income_records ORDER BY id DESC`
    );
    console.log(`   Total records: ${incomeRecords.length}`);
    incomeRecords.forEach((rec, i) => {
      console.log(`   ${i + 1}. ID: ${rec.id}, Farmer ID: ${rec.farmer_id}, Status: ${rec.status}, Created: ${rec.created_at}`);
    });

    // Check if farmers exist
    console.log('\n2️⃣ Checking if farmers exist:');
    for (const rec of incomeRecords) {
      const [farmer] = await pool.execute(
        `SELECT id, full_name, barangay_id FROM farmers WHERE id = ?`,
        [rec.farmer_id]
      );
      if (farmer.length > 0) {
        console.log(`   ✅ Farmer ID ${rec.farmer_id}: ${farmer[0].full_name} (Barangay: ${farmer[0].barangay_id})`);
      } else {
        console.log(`   ❌ Farmer ID ${rec.farmer_id}: NOT FOUND (orphaned record!)`);
      }
    }

    // Test JOIN query (same as API uses)
    console.log('\n3️⃣ Testing JOIN query (as used by API):');
    const [joinResults] = await pool.execute(
      `SELECT r.id, r.farmer_id, r.status, f.full_name as farmer_name, f.barangay_id
       FROM farmer_income_records r
       JOIN farmers f ON r.farmer_id = f.id
       ORDER BY r.created_at DESC`
    );
    console.log(`   Records returned by JOIN: ${joinResults.length}`);
    joinResults.forEach((rec, i) => {
      console.log(`   ${i + 1}. ID: ${rec.id}, Farmer: ${rec.farmer_name}, Status: ${rec.status}, Barangay: ${rec.barangay_id}`);
    });

    // Check status distribution
    console.log('\n4️⃣ Status Distribution:');
    const [statusDist] = await pool.execute(
      `SELECT status, COUNT(*) as count FROM farmer_income_records GROUP BY status`
    );
    statusDist.forEach(row => {
      console.log(`   ${row.status || 'NULL'}: ${row.count}`);
    });

    // List all farmers in database
    console.log('\n5️⃣ All farmers in database:');
    const [allFarmers] = await pool.execute(
      `SELECT id, full_name, barangay_id FROM farmers LIMIT 10`
    );
    console.log(`   Found ${allFarmers.length} farmers:`);
    allFarmers.forEach((farmer, i) => {
      console.log(`   ${i + 1}. ID: ${farmer.id}, Name: ${farmer.full_name}, Barangay: ${farmer.barangay_id}`);
    });

    await pool.end();
    console.log('\n✅ Diagnosis complete!');
  } catch (err) {
    console.error('❌ Diagnosis failed:', err.message);
    process.exit(1);
  }
}

diagnose();
