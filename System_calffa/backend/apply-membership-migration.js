// Migration script to add membership status and tiered pricing
// Run with: node apply-membership-migration.js

const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function applyMigrations() {
  try {
    console.log('🔄 Starting membership status and pricing migration...');

    // Migration 1: Add membership_status to farmers table
    console.log('\n📝 Migration 1: Adding membership_status to farmers table...');
    try {
      await pool.execute(`
        ALTER TABLE farmers ADD COLUMN membership_status ENUM('member', 'non-member') DEFAULT 'member' AFTER status
      `);
      console.log('✅ Added membership_status column');
    } catch (err) {
      if (err.message.includes('Duplicate column name')) {
        console.log('ℹ️  membership_status column already exists');
      } else {
        throw err;
      }
    }

    // Add index if it doesn't exist
    try {
      await pool.execute(`
        CREATE INDEX idx_farmers_membership_status ON farmers(membership_status)
      `);
      console.log('✅ Created membership_status index');
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) {
        console.log('ℹ️  Index may already exist:', err.message);
      }
    }

    // Migration 2: Add tiered pricing to machinery_inventory table
    console.log('\n💰 Migration 2: Adding tiered pricing to machinery_inventory table...');
    
    // Add member_price column
    try {
      await pool.execute(`
        ALTER TABLE machinery_inventory ADD COLUMN member_price DECIMAL(10, 2) AFTER price_per_unit
      `);
      console.log('✅ Added member_price column');
    } catch (err) {
      if (err.message.includes('Duplicate column name')) {
        console.log('ℹ️  member_price column already exists');
      } else {
        throw err;
      }
    }

    // Add non_member_price column
    try {
      await pool.execute(`
        ALTER TABLE machinery_inventory ADD COLUMN non_member_price DECIMAL(10, 2) AFTER member_price
      `);
      console.log('✅ Added non_member_price column');
    } catch (err) {
      if (err.message.includes('Duplicate column name')) {
        console.log('ℹ️  non_member_price column already exists');
      } else {
        throw err;
      }
    }

    // Update existing records with tiered pricing
    console.log('\n📊 Populating tiered pricing for existing machinery...');
    const [result] = await pool.execute(`
      UPDATE machinery_inventory 
      SET member_price = price_per_unit, 
          non_member_price = ROUND(price_per_unit * 1.25, 2)
      WHERE member_price IS NULL OR non_member_price IS NULL
    `);
    console.log(`✅ Updated ${result.affectedRows} machinery records`);

    // Verify the migration
    const [machinery] = await pool.execute(`
      SELECT COUNT(*) as total, 
             SUM(CASE WHEN member_price IS NOT NULL THEN 1 ELSE 0 END) as with_member_price,
             SUM(CASE WHEN non_member_price IS NOT NULL THEN 1 ELSE 0 END) as with_non_member_price
      FROM machinery_inventory
    `);

    const [farmers] = await pool.execute(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN membership_status = 'member' THEN 1 ELSE 0 END) as members,
             SUM(CASE WHEN membership_status = 'non-member' THEN 1 ELSE 0 END) as non_members
      FROM farmers
    `);

    console.log('\n✨ Migration Summary:');
    console.log('Machinery Inventory:');
    console.log(`  - Total machinery: ${machinery[0].total}`);
    console.log(`  - With member pricing: ${machinery[0].with_member_price}`);
    console.log(`  - With non-member pricing: ${machinery[0].with_non_member_price}`);
    console.log('\nFarmers:');
    console.log(`  - Total farmers: ${farmers[0].total}`);
    console.log(`  - Members: ${farmers[0].members}`);
    console.log(`  - Non-members: ${farmers[0].non_members}`);

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

applyMigrations();
