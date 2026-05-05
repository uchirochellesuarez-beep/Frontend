const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, authorizeRoles, verifyLoanBarangayAccess } = require('../middleware/auth');
const { buildBarangayFilter } = require('../utils/barangayHelpers');

// Loan type limits
const LOAN_LIMITS = {
  agricultural: 5000,
  provident: 3000,
  educational: 3000
};

const INTEREST_RATE = 1.00; // Fixed 1% interest applied upfront when loan is created
const PENALTY_RATE = 1.00; // Additional 1% penalty per 6-month period overdue (ONLY after due date if unpaid)
const PAYMENT_TERM_MONTHS = 6; // Fixed 6 months

// Helper function to calculate penalty based on days overdue
const calculatePenalty = (principalAmount, daysOverdue) => {
  // Apply 1% penalty immediately after due date, scaling with time
  // 1 day overdue = 1% penalty, accumulates gradually over 180 days (6 months)
  const totalPenaltyPeriods = Math.max(1, Math.ceil(daysOverdue / 180));
  const penaltyAmount = (principalAmount * PENALTY_RATE / 100) * totalPenaltyPeriods;
  
  return {
    penaltyAmount: parseFloat(penaltyAmount.toFixed(2)),
    periodsPenalty: totalPenaltyPeriods,
    daysOverdue: daysOverdue
  };
};

