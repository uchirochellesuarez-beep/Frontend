/**
 * Credit Analyzer - Machine Learning Module for Farmer Loan Risk Assessment
 * 
 * This module analyzes historical loan and repayment data to:
 * 1. Classify farmers as Good, Average, or High-Risk payers
 * 2. Generate credit scores (0-100)
 * 3. Provide decision support for loan administrators
 * 
 * Classification Criteria:
 * - GOOD PAYER: High on-time payment rate, low defaults
 * - AVERAGE PAYER: Some late payments but completes loans
 * - HIGH-RISK/BAD PAYER: Frequent late payments or defaults
 */

const pool = require('../db');

// Constants for classification
const CREDIT_ASSESSMENT_WEIGHTS = {
  paymentHistory: 0.40,    // 40% - Most important
  defaultHistory: 0.30,    // 30% - Very important
  loanVolume: 0.15,        // 15% - Number of loans taken
  activityRecency: 0.15    // 15% - Recent activity
};

const CLASSIFICATION_THRESHOLDS = {
  GOOD_PAYER: 70,          // Score >= 70
  AVERAGE_PAYER: 40,       // Score >= 40 and < 70
  HIGH_RISK_PAYER: 0       // Score < 40
};

/**
 * Get all loan and payment data for a specific farmer
 */
async function getFarmerLoanData(farmerId) {
  try {
    // Fetch farmer profile
    const [farmers] = await pool.execute(
      `SELECT id, full_name, reference_number, membership_status, membership_date, 
              primary_crop, land_area, registered_on
       FROM farmers WHERE id = ?`,
      [farmerId]
    );

    if (farmers.length === 0) {
      return null;
    }

    const farmer = farmers[0];

    // Fetch all loans
    const [loans] = await pool.execute(
      `SELECT id, loan_amount, interest_rate, loan_purpose, application_date, 
              approval_date, due_date, paid_date, status, remaining_balance, 
              total_paid, payment_term, remarks
       FROM loans WHERE farmer_id = ? ORDER BY application_date DESC`,
      [farmerId]
    );

    // For each loan, fetch payment data
    const loansWithPayments = [];
    for (const loan of loans) {
      const [payments] = await pool.execute(
        `SELECT id, loan_id, payment_date, amount, payment_method, 
                reference_number, remarks
         FROM loan_payments WHERE loan_id = ? ORDER BY payment_date ASC`,
        [loan.id]
      );
      
      loansWithPayments.push({
        ...loan,
        payments: payments || []
      });
    }

    return {
      farmer,
      loans: loansWithPayments
    };
  } catch (error) {
    console.error('Error fetching farmer loan data:', error);
    throw error;
  }
}

/**
 * Calculate repayment statistics for a farmer
 */
