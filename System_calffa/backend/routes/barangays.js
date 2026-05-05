const express = require('express');
const router = express.Router();
const db = require('../db');
const barangayConstants = require('../constants/barangays');

// GET /api/barangays - Get all available barangays (hardcoded: Camansihan and Managpi)
router.get('/', async (req, res) => {
  try {
    // Return hardcoded barangays instead of querying the database
    const barangays = barangayConstants.getAllBarangays();
    res.json({ success: true, barangays });
  } catch (error) {
    console.error('Error fetching barangays:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch barangays' });
  }
});

// GET /api/barangays/:id - Get single barangay details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const barangayId = parseInt(id);
    
    // Get barangay from hardcoded constants
    const barangay = barangayConstants.getBarangayById(barangayId);
    if (!barangay) {
      return res.status(404).json({ success: false, message: 'Barangay not found' });
    }
    
    // Get farmers from database (using barangay_id)
    const [farmers] = await db.query(
      `SELECT id, reference_number, full_name, phone_number, date_of_birth, role, status, registered_on
       FROM farmers 
       WHERE barangay_id = ? AND status = 'approved' AND role = 'farmer'
       ORDER BY full_name ASC`,
      [barangayId]
    );
    
    // Get officers from database
    const [officers] = await db.query(
      `SELECT id, reference_number, full_name, phone_number, date_of_birth, role, status, registered_on
       FROM farmers 
       WHERE barangay_id = ? AND status = 'approved' AND role IN ('president', 'treasurer', 'auditor', 'operator')
       ORDER BY 
         CASE role
           WHEN 'president' THEN 1
           WHEN 'treasurer' THEN 2
           WHEN 'auditor' THEN 3
           WHEN 'operator' THEN 4
           ELSE 5
         END,
         full_name ASC`,
      [barangayId]
    );
    
    res.json({
      success: true,
      barangay,
      farmers,
      officers
    });
  } catch (error) {
    console.error('Error fetching barangay details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch barangay details' });
  }
});

// ===== BARANGAY CRUD OPERATIONS ARE DISABLED =====
// Barangays are now fixed and hardcoded (Camansihan and Managpi)
// No new barangays can be added, and existing ones cannot be modified or deleted

// PUT /api/barangays/:id - DISABLED - Barangays cannot be modified
router.put('/:id', async (req, res) => {
  res.status(403).json({ 
    success: false, 
    message: 'Barangay modifications are disabled. Barangays are now fixed: Camansihan and Managpi.' 
  });
});

// POST /api/barangays - DISABLED - New barangays cannot be added
router.post('/', async (req, res) => {
  res.status(403).json({ 
    success: false, 
    message: 'Adding new barangays is disabled. Only Camansihan and Managpi are available.' 
  });
});

// DELETE /api/barangays/:id - DISABLED - Barangays cannot be deleted
router.delete('/:id', async (req, res) => {
  res.status(403).json({ 
    success: false, 
    message: 'Barangay deletion is disabled. Barangays are now fixed.' 
  });
});

// ===== BARANGAY OFFICER MANAGEMENT - DISABLED =====
// Officer management is disabled as barangays are now fixed

// POST /api/barangays/:id/officers - DISABLED
router.post('/:id/officers', async (req, res) => {
  res.status(403).json({ 
    success: false, 
    message: 'Barangay officer management is disabled. Barangays are now fixed.' 
  });
});

// PUT /api/barangays/:id/officers/:officerId - DISABLED
router.put('/:id/officers/:officerId', async (req, res) => {
  res.status(403).json({ 
    success: false, 
    message: 'Barangay officer management is disabled.' 
  });
});

// DELETE /api/barangays/:id/officers/:officerId - DISABLED
router.delete('/:id/officers/:officerId', async (req, res) => {
  res.status(403).json({ 
    success: false, 
    message: 'Barangay officer management is disabled.' 
  });
});

// ===== BARANGAY CONTRIBUTIONS MANAGEMENT - DISABLED =====
// Contribution management is disabled as barangays are now fixed

// POST /api/barangays/:id/contributions - DISABLED
router.post('/:id/contributions', async (req, res) => {
  res.status(403).json({ 
    success: false, 
    message: 'Barangay contribution management is disabled. Barangays are now fixed.' 
  });
});

// PUT /api/barangays/:id/contributions/:contributionId - DISABLED
router.put('/:id/contributions/:contributionId', async (req, res) => {
  res.status(403).json({ 
    success: false, 
    message: 'Barangay contribution management is disabled.' 
  });
});

// ===== BARANGAY ACTIVITIES MANAGEMENT - DISABLED =====
// Activity management is disabled as barangays are now fixed

// POST /api/barangays/:id/activities - DISABLED
router.post('/:id/activities', async (req, res) => {
  res.status(403).json({ 
    success: false, 
    message: 'Barangay activity management is disabled. Barangays are now fixed.' 
  });
});

// PUT /api/barangays/:id/activities/:activityId - DISABLED
router.put('/:id/activities/:activityId', async (req, res) => {
  res.status(403).json({ 
    success: false, 
    message: 'Barangay activity management is disabled.' 
  });
});

// DELETE /api/barangays/:id/activities/:activityId - DISABLED
router.delete('/:id/activities/:activityId', async (req, res) => {
  res.status(403).json({ 
    success: false, 
    message: 'Barangay activity management is disabled.' 
  });
});

// GET /api/barangays/stats/summary - Get federation-wide statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT b.id) as total_barangays,
        COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END) as active_barangays,
        COUNT(DISTINCT f.id) as total_farmers,
        COUNT(DISTINCT bo.id) as total_officers,
        COALESCE(SUM(bc.amount), 0) as total_contributions,
        COUNT(DISTINCT ba.id) as total_activities
      FROM barangays b
      LEFT JOIN farmers f ON f.address = b.name AND f.status = 'approved'
      LEFT JOIN barangay_officers bo ON bo.barangay_id = b.id AND bo.status = 'active'
      LEFT JOIN barangay_contributions bc ON bc.barangay_id = b.id AND bc.status = 'verified'
      LEFT JOIN barangay_activities ba ON ba.barangay_id = b.id
    `);
    
    res.json({ success: true, stats: stats[0] });
  } catch (error) {
    console.error('Error fetching federation stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

module.exports = router;