// Helper function to get today's date as a string in YYYY-MM-DD format (local time, no timezone conversion)
// Accepts optional deviceDate from frontend for accurate date-change detection
const getTodayDateString = (deviceDate = null) => {
  if (deviceDate && /^\d{4}-\d{2}-\d{2}$/.test(deviceDate)) {
    return deviceDate;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return String(today.getFullYear()).padStart(4, '0') + '-' + 
         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
         String(today.getDate()).padStart(2, '0');
};

// Helper function to get reference Date object from deviceDate or current date
const parseReferenceDate = (deviceDate = null) => {
  if (deviceDate && /^\d{4}-\d{2}-\d{2}$/.test(deviceDate)) {
    const [year, month, day] = deviceDate.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper function to apply and persist penalty to database for overdue loans
const applyPenaltyForOverdueLoans = async (deviceDate = null) => {
  try {
    const today = parseReferenceDate(deviceDate);
    const todayStr = getTodayDateString(deviceDate);

    // Find all overdue loans with unpaid balance
    const [overdueLoans] = await pool.execute(
      `SELECT id, loan_amount, principal_amount, remaining_balance, due_date, pending_penalty, penalty_applied_date, status, total_paid 
       FROM loans 
       WHERE status IN ('overdue', 'active', 'approved')
       AND remaining_balance > 0
       AND due_date IS NOT NULL
       AND due_date < ?`,
      [todayStr]
    );

    console.log(`📋 [applyPenaltyForOverdueLoans] Found ${overdueLoans.length} potentially overdue loans (today: ${todayStr})`);

    for (const loan of overdueLoans) {
      try {
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
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

        // Only apply penalty if at least 1 day overdue
        if (daysOverdue < 1) continue;

        // Use principal_amount if available, otherwise calculate from loan_amount
        const principal = parseFloat(loan.principal_amount) || parseFloat(loan.loan_amount);
        if (isNaN(principal) || principal <= 0) continue;

        const penaltyInfo = calculatePenalty(principal, daysOverdue);
        const currentPending = parseFloat(loan.pending_penalty) || 0;
        const totalPaid = parseFloat(loan.total_paid) || 0;
        const loanAmount = parseFloat(loan.loan_amount);

        // Calculate correct remaining_balance: loan_amount + penalty - total_paid
        const correctRemainingBalance = Math.max(0, loanAmount + penaltyInfo.penaltyAmount - totalPaid);
        const currentRemainingBalance = parseFloat(loan.remaining_balance);

        // Update if penalty changed OR remaining_balance doesn't include penalty yet
        if (penaltyInfo.penaltyAmount > currentPending || Math.abs(correctRemainingBalance - currentRemainingBalance) > 0.01) {
          console.log(`💰 Applying penalty to loan ${loan.id}: ₱${penaltyInfo.penaltyAmount} (${daysOverdue} days overdue), remaining: ${currentRemainingBalance} → ${correctRemainingBalance}`);

          // Update loan with new penalty amount and add penalty to remaining_balance
          const penaltyAppliedDate = loan.penalty_applied_date || todayStr;
          await pool.execute(
            `UPDATE loans 
             SET pending_penalty = ?, penalty_applied_date = ?, status = 'overdue', remaining_balance = ?
             WHERE id = ?`,
            [penaltyInfo.penaltyAmount, penaltyAppliedDate, correctRemainingBalance, loan.id]
          );
        }
      } catch (err) {
        console.error(`❌ Error processing penalty for loan ${loan.id}:`, err.message);
      }
    }

    console.log(`✅ [applyPenaltyForOverdueLoans] Completed`);
  } catch (error) {
    console.error('❌ Error in applyPenaltyForOverdueLoans:', error);
  }
};

// Helper function to revert loans from overdue status if due date is now in the future
const revertNonOverdueLoans = async (deviceDate = null) => {
  try {
    const todayStr = getTodayDateString(deviceDate);

    // Find all loans that should NOT be overdue but still have overdue status or orphaned penalty data
    const [nonOverdueLoans] = await pool.execute(
      `SELECT id, status, remaining_balance, total_paid, loan_amount, due_date, pending_penalty 
       FROM loans 
       WHERE (status = 'overdue' OR pending_penalty > 0)
       AND remaining_balance > 0
       AND due_date IS NOT NULL
       AND due_date >= ?`,
      [todayStr]
    );

    console.log(`📋 [revertNonOverdueLoans] Found ${nonOverdueLoans.length} loans that are no longer overdue`);

    for (const loan of nonOverdueLoans) {
      try {
        // Determine what status to revert to
        const totalPaid = parseFloat(loan.total_paid) || 0;
        const loanAmount = parseFloat(loan.loan_amount) || 0;
        
        // If any payment has been made, status should be 'active', otherwise 'approved'
        const revertStatus = totalPaid > 0 ? 'active' : 'approved';
        
        // Remove penalty from remaining_balance since loan is no longer overdue
        const correctedBalance = Math.max(0, loanAmount - totalPaid);
        
        console.log(`↩️ Reverting loan ${loan.id} from 'overdue' to '${revertStatus}' (due date: ${loan.due_date}, today: ${todayStr}), removing penalty from balance: ${loan.remaining_balance} → ${correctedBalance}`);

        // Revert loan status and remove penalty from remaining_balance
        await pool.execute(
          `UPDATE loans SET status = ?, pending_penalty = 0, penalty_applied_date = NULL, remaining_balance = ? WHERE id = ?`,
          [revertStatus, correctedBalance, loan.id]
        );
      } catch (err) {
        console.error(`❌ Error reverting loan ${loan.id}:`, err.message);
      }
    }

    console.log(`✅ [revertNonOverdueLoans] Completed`);
  } catch (error) {
    console.error('❌ Error in revertNonOverdueLoans:', error);
  }
};

// Helper function to calculate due date (6 months from approval) - using local date
const calculateDueDate = (approvalDate) => {
  const date = new Date(approvalDate);
  date.setMonth(date.getMonth() + 6);
  // Return date in YYYY-MM-DD format using local time (no timezone conversion)
  return String(date.getFullYear()).padStart(4, '0') + '-' + 
         String(date.getMonth() + 1).padStart(2, '0') + '-' + 
         String(date.getDate()).padStart(2, '0');
};

// Helper function to mark loans as overdue based on due date (independent of penalty)
const markLoansAsOverdueByDueDate = async (deviceDate = null) => {
  try {
    const todayStr = getTodayDateString(deviceDate);

    console.log(`📋 [markLoansAsOverdueByDueDate] Checking loans for overdue status. Today's date: ${todayStr}`);

    // Find all approved/active loans that are past due with outstanding balance
    const [loansToMarkOverdue] = await pool.execute(
      `SELECT id, status, remaining_balance, due_date
       FROM loans 
       WHERE status IN ('approved', 'active')
       AND remaining_balance > 0
       AND due_date IS NOT NULL
       AND due_date < ?`,
      [todayStr]
    );

    console.log(`📋 [markLoansAsOverdueByDueDate] Found ${loansToMarkOverdue.length} loans past due date that need overdue status`);

    let markedCount = 0;
    for (const loan of loansToMarkOverdue) {
      try {
        console.log(`  - Attempting to mark loan ${loan.id} as overdue (due_date: ${loan.due_date}, today: ${todayStr})`);
        const [updateResult] = await pool.execute(
          `UPDATE loans 
           SET status = 'overdue'
           WHERE id = ? AND status != 'overdue'`,
          [loan.id]
        );
        if (updateResult.affectedRows > 0) {
          markedCount++;
          console.log(`✓ Loan ${loan.id} marked as overdue (due_date: ${loan.due_date}, today: ${todayStr})`);
        } else {
          console.log(`  ⚠ Loan ${loan.id} already overdue or not updated`);
        }
      } catch (err) {
        console.error(`❌ Error marking loan ${loan.id} as overdue:`, err.message);
      }
    }

    console.log(`✅ [markLoansAsOverdueByDueDate] Completed - ${markedCount} loans marked as overdue`);
  } catch (error) {
    console.error('❌ Error in markLoansAsOverdueByDueDate:', error);
  }
};

// Helper function to check if farmer/officer can apply for loan
const canApplyForLoan = async (farmerId) => {
  // Check for unsettled loans
  const [unsettledLoans] = await pool.execute(
    `SELECT id FROM loans 
     WHERE farmer_id = ? 
     AND status IN ('pending', 'approved', 'active', 'overdue')`,
    [farmerId]
  );
  
  if (unsettledLoans.length > 0) {
    return { allowed: false, reason: 'You have an unsettled loan. Please complete your existing loan before applying for a new one.' };
  }
  
  // Check if farmer/officer already had an APPROVED loan in the last 6 months (rejected loans don't count)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  // Use local date string instead of ISO string to avoid timezone issues
  const sixMonthsAgoStr = String(sixMonthsAgo.getFullYear()).padStart(4, '0') + '-' + 
                          String(sixMonthsAgo.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(sixMonthsAgo.getDate()).padStart(2, '0');
  
  const [recentLoans] = await pool.execute(
    `SELECT id FROM loans 
     WHERE farmer_id = ? 
     AND application_date >= ?
     AND status IN ('approved', 'active', 'paid', 'overdue')`,
    [farmerId, sixMonthsAgoStr]
  );
  
  if (recentLoans.length > 0) {
    return { allowed: false, reason: 'You have already availed a loan in the last 6 months. Each person can only apply once every 6 months.' };
  }
  
  return { allowed: true };
};

// Helper function to get approver for officer loans
const getOfficerLoanApprover = async (applicantId) => {
  const [applicant] = await pool.execute(
    'SELECT role, barangay_id FROM farmers WHERE id = ?',
    [applicantId]
  );
  
  if (applicant.length === 0) {
    return { approver: null, reason: 'Applicant not found' };
  }
  
  const { role, barangay_id } = applicant[0];
  
  // Officer loan approval logic:
  // - If Treasurer applies, President approves
  // - If President applies, Treasurer approves
  // - Other officers cannot apply
  
  let requiredApproverRole = null;
  
  if (role === 'treasurer') {
    requiredApproverRole = 'president';
  } else if (role === 'president') {
    requiredApproverRole = 'treasurer';
  } else {
    return { approver: null, reason: 'Only Treasurer and President can apply for officer loans' };
  }
  
  // Find the required approver from the same barangay
  const [approvers] = await pool.execute(
    `SELECT id, full_name FROM farmers 
     WHERE role = ? AND barangay_id = ? AND id != ?`,
    [requiredApproverRole, barangay_id, applicantId]
  );
  
  if (approvers.length === 0) {
    return { 
      approver: null, 
      reason: `No ${requiredApproverRole} found in your barangay to approve this loan` 
    };
  }
  
  return { approver: approvers[0], reason: null };
};

// Get farmer's barangay for loan context
const getFarmerBarangay = async (farmerId) => {
  const [farmers] = await pool.execute(
    'SELECT barangay_id FROM farmers WHERE id = ?',
    [farmerId]
  );
  return farmers.length > 0 ? farmers[0].barangay_id : null;
};

// GET /api/loans - Get all loans with barangay filtering
router.get('/', async (req, res) => {
  try {
    const { farmer_id, status, start_date, end_date, limit = 100, barangay_id, deviceDate } = req.query;

    // Apply penalties to overdue loans before fetching (using device date for accurate detection)
    await applyPenaltyForOverdueLoans(deviceDate);
    // Mark loans as overdue based on due date (independent of penalty)
    await markLoansAsOverdueByDueDate(deviceDate);
    // Revert loans that are no longer overdue due to system date change
    await revertNonOverdueLoans(deviceDate);
    
    // Check if user token is provided for barangay context
    let userBarangayId = null;
    let userRole = 'guest';
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userBarangayId = decoded.barangay_id;
        userRole = decoded.role || 'guest';
      } catch (err) {
        // Token invalid, proceed without filtering
      }
    }

    let query = `
      SELECT 
        l.*,
        f.full_name,
        f.reference_number,
        f.barangay_id as farmer_barangay,
        f.role as applicant_role,
        a.full_name as approved_by_name,
        b.name as barangay_name
      FROM loans l
      JOIN farmers f ON l.farmer_id = f.id
      LEFT JOIN farmers a ON l.approved_by = a.id
      LEFT JOIN barangays b ON f.barangay_id = b.id
      WHERE 1=1`;
    const params = [];
    
    if (farmer_id) {
      query += ' AND l.farmer_id = ?';
      params.push(farmer_id);
    }
    
    if (status) {
      query += ' AND l.status = ?';
      params.push(status);
    }
    
    if (start_date) {
      query += ' AND l.application_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND l.application_date <= ?';
      params.push(end_date);
    }

    // Barangay filtering
    // Officers can only see loans from their barangay
    const targetBarangayId = barangay_id || userBarangayId;
    if (userRole !== 'admin' && targetBarangayId) {
      query += ' AND f.barangay_id = ?';
      params.push(targetBarangayId);
    }
    
    query += ' ORDER BY l.application_date DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [loans] = await pool.execute(query, params);
    
    // Fetch payments for each loan and calculate total including penalties
    const today = parseReferenceDate(deviceDate);
    
    for (let loan of loans) {
      try {
        const [payments] = await pool.execute(
          `SELECT id, amount, payment_date, payment_method, reference_number, remarks 
           FROM loan_payments WHERE loan_id = ? ORDER BY payment_date DESC`,
          [loan.id]
        );
        loan.payments = payments || [];
        
        // Calculate correct status based on current date and due date
        let daysOverdue = 0;
        let calculatedStatus = loan.status;
        
        if (loan.due_date) {
          // Parse due date properly
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
          const daysDifference = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
          
          // Dynamically calculate correct status
          if (daysDifference >= 1 && loan.remaining_balance > 0 && ['approved', 'active', 'overdue'].includes(loan.status)) {
            calculatedStatus = 'overdue';
            daysOverdue = daysDifference;
          } else if (daysDifference < 1 && loan.status === 'overdue' && loan.remaining_balance > 0) {
            // Date went back - revert to approved
            calculatedStatus = 'approved';
            daysOverdue = daysDifference;
          } else {
            daysOverdue = Math.max(0, daysDifference);
          }
        }
        
        loan.status = calculatedStatus;
        
        // Set penalty amounts based on calculated status
        if (calculatedStatus === 'overdue' && loan.due_date && daysOverdue >= 1) {
          loan.penalty_amount = parseFloat(loan.pending_penalty) || 0;
          loan.days_overdue = daysOverdue;
          loan.total_with_penalty = parseFloat(loan.remaining_balance);
        } else if (loan.due_date) {
          loan.penalty_amount = 0;
          loan.days_overdue = Math.max(0, daysOverdue);
          loan.is_overdue = daysOverdue > 0;
          loan.total_with_penalty = parseFloat(loan.remaining_balance);
        } else {
          loan.penalty_amount = 0;
          loan.days_overdue = 0;
          loan.total_with_penalty = parseFloat(loan.remaining_balance);
        }
      } catch (paymentErr) {
        console.error(`Error fetching payments for loan ${loan.id}:`, paymentErr);
        loan.payments = [];
        loan.penalty_amount = parseFloat(loan.pending_penalty) || 0;
        loan.total_with_penalty = parseFloat(loan.remaining_balance); // remaining_balance already includes penalty
        loan.days_overdue = 0;
      }
    }
    
    res.json({ success: true, loans });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch loans' });
  }
});

// POST /api/loans/update-overdue - Update loans to overdue status if past due date
router.post('/update-overdue', async (req, res) => {
  try {
    const deviceDate = req.query.deviceDate || req.body?.deviceDate;
    // Apply penalties to overdue loans first
    await applyPenaltyForOverdueLoans(deviceDate);
    // Mark loans as overdue based on due date (independent of penalty)
    await markLoansAsOverdueByDueDate(deviceDate);
    // Revert loans that are no longer overdue due to system date change
    await revertNonOverdueLoans(deviceDate);

    res.json({ 
      success: true, 
      message: 'Loan overdue status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating overdue loans:', error);
    res.status(500).json({ success: false, message: 'Failed to update overdue loans' });
  }
});

// GET /api/loans/eligibility/:farmerId - Check loan eligibility with barangay context
router.get('/eligibility/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    // Get farmer's barangay
    const barangayId = await getFarmerBarangay(farmerId);
    
    const eligibility = await canApplyForLoan(farmerId);
    res.json({ success: true, ...eligibility, barangay_id: barangayId });
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({ success: false, message: 'Failed to check eligibility' });
  }
});

// GET /api/loans/farmer/:farmerId - Get loans for specific farmer with barangay check
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { deviceDate } = req.query;
    
    // Apply any pending penalties for overdue loans before fetching
    await applyPenaltyForOverdueLoans(deviceDate);
    // Mark loans as overdue based on due date
    await markLoansAsOverdueByDueDate(deviceDate);
    
    const [loans] = await pool.execute(
      `SELECT l.*, b.name as barangay_name
       FROM loans l
       LEFT JOIN barangays b ON l.barangay_id = b.id
       WHERE l.farmer_id = ? 
       ORDER BY l.application_date DESC`,
      [farmerId]
    );
    
    // Calculate penalty information for each loan
    // Note: remaining_balance already includes pending_penalty
    const today = parseReferenceDate(deviceDate);
    
    const loansWithPenalty = loans.map(loan => {
      // Parse due date properly
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
      
      // Calculate correct status based on current date
      let daysOverdue = 0;
      let calculatedStatus = loan.status;
      
      if (loan.due_date) {
        const parts = dueDateStr.split('-');
        const dueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        dueDate.setHours(0, 0, 0, 0);
        const daysDifference = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        
        // Dynamically calculate correct status
        if (daysDifference >= 1 && loan.remaining_balance > 0 && ['approved', 'active', 'overdue'].includes(loan.status)) {
          calculatedStatus = 'overdue';
          daysOverdue = daysDifference;
        } else if (daysDifference < 1 && loan.status === 'overdue' && loan.remaining_balance > 0) {
          // Date went back - revert to approved
          calculatedStatus = 'approved';
          daysOverdue = daysDifference;
        } else {
          daysOverdue = Math.max(0, daysDifference);
        }
      }
      
      loan.status = calculatedStatus;
      
      if (calculatedStatus === 'overdue' && loan.due_date && daysOverdue >= 1) {
        loan.penalty_amount = parseFloat(loan.pending_penalty) || 0;
        loan.days_overdue = daysOverdue;
        loan.total_with_penalty = parseFloat(loan.remaining_balance);
      } else if (loan.due_date) {
        loan.penalty_amount = 0;
        loan.days_overdue = Math.max(0, daysOverdue);
        loan.total_with_penalty = parseFloat(loan.remaining_balance);
      } else {
        loan.penalty_amount = 0;
        loan.days_overdue = 0;
        loan.total_with_penalty = parseFloat(loan.remaining_balance);
      }
      return loan;
    });
    
    res.json({ success: true, loans: loansWithPenalty });
  } catch (error) {
    console.error('Error fetching farmer loans:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch loans' });
  }
});


