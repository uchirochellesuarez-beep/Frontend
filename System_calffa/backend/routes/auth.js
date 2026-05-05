// routes/auth.js
// Google OAuth and authentication routes

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');
const {
  verifyGoogleToken,
  extractGoogleProfileData,
  hasFarmersEmailColumn,
  hasFarmersGoogleIdColumn,
  ensureFarmersGoogleIdColumn,
  findUserByEmail,
  findUserByGoogleId
} = require('../utils/googleAuth');

/**
 * POST /api/auth/google/verify-token
 * Verify Google ID token and check if user exists
 * Returns user status (existing/new) and profile data
 */
router.post('/google/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required'
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    console.log('🔍 DEBUG: Client ID from env:', clientId);
    
    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: 'Google Client ID not configured on server'
      });
    }

    await ensureFarmersGoogleIdColumn(pool);

    // Verify token with Google
    const tokenData = await verifyGoogleToken(token, clientId);

    // Extract profile data
    const profileData = extractGoogleProfileData(tokenData);
    const hasGoogleIdColumn = await hasFarmersGoogleIdColumn(pool);

    // Check if user exists by google_id (most reliable)
    const existingUserByGoogle = hasGoogleIdColumn
      ? await findUserByGoogleId(pool, profileData.google_id)
      : null;

    if (existingUserByGoogle) {
      // User exists - return login response
      return res.json({
        success: true,
        status: 'existing',
        message: 'User exists, proceeding with login',
        user: {
          id: existingUserByGoogle.id,
          reference_number: existingUserByGoogle.reference_number,
          full_name: existingUserByGoogle.full_name,
          status: existingUserByGoogle.status,
          role: existingUserByGoogle.role,
          barangay_id: existingUserByGoogle.barangay_id,
          is_farmer: existingUserByGoogle.is_farmer
        },
        profileData
      });
    }

    // If email column exists, check if user registered manually using same email.
    const existingUserByEmail = await findUserByEmail(pool, profileData.email);
    if (existingUserByEmail) {
      return res.json({
        success: true,
        status: 'existing-email',
        message: 'Email already registered. Please link your Google account.',
        user: {
          id: existingUserByEmail.id,
          reference_number: existingUserByEmail.reference_number,
          full_name: existingUserByEmail.full_name,
          status: existingUserByEmail.status,
          role: existingUserByEmail.role,
          barangay_id: existingUserByEmail.barangay_id
        },
        profileData
      });
    }

    // New user - return profile data for registration
    res.json({
      success: true,
      status: 'new',
      message: 'New user - proceed to assisted registration',
      profileData
    });

  } catch (error) {
    console.error('Google token verification error:', error);
    const statusCode = error.message?.includes('Database query failed') ? 500 : 401;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to verify Google token'
    });
  }
});

/**
 * POST /api/auth/google/register
 * Register new user via Google OAuth
 * Auto-fills known fields, user completes required fields
 */
