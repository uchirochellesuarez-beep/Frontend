// migrations/add-google-auth.js
// Migration: Add google_id column to farmers table for Google OAuth integration

const pool = require('../db');

async function addGoogleAuthColumn() {
  try {
    console.log('Starting migration: Adding google_id column to farmers table...');

    // Check if column already exists
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'google_id'`
    );

    if (columns.length > 0) {
      console.log('✓ google_id column already exists. Migration skipped.');
      process.exit(0);
    }

    // Add google_id column (unique, nullable)
    await pool.execute(
      `ALTER TABLE farmers ADD COLUMN google_id VARCHAR(255) UNIQUE NULL AFTER password_hash`
    );

    console.log('✓ Successfully added google_id column to farmers table');

    // Add index for faster lookups
    await pool.execute(
      `CREATE INDEX idx_google_id ON farmers(google_id)`
    );

    console.log('✓ Successfully created index on google_id');

    // Verify column was added
    const [verify] = await pool.execute(
      `DESCRIBE farmers`
    );

    const googleIdColumn = verify.find(col => col.Field === 'google_id');
    if (googleIdColumn) {
      console.log('✓ Migration completed successfully!');
      console.log(`Column: ${googleIdColumn.Field}, Type: ${googleIdColumn.Type}, Null: ${googleIdColumn.Null}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addGoogleAuthColumn();
}

module.exports = addGoogleAuthColumn;
