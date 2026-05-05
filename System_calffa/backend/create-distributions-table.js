// Create income_assistance_distributions table
const pool = require('./db');

async function createTable() {
  const conn = await pool.getConnection();
  try {
    console.log('📦 Creating income_assistance_distributions table...\n');

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS income_assistance_distributions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        income_record_id INT UNSIGNED NOT NULL,
        farmer_id INT UNSIGNED NOT NULL,
        barangay_id INT NOT NULL,
        assistance_type ENUM('fertilizer', 'seeds', 'both') NOT NULL,
        quantity INT DEFAULT 0,
        unit VARCHAR(50),
        status ENUM('Pending', 'Ready for Distribution', 'Distributed', 'Confirmed Received') DEFAULT 'Pending' NOT NULL,
        created_by INT UNSIGNED NOT NULL,
        distribution_date TIMESTAMP NULL,
        received_date TIMESTAMP NULL,
        confirmed_by INT UNSIGNED,
        confirmed_at TIMESTAMP NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (income_record_id) REFERENCES farmer_income_records(id) ON DELETE CASCADE,
        FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
        FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES farmers(id) ON DELETE RESTRICT,
        FOREIGN KEY (confirmed_by) REFERENCES farmers(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ income_assistance_distributions table created successfully');
    
  } catch(err) {
    if (err.message.includes('already exists')) {
      console.log('⚠️ Table already exists');
    } else {
      console.error('❌ Error:', err.message);
    }
  }
  conn.release();
  process.exit(0);
}

createTable();