// GET /api/loans/:id - Get specific loan details with barangay context
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceDate } = req.query; // Get optional device date parameter
    
    // Apply any pending penalties for overdue loans before fetching
    await applyPenaltyForOverdueLoans(deviceDate);
    // Mark loans as overdue based on due date
    await markLoansAsOverdueByDueDate(deviceDate);
    
    const [loans] = await pool.execute(
      `SELECT 
        l.*,
        f.full_name,
        f.reference_number,
        f.barangay_id as farmer_barangay,
        a.full_name as approved_by_name,
        b.name as barangay_name
       FROM loans l
       JOIN farmers f ON l.farmer_id = f.id
       LEFT JOIN farmers a ON l.approved_by = a.id
       LEFT JOIN barangays b ON l.barangay_id = b.id
       WHERE l.id = ?`,
      [id]
    );
    
    if (loans.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }
    
    let loan = loans[0];
    
    // Determine which date to use (device date or server date)
    const referenceDate = parseReferenceDate(deviceDate);
    
    // Parse due date properly
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
    
    // Calculate correct status based on current date and due date
    let daysOverdue = 0;
    let calculatedStatus = loan.status;
    
    if (loan.due_date) {
      const parts = dueDateStr.split('-');
      const dueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      dueDate.setHours(0, 0, 0, 0);
      const daysDifference = Math.floor((referenceDate - dueDate) / (1000 * 60 * 60 * 24));
      
      // Dynamically calculate correct status based on due date
      if (daysDifference >= 1 && loan.remaining_balance > 0 && ['approved', 'active', 'overdue'].includes(loan.status)) {
        calculatedStatus = 'overdue';
        daysOverdue = daysDifference;
      } else if (daysDifference < 1 && loan.status === 'overdue' && loan.remaining_balance > 0) {
        // Date went back before due date - revert to approved
        calculatedStatus = 'approved';
        daysOverdue = daysDifference;
      } else {
        daysOverdue = Math.max(0, daysDifference);
      }
    }
    
    // Set loan status to the dynamically calculated correct status
    loan.status = calculatedStatus;
    
    // Calculate penalty information based on current date
    // Note: remaining_balance already includes pending_penalty, so we just use it as total_with_penalty
    if (calculatedStatus === 'overdue' && loan.due_date && daysOverdue >= 1) {
      loan.penalty_amount = parseFloat(loan.pending_penalty) || 0;
      loan.days_overdue = daysOverdue;
      loan.total_with_penalty = parseFloat(loan.remaining_balance);
    } else {
      loan.penalty_amount = 0;
      loan.days_overdue = 0;
      loan.total_with_penalty = parseFloat(loan.remaining_balance);
    }
    
    // Get payment history
    const [payments] = await pool.execute(
      `SELECT * FROM loan_payments 
       WHERE loan_id = ? 
       ORDER BY payment_date DESC`,
      [id]
    );
    
    res.json({ 
      success: true, 
      loan,
      payments 
    });
  } catch (error) {
    console.error('Error fetching loan details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch loan details' });
  }
});

