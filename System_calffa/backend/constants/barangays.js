/**
 * Hardcoded Barangay Constants
 * CALLFA system now only operates with two fixed barangays:
 * - Camansihan: Active operations, all transaction modules enabled
 * - Managpi: Sample barangay, transactions disabled, view-only access
 */

const BARANGAYS = {
  CAMANSIHAN: {
    id: 1,
    name: "Camansihan",
    location: "Calapan City, Mindoro Oriental",
    status: "active",
    population: 2500,
    total_area: 125.5,
    contact_person: "Barangay Hall",
    contact_phone: "+63-43-867-1000",
    is_active_for_transactions: true,
    description: "Primary operational barangay with active transactions"
  },
  MANAGPI: {
    id: 2,
    name: "Managpi",
    location: "Calapan City, Mindoro Oriental",
    status: "sample",
    population: 1800,
    total_area: 98.3,
    contact_person: "Barangay Hall",
    contact_phone: "+63-43-867-2000",
    is_active_for_transactions: false,
    description: "Sample barangay for demonstration - transactions not yet available"
  }
};

const BARANGAY_LIST = [BARANGAYS.CAMANSIHAN, BARANGAYS.MANAGPI];

const BARANGAY_NAMES = {
  CAMANSIHAN: "Camansihan",
  MANAGPI: "Managpi"
};

/**
 * Get all available barangays
 * @returns {Array} List of all barangays
 */
function getAllBarangays() {
  return BARANGAY_LIST;
}

/**
 * Get barangay by ID
 * @param {number} id - Barangay ID
 * @returns {Object|null} Barangay object or null if not found
 */
function getBarangayById(id) {
  return BARANGAY_LIST.find(b => b.id === id) || null;
}

/**
 * Get barangay by name
 * @param {string} name - Barangay name
 * @returns {Object|null} Barangay object or null if not found
 */
function getBarangayByName(name) {
  return BARANGAY_LIST.find(b => b.name === name) || null;
}

/**
 * Check if barangay has active transactions
 * @param {number|string} barangayId - Barangay ID or name
 * @returns {boolean} True if barangay allows transactions
 */
function isBarangayActiveForTransactions(barangayId) {
  let barangay;
  if (typeof barangayId === "string") {
    barangay = getBarangayByName(barangayId);
  } else {
    barangay = getBarangayById(barangayId);
  }
  return barangay ? barangay.is_active_for_transactions : false;
}

/**
 * Get barangay status message
 * @param {number|string} barangayId - Barangay ID or name
 * @returns {string} Status message for the barangay
 */
function getBarangayStatusMessage(barangayId) {
  const barangay = typeof barangayId === "string" 
    ? getBarangayByName(barangayId) 
    : getBarangayById(barangayId);
  
  if (!barangay) return "Barangay not found";
  if (barangay.is_active_for_transactions) {
    return `Welcome to ${barangay.name}. All transaction modules are available.`;
  }
  return `${barangay.name} is a sample barangay. Transaction modules are not yet available for this barangay.`;
}

module.exports = {
  BARANGAYS,
  BARANGAY_LIST,
  BARANGAY_NAMES,
  getAllBarangays,
  getBarangayById,
  getBarangayByName,
  isBarangayActiveForTransactions,
  getBarangayStatusMessage
};
