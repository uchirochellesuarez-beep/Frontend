// scheduler/notification-scheduler.js
// Periodically generates due-date notifications for unpaid loans and machinery bookings
// Also updates loan statuses to overdue and applies penalties

const { generateDueDateNotifications } = require('../routes/notifications');
const pool = require('../db');

let intervalId = null;
let lastProcessedDate = null;

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Update loans to overdue status if past due date
 * Also calculates and applies penalties for overdue loans
 */
async function updateOverdueLoans() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatLocalDate(today);
    
    // Find ALL loans (including already overdue) that are past due date with remaining balance
    const [overdueLoans] = await pool.execute(
      `SELECT id, loan_amount, principal_amount, due_date, remaining_balance, pending_penalty, penalty_applied_date, status, total_paid 
       FROM loans 
       WHERE status IN ('approved', 'active', 'overdue')
       AND due_date < ?
       AND due_date IS NOT NULL
       AND remaining_balance > 0`,
      [todayStr]
    );
    
    if (overdueLoans.length > 0) {
      console.log(`📋 Found ${overdueLoans.length} loans past due date`);
      
      for (const loan of overdueLoans) {
        try {
          // Calculate penalty - Parse due_date from YYYY-MM-DD string using local time (NO timezone conversion)
          let dueDateStr;
          if (typeof loan.due_date === 'string') {
            dueDateStr = loan.due_date.split('T')[0];
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
          
          console.log(`  📅 Loan ${loan.id}: ${daysOverdue} days overdue (due: ${loan.due_date}, today: ${todayStr}, status: ${loan.status})`);
          
          if (daysOverdue >= 1) {
            const principal = parseFloat(loan.principal_amount) || parseFloat(loan.loan_amount);
            // Apply 1% penalty immediately after due date, scaling over 180 days
            const totalPenaltyPeriods = Math.max(1, Math.ceil(daysOverdue / 180));
            const penaltyAmount = parseFloat(((principal * 1.00 / 100) * totalPenaltyPeriods).toFixed(2));
            const currentPending = parseFloat(loan.pending_penalty) || 0;
            const totalPaid = parseFloat(loan.total_paid) || 0;
            const loanAmount = parseFloat(loan.loan_amount);
            
            // Use absolute formula: loan_amount + penalty - total_paid
            const correctRemainingBalance = Math.max(0, loanAmount + penaltyAmount - totalPaid);
            const currentRemainingBalance = parseFloat(loan.remaining_balance);
            
            // Update if penalty changed OR remaining_balance is incorrect OR status needs updating
            if (penaltyAmount !== currentPending || Math.abs(correctRemainingBalance - currentRemainingBalance) > 0.01 || loan.status !== 'overdue') {
              const penaltyAppliedDate = loan.penalty_applied_date || todayStr;
              await pool.execute(
                `UPDATE loans SET pending_penalty = ?, penalty_applied_date = ?, remaining_balance = ?, status = 'overdue' WHERE id = ?`,
                [penaltyAmount, penaltyAppliedDate, correctRemainingBalance, loan.id]
              );
              console.log(`  ✅ Loan ${loan.id}: ₱${penaltyAmount} penalty, remaining: ${currentRemainingBalance} → ${correctRemainingBalance}`);
            }
          }
        } catch (err) {
          console.error(`  ❌ Error processing loan ${loan.id}:`, err.message);
        }
      }
      
      console.log(`✅ ${overdueLoans.length} loans processed for overdue status and penalties`);
    }
    
    // Find loans that should NOT be overdue but still have overdue status or orphaned penalty data
    const [revertLoans] = await pool.execute(
      `SELECT id, status, due_date, remaining_balance, loan_amount, total_paid, pending_penalty
       FROM loans
       WHERE (status = 'overdue' OR pending_penalty > 0)
       AND due_date >= ?
       AND remaining_balance > 0`,
      [todayStr]
    );
    
    if (revertLoans.length > 0) {
      console.log(`⏮️ Found ${revertLoans.length} loans that should no longer be overdue (date went back)`);
      
      for (const loan of revertLoans) {
        try {
          const totalPaid = parseFloat(loan.total_paid) || 0;
          const loanAmount = parseFloat(loan.loan_amount) || 0;
          const revertStatus = totalPaid > 0 ? 'active' : 'approved';
          // Remove penalty from remaining_balance using absolute formula
          const correctedBalance = Math.max(0, loanAmount - totalPaid);
          
          await pool.execute(
            `UPDATE loans SET status = ?, pending_penalty = 0, penalty_applied_date = NULL, remaining_balance = ? WHERE id = ?`,
            [revertStatus, correctedBalance, loan.id]
          );
          console.log(`  ⏮️ Loan ${loan.id}: Reverted to '${revertStatus}', balance: ${loan.remaining_balance} → ${correctedBalance}`);
        } catch (err) {
          console.error(`  ❌ Error reverting loan ${loan.id}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error updating overdue loans:', err.message);
  }
}

/**
 * Update machinery bookings to apply interest if past due date (30 days from booking).
 * Interest: Season 1 (0-6 months overdue) = 2%, Season 2 (6+ months) = 4%
 * Calculated on the original total_price (before any interest additions).
 * Interest is added to total_price, increasing the remaining balance.
 */
async function updateOverdueMachineryBookings() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatLocalDate(today);

    // Find machinery bookings that are past due (30 days after booking_date) with unpaid balance
    // This only logs overdue bookings for monitoring — interest is applied manually by the treasurer
    const [overdueBookings] = await pool.execute(
      `SELECT id, total_price, total_paid, booking_date, pending_interest, interest_applied_date, payment_status
       FROM machinery_bookings
       WHERE payment_status IN ('Unpaid', 'Partial')
       AND status IN ('Approved', 'Completed')
       AND DATE_ADD(booking_date, INTERVAL 30 DAY) < ?
       AND (total_price - COALESCE(total_paid, 0)) > 0`,
      [todayStr]
    );

    if (overdueBookings.length > 0) {
      console.log(`🚜 Found ${overdueBookings.length} machinery bookings past due date (interest applied by treasurer only)`);
      for (const booking of overdueBookings) {
        const bookingDate = new Date(booking.booking_date + 'T00:00:00');
        const dueDate = new Date(bookingDate);
        dueDate.setDate(dueDate.getDate() + 30);
        dueDate.setHours(0, 0, 0, 0);
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        const interestApplied = (parseFloat(booking.pending_interest) || 0) > 0;
        console.log(`  📋 Booking ${booking.id}: ${daysOverdue} days overdue, interest ${interestApplied ? 'applied ₱' + booking.pending_interest : 'not yet applied'}`);
      }
    }
  } catch (err) {
    console.error('❌ Error checking overdue machinery bookings:', err.message);
  }
}

/**
 * Run daily notification tasks once per calendar date.
 * This also supports manual system date changes during testing.
 */
async function runDailyTasksIfDateChanged(forceRun = false) {
  const todayStr = formatLocalDate(new Date());
  const shouldRun = forceRun || lastProcessedDate !== todayStr;

  if (!shouldRun) return;

  console.log(`📅 Date checkpoint changed: ${lastProcessedDate || 'none'} -> ${todayStr}`);
  await updateOverdueLoans();
  await updateOverdueMachineryBookings();
  await generateDueDateNotifications();
  lastProcessedDate = todayStr;
  console.log('✅ Daily notification tasks completed');
}

/**
 * Start the notification scheduler
 * - Runs immediately on startup
 * - Then runs every 6 hours to catch new records and date changes
 */
function startNotificationScheduler() {
  console.log('⏰ Starting due-date notification scheduler...');

  // Run immediately on startup (with a small delay to let DB connect)
  setTimeout(async () => {
    try {
      await runDailyTasksIfDateChanged(true);
      console.log('✅ Initial notification and overdue generation complete');
    } catch (err) {
      console.error('❌ Initial generation failed:', err.message);
    }
  }, 5000);

  // Check frequently so manual system date changes trigger quickly.
  // Heavy DB work still runs only when date actually changes.
  const parsedInterval = Number(process.env.NOTIFICATION_DATE_CHECK_INTERVAL_MS);
  const DATE_CHECK_INTERVAL_MS = Number.isFinite(parsedInterval) && parsedInterval > 0
    ? parsedInterval
    : 1000;
  intervalId = setInterval(async () => {
    try {
      await runDailyTasksIfDateChanged(false);
    } catch (err) {
      console.error('❌ Scheduled generation failed:', err.message);
    }
  }, DATE_CHECK_INTERVAL_MS);

  console.log(`⏰ Notification scheduler running (date check every ${DATE_CHECK_INTERVAL_MS}ms)`);
}

function stopNotificationScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('⏰ Notification scheduler stopped');
  }
}

module.exports = { startNotificationScheduler, stopNotificationScheduler };