function calculateRepaymentStatistics(farmerData) {
  if (!farmerData || !farmerData.loans || farmerData.loans.length === 0) {
    // New farmer with no loans
    return {
      totalLoans: 0,
      completedLoans: 0,
      activeLoans: 0,
      defaultedLoans: 0,
      oncomeTimePayments: 0,
      latePayments: 0,
      totalPayments: 0,
      paymentRateOnTime: 0,
      defaultRate: 0,
      averageLoanAmount: 0,
      totalBorrowed: 0,
      totalRepaid: 0,
      loanDaysToCompletion: [], // Array of days taken to complete loans
      averageDaysToCompletion: 0,
      isNewFarmer: true
    };
  }

  // Filter out loans that shouldn't affect credit scoring
  const EXCLUDED_STATUSES = ['pending', 'rejected', 'cancelled'];
  const scorableLoans = farmerData.loans.filter(
    loan => !EXCLUDED_STATUSES.includes(loan.status)
  );

  if (scorableLoans.length === 0) {
    // All loans are pending/rejected/cancelled — treat as new farmer
    return {
      totalLoans: 0,
      completedLoans: 0,
      activeLoans: 0,
      defaultedLoans: 0,
      oncomeTimePayments: 0,
      latePayments: 0,
      totalPayments: 0,
      paymentRateOnTime: 0,
      defaultRate: 0,
      averageLoanAmount: 0,
      totalBorrowed: 0,
      totalRepaid: 0,
      loanDaysToCompletion: [],
      averageDaysToCompletion: 0,
      isNewFarmer: true
    };
  }

  let totalLoans = scorableLoans.length;
  let completedLoans = 0;
  let activeLoans = 0;
  let defaultedLoans = 0;
  let oncomeTimePayments = 0;
  let latePayments = 0;
  let totalPayments = 0;
  let totalBorrowed = 0;
  let totalRepaid = 0;
  let loanDaysToCompletion = [];

  for (const loan of scorableLoans) {
    totalBorrowed += parseFloat(loan.loan_amount) || 0;
    totalRepaid += parseFloat(loan.total_paid) || 0;

    // Determine loan status
    if (loan.status === 'paid' || (loan.status === 'completed' && parseFloat(loan.remaining_balance) === 0)) {
      completedLoans++;
      
      // Calculate days to completion
      if (loan.application_date && loan.paid_date) {
        const appDate = new Date(loan.application_date);
        const paidDate = new Date(loan.paid_date);
        const daysToComplete = Math.floor((paidDate - appDate) / (1000 * 60 * 60 * 24));
        loanDaysToCompletion.push(daysToComplete);
      }
    } else if (loan.status === 'active' || loan.status === 'approved') {
      activeLoans++;
    } else if (loan.status === 'overdue') {
      defaultedLoans++;
    }

    // Analyze payments for this loan
    if (loan.payments && loan.payments.length > 0) {
      totalPayments += loan.payments.length;
      
      const dueDate = new Date(loan.due_date);
      const dueDateTime = dueDate.getTime();

      for (const payment of loan.payments) {
        const paymentDate = new Date(payment.payment_date);
        const paymentDateTime = paymentDate.getTime();

        if (paymentDateTime <= dueDateTime) {
          oncomeTimePayments++;
        } else {
          // Calculate days late
          const daysLate = Math.floor((paymentDateTime - dueDateTime) / (1000 * 60 * 60 * 24));
          if (daysLate > 0) {
            latePayments++;
          } else {
            oncomeTimePayments++;
          }
        }
      }
    }
  }

  // Calculate averages
  const paymentRateOnTime = totalPayments > 0 ? (oncomeTimePayments / totalPayments) * 100 : 0;
  const defaultRate = totalLoans > 0 ? (defaultedLoans / totalLoans) * 100 : 0;
  const averageLoanAmount = totalLoans > 0 ? totalBorrowed / totalLoans : 0;
  const averageDaysToCompletion = loanDaysToCompletion.length > 0
    ? loanDaysToCompletion.reduce((a, b) => a + b, 0) / loanDaysToCompletion.length
    : 0;

  return {
    totalLoans,
    completedLoans,
    activeLoans,
    defaultedLoans,
    oncomeTimePayments,
    latePayments,
    totalPayments,
    paymentRateOnTime: parseFloat(paymentRateOnTime.toFixed(2)),
    defaultRate: parseFloat(defaultRate.toFixed(2)),
    averageLoanAmount: parseFloat(averageLoanAmount.toFixed(2)),
    totalBorrowed: parseFloat(totalBorrowed.toFixed(2)),
    totalRepaid: parseFloat(totalRepaid.toFixed(2)),
    loanDaysToCompletion,
    averageDaysToCompletion: parseFloat(averageDaysToCompletion.toFixed(0)),
    isNewFarmer: false
  };
}

/**
 * Calculate payment history score component
 * Based on percentage of on-time payments
 */
function calculatePaymentHistoryScore(stats) {
  // New farmer: default to 50 (neutral)
  if (stats.isNewFarmer || stats.totalPayments === 0) {
    return 50;
  }

  // Score based on on-time payment rate
  // 90%+ on-time = 100
  // 70-89% = 75
  // 50-69% = 50
  // 30-49% = 25
  // <30% = 0

  const rate = stats.paymentRateOnTime;
  
  if (rate >= 90) return 100;
  if (rate >= 70) return 75;
  if (rate >= 50) return 50;
  if (rate >= 30) return 25;
  return 0;
}

/**
 * Calculate default history score component
 * Based on number of defaults relative to total loans
 */
function calculateDefaultHistoryScore(stats) {
  // New farmer: default to 50 (neutral)
  if (stats.isNewFarmer || stats.totalLoans === 0) {
    return 50;
  }

  const defaultRate = stats.defaultRate;

  // Score based on default rate
  // 0% defaults = 100
  // 1-10% = 75
  // 11-25% = 50
  // 26-50% = 25
  // >50% = 0

  if (defaultRate === 0) return 100;
  if (defaultRate <= 10) return 75;
  if (defaultRate <= 25) return 50;
  if (defaultRate <= 50) return 25;
  return 0;
}

