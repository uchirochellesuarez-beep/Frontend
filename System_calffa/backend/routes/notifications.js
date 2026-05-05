// routes/notifications.js
// Simplified notification system: ONE notification per item, 1 day before due date
// Also generates overdue payment notifications when loans are past due

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Penalty calculation helper
const calculatePenalty = (principalAmount, daysOverdue) => {
  // Apply 1% penalty immediately after due date, scaling over 180 days (6 months)
  // 1 day overdue = 1% penalty, 180+ days = 2% penalty, etc.
  const totalPenaltyPeriods = Math.max(1, Math.ceil(daysOverdue / 180));
  const penaltyAmount = (principalAmount * 1 / 100) * totalPenaltyPeriods;
  
  return {
    penaltyAmount: parseFloat(penaltyAmount.toFixed(2)),
    periodsPenalty: totalPenaltyPeriods,
    daysOverdue: daysOverdue
  };
};

// ─── GET /api/notifications ─── Fetch unread notifications for the logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const deviceDate = req.query.deviceDate; // Accept device date from frontend
    
    // Generate notifications using device date if provided
    await generateDueDateNotifications(deviceDate);

    let query, params;
    const todayStr = deviceDate || formatLocalDate(new Date());

    if (['admin', 'treasurer', 'president'].includes(userRole)) {
      // Officers see all notifications in their scope
      query = `
        SELECT n.*, f.full_name AS farmer_name, f.reference_number
        FROM due_date_notifications n
        JOIN farmers f ON n.farmer_id = f.id
        WHERE n.trigger_date <= ?
          AND n.notification_type IN ('1_day', 'overdue_penalty')
        ORDER BY n.is_read ASC, n.trigger_date DESC
        LIMIT 50
      `;
      params = [todayStr];
    } else {
      // Farmers only see their own notifications
      query = `
        SELECT n.*, f.full_name AS farmer_name, f.reference_number
        FROM due_date_notifications n
        JOIN farmers f ON n.farmer_id = f.id
        WHERE n.farmer_id = ? 
          AND n.trigger_date <= ?
          AND n.notification_type IN ('1_day', 'overdue_penalty')
        ORDER BY n.is_read ASC, n.trigger_date DESC
        LIMIT 50
      `;
      params = [userId, todayStr];
    }

    const [notifications] = await pool.execute(query, params);
    res.json({ success: true, notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// ─── GET /api/notifications/unread-count ─── Count unread notifications
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const deviceDate = req.query.deviceDate; // Accept device date from frontend

    // Generate notifications using device date if provided
    await generateDueDateNotifications(deviceDate);

    let query, params;
    const todayStr = deviceDate || formatLocalDate(new Date());

    if (['admin', 'treasurer', 'president'].includes(userRole)) {
      query = `
        SELECT COUNT(*) as count 
        FROM due_date_notifications 
        WHERE is_read = 0 
          AND trigger_date <= ?
          AND notification_type IN ('1_day', 'overdue_penalty')
      `;
      params = [todayStr];
    } else {
      query = `
        SELECT COUNT(*) as count 
        FROM due_date_notifications 
        WHERE farmer_id = ? 
          AND is_read = 0 
          AND trigger_date <= ?
          AND notification_type IN ('1_day', 'overdue_penalty')
      `;
      params = [userId, todayStr];
    }

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, count: rows[0].count });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch count' });
  }
});

