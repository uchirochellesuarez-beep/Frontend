const express = require('express');
const router = express.Router();
const pool = require('../db');

const {
  verifyToken,
  authorizeRoles,
  verifyFarmerBarangayAccess
} = require('../middleware/auth');

const SHARE_CONTRIBUTION_AMOUNT = 50;

const requireBarangayForOfficer = (req, res, next) => {
  const role = req.user?.role;
  if (role === 'admin') return next();
  if (role === 'treasurer' || role === 'president') {
    if (!req.user?.barangay_id) {
      return res.status(403).json({
        success: false,
        message: 'Barangay assignment is required for officers.'
      });
    }
  }
  next();
};

const getTargetBarangayId = (req) => {
  if (req.user?.role === 'admin') {
    const q = req.query.barangay_id;
    return q ? parseInt(q) : null;
  }
  return req.user?.barangay_id ? parseInt(req.user.barangay_id) : null;
};

// GET /api/share-capital/overview
// Treasurer/President: list farmers in their barangay + totals
router.get(
  '/overview',
  verifyToken,
  requireBarangayForOfficer,
  authorizeRoles(['admin', 'treasurer', 'president']),
  async (req, res) => {
    try {
      const barangayId = getTargetBarangayId(req);
      if (!barangayId) {
        return res.status(400).json({ success: false, message: 'barangay_id is required' });
      }

      const [rows] = await pool.execute(
        `
        SELECT
          f.id,
          f.full_name,
          f.reference_number,
          f.status,
          f.barangay_id,
          COALESCE(SUM(CASE WHEN c.status = 'confirmed' THEN c.amount ELSE 0 END), 0) AS total_contributed,
          COALESCE(MAX(CASE WHEN w.total_withdrawn IS NOT NULL THEN w.total_withdrawn ELSE 0 END), 0) AS total_withdrawn
        FROM farmers f
        LEFT JOIN share_capital_contributions c
          ON c.farmer_id = f.id AND c.barangay_id = f.barangay_id
        LEFT JOIN (
          SELECT farmer_id, SUM(amount) AS total_withdrawn
          FROM share_capital_withdrawals
          GROUP BY farmer_id
        ) w ON w.farmer_id = f.id
        WHERE f.role = 'farmer'
          AND f.barangay_id = ?
          AND (f.status IN ('approved', 'inactive') OR f.status IS NULL)
        GROUP BY f.id, f.full_name, f.reference_number, f.status, f.barangay_id
        ORDER BY f.full_name ASC
        `,
        [barangayId]
      );

      // Calculate balance for each farmer
      const farmersWithBalance = rows.map(r => ({
        ...r,
        balance: parseFloat(r.total_contributed || 0) - parseFloat(r.total_withdrawn || 0)
      }));

      const totals = farmersWithBalance.reduce(
        (acc, r) => {
          acc.total_farmers += 1;
          acc.total_collected += parseFloat(r.total_contributed || 0);
          acc.total_withdrawn += parseFloat(r.total_withdrawn || 0);
          acc.total_balance += parseFloat(r.balance || 0);
          return acc;
        },
        { total_farmers: 0, total_collected: 0, total_withdrawn: 0, total_balance: 0 }
      );

      res.json({
        success: true,
        barangay_id: barangayId,
        rules: {
          amount_per_6_months: SHARE_CONTRIBUTION_AMOUNT,
          contributions_per_year: 2,
          amount_per_year: SHARE_CONTRIBUTION_AMOUNT * 2
        },
        totals,
        farmers: farmersWithBalance
      });
    } catch (error) {
      console.error('Error fetching share capital overview:', error.message, error.code);
      if (error.code === 'ER_NO_REFERENCED_TABLE' || error.code === 'ER_BAD_TABLE_ERROR') {
        return res.status(500).json({
          success: false,
          message: 'Share capital tables not found. Run the migration: backend/migrations/create_share_capital_module.sql',
          error: error.message
        });
      }
      res.status(500).json({ success: false, message: 'Failed to fetch share capital overview', error: error.message });
    }
  }
);