/**
 * Calculate loan volume score component
 * Farmers with more successful loans get higher scores
 */
function calculateLoanVolumeScore(stats) {
  // New farmer: 0 points
  if (stats.isNewFarmer || stats.completedLoans === 0) {
    return 0;
  }

  // Score based on number of completed loans
  // This shows farmer's experience and reliability
  // 1 completed loan = 25
  // 2-3 = 50
  // 4-5 = 75
  // 6+ = 100

  const completed = stats.completedLoans;
  
  if (completed === 0) return 0;
  if (completed === 1) return 25;
  if (completed <= 3) return 50;
  if (completed <= 5) return 75;
  return 100;
}

/**
 * Calculate activity recency score component
 * Recent borrowers are generally more active
 */
function calculateActivityRecencyScore(farmerData, stats) {
  if (stats.isNewFarmer || !farmerData.loans || farmerData.loans.length === 0) {
    return 50; // Neutral for new farmers
  }

  // Find most recent scorable loan (exclude pending/rejected/cancelled)
  const EXCLUDED_STATUSES = ['pending', 'rejected', 'cancelled'];
  const scorableLoans = farmerData.loans.filter(
    loan => !EXCLUDED_STATUSES.includes(loan.status)
  );
  if (scorableLoans.length === 0) {
    return 50; // Neutral if no scorable loans
  }

  const mostRecentLoan = scorableLoans[0]; // Loans are sorted DESC by application_date
  const lastLoanDate = new Date(mostRecentLoan.application_date);
  const today = new Date();
  const monthsAgo = (today - lastLoanDate) / (1000 * 60 * 60 * 24 * 30);

  // Score based on recency
  // Within 3 months = 100
  // 3-6 months = 75
  // 6-12 months = 50
  // 12-24 months = 25
  // >24 months = 0

  if (monthsAgo <= 3) return 100;
  if (monthsAgo <= 6) return 75;
  if (monthsAgo <= 12) return 50;
  if (monthsAgo <= 24) return 25;
  return 0;
}

/**
 * Calculate overall credit score (0-100)
 */
function calculateCreditScore(farmerData, stats) {
  const paymentScore = calculatePaymentHistoryScore(stats);
  const defaultScore = calculateDefaultHistoryScore(stats);
  const volumeScore = calculateLoanVolumeScore(stats);
  const recencyScore = calculateActivityRecencyScore(farmerData, stats);

  // Weighted calculation
  const creditScore =
    (paymentScore * CREDIT_ASSESSMENT_WEIGHTS.paymentHistory) +
    (defaultScore * CREDIT_ASSESSMENT_WEIGHTS.defaultHistory) +
    (volumeScore * CREDIT_ASSESSMENT_WEIGHTS.loanVolume) +
    (recencyScore * CREDIT_ASSESSMENT_WEIGHTS.activityRecency);

  return parseFloat(creditScore.toFixed(2));
}

/**
 * Classify farmer as Good, Average, High-Risk, or New Borrower
 */
function classifyFarmer(creditScore, stats) {
  // First-time / no-history borrowers get a distinct classification
  if (stats && (stats.isNewFarmer || (stats.totalPayments === 0 && stats.completedLoans === 0))) {
    return {
      classification: 'NEW_BORROWER',
      displayName: 'New Borrower',
      riskLevel: 'UNKNOWN',
      description: 'First-time borrower with no loan repayment history yet',
      color: 'info',
      icon: 'help_circle'
    };
  }

  if (creditScore >= CLASSIFICATION_THRESHOLDS.GOOD_PAYER) {
    return {
      classification: 'GOOD_PAYER',
      displayName: 'Good Payer',
      riskLevel: 'LOW',
      description: 'Consistently pays loans on time with minimal defaults',
      color: 'success',
      icon: 'check_circle'
    };
  } else if (creditScore >= CLASSIFICATION_THRESHOLDS.AVERAGE_PAYER) {
    return {
      classification: 'AVERAGE_PAYER',
      displayName: 'Average Payer',
      riskLevel: 'MEDIUM',
      description: 'Occasionally makes late payments but completes loans',
      color: 'warning',
      icon: 'info'
    };
  } else {
    return {
      classification: 'HIGH_RISK_PAYER',
      displayName: 'High-Risk Payer',
      riskLevel: 'HIGH',
      description: 'Frequently late or has unpaid loans - requires monitoring',
      color: 'danger',
      icon: 'exclamation_circle'
    };
  }
}

