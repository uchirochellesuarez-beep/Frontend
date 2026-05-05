// Migration script to add machinery picture column
// Run with: node apply-machinery-picture-migration.js

const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function applyMigration() {
  try {
    console.log('🔄 Starting machinery picture migration...\n');

    // Add machinery_picture column
    console.log('📝 Adding machinery_picture column to machinery_inventory table...');
    try {
      await pool.execute(`
        ALTER TABLE machinery_inventory ADD COLUMN machinery_picture VARCHAR(255) AFTER description
      `);
      console.log('✅ Added machinery_picture column');
    } catch (err) {
      if (err.message.includes('Duplicate column name')) {
        console.log('ℹ️  machinery_picture column already exists');
      } else {
        throw err;
      }
    }

    // Create index
    try {
      await pool.execute(`
        CREATE INDEX idx_machinery_picture ON machinery_inventory(machinery_picture)
      `);
      console.log('✅ Created index for machinery_picture');
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) {
        console.log('ℹ️  Index may already exist');
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

applyMigration();
