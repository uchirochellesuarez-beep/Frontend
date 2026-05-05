// Migration: Add email column to farmers table for Google OAuth account linking
// Safe to run multiple times (idempotent)

const pool = require('../db');

async function addFarmersEmailForGoogleAuth() {
  try {
    console.log('Starting migration: adding farmers.email for Google auth...');

    const [columnRows] = await pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'farmers'
         AND COLUMN_NAME = 'email'
       LIMIT 1`
    );

    if (columnRows.length === 0) {
      await pool.execute(
        `ALTER TABLE farmers
         ADD COLUMN email VARCHAR(191) NULL
         AFTER full_name`
      );
      console.log('Added column: farmers.email');
    } else {
      console.log('Column farmers.email already exists, skipping ADD COLUMN');
    }

    const [indexRows] = await pool.execute(
      `SELECT INDEX_NAME
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'farmers'
         AND INDEX_NAME = 'uq_farmers_email'
       LIMIT 1`
    );

    if (indexRows.length === 0) {
      await pool.execute(
        `CREATE UNIQUE INDEX uq_farmers_email ON farmers(email)`
      );
      console.log('Added unique index: uq_farmers_email');
    } else {
      console.log('Unique index uq_farmers_email already exists, skipping');
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  addFarmersEmailForGoogleAuth();
}

module.exports = addFarmersEmailForGoogleAuth;