// POST /api/loans - Create new loan application with barangay context
router.post('/', async (req, res) => {
  try {
    const { 
      farmer_id, 
      loan_amount, 
      loan_type,
      loan_purpose,
      remarks 
    } = req.body;
    
    console.log('Received loan application:', req.body);
    
    // Validate required fields
    if (!farmer_id || !loan_amount || !loan_type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: farmer_id, loan_amount, loan_type' 
      });
    }
    
    // Validate loan type
    if (!['agricultural', 'provident', 'educational'].includes(loan_type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid loan type. Must be agricultural, provident, or educational' 
      });
    }
    
    // Validate loan amount against limits
    if (parseFloat(loan_amount) > LOAN_LIMITS[loan_type]) {
      return res.status(400).json({ 
        success: false, 
        message: `Loan amount exceeds maximum limit of ₱${LOAN_LIMITS[loan_type].toLocaleString()} for ${loan_type} loan` 
      });
    }
    
    // Check eligibility
    const eligibility = await canApplyForLoan(farmer_id);
    if (!eligibility.allowed) {
      return res.status(400).json({ 
        success: false, 
        message: eligibility.reason 
      });
    }

    // Get farmer's barangay
    const barangayId = await getFarmerBarangay(farmer_id);
    if (!barangayId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Farmer barangay assignment is required to apply for loans' 
      });
    }
    
    const application_date = getTodayDateString();
    
    // Calculate total amount with interest (1%)
    const principal = parseFloat(loan_amount);
    const interestAmount = principal * (INTEREST_RATE / 100);
    const totalAmount = principal + interestAmount;
    
    const [result] = await pool.execute(
      `INSERT INTO loans 
       (farmer_id, barangay_id, loan_amount, principal_amount, loan_type, interest_rate, loan_purpose, application_date, 
        total_paid, remaining_balance, payment_term, remarks, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        farmer_id, 
        barangayId,
        totalAmount, // Store total amount (principal + interest)
        principal, // Store original principal separately
        loan_type,
        INTEREST_RATE,
        loan_purpose || `${loan_type} loan`,
        application_date,
        0, // Initialize total_paid to 0
        totalAmount, // Initially, remaining balance equals total amount
        PAYMENT_TERM_MONTHS,
        remarks || null
      ]
    );
    
    // Log activity with barangay context
    try {
      const [farmer] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [farmer_id]);
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description, metadata)
         VALUES (?, ?, 'loan_application', ?, ?)`,
        [
          farmer_id,
          barangayId,
          `${farmer[0]?.full_name || 'Farmer'} applied for ${loan_type} loan of ₱${loan_amount}`,
          JSON.stringify({ loan_id: result.insertId, loan_type, loan_amount })
        ]
      );
    } catch (logErr) {
      console.error('Error logging loan application:', logErr);
    }
    
    console.log(`✓ Loan application created: ID ${result.insertId} for farmer ${farmer_id}`);
    
    res.json({ 
      success: true, 
      message: 'Loan application submitted successfully',
      loan_id: result.insertId,
      status: 'pending',
      barangay_id: barangayId,
      details: {
        principal: principal,
        interest: interestAmount,
        total: totalAmount,
        payment_term: PAYMENT_TERM_MONTHS
      }
    });
  } catch (error) {
    console.error('Error creating loan application:', error);
    res.status(500).json({ success: false, message: 'Failed to create loan application', error: error.message });
  }
});

