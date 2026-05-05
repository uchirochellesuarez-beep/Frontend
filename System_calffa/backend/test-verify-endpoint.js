// Test the verify endpoint
// Run: node test-verify-endpoint.js

const pool = require('./db');
const jwt = require('jsonwebtoken');

async function test() {
  try {
    console.log('Testing verify endpoint...\n');

    // Get president user to get their ID
    const [presidents] = await pool.execute(
      `SELECT id, full_name, barangay_id FROM farmers WHERE role = 'president' LIMIT 1`
    );

    if (presidents.length === 0) {
      console.log('❌ No president found');
      await pool.end();
      return;
    }

    const president = presidents[0];
    console.log(`President: ${president.full_name} (ID: ${president.id}, Barangay: ${president.barangay_id})`);

    // Create a test token
    const token = jwt.sign(
      { 
        id: president.id,
        barangay_id: president.barangay_id,
        role: 'president'
      },
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Get a pending record
    const [pendingRecords] = await pool.execute(
      `SELECT r.* FROM farmer_income_records r
       JOIN farmers f ON r.farmer_id = f.id
       WHERE r.status = 'Pending' AND f.barangay_id = ? LIMIT 1`,
      [president.barangay_id]
    );

    if (pendingRecords.length === 0) {
      console.log('❌ No pending records found');
      await pool.end();
      return;
    }

    const record = pendingRecords[0];
    console.log(`\nPending record: ID ${record.id}, Status: ${record.status}`);

    // Simulate the verify call
    console.log('\nSimulating verify request...');
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();

      // Decode token to get user barangay
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const userBarangayId = decoded.barangay_id;
      const userId = decoded.id;

      // Check record
      const [records] = await conn.execute(
        `SELECT r.*, f.barangay_id FROM farmer_income_records r
         JOIN farmers f ON r.farmer_id = f.id
         WHERE r.id = ?`,
        [record.id]
      );

      if (records.length === 0) {
        console.log('❌ Record not found');
        await conn.rollback();
        return;
      }

      const foundRecord = records[0];
      console.log(`✅ Record found: Barangay ${foundRecord.barangay_id}`);

      const oldStatus = foundRecord.status;
      const newStatus = 'Eligible';

      // Update status
      await conn.execute(
        `UPDATE farmer_income_records SET status = ? WHERE id = ?`,
        [newStatus, record.id]
      );
      console.log(`✅ Status updated: ${oldStatus} → ${newStatus}`);

      // Create audit log
      await conn.execute(
        `INSERT INTO income_status_audit_log (income_record_id, farmer_id, old_status, new_status, changed_by, reason_notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [record.id, foundRecord.farmer_id, oldStatus, newStatus, userId, null]
      );
      console.log(`✅ Audit log created`);

      await conn.commit();
      console.log('\n✅ Verification successful!');

      // Verify the change
      const [updated] = await pool.execute(
        `SELECT status FROM farmer_income_records WHERE id = ?`,
        [record.id]
      );
      console.log(`Final status: ${updated[0].status}`);

    } catch (err) {
      await conn.rollback();
      console.error('❌ Error:', err.message);
    } finally {
      conn.release();
    }

    await pool.end();
    console.log('\n✅ Test complete!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

test();