// GET /api/share-capital/farmer/:farmerId
// Treasurer/President: view a farmer's share capital history within barangay
router.get(
  '/farmer/:farmerId',
  verifyToken,
  requireBarangayForOfficer,
  authorizeRoles(['admin', 'treasurer', 'president']),
  verifyFarmerBarangayAccess('farmerId'),
  async (req, res) => {
    try {
      const { farmerId } = req.params;

      const [farmers] = await pool.execute(
        'SELECT id, full_name, reference_number, status, barangay_id FROM farmers WHERE id = ?',
        [farmerId]
      );
      if (farmers.length === 0) {
        return res.status(404).json({ success: false, message: 'Farmer not found' });
      }

      const [contributions] = await pool.execute(
        `
        SELECT id, contribution_date, amount, status, created_by, updated_by, created_at, updated_at
        FROM share_capital_contributions
        WHERE farmer_id = ?
        ORDER BY contribution_date DESC, id DESC
        `,
        [farmerId]
      );

      const [withdrawals] = await pool.execute(
        `
        SELECT id, withdrawal_date, amount, processed_by, remarks, created_at
        FROM share_capital_withdrawals
        WHERE farmer_id = ?
        ORDER BY withdrawal_date DESC, id DESC
        `,
        [farmerId]
      );

      const totals = {
        total_contributed: contributions
          .filter(c => c.status === 'confirmed')
          .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0),
        total_withdrawn: withdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0)
      };
      totals.balance = totals.total_contributed - totals.total_withdrawn;

      res.json({
        success: true,
        farmer: farmers[0],
        totals,
        contributions,
        withdrawals
      });
    } catch (error) {
      console.error('Error fetching share capital farmer details:', error.message, error.code);
      if (error.code === 'ER_NO_REFERENCED_TABLE' || error.code === 'ER_BAD_TABLE_ERROR') {
        return res.status(500).json({
          success: false,
          message: 'Share capital tables not found. Run migration: backend/migrations/create_share_capital_module.sql',
          error: error.message
        });
      }
      res.status(500).json({ success: false, message: 'Failed to fetch share capital farmer details', error: error.message });
    }
  }
);

// GET /api/share-capital/me
// Farmer: view own share capital totals + history
router.get('/me', verifyToken, async (req, res) => {
  try {
    const farmerId = req.user?.id;
    if (!farmerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Only farmers can use /me for this module (keeps UX aligned)
    if (req.user?.role !== 'farmer') {
      return res.status(403).json({ success: false, message: 'Farmer access required' });
    }

    const [contributions] = await pool.execute(
      `
      SELECT id, contribution_date, amount, status, created_at, updated_at
      FROM share_capital_contributions
      WHERE farmer_id = ?
      ORDER BY contribution_date DESC, id DESC
      `,
      [farmerId]
    );

    const [withdrawals] = await pool.execute(
      `
      SELECT id, withdrawal_date, amount, remarks, created_at
      FROM share_capital_withdrawals
      WHERE farmer_id = ?
      ORDER BY withdrawal_date DESC, id DESC
      `,
      [farmerId]
    );

    const totals = {
      total_contributed: contributions
        .filter(c => c.status === 'confirmed')
        .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0),
      total_withdrawn: withdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0)
    };
    totals.balance = totals.total_contributed - totals.total_withdrawn;

    res.json({
      success: true,
      rules: {
        amount_per_6_months: SHARE_CONTRIBUTION_AMOUNT,
        contributions_per_year: 2,
        amount_per_year: SHARE_CONTRIBUTION_AMOUNT * 2
      },
      totals,
      contributions,
      withdrawals
    });
  } catch (error) {
    console.error('Error fetching share capital for current farmer:', error.message, error.code);
    if (error.code === 'ER_NO_REFERENCED_TABLE' || error.code === 'ER_BAD_TABLE_ERROR') {
      return res.status(500).json({
        success: false,
        message: 'Share capital tables not found. Run migration: backend/migrations/create_share_capital_module.sql',
        error: error.message
      });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch share capital data', error: error.message });
  }
});