// PUT /api/loans/:id/approve - Approve loan (Treasurer, President, or Admin based on barangay)
// For officer loans: Treasurer and President approve each other
// For farmer loans: Treasurer or President approves
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by, remarks } = req.body;

    // Get loan and applicant info
    const [loans] = await pool.execute(
      `SELECT l.barangay_id, l.farmer_id, l.status, f.role as applicant_role 
       FROM loans l
       JOIN farmers f ON l.farmer_id = f.id
       WHERE l.id = ?`,
      [id]
    );

    if (loans.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const loan = loans[0];

    // Check if loan is already approved
    if (loan.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Loan is already ${loan.status}. Only pending loans can be approved.` 
      });
    }

    // Get approver info for authorization
    if (approved_by) {
      const [approvers] = await pool.execute(
        'SELECT id, role, barangay_id FROM farmers WHERE id = ?',
        [approved_by]
      );

      if (approvers.length === 0) {
        return res.status(400).json({ success: false, message: 'Approver not found' });
      }

      const approver = approvers[0];

      // Determine if this is an officer loan or farmer loan
      const isOfficerLoan = ['treasurer', 'president'].includes(loan.applicant_role);

      if (isOfficerLoan) {
        // Officer loan approval logic
        // Treasurer loans must be approved by President
        // President loans must be approved by Treasurer
        if (loan.applicant_role === 'treasurer' && approver.role !== 'president') {
          return res.status(403).json({ 
            success: false, 
            message: 'Treasurer loans must be approved by the President of the same barangay' 
          });
        }
        
        if (loan.applicant_role === 'president' && approver.role !== 'treasurer') {
          return res.status(403).json({ 
            success: false, 
            message: 'President loans must be approved by the Treasurer of the same barangay' 
          });
        }
        
        // Check that approver cannot approve their own loan
        if (approver.id === loan.farmer_id) {
          return res.status(403).json({ 
            success: false, 
            message: 'Officers cannot approve their own loans' 
          });
        }
      } else {
        // Farmer loan approval logic
        // ONLY Treasurer (or Treasurer-like roles) can approve farmer loans
        // President CANNOT approve farmer loans
        
        const isPresident = approver.role === 'president';
        if (isPresident) {
          return res.status(403).json({ 
            success: false, 
            message: 'President cannot approve farmer loans. Only Treasurer can approve farmer loans.' 
          });
        }
        
        const allowedApproverRoles = ['treasurer', 'operation_manager', 'business_manager', 'admin'];
        if (!allowedApproverRoles.includes(approver.role)) {
          return res.status(403).json({ 
            success: false, 
            message: 'Only treasurers or admins can approve farmer loans' 
          });
        }
      }

      // Check barangay access
      if (approver.role !== 'admin' && approver.barangay_id !== loan.barangay_id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Officers can only approve loans from their assigned barangay' 
        });
      }
    }

    const approval_date = getTodayDateString();
    const due_date = calculateDueDate(approval_date);

    const [result] = await pool.execute(
      `UPDATE loans 
       SET status = 'approved', approved_by = ?, approval_date = ?, due_date = ?, remarks = ?
       WHERE id = ?`,
      [approved_by || null, approval_date, due_date, remarks || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    // Log approval activity
    try {
      const [farmer] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [loan.farmer_id]);
      const [approverInfo] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [approved_by]);
      
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description, metadata)
         VALUES (?, ?, 'loan_approval', ?, ?)`,
        [
          loan.farmer_id,
          loan.barangay_id,
          `${farmer[0]?.full_name || 'User'} loan approved by ${approverInfo[0]?.full_name || 'Admin'}`,
          JSON.stringify({ loan_id: id, approved_by, approval_date })
        ]
      );
    } catch (logErr) {
      console.error('Error logging loan approval:', logErr);
    }

    res.json({ 
      success: true, 
      message: 'Loan approved successfully',
      loan_id: id,
      status: 'approved',
      due_date 
    });
  } catch (error) {
    console.error('Error approving loan:', error);
    res.status(500).json({ success: false, message: 'Failed to approve loan', error: error.message });
  }
});

