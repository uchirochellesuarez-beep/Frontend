// Migration: Add status column to farmer_income_records table
// This adds the status field needed for the President verification workflow
// Run: node add-status-to-farmer-income.js

const pool = require('./db');

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('🌾 Adding status column to farmer_income_records...\n');

    // Check if status column already exists
    const [columns] = await conn.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'farmer_income_records' 
      AND TABLE_SCHEMA = DATABASE()
      AND COLUMN_NAME = 'status'
    `);

    if (columns.length > 0) {
      console.log('✅ status column already exists');
      return;
    }

    // Add status column after net_income column
    // Status values: 'Pending' (farmer submitted), 'Eligible' (President verified), 'Rejected' (President rejected)
    await conn.execute(`
      ALTER TABLE farmer_income_records 
      ADD COLUMN status ENUM('Pending', 'Eligible', 'Rejected') DEFAULT 'Pending'
      AFTER net_income
    `);

    console.log('✅ status column added to farmer_income_records');
    console.log('\nStatus values:');
    console.log('  - Pending: Initial submission by farmer, awaiting President verification');
    console.log('  - Eligible: President approved this farmer for assistance');
    console.log('  - Rejected: President rejected this farmer (not eligible)');

    await conn.end();
    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
