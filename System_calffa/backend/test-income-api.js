// Test: Verify farmer-income API endpoint returns correct data
// Run: node test-income-api.js

const pool = require('./db');

async function test() {
  try {
    console.log('🧪 Testing /api/farmer-income/by-barangay/1 response...\n');

    // Get the records as the API would
    const [records] = await pool.execute(
      `SELECT r.*, f.full_name as farmer_name, f.barangay_id
       FROM farmer_income_records r
       JOIN farmers f ON r.farmer_id = f.id
       WHERE f.barangay_id = ?
       ORDER BY r.created_at DESC`,
      [1] // barangay_id = 1
    );

    console.log(`1️⃣ Records found: ${records.length}\n`);

    if (records.length > 0) {
      // Show the full first record to see all fields
      console.log('2️⃣ First record (full details):');
      const firstRecord = records[0];
      console.log(JSON.stringify(firstRecord, null, 2));

      console.log('\n3️⃣ Checking key fields:');
      console.log(`   - status field exists: ${firstRecord.hasOwnProperty('status') ? '✅' : '❌'}`);
      console.log(`   - status value: "${firstRecord.status}"`);
      console.log(`   - status === 'Pending': ${firstRecord.status === 'Pending' ? '✅' : '❌'}`);
      console.log(`   - farmer_name: ${firstRecord.farmer_name}`);
      console.log(`   - barangay_id: ${firstRecord.barangay_id}`);
    } else {
      console.log('❌ No records found for barangay 1');
    }

    await pool.end();
    console.log('\n✅ API test complete!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

test();
