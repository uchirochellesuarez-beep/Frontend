/**
 * ML Assessment Routes
 * Provides API endpoints for accessing farmer credit assessments and risk analysis
 */

const express = require('express');
const router = express.Router();
const creditAnalyzer = require('../ml/creditAnalyzer');
const pool = require('../db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

/**
 * GET /api/ml-assessments/farmer/:farmerId
 * Get credit assessment for a specific farmer
 * Accessible by: admins, loan officers, and the farmer themselves
 */
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;

    // Get assessment
    const assessment = await creditAnalyzer.generateFarmerAssessment(farmerId);

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error generating farmer assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate farmer assessment',
      error: error.message
    });
  }
});

/**
 * GET /api/ml-assessments/all
 * Get assessments for all farmers (with optional barangay filtering)
 * Accessible by: admins and loan officers (with barangay context)
 */
router.get('/all', verifyToken, async (req, res) => {
  try {
    const { barangay_id } = req.query;
    const token = req.headers.authorization?.split(' ')[1];
    let userBarangayId = null;
    let userRole = 'guest';

    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userBarangayId = decoded.barangay_id;
        userRole = decoded.role || 'guest';
      } catch (err) {
        // Token invalid
      }
    }

    // Determine which barangay to filter by
    const filterBarangayId = barangay_id || (userRole !== 'admin' ? userBarangayId : null);

    // Get all assessments
    const assessments = await creditAnalyzer.generateAllFarmerAssessments(filterBarangayId);

    res.json({
      success: true,
      count: assessments.length,
      data: assessments
    });
  } catch (error) {
    console.error('Error generating all assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate assessments',
      error: error.message
    });
  }
});

/**
 * GET /api/ml-assessments/barangay/:barangayId/summary
 * Get risk summary for a specific barangay
 * Shows distribution of farmers by risk level and average credit score
 */
router.get('/barangay/:barangayId/summary', async (req, res) => {
  try {
    const { barangayId } = req.params;

    const summary = await creditAnalyzer.getBarangayRiskSummary(barangayId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting barangay risk summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get barangay risk summary',
      error: error.message
    });
  }
});

/**
 * GET /api/ml-assessments/barangay/:barangayId/high-risk
 * Get list of high-risk farmers in a barangay for monitoring
 */
router.get('/barangay/:barangayId/high-risk', async (req, res) => {
  try {
    const { barangayId } = req.params;

    const summary = await creditAnalyzer.getBarangayRiskSummary(barangayId);
    const highRiskFarmers = summary.assessments.filter(
      a => a.assessment.classification === 'HIGH_RISK_PAYER'
    );

    res.json({
      success: true,
      count: highRiskFarmers.length,
      data: highRiskFarmers,
      summary: {
        total: summary.total,
        highRiskCount: summary.highRiskPayers,
        percentage: summary.total > 0 
          ? parseFloat(((summary.highRiskPayers / summary.total) * 100).toFixed(2))
          : 0
      }
    });
  } catch (error) {
    console.error('Error getting high-risk farmers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get high-risk farmers',
      error: error.message
    });
  }
});

/**
 * GET /api/ml-assessments/eligibility/:farmerId
 * Get loan eligibility (combines existing eligibility check with credit risk info)
 * Returns eligibility status + credit assessment for informed decision making
 */
router.get('/eligibility/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;

    // Get assessment
    const assessment = await creditAnalyzer.generateFarmerAssessment(farmerId);

    // Check for outstanding loans (existing eligibility rule)
    const [outstandingLoans] = await pool.execute(
      `SELECT id FROM loans 
       WHERE farmer_id = ? 
       AND remaining_balance > 0`,
      [farmerId]
    );

    const hasOutstandingBalance = outstandingLoans.length > 0;

    res.json({
      success: true,
      data: {
        farmerId,
        farmerName: assessment.farmerName,
        canApply: !hasOutstandingBalance,
        outstandingLoans: hasOutstandingBalance,
        creditAssessment: assessment.assessment,
        creditScore: assessment.assessment.creditScore,
        recommendation: generateLoanRecommendation(
          !hasOutstandingBalance,
          assessment.assessment.classification
        ),
        fullAssessment: assessment
      }
    });
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check eligibility',
      error: error.message
    });
  }
});

/**
 * GET /api/ml-assessments/stats/:farmerId
 * Get detailed statistics for a farmer's loan history
 */
router.get('/stats/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;

    const assessment = await creditAnalyzer.generateFarmerAssessment(farmerId);

    res.json({
      success: true,
      data: {
        farmerId: assessment.farmerId,
        farmerName: assessment.farmerName,
        statistics: assessment.statistics,
        creditScore: assessment.assessment.creditScore,
        scoreComponents: assessment.scoreComponents
      }
    });
  } catch (error) {
    console.error('Error getting farmer statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get farmer statistics',
      error: error.message
    });
  }
});

/**
 * POST /api/ml-assessments/recalculate/:farmerId
 * Recalculate assessment for a farmer (manually triggered)
 */
router.post('/recalculate/:farmerId', verifyToken, async (req, res) => {
  try {
    const { farmerId } = req.params;

    // Verify user has permission (admin or loan officer)
    const token = req.headers.authorization?.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.role !== 'admin' && decoded.role !== 'loan_officer') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators and loan officers can recalculate assessments'
      });
    }

    // Regenerate assessment
    const assessment = await creditAnalyzer.generateFarmerAssessment(farmerId);

    res.json({
      success: true,
      message: 'Assessment recalculated successfully',
      data: assessment
    });
  } catch (error) {
    console.error('Error recalculating assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recalculate assessment',
      error: error.message
    });
  }
});

/**
 * Helper function to generate loan recommendation based on eligibility and credit risk
 */
function generateLoanRecommendation(canApply, classification) {
  const recommendations = {
    GOOD_PAYER: {
      tone: 'positive',
      message: 'Farmer has excellent payment history. Loan approval recommended.',
      emoji: '✓'
    },
    AVERAGE_PAYER: {
      tone: 'neutral',
      message: 'Farmer has acceptable payment history. Monitor loan activity closely.',
      emoji: '◐'
    },
    HIGH_RISK_PAYER: {
      tone: 'negative',
      message: 'Farmer has payment issues. Recommend additional monitoring or conditions.',
      emoji: '✗'
    }
  };

  if (!canApply) {
    return {
      tone: 'blocked',
      message: 'Farmer has outstanding loan balances. Cannot apply for new loan.',
      emoji: '✗'
    };
  }

  return recommendations[classification] || {
    tone: 'neutral',
    message: 'No classification available',
    emoji: '?'
  };
}

/**
 * Export module
 */
module.exports = router;