router.post('/google/register', async (req, res) => {
  try {
    const {
      google_id,
      reference_number,
      full_name,
      email,
      given_name,
      family_name,
      profile_picture,
      phone_number,
      educational_status,
      land_area,
      farm_location,
      barangay_id,
      password,
      confirm_password
    } = req.body;

    // Validate required fields
    if (!google_id || !reference_number || !full_name || !phone_number || 
        !educational_status || !barangay_id || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: google_id, reference_number, full_name, phone_number, educational_status, barangay_id, password'
      });
    }

    // Validate password matches confirm password
    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate password (minimum 8 characters with letters and numbers)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    
    if (!hasLetters || !hasNumbers) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain both letters and numbers'
      });
    }

    // Validate land area if provided
    if (land_area !== undefined && land_area !== null && land_area !== '') {
      const parsedLandArea = Number(land_area);
      if (!Number.isFinite(parsedLandArea) || parsedLandArea <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Land area must be a positive number.'
        });
      }
    }


    // Validate phone number (must be exactly 11 digits)
    const phoneDigitsOnly = phone_number.replace(/\D/g, '');
    if (phoneDigitsOnly.length !== 11) {
      return res.status(400).json({
        success: false,
        message: `Phone number must be exactly 11 digits. You entered ${phoneDigitsOnly.length} digits.`
      });
    }

    // Validate date of birth if provided
    if (req.body.date_of_birth) {
      const birthDate = new Date(req.body.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        return res.status(400).json({
          success: false,
          message: `You must be at least 18 years old to register. You are currently ${age} years old.`
        });
      }
    }

    // Validate barangay exists
    const [barangays] = await pool.execute(
      'SELECT id FROM barangays WHERE id = ?',
      [barangay_id]
    );

    if (barangays.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid barangay_id. Barangay does not exist.'
      });
    }

    // Check for duplicates
    await ensureFarmersGoogleIdColumn(pool);

    const [existingGoogleId] = await pool.execute(
      'SELECT id FROM farmers WHERE google_id = ?',
      [google_id]
    );

    if (existingGoogleId.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This Google account is already registered'
      });
    }

    const [existingRef] = await pool.execute(
      'SELECT id FROM farmers WHERE reference_number = ? LIMIT 1',
      [reference_number]
    );
    if (existingRef.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Reference number already exists'
      });
    }

    const hasEmailColumn = await hasFarmersEmailColumn(pool);
    if (hasEmailColumn && email) {
      const [existingEmail] = await pool.execute(
        'SELECT id FROM farmers WHERE email = ? LIMIT 1',
        [email]
      );
      if (existingEmail.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered'
        });
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new farmer record
    const insertFields = [
      'google_id',
      'reference_number',
      'full_name'
    ];
    const insertValues = [
      google_id,
      reference_number,
      full_name
    ];

    if (hasEmailColumn) {
      insertFields.push('email');
      insertValues.push(email || null);
    }

    insertFields.push(
      'phone_number',
      'educational_status',
      'land_area',
      'farm_location',
      'barangay_id',
      'profile_picture',
      'password_hash',
      'role',
      'status',
      'membership_status',
      'is_farmer',
      'date_of_birth',
      'address'
    );

    insertValues.push(
      phone_number,
      educational_status,
      land_area || null,
      farm_location || null,
      barangay_id,
      profile_picture || null,
      password_hash,
      'farmer',
      'pending',
      'member',
      1,
      req.body.date_of_birth || null,
      req.body.address || null
    );

    const placeholders = insertFields.map(() => '?').join(', ');
    const [result] = await pool.execute(
      `INSERT INTO farmers (${insertFields.join(', ')}) VALUES (${placeholders})`,
      insertValues
    );

    res.json({
      success: true,
      message: 'Registration successful! Your account is pending approval from your Barangay President.',
      farmerId: result.insertId,
      farmer: {
        id: result.insertId,
        reference_number,
        full_name,
        email: email || null,
        barangay_id,
        status: 'pending',
        role: 'farmer'
      }
    });

  } catch (error) {
    console.error('Google registration error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Google account or reference number already registered'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/google/login
 * Login with Google - for existing users only
 */
router.post('/google/login', async (req, res) => {
  try {
    await ensureFarmersGoogleIdColumn(pool);
    const { google_id, farmerId } = req.body;

    if (!google_id || !farmerId) {
      return res.status(400).json({
        success: false,
        message: 'google_id and farmerId are required'
      });
    }

    // Check if email column exists
    const hasEmailColumn = await hasFarmersEmailColumn(pool);
    
    // Build query dynamically based on available columns
    const selectFields = [
      'id', 'reference_number', 'full_name', 'phone_number', 'educational_status', 
      'address', 'role', 'barangay_id', 'status', 'membership_status', 
      'profile_picture', 'is_farmer'
    ];
    
    if (hasEmailColumn) {
      selectFields.push('email');
    }

    // Get user from database - include all available profile fields
    const [users] = await pool.execute(
      `SELECT ${selectFields.join(', ')}
       FROM farmers WHERE id = ? AND google_id = ?`,
      [farmerId, google_id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const farmer = users[0];

    // Check if farmer status is approved
    if (farmer.role === 'farmer' && farmer.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account is still pending approval from your Barangay President.'
      });
    }

    // Get barangay info
    let barangayContext = null;
    if (farmer.barangay_id) {
      const [barangays] = await pool.execute(
        'SELECT id, name, location FROM barangays WHERE id = ?',
        [farmer.barangay_id]
      );
      barangayContext = barangays[0] || null;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: farmer.id,
        reference_number: farmer.reference_number,
        role: farmer.role,
        barangay_id: farmer.barangay_id,
        membership_status: farmer.membership_status
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Log login activity
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description, ip_address, user_agent)
         VALUES (?, ?, 'login', ?, ?, ?)`,
        [farmer.id, farmer.barangay_id, `${farmer.full_name} logged in via Google`, ipAddress, userAgent]
      );
    } catch (logErr) {
      console.error('Error logging login activity:', logErr);
    }

    res.json({
      success: true,
      message: 'Login successful!',
      farmer,
      barangay: barangayContext,
      token
    });

  } catch (error) {
    console.error('Google login error:', error);
    if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage?.includes('google_id')) {
      return res.status(500).json({
        success: false,
        message: 'Database schema missing google_id column. Run google auth migration first.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/google/link
 * Link Google account to existing user (user registered manually before)
 */
router.post('/google/link', async (req, res) => {
  try {
    await ensureFarmersGoogleIdColumn(pool);
    const { farmerId, google_id, password } = req.body;

    if (!farmerId || !google_id || !password) {
      return res.status(400).json({
        success: false,
        message: 'farmerId, google_id, and password are required'
      });
    }

    // Get user
    const [users] = await pool.execute(
      'SELECT id, password_hash FROM farmers WHERE id = ?',
      [farmerId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const match = await bcrypt.compare(password, users[0].password_hash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Link Google account
    await pool.execute(
      'UPDATE farmers SET google_id = ? WHERE id = ?',
      [google_id, farmerId]
    );

    res.json({
      success: true,
      message: 'Google account linked successfully!'
    });

  } catch (error) {
    console.error('Google link error:', error);
    if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage?.includes('google_id')) {
      return res.status(500).json({
        success: false,
        message: 'Database schema missing google_id column. Run google auth migration first.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to link Google account',
      error: error.message
    });
  }
});

module.exports = router;