// POST /api/share-capital/contributions
// Treasurer: record a ₱50 contribution for a farmer in their barangay
router.post(
  '/contributions',
  verifyToken,
  requireBarangayForOfficer,
  authorizeRoles(['admin', 'treasurer']),
  verifyFarmerBarangayAccess('farmerId'),
  async (req, res) => {
    try {
      const { farmer_id, contribution_date, amount } = req.body;

      if (!farmer_id || !contribution_date) {
        return res.status(400).json({ success: false, message: 'Missing required fields: farmer_id, contribution_date' });
      }

      const amt = amount === undefined || amount === null ? SHARE_CONTRIBUTION_AMOUNT : parseFloat(amount);
      if (Number.isNaN(amt) || amt !== SHARE_CONTRIBUTION_AMOUNT) {
        return res.status(400).json({
          success: false,
          message: `Share contribution amount is fixed at ₱${SHARE_CONTRIBUTION_AMOUNT}.`
        });
      }

      const barangayId = req.farmerBarangayId;

      // Do not allow contributions for inactive/exited farmers
      const [[farmerRow]] = await pool.execute(
        'SELECT status FROM farmers WHERE id = ?',
        [farmer_id]
      );
      if (farmerRow?.status && String(farmerRow.status).toLowerCase() === 'inactive') {
        return res.status(400).json({ success: false, message: 'Farmer is inactive/exited. Cannot record new contributions.' });
      }

      // Enforce one contribution per 6-month period
      const dt = new Date(contribution_date);
      if (Number.isNaN(dt.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid contribution_date' });
      }
      const year = dt.getFullYear();
      const month = dt.getMonth() + 1; // 1-12
      const isFirstHalf = month <= 6;
      const periodStart = `${year}-${isFirstHalf ? '01' : '07'}-01`;
      const periodEnd = `${year}-${isFirstHalf ? '06' : '12'}-${isFirstHalf ? '30' : '31'}`;

      const [[existing]] = await pool.execute(
        `
        SELECT COUNT(*) AS cnt
        FROM share_capital_contributions
        WHERE farmer_id = ?
          AND barangay_id = ?
          AND status = 'confirmed'
          AND contribution_date >= ? AND contribution_date <= ?
        `,
        [farmer_id, barangayId, periodStart, periodEnd]
      );
      if ((existing?.cnt || 0) > 0) {
        return res.status(400).json({
          success: false,
          message: 'A share capital contribution already exists for this 6-month period.'
        });
      }

      const [result] = await pool.execute(
        `
        INSERT INTO share_capital_contributions
          (farmer_id, barangay_id, contribution_date, amount, status, created_by)
        VALUES
          (?, ?, ?, ?, 'confirmed', ?)
        `,
        [farmer_id, barangayId, contribution_date, amt, req.user?.id || null]
      );

      // Best-effort activity log
      try {
        const [farmer] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [farmer_id]);
        await pool.execute(
          `
          INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description, metadata)
          VALUES (?, ?, 'share_capital', ?, ?)
          `,
          [
            farmer_id,
            barangayId,
            `${farmer[0]?.full_name || 'Farmer'} share capital contribution recorded: ₱${amt}`,
            JSON.stringify({ share_capital_contribution_id: result.insertId, amount: amt })
          ]
        );
      } catch (logErr) {
        console.error('Error logging share capital contribution activity:', logErr);
      }

      res.json({ success: true, id: result.insertId, message: 'Share contribution recorded successfully' });
    } catch (error) {
      console.error('Error recording share capital contribution:', error.message, error.code);
      if (error.code === 'ER_NO_REFERENCED_TABLE' || error.code === 'ER_BAD_TABLE_ERROR') {
        return res.status(500).json({
          success: false,
          message: 'Share capital tables not found. Run migration: backend/migrations/create_share_capital_module.sql',
          error: error.message
        });
      }
      res.status(500).json({ success: false, message: 'Failed to record share contribution', error: error.message });
    }
  }
);

