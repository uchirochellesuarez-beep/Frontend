// Check if income_status_audit_log table exists
// Run: node check-audit-table.js

const pool = require('./db');

async function check() {
  try {
    console.log('Checking for income_status_audit_log table...\n');

    const [tables] = await pool.execute(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'income_status_audit_log'
    `);

    if (tables.length > 0) {
      console.log('✅ income_status_audit_log table EXISTS');
      
      // Get table structure
      const [columns] = await pool.execute(`
        SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'income_status_audit_log' AND TABLE_SCHEMA = DATABASE()
      `);
      
      console.log('\nTable columns:');
      columns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('❌ income_status_audit_log table DOES NOT EXIST');
      console.log('\nCreating the table now...');
      
      await pool.execute(`
        CREATE TABLE income_status_audit_log (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          income_record_id INT UNSIGNED NOT NULL,
          farmer_id INT UNSIGNED NOT NULL,
          old_status VARCHAR(50),
          new_status VARCHAR(50) NOT NULL,
          changed_by INT UNSIGNED,
          reason_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (income_record_id) REFERENCES farmer_income_records(id) ON DELETE CASCADE,
          FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      
      console.log('✅ Table created successfully!');
    }

    await pool.end();
    console.log('\n✅ Check complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

check();
