// Migration: Update NULL status values to 'Pending' for existing records
// Run: node update-null-status-to-pending.js

const pool = require('./db');

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('🌾 Updating NULL status values to "Pending"...\n');

    // Update all NULL status values to 'Pending'
    const [result] = await conn.execute(
      `UPDATE farmer_income_records SET status = 'Pending' WHERE status IS NULL`
    );

    console.log(`✅ Updated ${result.affectedRows} records with NULL status → 'Pending'`);

    // Verify the update
    const [verify] = await conn.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'Eligible' THEN 1 ELSE 0 END) as eligible_count,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status IS NULL THEN 1 ELSE 0 END) as null_count
       FROM farmer_income_records`
    );

    const stats = verify[0] || {};
    console.log('\n📊 Status Distribution:');
    console.log(`   Total records: ${stats.total}`);
    console.log(`   Pending: ${stats.pending_count || 0}`);
    console.log(`   Eligible: ${stats.eligible_count || 0}`);
    console.log(`   Rejected: ${stats.rejected_count || 0}`);
    console.log(`   NULL (should be 0): ${stats.null_count || 0}`);

    await conn.release();
    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
