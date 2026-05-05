const pool = require('./db');
async function run() {
  try {
    const [cols] = await pool.execute("SHOW COLUMNS FROM machinery_bookings LIKE 'pending_interest'");
    if (cols.length === 0) {
      await pool.execute('ALTER TABLE machinery_bookings ADD COLUMN pending_interest DECIMAL(10, 2) DEFAULT 0.00 AFTER remaining_balance');
      console.log('Added pending_interest column');
    } else {
      console.log('pending_interest column already exists');
    }
    const [cols2] = await pool.execute("SHOW COLUMNS FROM machinery_bookings LIKE 'interest_applied_date'");
    if (cols2.length === 0) {
      await pool.execute('ALTER TABLE machinery_bookings ADD COLUMN interest_applied_date DATE AFTER pending_interest');
      console.log('Added interest_applied_date column');
    } else {
      console.log('interest_applied_date column already exists');
    }
    try {
      await pool.execute('CREATE INDEX idx_machinery_bookings_overdue ON machinery_bookings(payment_status, booking_date)');
      console.log('Created index');
    } catch(e) { console.log('Index already exists or skipped'); }
    console.log('Migration complete');
    await pool.end();
  } catch(e) { console.error(e.message); await pool.end(); }
}
run();