// PUT /api/share-capital/contributions/:id
// Treasurer: edit/update contribution record (date and amount; amount remains fixed at ₱50)
router.put(
  '/contributions/:id',
  verifyToken,
  requireBarangayForOfficer,
  authorizeRoles(['admin', 'treasurer']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { contribution_date, amount, status } = req.body;

      const [rows] = await pool.execute(
        'SELECT id, farmer_id, barangay_id FROM share_capital_contributions WHERE id = ?',
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Contribution record not found' });
      }

      const record = rows[0];
      if (req.user?.role !== 'admin' && parseInt(req.user?.barangay_id) !== parseInt(record.barangay_id)) {
        return res.status(403).json({ success: false, message: 'You can only edit records in your barangay.' });
      }

      const updates = [];
      const params = [];

      if (contribution_date) {
        const dt = new Date(contribution_date);
        if (Number.isNaN(dt.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid contribution_date' });
        }

        // Enforce one contribution per 6-month period (excluding this record)
        const year = dt.getFullYear();
        const month = dt.getMonth() + 1;
        const isFirstHalf = month <= 6;
        const periodStart = `${year}-${isFirstHalf ? '01' : '07'}-01`;
        const periodEnd = `${year}-${isFirstHalf ? '06' : '12'}-${isFirstHalf ? '30' : '31'}`;

        const [[existing]] = await pool.execute(
          `
          SELECT COUNT(*) AS cnt
          FROM share_capital_contributions
          WHERE farmer_id = ?
            AND barangay_id = ?
            AND status = 'confirmed'
            AND contribution_date >= ? AND contribution_date <= ?
            AND id <> ?
          `,
          [record.farmer_id, record.barangay_id, periodStart, periodEnd, id]
        );
        if ((existing?.cnt || 0) > 0) {
          return res.status(400).json({
            success: false,
            message: 'A share capital contribution already exists for this 6-month period.'
          });
        }

        updates.push('contribution_date = ?');
        params.push(contribution_date);
      }

      if (amount !== undefined) {
        const amt = parseFloat(amount);
        if (Number.isNaN(amt) || amt !== SHARE_CONTRIBUTION_AMOUNT) {
          return res.status(400).json({
            success: false,
            message: `Share contribution amount is fixed at ₱${SHARE_CONTRIBUTION_AMOUNT}.`
          });
        }
        updates.push('amount = ?');
        params.push(amt);
      }

      if (status) {
        if (!['confirmed', 'cancelled'].includes(status)) {
          return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        updates.push('status = ?');
        params.push(status);
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      updates.push('updated_by = ?');
      params.push(req.user?.id || null);

      params.push(id);

      await pool.execute(
        `UPDATE share_capital_contributions SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      res.json({ success: true, message: 'Share contribution updated successfully' });
    } catch (error) {
      console.error('Error updating share capital contribution:', error.message, error.code);
      if (error.code === 'ER_NO_REFERENCED_TABLE' || error.code === 'ER_BAD_TABLE_ERROR') {
        return res.status(500).json({
          success: false,
          message: 'Share capital tables not found. Run migration: backend/migrations/create_share_capital_module.sql',
          error: error.message
        });
      }
      res.status(500).json({ success: false, message: 'Failed to update share contribution', error: error.message });
    }
  }
);

// POST /api/share-capital/withdrawals
// Treasurer: process withdrawal and mark farmer inactive
router.post(
  '/withdrawals',
  verifyToken,
  requireBarangayForOfficer,
  authorizeRoles(['admin', 'treasurer']),
  verifyFarmerBarangayAccess('farmerId'),
  async (req, res) => {
    try {
      const { farmer_id, withdrawal_date, remarks } = req.body;
      if (!farmer_id || !withdrawal_date) {
        return res.status(400).json({ success: false, message: 'Missing required fields: farmer_id, withdrawal_date' });
      }

      const barangayId = req.farmerBarangayId;

      const [[contribTotals]] = await pool.execute(
        `
        SELECT COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END), 0) AS total_contributed
        FROM share_capital_contributions
        WHERE farmer_id = ?
        `,
        [farmer_id]
      );

      const [[withdrawTotals]] = await pool.execute(
        `
        SELECT COALESCE(SUM(amount), 0) AS total_withdrawn
        FROM share_capital_withdrawals
        WHERE farmer_id = ?
        `,
        [farmer_id]
      );

      const totalContributed = parseFloat(contribTotals?.total_contributed || 0);
      const totalWithdrawn = parseFloat(withdrawTotals?.total_withdrawn || 0);
      const balance = totalContributed - totalWithdrawn;

      if (balance <= 0) {
        return res.status(400).json({ success: false, message: 'No share capital balance available for withdrawal.' });
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const [result] = await conn.execute(
          `
          INSERT INTO share_capital_withdrawals
            (farmer_id, barangay_id, withdrawal_date, amount, processed_by, remarks)
          VALUES
            (?, ?, ?, ?, ?, ?)
          `,
          [farmer_id, barangayId, withdrawal_date, balance, req.user?.id || null, remarks || null]
        );

        await conn.execute(
          `UPDATE farmers SET status = 'inactive' WHERE id = ?`,
          [farmer_id]
        );

        // Best-effort log inside transaction
        try {
          const [farmer] = await conn.execute('SELECT full_name FROM farmers WHERE id = ?', [farmer_id]);
          await conn.execute(
            `
            INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description, metadata)
            VALUES (?, ?, 'share_capital_withdrawal', ?, ?)
            `,
            [
              farmer_id,
              barangayId,
              `${farmer[0]?.full_name || 'Farmer'} share capital withdrawn: ₱${balance}`,
              JSON.stringify({ share_capital_withdrawal_id: result.insertId, amount: balance })
            ]
          );
        } catch (logErr) {
          console.error('Error logging share capital withdrawal activity:', logErr);
        }

        await conn.commit();
      } catch (txErr) {
        await conn.rollback();
        throw txErr;
      } finally {
        conn.release();
      }

      res.json({
        success: true,
        message: 'Withdrawal processed and farmer marked inactive',
        withdrawal_amount: balance
      });
    } catch (error) {
      console.error('Error processing share capital withdrawal:', error.message, error.code);
      if (error.code === 'ER_NO_REFERENCED_TABLE' || error.code === 'ER_BAD_TABLE_ERROR') {
        return res.status(500).json({
          success: false,
          message: 'Share capital tables not found. Run migration: backend/migrations/create_share_capital_module.sql',
          error: error.message
        });
      }
      res.status(500).json({ success: false, message: 'Failed to process withdrawal', error: error.message });
    }
  }
);

module.exports = router;
