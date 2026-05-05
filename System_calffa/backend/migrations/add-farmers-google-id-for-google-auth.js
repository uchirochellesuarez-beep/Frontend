// Migration: Add google_id column to farmers table for Google OAuth linking
// Safe to run multiple times (idempotent)

const pool = require('../db');

async function addFarmersGoogleIdForGoogleAuth() {
  try {
    console.log('Starting migration: adding farmers.google_id for Google auth...');

    const [columnRows] = await pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'farmers'
         AND COLUMN_NAME = 'google_id'
       LIMIT 1`
    );

    if (columnRows.length === 0) {
      await pool.execute(
        `ALTER TABLE farmers
         ADD COLUMN google_id VARCHAR(255) NULL
         AFTER password_hash`
      );
      console.log('Added column: farmers.google_id');
    } else {
      console.log('Column farmers.google_id already exists, skipping ADD COLUMN');
    }

    const [indexRows] = await pool.execute(
      `SELECT INDEX_NAME
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'farmers'
         AND INDEX_NAME = 'uq_farmers_google_id'
       LIMIT 1`
    );

    if (indexRows.length === 0) {
      await pool.execute(
        `CREATE UNIQUE INDEX uq_farmers_google_id ON farmers(google_id)`
      );
      console.log('Added unique index: uq_farmers_google_id');
    } else {
      console.log('Unique index uq_farmers_google_id already exists, skipping');
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  addFarmersGoogleIdForGoogleAuth();
}

module.exports = addFarmersGoogleIdForGoogleAuth;
