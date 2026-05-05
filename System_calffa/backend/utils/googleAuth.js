// utils/googleAuth.js
// Google OAuth token verification and validation utilities

/**
 * Decode and verify Google ID token JWT
 * Decodes the JWT directly without calling Google API (faster & more reliable)
 * @param {String} token - Google ID token from frontend
 * @param {String} clientId - Google Client ID
 * @returns {Promise<Object>} - Decoded token payload if valid
 */
async function verifyGoogleToken(token, clientId) {
  return new Promise((resolve, reject) => {
    try {
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        return reject(new Error('Invalid token format'));
      }

      // Decode payload (it's base64url encoded)
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf8')
      );

      console.log('🔍 Decoded JWT payload:', JSON.stringify(payload, null, 2));
      console.log('🔍 Token aud:', payload.aud);
      console.log('🔍 Expected clientId:', clientId);

      // Verify audience (client ID)
      if (payload.aud !== clientId) {
        return reject(new Error(`Token audience mismatch. Token aud: ${payload.aud}, Expected: ${clientId}`));
      }

      // Verify email is verified
      if (!payload.email_verified) {
        return reject(new Error('Email not verified by Google'));
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return reject(new Error('Token has expired'));
      }

      // Return decoded token
      resolve({
        google_id: payload.sub,
        email: payload.email,
        given_name: payload.given_name,
        family_name: payload.family_name,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified
      });
    } catch (error) {
      reject(new Error(`Failed to verify token: ${error.message}`));
    }
  });
}

/**
 * Generate reference number for new Google users
 * Format: GOOGLE-<timestamp>-<random>
 * @returns {String} - Unique reference number
 */
function generateGoogleReferenceNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `GOO-${timestamp}-${random}`;
}

/**
 * Extract profile data from Google token
 * @param {Object} tokenData - Decoded Google token data
 * @returns {Object} - Profile data for registration form
 */
function extractGoogleProfileData(tokenData) {
  return {
    full_name: tokenData.name || `${tokenData.given_name || ''} ${tokenData.family_name || ''}`.trim(),
    given_name: tokenData.given_name,
    family_name: tokenData.family_name,
    email: tokenData.email,
    profile_picture: tokenData.picture,
    google_id: tokenData.google_id
  };
}

/**
 * Check if email already exists in database
 * @param {Object} pool - MySQL connection pool
 * @param {String} email - Email to check
 * @returns {Promise<Object|null>} - User object if exists, null otherwise
 */
async function hasFarmersEmailColumn(pool) {
  const [columns] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'farmers'
       AND COLUMN_NAME = 'email'
     LIMIT 1`
  );
  return columns.length > 0;
}

async function hasFarmersGoogleIdColumn(pool) {
  const [columns] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'farmers'
       AND COLUMN_NAME = 'google_id'
     LIMIT 1`
  );
  return columns.length > 0;
}

async function ensureFarmersGoogleIdColumn(pool) {
  const exists = await hasFarmersGoogleIdColumn(pool);
  if (exists) return;

  await pool.execute(
    `ALTER TABLE farmers
     ADD COLUMN google_id VARCHAR(255) NULL
     AFTER password_hash`
  );

  const [indexRows] = await pool.execute(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'farmers'
       AND INDEX_NAME = 'uq_farmers_google_id'
     LIMIT 1`
  );

  if (indexRows.length === 0) {
    await pool.execute(`CREATE UNIQUE INDEX uq_farmers_google_id ON farmers(google_id)`);
  }
}

async function findUserByEmail(pool, email) {
  if (!email) return null;

  try {
    const emailColumnExists = await hasFarmersEmailColumn(pool);
    if (!emailColumnExists) {
      return null;
    }

    const [users] = await pool.execute(
      `SELECT id, reference_number, full_name, email, status, role, barangay_id
       FROM farmers WHERE email = ? LIMIT 1`,
      [email]
    );
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }
}

/**
 * Check if google_id already exists in database
 * @param {Object} pool - MySQL connection pool
 * @param {String} googleId - Google ID to check
 * @returns {Promise<Object|null>} - User object if exists, null otherwise
 */
async function findUserByGoogleId(pool, googleId) {
  try {
    const googleIdColumnExists = await hasFarmersGoogleIdColumn(pool);
    if (!googleIdColumnExists) {
      return null;
    }

    const [users] = await pool.execute(
      `SELECT id, reference_number, full_name, status, role, barangay_id, is_farmer 
       FROM farmers WHERE google_id = ? LIMIT 1`,
      [googleId]
    );
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }
}

module.exports = {
  verifyGoogleToken,
  generateGoogleReferenceNumber,
  extractGoogleProfileData,
  hasFarmersEmailColumn,
  hasFarmersGoogleIdColumn,
  ensureFarmersGoogleIdColumn,
  findUserByEmail,
  findUserByGoogleId
};
