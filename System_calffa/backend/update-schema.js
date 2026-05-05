const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'agriculture_portal'
});

(async () => {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      ALTER TABLE due_date_notifications 
      MODIFY COLUMN notification_type ENUM(
        'last_month','last_week','3_days','2_days','1_day','due_day','overdue_penalty'
      )
    `);
    console.log('✅ Database schema updated: added overdue_penalty to notification_type enum');
  } catch (err) {
    console.error('❌ Error updating schema:', err.message);
  }
  conn.release();
  process.exit();
})();