// PUT /api/loans/:id/reject - Reject loan (Treasurer, President, or Admin based on barangay)
router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { rejected_by, rejection_reason } = req.body;

    // Get loan and applicant info
    const [loans] = await pool.execute(
      `SELECT l.barangay_id, l.farmer_id, l.status, f.role as applicant_role 
       FROM loans l
       JOIN farmers f ON l.farmer_id = f.id
       WHERE l.id = ?`,
      [id]
    );

    if (loans.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const loan = loans[0];

    // Check if loan is pending
    if (loan.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending loans can be rejected' 
      });
    }

    // Get rejector info for authorization
    if (rejected_by) {
      const [rejecters] = await pool.execute(
        'SELECT id, role, barangay_id FROM farmers WHERE id = ?',
        [rejected_by]
      );

      if (rejecters.length === 0) {
        return res.status(400).json({ success: false, message: 'Rejector not found' });
      }

      const rejecter = rejecters[0];

      // Determine if this is an officer loan or farmer loan
      const isOfficerLoan = ['treasurer', 'president'].includes(loan.applicant_role);

      if (isOfficerLoan) {
        // Officer loan rejection logic
        if (loan.applicant_role === 'treasurer' && rejecter.role !== 'president') {
          return res.status(403).json({ 
            success: false, 
            message: 'Treasurer loans must be rejected by the President' 
          });
        }
        
        if (loan.applicant_role === 'president' && rejecter.role !== 'treasurer') {
          return res.status(403).json({ 
            success: false, 
            message: 'President loans must be rejected by the Treasurer' 
          });
        }
        
        if (rejecter.id === loan.farmer_id) {
          return res.status(403).json({ 
            success: false, 
            message: 'Officers cannot reject their own loans' 
          });
        }
      } else {
        // Farmer loan rejection logic - only treasurer, operation_manager, business_manager, or admin can reject
        // President cannot reject farmer loans (can only view and approve/reject officer loans)
        const rejecterRoles = ['treasurer', 'operation_manager', 'business_manager', 'admin'];
        
        if (!rejecterRoles.includes(rejecter.role)) {
          return res.status(403).json({ 
            success: false, 
            message: 'Only treasurers can reject farmer loans. Presidents can only approve or reject officer loans.' 
          });
        }
      }

      // Check barangay access
      if (rejecter.role !== 'admin' && rejecter.barangay_id !== loan.barangay_id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Officers can only reject loans from their assigned barangay' 
        });
      }
    }

    const rejected_date = getTodayDateString();

    const [result] = await pool.execute(
      `UPDATE loans 
       SET status = 'rejected', rejected_by = ?, rejection_date = ?, rejection_reason = ?
       WHERE id = ?`,
      [rejected_by || null, rejected_date, rejection_reason || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    // Log rejection activity
    try {
      const [farmer] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [loan.farmer_id]);
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description, metadata)
         VALUES (?, ?, 'loan_rejection', ?, ?)`,
        [
          loan.farmer_id,
          loan.barangay_id,
          `${farmer[0]?.full_name || 'User'} loan rejected`,
          JSON.stringify({ loan_id: id, rejected_by, reason: rejection_reason })
        ]
      );
    } catch (logErr) {
      console.error('Error logging loan rejection:', logErr);
    }

    res.json({ 
      success: true, 
      message: 'Loan rejected successfully',
      loan_id: id,
      status: 'rejected'
    });
  } catch (error) {
    console.error('Error rejecting loan:', error);
    res.status(500).json({ success: false, message: 'Failed to reject loan', error: error.message });
  }
});

// PUT /api/loans/:id - Update loan (generic updates with barangay validation)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current loan info
    const [loans] = await pool.execute(
      'SELECT barangay_id, loan_amount, principal_amount, total_paid, status FROM loans WHERE id = ?',
      [id]
    );

    if (loans.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const currentLoan = loans[0];

    // Check if loan_amount is being updated
    const isAmountBeingUpdated = req.body.loan_amount !== undefined && 
                                  req.body.loan_amount !== currentLoan.loan_amount;

    // If amount is being updated, validate and recalculate
    if (isAmountBeingUpdated) {
      const newPrincipal = parseFloat(req.body.loan_amount);
      
      // Validate against loan limits
      if (req.body.loan_type) {
        if (!LOAN_LIMITS[req.body.loan_type]) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid loan type' 
          });
        }
        
        if (newPrincipal > LOAN_LIMITS[req.body.loan_type]) {
          return res.status(400).json({ 
            success: false, 
            message: `Loan amount exceeds maximum limit of ₱${LOAN_LIMITS[req.body.loan_type].toLocaleString()} for ${req.body.loan_type} loan` 
          });
        }
      }

      // Calculate new total with interest (1%)
      const newInterest = newPrincipal * (INTEREST_RATE / 100);
      const newTotalAmount = newPrincipal + newInterest;
      
      // Calculate new remaining balance: total_amount - total_paid
      const currentTotalPaid = parseFloat(currentLoan.total_paid) || 0;
      const newRemainingBalance = newTotalAmount - currentTotalPaid;

      // Update with recalculated values
      await pool.execute(
        `UPDATE loans 
         SET loan_amount = ?, principal_amount = ?, remaining_balance = ?, remarks = ?, loan_type = ?, loan_purpose = ?, status = ?
         WHERE id = ?`,
        [
          newTotalAmount,
          newPrincipal,
          newRemainingBalance,
          req.body.remarks || null,
          req.body.loan_type || currentLoan.loan_type,
          req.body.loan_purpose || null,
          req.body.status || currentLoan.status,
          id
        ]
      );

      console.log(`✓ Loan ${id} updated: Old Amount=${currentLoan.loan_amount}, New Amount=${newTotalAmount}, New Principal=${newPrincipal}, New Remaining=${newRemainingBalance}`);
    } else {
      // No amount change, just update allowed fields
      const updates = [];
      const values = [];

      // Only allow specific fields to be updated
      const allowedFields = ['remarks', 'status', 'loan_type', 'loan_purpose'];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(req.body[field]);
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      values.push(id);
      const [result] = await pool.execute(
        `UPDATE loans SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Loan not found' });
      }
    }

    // Fetch updated loan to return details
    const [updatedLoan] = await pool.execute(
      'SELECT id, loan_amount, principal_amount, remaining_balance, total_paid, interest_rate, payment_term, status FROM loans WHERE id = ?', 
      [id]
    );
    const loan = updatedLoan[0];
    const principal = parseFloat(loan.principal_amount) || parseFloat(loan.loan_amount);
    const interest = parseFloat(loan.loan_amount) - principal;
    const total = parseFloat(loan.loan_amount);

    res.json({ 
      success: true, 
      message: 'Loan updated successfully',
      loan_id: id,
      details: {
        principal: principal,
        interest: interest,
        total: total,
        remaining_balance: loan.remaining_balance,
        total_paid: loan.total_paid,
        status: loan.status,
        payment_term: loan.payment_term
      }
    });
  } catch (error) {
    console.error('Error updating loan:', error);
    res.status(500).json({ success: false, message: 'Failed to update loan', error: error.message });
  }
});