/**
 * Generate comprehensive assessment for a farmer
 */
async function generateFarmerAssessment(farmerId) {
  try {
    // Get farmer loan data
    const farmerData = await getFarmerLoanData(farmerId);
    
    if (!farmerData) {
      throw new Error(`Farmer ${farmerId} not found`);
    }

    // Calculate statistics
    const stats = calculateRepaymentStatistics(farmerData);

    // Calculate credit score
    const creditScore = calculateCreditScore(farmerData, stats);

    // Classify farmer
    const classification = classifyFarmer(creditScore, stats);

    // Generate assessment
    return {
      farmerId,
      farmerName: farmerData.farmer.full_name,
      referenceNumber: farmerData.farmer.reference_number,
      membershipStatus: farmerData.farmer.membership_status,
      assessment: {
        creditScore,
        classification: classification.classification,
        displayName: classification.displayName,
        riskLevel: classification.riskLevel,
        description: classification.description,
        color: classification.color,
        icon: classification.icon
      },
      statistics: stats,
      scoreComponents: {
        paymentHistoryScore: calculatePaymentHistoryScore(stats),
        defaultHistoryScore: calculateDefaultHistoryScore(stats),
        loanVolumeScore: calculateLoanVolumeScore(stats),
        activityRecencyScore: calculateActivityRecencyScore(farmerData, stats),
        weights: CREDIT_ASSESSMENT_WEIGHTS
      },
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error generating assessment for farmer ${farmerId}:`, error);
    throw error;
  }
}

/**
 * Generate assessments for all farmers with loan history
 */
async function generateAllFarmerAssessments(barangayFilter = null) {
  try {
    // Get all farmers with loan history
    let query = `
      SELECT DISTINCT f.id
      FROM farmers f
      JOIN loans l ON f.id = l.farmer_id
    `;
    const params = [];

    if (barangayFilter) {
      query += ` WHERE f.barangay_id = ?`;
      params.push(barangayFilter);
    }

    query += ` ORDER BY f.id`;

    const [farmers] = await pool.execute(query, params);

    const assessments = [];

    for (const farmer of farmers) {
      try {
        const assessment = await generateFarmerAssessment(farmer.id);
        assessments.push(assessment);
      } catch (err) {
        console.error(`Error processing farmer ${farmer.id}:`, err);
        // Continue with next farmer
      }
    }

    return assessments;
  } catch (error) {
    console.error('Error generating all assessments:', error);
    throw error;
  }
}

/**
 * Get risk summary for barangay
 * Returns count of farmers in each risk category
 */
async function getBarangayRiskSummary(barangayId) {
  try {
    const assessments = await generateAllFarmerAssessments(barangayId);

    const summary = {
      total: assessments.length,
      goodPayers: 0,
      averagePayers: 0,
      highRiskPayers: 0,
      averageCreditScore: 0,
      assessments
    };

    let totalScore = 0;

    for (const assessment of assessments) {
      totalScore += assessment.assessment.creditScore;
      
      switch (assessment.assessment.classification) {
        case 'GOOD_PAYER':
          summary.goodPayers++;
          break;
        case 'AVERAGE_PAYER':
          summary.averagePayers++;
          break;
        case 'HIGH_RISK_PAYER':
          summary.highRiskPayers++;
          break;
      }
    }

    summary.averageCreditScore = assessments.length > 0
      ? parseFloat((totalScore / assessments.length).toFixed(2))
      : 0;

    return summary;
  } catch (error) {
    console.error('Error getting barangay risk summary:', error);
    throw error;
  }
}

/**
 * Export module functions
 */
module.exports = {
  generateFarmerAssessment,
  generateAllFarmerAssessments,
  getBarangayRiskSummary,
  calculateRepaymentStatistics,
  calculateCreditScore,
  classifyFarmer,
  
  // Weights and thresholds (for reference)
  CREDIT_ASSESSMENT_WEIGHTS,
  CLASSIFICATION_THRESHOLDS
};
