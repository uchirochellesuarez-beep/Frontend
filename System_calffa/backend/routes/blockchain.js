const express = require('express');
const router = express.Router();
const pool = require('../db');
const {
  ensureLedgerSchema,
  getLedgerBlocks,
  verifyLedger
} = require('../services/machineryBlockchainService');

const verifyBlockchainAccess = async (req, res, next) => {
  try {
    const userId = req.query.user_id || req.body.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const [user] = await pool.execute('SELECT role FROM farmers WHERE id = ?', [userId]);

    if (user.length === 0 || !['admin', 'president', 'treasurer', 'auditor'].includes(user[0].role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admin, president, treasurer, and auditor can access blockchain verification.'
      });
    }

    next();
  } catch (error) {
    console.error('Blockchain auth error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

// =====================
// GET BLOCKCHAIN LEDGER
// =====================
router.get('/ledger', verifyBlockchainAccess, async (req, res) => {
  try {
    const blocks = await getLedgerBlocks({
      limit: req.query.limit || 300,
      transaction_type: req.query.transaction_type || null
    });

    res.json({
      success: true,
      blocks,
      count: blocks.length
    });
  } catch (error) {
    console.error('Error fetching blockchain ledger:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching blockchain ledger',
      error: error.message
    });
  }
});

// =====================
// VERIFY BLOCKCHAIN INTEGRITY
// =====================
router.get('/verify', verifyBlockchainAccess, async (req, res) => {
  try {
    const verification = await verifyLedger();

    res.json({
      success: true,
      ...verification
    });
  } catch (error) {
    console.error('Error verifying blockchain ledger:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error verifying blockchain',
      error: error.message
    });
  }
});

router.get('/audit-trail', verifyBlockchainAccess, async (req, res) => {
  try {
    await ensureLedgerSchema();
    const verification = await verifyLedger();
    const blocks = await getLedgerBlocks({ limit: req.query.limit || 300 });

    res.json({
      success: true,
      summary: {
        total_blocks: verification.total_blocks,
        valid_blocks: verification.valid_blocks,
        tampered_blocks: verification.tampered_blocks,
        chain_valid: verification.chain_valid
      },
      verification: verification.verification_results,
      blocks
    });
  } catch (error) {
    console.error('Error fetching blockchain audit trail:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching blockchain audit trail',
      error: error.message
    });
  }
});

module.exports = router;
