// utils/referenceNumberGenerator.js
// Utility for generating unique reference numbers

/**
 * Generate a unique reference number for farmers
 * Format: REF-YYYYMMDD-XXXXX where XXXXX is random alphanumeric
 * @returns {String} Unique reference number
 */
function generateReferenceNumber() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase(); // Random chars
  return `REF-${dateStr}-${randomStr}`;
}

/**
 * Validate reference number format
 * @param {String} refNum - Reference number to validate
 * @returns {Boolean} True if valid format
 */
function isValidReferenceNumber(refNum) {
  return /^REF-\d{8}-[A-Z0-9]{5}$/.test(refNum);
}

module.exports = {
  generateReferenceNumber,
  isValidReferenceNumber
};