// ─── PUT /api/notifications/:id/read ─── Mark single notification as read (like Facebook)
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute(`UPDATE due_date_notifications SET is_read = 1 WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

// ─── PUT /api/notifications/read-all ─── Mark all as read
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const deviceDate = req.query.deviceDate; // Accept device date from frontend
    const todayStr = deviceDate || formatLocalDate(new Date());

    if (['admin', 'treasurer', 'president'].includes(userRole)) {
      await pool.execute(`
        UPDATE due_date_notifications 
        SET is_read = 1 
        WHERE trigger_date <= ? 
          AND notification_type IN ('1_day', 'overdue_penalty')
      `, [todayStr]);
    } else {
      await pool.execute(`
        UPDATE due_date_notifications 
        SET is_read = 1 
        WHERE farmer_id = ? 
          AND trigger_date <= ?
          AND notification_type IN ('1_day', 'overdue_penalty')
      `, [userId, todayStr]);
    }
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all read:', err);
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
});

// ─── POST /api/notifications/generate ─── Manually trigger notification generation
router.post('/generate', verifyToken, async (req, res) => {
  try {
    if (!['admin', 'treasurer', 'president'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const count = await generateDueDateNotifications();
    res.json({ success: true, message: `Generated ${count} new notifications` });
  } catch (err) {
    console.error('Error generating notifications:', err);
    res.status(500).json({ success: false, message: 'Failed to generate notifications' });
  }
});

// ─── Notification Generation: ONLY '1_day' notifications (1 day before due date) ───
// Accepts optional testDate parameter for testing without changing system date

async function generateDueDateNotifications(testDate = null) {
  let totalGenerated = 0;

  // Calculate today's date - use testDate if provided, otherwise use system date
  let today;
  if (testDate) {
    // Parse testDate properly to avoid timezone shifts
    const [year, month, day] = testDate.split('-').map(Number);
    today = new Date(year, month - 1, day, 0, 0, 0, 0);
  } else {
    today = new Date();
  }
  today.setHours(0, 0, 0, 0); // Set to start of day
  const todayStr = formatLocalDate(today);

  // ─── LOANS: Trigger notification 1 day before due date ───
  try {
    const [loans] = await pool.execute(`
      SELECT l.id, l.farmer_id, l.loan_amount, l.remaining_balance, l.due_date, 
             l.loan_type, l.status, f.full_name
      FROM loans l
      JOIN farmers f ON l.farmer_id = f.id
      WHERE l.status IN ('active', 'approved', 'overdue')
        AND l.remaining_balance > 0
        AND l.due_date IS NOT NULL
    `);

    console.log(`\n🔍 [generateDueDateNotifications] TEST MODE: ${testDate ? `Testing with date ${testDate}` : 'Using system date'}`);
    console.log(`📅 Processing date: ${todayStr}`);
    console.log(`📋 Found ${loans.length} loans with status in ('active', 'approved', 'overdue')\n`);

    for (const loan of loans) {
      if (!loan.due_date) continue; // Skip if no due date
      
      // Calculate the trigger date (1 day before due date)
      // Handle both string and Date formats from database
      let dueDateStr;
      if (typeof loan.due_date === 'string') {
        dueDateStr = loan.due_date.split('T')[0]; // Extract YYYY-MM-DD
      } else if (loan.due_date instanceof Date) {
        const year = loan.due_date.getFullYear();
        const month = String(loan.due_date.getMonth() + 1).padStart(2, '0');
        const day = String(loan.due_date.getDate()).padStart(2, '0');
        dueDateStr = `${year}-${month}-${day}`;
      } else {
        dueDateStr = loan.due_date;
      }
      
      const parts = dueDateStr.split('-');
      const dueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      dueDate.setHours(0, 0, 0, 0);
      
      if (isNaN(dueDate.getTime())) continue; // Skip invalid dates
      
      const triggerDate = new Date(dueDate);
      triggerDate.setDate(triggerDate.getDate() - 1);
      triggerDate.setHours(0, 0, 0, 0); // Ensure start of day for consistency
      const triggerDateStr = formatLocalDate(triggerDate);

      // Generate if today IS the trigger date OR if today is after trigger date but notification doesn't exist yet
      // This handles cases where the date has changed or the function didn't run at the right time
      const isOnOrAfterTriggerDate = todayStr >= triggerDateStr;
      
      const dueDateStrDisplay = formatLocalDate(dueDate);
      console.log(`  └─ Loan ${loan.id}: Due=${dueDateStrDisplay}, Trigger=${triggerDateStr}, Today=${todayStr}, Match=${isOnOrAfterTriggerDate ? '✓' : '✗'}`);
      
      if (!isOnOrAfterTriggerDate) continue;

      const loanLabel = loan.loan_type?.charAt(0).toUpperCase() + loan.loan_type?.slice(1) || 'Loan';
      const amount = parseFloat(loan.remaining_balance).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      const inserted = await upsertNotification({
        farmer_id: loan.farmer_id,
        reference_type: 'loan',
        reference_id: loan.id,
        notification_type: '1_day',
        title: `${loanLabel} Due Tomorrow`,
        message: `Remaining balance: ₱${amount}`,
        due_date: loan.due_date,
        trigger_date: triggerDateStr
      });
      if (inserted) totalGenerated++;
    }
  } catch (err) {
    console.error('Error processing loans for notifications:', err.message);
  }

  // ─── LOANS: Trigger notification for overdue loans with penalty ───
  try {
    // Reuse the same 'today' date for consistency (respects testDate if provided)
    const [overdueLoans] = await pool.execute(`
      SELECT l.id, l.farmer_id, l.principal_amount, l.loan_amount, l.remaining_balance, l.due_date, 
             l.loan_type, l.status, f.full_name
      FROM loans l
      JOIN farmers f ON l.farmer_id = f.id
      WHERE l.status = 'overdue'
        AND l.remaining_balance > 0
        AND l.due_date IS NOT NULL
        AND l.due_date < ?
    `, [todayStr]);

    for (const loan of overdueLoans) {
      if (!loan.due_date) continue;

      // Handle both string and Date formats from database
      let dueDateStr;
      if (typeof loan.due_date === 'string') {
        dueDateStr = loan.due_date.split('T')[0]; // Extract YYYY-MM-DD
      } else if (loan.due_date instanceof Date) {
        const year = loan.due_date.getFullYear();
        const month = String(loan.due_date.getMonth() + 1).padStart(2, '0');
        const day = String(loan.due_date.getDate()).padStart(2, '0');
        dueDateStr = `${year}-${month}-${day}`;
      } else {
        dueDateStr = loan.due_date;
      }
      
      const parts = dueDateStr.split('-');
      const dueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      dueDate.setHours(0, 0, 0, 0);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      
      // Generate penalty notification if overdue by 1+ days
      if (daysOverdue < 1) continue;

      const principal = parseFloat(loan.principal_amount) || parseFloat(loan.loan_amount);
      if (isNaN(principal) || principal <= 0) continue; // Skip invalid amounts
      
      const penaltyInfo = calculatePenalty(principal, daysOverdue);
      
      const loanLabel = loan.loan_type?.charAt(0).toUpperCase() + loan.loan_type?.slice(1) || 'Loan';
      const remainingBalance = parseFloat(loan.remaining_balance).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      const penaltyAmount = penaltyInfo.penaltyAmount.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      const totalWithPenalty = (parseFloat(loan.remaining_balance) + penaltyInfo.penaltyAmount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      const inserted = await upsertNotification({
        farmer_id: loan.farmer_id,
        reference_type: 'loan',
        reference_id: loan.id,
        notification_type: 'overdue_penalty',
        title: `⚠️ ${loanLabel} Overdue - Penalty Applied`,
        message: `Days overdue: ${daysOverdue} | Penalty: ₱${penaltyAmount} (${penaltyInfo.periodsPenalty} period${penaltyInfo.periodsPenalty > 1 ? 's' : ''}) | New total: ₱${totalWithPenalty}`,
        due_date: loan.due_date,
        trigger_date: todayStr
      });
      if (inserted) totalGenerated++;
    }
  } catch (err) {
    console.error('Error processing overdue loans for penalty notifications:', err.message);
  }

  // ─── MACHINERY BOOKINGS: Trigger notification 1 day before due date ───
  try {
    const [bookings] = await pool.execute(`
      SELECT mb.id, mb.farmer_id, mb.total_price, mb.remaining_balance, 
             mb.booking_date, mb.payment_status, mb.status,
             mi.machinery_name, f.full_name
      FROM machinery_bookings mb
      JOIN farmers f ON mb.farmer_id = f.id
      LEFT JOIN machinery_inventory mi ON mb.machinery_id = mi.id
      WHERE mb.payment_status IN ('Unpaid', 'Partial')
        AND mb.remaining_balance > 0
        AND mb.status NOT IN ('Rejected', 'Cancelled')
    `);

    for (const booking of bookings) {
      if (!booking.booking_date) continue; // Skip if no booking date
      
      // Calculate due date: 30 days after booking
      const bookingDateObj = new Date(booking.booking_date + 'T00:00:00');
      if (isNaN(bookingDateObj.getTime())) continue; // Skip invalid dates
      
      const dueDate = new Date(bookingDateObj);
      dueDate.setDate(dueDate.getDate() + 30);
      dueDate.setHours(0, 0, 0, 0); // Ensure start of day
      const dueDateStr = formatLocalDate(dueDate);

      // Calculate trigger date (1 day before due date)
      const triggerDate = new Date(dueDate);
      triggerDate.setDate(triggerDate.getDate() - 1);
      triggerDate.setHours(0, 0, 0, 0);
      const triggerDateStr = formatLocalDate(triggerDate);

      // Generate if today is on or after the trigger date
      const isOnOrAfterTriggerDate = todayStr >= triggerDateStr;
      if (!isOnOrAfterTriggerDate) continue;

      const machineryName = booking.machinery_name || 'Machinery';
      const amount = parseFloat(booking.remaining_balance).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      const inserted = await upsertNotification({
        farmer_id: booking.farmer_id,
        reference_type: 'machinery_booking',
        reference_id: booking.id,
        notification_type: '1_day',
        title: `${machineryName} Payment Due Tomorrow`,
        message: `Remaining balance: ₱${amount}`,
        due_date: dueDateStr,
        trigger_date: triggerDateStr
      });
      if (inserted) totalGenerated++;
    }
  } catch (err) {
    console.error('Error processing machinery bookings for notifications:', err.message);
  }

  // ─── MACHINERY BOOKINGS: Overdue interest notifications (similar to loan penalties) ───
  try {
    const [overdueBookings] = await pool.execute(`
      SELECT mb.id, mb.farmer_id, mb.total_price, mb.total_paid, mb.pending_interest,
             mb.booking_date, mb.payment_status,
             mi.machinery_name, f.full_name
      FROM machinery_bookings mb
      JOIN farmers f ON mb.farmer_id = f.id
      LEFT JOIN machinery_inventory mi ON mb.machinery_id = mi.id
      WHERE mb.payment_status IN ('Unpaid', 'Partial')
        AND mb.status IN ('Approved', 'Completed')
        AND DATE_ADD(mb.booking_date, INTERVAL 30 DAY) < ?
        AND (mb.total_price - COALESCE(mb.total_paid, 0)) > 0
    `, [todayStr]);

    for (const booking of overdueBookings) {
      if (!booking.booking_date) continue;

      const bookingDate = new Date(booking.booking_date + 'T00:00:00');
      const dueDate = new Date(bookingDate);
      dueDate.setDate(dueDate.getDate() + 30);
      dueDate.setHours(0, 0, 0, 0);
      const dueDateStr = formatLocalDate(dueDate);

      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      if (daysOverdue < 1) continue;

      const monthsOverdue = Math.floor(daysOverdue / 30.44);
      const rate = monthsOverdue <= 6 ? 0.02 : 0.04;
      const seasonLabel = monthsOverdue <= 6 ? 'Season 1 (0-6mo): 2%' : 'Season 2 (6+mo): 4%';

      const originalPrice = parseFloat(booking.total_price) - (parseFloat(booking.pending_interest) || 0);
      const interestAmt = parseFloat((originalPrice * rate).toFixed(2));
      const remainBal = parseFloat(booking.total_price) - (parseFloat(booking.total_paid) || 0);

      const machineryName = booking.machinery_name || 'Machinery';
      const interestStr = interestAmt.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const balanceStr = remainBal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const inserted = await upsertNotification({
        farmer_id: booking.farmer_id,
        reference_type: 'machinery_booking',
        reference_id: booking.id,
        notification_type: 'overdue_penalty',
        title: `⚠️ ${machineryName} Payment Overdue - Interest Applied`,
        message: `Days overdue: ${daysOverdue} | Interest: ₱${interestStr} (${seasonLabel}) | Balance: ₱${balanceStr}`,
        due_date: dueDateStr,
        trigger_date: todayStr
      });
      if (inserted) totalGenerated++;
    }
  } catch (err) {
    console.error('Error processing overdue machinery bookings for interest notifications:', err.message);
  }

  console.log(`📬 Generated ${totalGenerated} due-date notifications for tomorrow`);
  return totalGenerated;
}

// ─── Insert or update notification (prevents duplicates, updates overdue info) ───
async function upsertNotification(data) {
  try {
    const [existing] = await pool.execute(
      `SELECT id, trigger_date, message FROM due_date_notifications 
       WHERE farmer_id = ? AND reference_type = ? AND reference_id = ? AND notification_type = ?`,
      [data.farmer_id, data.reference_type, data.reference_id, data.notification_type]
    );
    if (existing.length > 0) {
      // For overdue_penalty notifications, update trigger_date and message (penalty info changes daily)
      if (data.notification_type === 'overdue_penalty') {
        const existingTrigger = typeof existing[0].trigger_date === 'string' 
          ? existing[0].trigger_date.split('T')[0] 
          : (existing[0].trigger_date instanceof Date ? formatLocalDate(existing[0].trigger_date) : existing[0].trigger_date);
        if (existingTrigger !== data.trigger_date || existing[0].message !== data.message) {
          await pool.execute(
            `UPDATE due_date_notifications 
             SET trigger_date = ?, message = ?, title = ?, is_read = 0
             WHERE id = ?`,
            [data.trigger_date, data.message, data.title, existing[0].id]
          );
          return true;
        }
      }
      return false; // Already exists, no update needed
    }

    await pool.execute(
      `INSERT INTO due_date_notifications 
       (farmer_id, reference_type, reference_id, notification_type, title, message, due_date, trigger_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.farmer_id, data.reference_type, data.reference_id, data.notification_type,
       data.title, data.message, data.due_date, data.trigger_date]
    );
    return true;
  } catch (err) {
    // Ignore duplicate key errors (unique constraint)
    if (err.code === 'ER_DUP_ENTRY') return false;
    console.error('Error inserting notification:', err.message);
    return false;
  }
}

// Export for use by scheduler
module.exports = router;
module.exports.generateDueDateNotifications = generateDueDateNotifications;