// DELETE /api/loans/:id - Delete loan (Admin only, or pending loans from own barangay)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [loans] = await pool.execute(
      'SELECT barangay_id, status FROM loans WHERE id = ?',
      [id]
    );

    if (loans.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    // Only allow deletion of pending loans
    if (loans[0].status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending loans can be deleted' 
      });
    }

    const [result] = await pool.execute('DELETE FROM loans WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    res.json({ 
      success: true, 
      message: 'Loan deleted successfully',
      loan_id: id 
    });
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).json({ success: false, message: 'Failed to delete loan', error: error.message });
  }
});

// POST /api/loans/:id/payment - Record loan payment
router.post('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_date, payment_method, remarks, recorded_by, reference_number } = req.body;

    // Validate inputs
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    if (!payment_date) {
      return res.status(400).json({ success: false, message: 'Payment date is required' });
    }

    if (!reference_number || reference_number.trim() === '') {
      return res.status(400).json({ success: false, message: 'Receipt number is required' });
    }

    // Get loan details with applicant role
    const [loans] = await pool.execute(
      `SELECT l.id, l.farmer_id, l.barangay_id, l.status, l.loan_amount, l.total_paid, l.remaining_balance, l.due_date, l.pending_penalty, l.principal_amount,
              f.role as applicant_role
       FROM loans l
       JOIN farmers f ON l.farmer_id = f.id
       WHERE l.id = ?`,
      [id]
    );

    if (loans.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const loan = loans[0];

    // Apply any pending penalties for overdue loans before processing payment
    const paymentDeviceDate = req.query.deviceDate || req.body?.deviceDate || null;
    await applyPenaltyForOverdueLoans(paymentDeviceDate);
    // Mark loans as overdue based on due date (independent of penalty)
    await markLoansAsOverdueByDueDate(paymentDeviceDate);
    
    // Refresh loan data to get updated penalty and status if overdue
    const [refreshedLoans] = await pool.execute(
      `SELECT l.id, l.farmer_id, l.barangay_id, l.status, l.loan_amount, l.total_paid, l.remaining_balance, l.due_date, l.pending_penalty, l.principal_amount,
              f.role as applicant_role
       FROM loans l
       JOIN farmers f ON l.farmer_id = f.id
       WHERE l.id = ?`,
      [id]
    );
    
    if (refreshedLoans.length > 0) {
      const updatedLoan = refreshedLoans[0];
      // Update loan with refreshed data
      Object.assign(loan, updatedLoan);
    }

    // Check if loan has a valid barangay assignment
    if (!loan.barangay_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Loan does not have a barangay assignment. Please assign a barangay to this loan before recording payment.' 
      });
    }

    // Check if loan is in a valid status for payment
    const validStatuses = ['approved', 'active', 'overdue'];
    if (!validStatuses.includes(loan.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot record payment for a ${loan.status} loan` 
      });
    }

    // Check authorization - verify the recorded_by user is authorized
    if (recorded_by) {
      const [recorders] = await pool.execute(
        'SELECT role, barangay_id FROM farmers WHERE id = ?',
        [recorded_by]
      );

      if (recorders.length === 0) {
        return res.status(400).json({ success: false, message: 'Recorder not found' });
      }

      const recorder = recorders[0];
      const allowedRoles = ['treasurer', 'operation_manager', 'business_manager', 'president', 'admin'];
      
      if (!allowedRoles.includes(recorder.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only treasurers, operation managers, business managers, presidents, or admins can record payments' 
        });
      }

      // Check barangay access - officers of the same barangay can record payments
      // Admins can record for any barangay
      const recorderBarangayId = parseInt(recorder.barangay_id);
      const loanBarangayId = parseInt(loan.barangay_id);
      
      const isAdmin = recorder.role === 'admin';
      const isSameBarangay = !isNaN(recorderBarangayId) && !isNaN(loanBarangayId) && recorderBarangayId === loanBarangayId;
      
      if (!isAdmin && !isSameBarangay) {
        return res.status(403).json({ 
          success: false, 
          message: `Officers can only record payments for loans from their barangay. Loan is in barangay ${loanBarangayId}, but you are assigned to barangay ${recorderBarangayId}.` 
        });
      }

      // Check if this is an officer loan that requires cross-approval for payment recording
      const isOfficerLoan = ['treasurer', 'president'].includes(loan.applicant_role);
      if (isOfficerLoan) {
        // Officers cannot record payments on their own loans
        if (recorded_by === loan.farmer_id) {
          const applicantName = loan.applicant_role === 'treasurer' ? 'Treasurer' : 'President';
          const approverRole = loan.applicant_role === 'treasurer' ? 'President' : 'Treasurer';
          return res.status(403).json({ 
            success: false, 
            message: `${applicantName}s cannot record payments on their own loans. Only the ${approverRole} can record payments for ${applicantName} loans.` 
          });
        }

        // Check that the recorder is the correct cross-approval officer
        if (['treasurer', 'president'].includes(recorder.role)) {
          // Treasurer loans must be recorded by President, President loans by Treasurer
          const isCorrectRecorder = (loan.applicant_role === 'treasurer' && recorder.role === 'president') ||
                                    (loan.applicant_role === 'president' && recorder.role === 'treasurer');
          
          if (!isCorrectRecorder) {
            const applicantName = loan.applicant_role === 'treasurer' ? 'Treasurer' : 'President';
            const requiredRole = loan.applicant_role === 'treasurer' ? 'President' : 'Treasurer';
            return res.status(403).json({ 
              success: false, 
              message: `Only ${requiredRole} can record payments for ${applicantName} loans. You are ${recorder.role}.` 
            });
          }
        }
      }
    }

    // Check if payment amount exceeds remaining balance
    const currentRemaining = loan.remaining_balance || loan.loan_amount;
    if (parseFloat(amount) > currentRemaining) {
      return res.status(400).json({ 
        success: false, 
        message: `Payment amount (₱${parseFloat(amount).toLocaleString()}) exceeds remaining balance (₱${currentRemaining.toLocaleString()})` 
      });
    }

    // Record the payment
    const [paymentResult] = await pool.execute(
      `INSERT INTO loan_payments (loan_id, amount, payment_date, payment_method, reference_number, remarks, recorded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, parseFloat(amount), payment_date, payment_method || 'cash', reference_number.trim(), remarks || null, recorded_by || null]
    );

    if (paymentResult.affectedRows === 0) {
      return res.status(500).json({ success: false, message: 'Failed to record payment' });
    }

    // Calculate new totals - ensure we use explicit numeric values
    const paymentAmount = parseFloat(amount);
    const currentTotalPaid = parseFloat(loan.total_paid) || 0;
    const loanAmount = parseFloat(loan.loan_amount);
    const currentPendingPenalty = parseFloat(loan.pending_penalty) || 0;
    
    // Apply payment: First to penalty, then to remaining loan balance
    let penaltyPaid = 0;
    let principalPaid = paymentAmount;
    
    if (currentPendingPenalty > 0) {
      if (paymentAmount >= currentPendingPenalty) {
        // Payment covers the full penalty and more
        penaltyPaid = currentPendingPenalty;
        principalPaid = paymentAmount - currentPendingPenalty;
      } else {
        // Payment only partially covers penalty
        penaltyPaid = paymentAmount;
        principalPaid = 0;
      }
    }
    
    const newTotalPaid = currentTotalPaid + principalPaid;
    const newPendingPenalty = Math.max(0, currentPendingPenalty - penaltyPaid);
    // remaining_balance includes penalty, so: loan_amount + pending_penalty - total_paid
    const newRemainingBalance = Math.max(0, loanAmount + newPendingPenalty - newTotalPaid);
    const isPaidOff = newRemainingBalance <= 0 && newPendingPenalty <= 0;
    
    // Determine new status with overdue check
    let newStatus;
    if (isPaidOff) {
      newStatus = 'paid';
    } else {
      // Check if loan is overdue (past due date with remaining balance)
      const todayStr = getTodayDateString();
      
      const isOverdue = loan.due_date && loan.due_date < todayStr && newRemainingBalance > 0;
      
      if (isOverdue) {
        newStatus = 'overdue';
      } else if (loan.status === 'approved') {
        newStatus = 'active';
      } else {
        newStatus = loan.status;
      }
    }
    
    const paidDate = isPaidOff ? payment_date : null;

    console.log(`Payment Update - Loan ${id}: PaymentAmount=${paymentAmount}, PenaltyPaid=${penaltyPaid}, PrincipalPaid=${principalPaid}, OldPending=${currentPendingPenalty}, NewPending=${newPendingPenalty}, OldBalance=${loan.remaining_balance}, NewBalance=${newRemainingBalance}, Status=${newStatus}, DueDate=${loan.due_date}, IsOverdue=${newRemainingBalance > 0 && loan.due_date && new Date(loan.due_date) < new Date()}`);

    // Update loan amounts, penalty, and status
    const [updateResult] = await pool.execute(
      `UPDATE loans 
       SET total_paid = ?, remaining_balance = ?, pending_penalty = ?, status = ?, paid_date = ?, last_payment_date = NOW()
       WHERE id = ?`,
      [newTotalPaid, newRemainingBalance, newPendingPenalty, newStatus, paidDate, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(500).json({ success: false, message: 'Failed to update loan' });
    }

    // Log payment activity
    try {
      const [farmer] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [loan.farmer_id]);
      const [recorder] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [recorded_by]);
      
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description, metadata)
         VALUES (?, ?, 'loan_payment', ?, ?)`,
        [
          loan.farmer_id,
          loan.barangay_id,
          `Payment of ₱${parseFloat(amount).toLocaleString()} recorded by ${recorder[0]?.full_name || 'Admin'}`,
          JSON.stringify({ 
            loan_id: id, 
            payment_amount: parseFloat(amount),
            new_balance: newRemainingBalance,
            recorded_by,
            payment_date
          })
        ]
      );
    } catch (logErr) {
      console.error('Error logging payment:', logErr);
    }

    res.json({ 
      success: true, 
      message: isPaidOff ? 'Loan paid in full!' : 'Payment recorded successfully',
      payment_id: paymentResult.insertId,
      loan_id: id,
      total_paid: newTotalPaid,
      remaining_balance: newRemainingBalance,
      pending_penalty: newPendingPenalty,
      status: newStatus,
      is_paid_off: isPaidOff,
      payment_breakdown: {
        penalty_paid: penaltyPaid,
        principal_paid: principalPaid,
        total_paid: paymentAmount
      }
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment', error: error.message });
  }
});

module.exports = router;
