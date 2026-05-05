// backend/routes/test-notifications.js
// Test endpoints for notification testing without changing system date
// Use these to test different date scenarios while developing

const express = require('express');
const router = express.Router();
const pool = require('../db');

// Store test date override (in memory)
let testDateOverride = null;

// Helper to get current date (respects test override)
const getCurrentDate = () => {
  if (testDateOverride) {
    const d = new Date(testDateOverride);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── SET TEST DATE ───
router.post('/set-date/:dateString', async (req, res) => {
  try {
    const { dateString } = req.params;
    const testDate = new Date(dateString + 'T00:00:00');
    
    if (isNaN(testDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    testDateOverride = dateString;
    const dateStr = testDate.toISOString().split('T')[0];
    
    console.log(`🧪 TEST DATE SET TO: ${dateStr}`);
    
    res.json({
      success: true,
      message: `Test date set to ${dateStr}`,
      testDate: dateStr,
      realDate: new Date().toISOString().split('T')[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET CURRENT TEST DATE ───
router.get('/current-date', (req, res) => {
  const current = getCurrentDate();
  const currentStr = current.toISOString().split('T')[0];
  const realDate = new Date();
  const realDateStr = realDate.toISOString().split('T')[0];
  
  res.json({
    success: true,
    testDate: testDateOverride ? currentStr : null,
    realDate: realDateStr,
    isTestMode: !!testDateOverride,
    message: testDateOverride 
      ? `Running in test mode with date ${currentStr}` 
      : 'Running with real system date'
  });
});

// ─── RESET TO REAL DATE ───
router.post('/reset-date', (req, res) => {
  testDateOverride = null;
  const realDate = new Date().toISOString().split('T')[0];
  
  console.log(`🔄 TEST DATE RESET TO REAL DATE: ${realDate}`);
  
  res.json({
    success: true,
    message: 'Test date reset to system date',
    date: realDate
  });
});

// ─── GENERATE NOTIFICATIONS FOR TEST DATE ───
router.post('/generate-for-date/:dateString', async (req, res) => {
  try {
    const { dateString } = req.params;
    const testDate = new Date(dateString + 'T00:00:00');
    
    if (isNaN(testDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Import and run the notification generator with test date
    const { generateDueDateNotifications } = require('./notifications');
    const count = await generateDueDateNotifications(dateString);
    
    res.json({
      success: true,
      message: `Generated notifications for ${dateString}`,
      generatedCount: count,
      date: dateString
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── LIST TEST SCENARIOS ───
router.get('/scenarios', async (req, res) => {
  try {
    const [loans] = await pool.execute(`
      SELECT id, farmer_id, due_date, loan_type, loan_amount, remaining_balance
      FROM loans
      WHERE loan_type = 'test_notifications'
      AND remaining_balance > 0
      LIMIT 3
    `);

    const scenarios = [];
    loans.forEach(loan => {
      // Parse due_date from YYYY-MM-DD string using local time (NO timezone conversion)
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
      
      // Trigger date (1 day before)
      const triggerDate = new Date(dueDate);
      triggerDate.setDate(triggerDate.getDate() - 1);
      const triggerStr = triggerDate.toISOString().split('T')[0];
      
      // Overdue date (2 days after)
      const overdueDate = new Date(dueDate);
      overdueDate.setDate(overdueDate.getDate() + 2);
      const overdueStr = overdueDate.toISOString().split('T')[0];
      
      const dueDateDisplay = dueDate.toISOString().split('T')[0];
      
      scenarios.push({
        loanId: loan.id,
        type: loan.loan_type,
        amount: loan.loan_amount,
        dates: {
          trigger: {
            date: triggerStr,
            notification: '💰 Due Tomorrow'
          },
          due: {
            date: dueDateDisplay,
            notification: '📅 On Due Date'
          },
          overdue: {
            date: overdueStr,
            notification: '⚠️ Overdue - Penalty Applied'
          }
        }
      });
    });

    res.json({
      success: true,
      testScenarios: scenarios,
      instructions: {
        step1: 'Choose a scenario above',
        step2: 'Call POST /api/test-notifications/set-date/{dateString}',
        step3: 'Call POST /api/test-notifications/generate-for-date/{dateString}',
        step4: 'Refresh your app and click bell 🔔 to see notification',
        step5: 'Call POST /api/test-notifications/reset-date to go back to real date'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── APPLY PENALTIES FOR TEST DATE ───
router.post('/apply-penalties/:dateString', async (req, res) => {
  try {
    const { dateString } = req.params;
    console.log(`🧪 [apply-penalties] Received dateString: "${dateString}"`);
    
    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const todayStr = dateString;
    console.log(`📅 [apply-penalties] Using test date: ${todayStr}`);

    // Create a proper test date for calculations (in local timezone)
    const parts = todayStr.split('-');
    const testDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    testDate.setHours(0, 0, 0, 0);

    // Find all overdue loans
    const [overdueLoans] = await pool.execute(
      `SELECT id, loan_amount, principal_amount, due_date, remaining_balance, pending_penalty, penalty_applied_date, status 
       FROM loans 
       WHERE status IN ('approved', 'active', 'overdue')
       AND due_date < ?
       AND due_date IS NOT NULL
       AND remaining_balance > 0`,
      [todayStr]
    );

    console.log(`📋 Found ${overdueLoans.length} loans past ${todayStr} for penalty application`);

    const calculatePenalty = (principalAmount, daysOverdue) => {
      const totalPenaltyPeriods = Math.max(1, Math.ceil(daysOverdue / 180));
      const penaltyAmount = (principalAmount * 1.00 / 100) * totalPenaltyPeriods;
      return {
        penaltyAmount: parseFloat(penaltyAmount.toFixed(2)),
        periodsPenalty: totalPenaltyPeriods,
        daysOverdue: daysOverdue
      };
    };

    const results = [];
    for (const loan of overdueLoans) {
      try {
        // Handle both string and Date object formats from database
        let dueDateStr;
        if (typeof loan.due_date === 'string') {
          dueDateStr = loan.due_date.split('T')[0]; // Extract YYYY-MM-DD if ISO string
        } else if (loan.due_date instanceof Date) {
          // Convert Date to YYYY-MM-DD in local timezone
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
        
        const daysOverdue = Math.floor((testDate - dueDate) / (1000 * 60 * 60 * 24));

        console.log(`  📅 Loan ${loan.id}: ${daysOverdue} days overdue (due: ${dueDateStr}, test date: ${todayStr})`);

        if (daysOverdue >= 1) {
          const principal = parseFloat(loan.principal_amount) || parseFloat(loan.loan_amount);
          const penaltyInfo = calculatePenalty(principal, daysOverdue);
          const currentPending = parseFloat(loan.pending_penalty) || 0;

          if (penaltyInfo.penaltyAmount > currentPending) {
            const penaltyAppliedDate = loan.penalty_applied_date || todayStr;
            const newRemainingBalance = parseFloat(loan.remaining_balance) + (penaltyInfo.penaltyAmount - currentPending);
            await pool.execute(
              `UPDATE loans SET pending_penalty = ?, penalty_applied_date = ?, remaining_balance = ?, status = 'overdue' WHERE id = ?`,
              [penaltyInfo.penaltyAmount, penaltyAppliedDate, newRemainingBalance, loan.id]
            );
            console.log(`  ✅ Penalty applied to loan ${loan.id}: ₱${penaltyInfo.penaltyAmount}`);
            results.push({
              loanId: loan.id,
              daysOverdue,
              penaltyAmount: penaltyInfo.penaltyAmount,
              status: 'applied'
            });
          }
        }
      } catch (err) {
        console.error(`  ❌ Error processing loan ${loan.id}:`, err.message);
        results.push({
          loanId: loan.id,
          status: 'error',
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      message: `Penalties applied for ${todayStr}`,
      testDate: todayStr,
      results
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── APPLY PENALTIES FOR TODAY'S DATE ───
router.post('/apply-penalties-today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`🧪 [apply-penalties-today] Applying penalties for TODAY: ${todayStr}`);
    
    // Find all overdue loans
    const [overdueLoans] = await pool.execute(
      `SELECT id, loan_amount, principal_amount, due_date, remaining_balance, pending_penalty, penalty_applied_date, status 
       FROM loans 
       WHERE status IN ('approved', 'active', 'overdue')
       AND due_date < ?
       AND due_date IS NOT NULL
       AND remaining_balance > 0`,
      [todayStr]
    );

    console.log(`📋 Found ${overdueLoans.length} loans past ${todayStr} for penalty application`);

    const calculatePenalty = (principalAmount, daysOverdue) => {
      const totalPenaltyPeriods = Math.max(1, Math.ceil(daysOverdue / 180));
      const penaltyAmount = (principalAmount * 1.00 / 100) * totalPenaltyPeriods;
      return {
        penaltyAmount: parseFloat(penaltyAmount.toFixed(2)),
        periodsPenalty: totalPenaltyPeriods,
        daysOverdue: daysOverdue
      };
    };

    const results = [];
    for (const loan of overdueLoans) {
      try {
        // Handle both string and Date formats from database
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

        console.log(`  📅 Loan ${loan.id}: ${daysOverdue} days overdue (due: ${dueDateStr}, today: ${todayStr})`);

        if (daysOverdue >= 1) {
          const principal = parseFloat(loan.principal_amount) || parseFloat(loan.loan_amount);
          const penaltyInfo = calculatePenalty(principal, daysOverdue);
          const currentPending = parseFloat(loan.pending_penalty) || 0;

          if (penaltyInfo.penaltyAmount > currentPending) {
            const penaltyAppliedDate = loan.penalty_applied_date || todayStr;
            const penaltyIncrease = penaltyInfo.penaltyAmount - currentPending;
            const newRemainingBalance = parseFloat(loan.remaining_balance) + penaltyIncrease;
            
            await pool.execute(
              `UPDATE loans SET pending_penalty = ?, penalty_applied_date = ?, remaining_balance = ?, status = 'overdue' WHERE id = ?`,
              [penaltyInfo.penaltyAmount, penaltyAppliedDate, newRemainingBalance, loan.id]
            );
            console.log(`  ✅ Penalty applied to loan ${loan.id}: ₱${penaltyInfo.penaltyAmount}`);
            results.push({
              loanId: loan.id,
              daysOverdue,
              penaltyAmount: penaltyInfo.penaltyAmount,
              newRemainingBalance,
              status: 'applied'
            });
          } else {
            console.log(`  ℹ️ Loan ${loan.id}: Penalty already applied (₱${currentPending})`);
            results.push({
              loanId: loan.id,
              status: 'skipped',
              reason: 'penalty already applied'
            });
          }
        }
      } catch (err) {
        console.error(`  ❌ Error processing loan ${loan.id}:`, err.message);
        results.push({
          loanId: loan.id,
          status: 'error',
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      message: `Penalties applied for TODAY (${todayStr})`,
      todayDate: todayStr,
      systemDate: new Date().toISOString().split('T')[0],
      results
    });
  } catch (err) {
    console.error('Error in apply-penalties-today:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
