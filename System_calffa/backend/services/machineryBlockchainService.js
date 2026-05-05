const crypto = require('crypto');
const pool = require('../db');

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
const SIGNATURE_SECRET = process.env.BLOCKCHAIN_SIGNATURE_SECRET || 'calffa_internal_signature_secret_v1';
const SYSTEM_VERIFICATION_KEY = process.env.BLOCKCHAIN_SYSTEM_KEY || 'CALFFA_INTERNAL_LEDGER_V1';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sortObjectKeys(input) {
  if (Array.isArray(input)) {
    return input.map(sortObjectKeys);
  }

  if (input && typeof input === 'object') {
    return Object.keys(input)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortObjectKeys(input[key]);
        return acc;
      }, {});
  }

  return input;
}

function serializeTransactionData(transactionData) {
  return JSON.stringify(sortObjectKeys(transactionData || {}));
}

function normalizeDbJson(value) {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return {};
    }
  }

  return value;
}

function formatHashTimestamp(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function runRawSql(executor, sql) {
  if (typeof executor.query === 'function') {
    return executor.query(sql);
  }

  return executor.execute(sql);
}

async function ensureLedgerSchema(executor = pool) {
  await runRawSql(executor, `
    CREATE TABLE IF NOT EXISTS machinery_blockchain_ledger (
      block_id INT AUTO_INCREMENT PRIMARY KEY,
      previous_hash CHAR(64) NOT NULL,
      current_hash CHAR(64) NOT NULL UNIQUE,
      timestamp DATETIME NOT NULL,
      transaction_type VARCHAR(100) NOT NULL,
      machinery_id INT NULL,
      booking_id INT NULL,
      income_amount DECIMAL(15, 2) DEFAULT 0,
      expense_amount DECIMAL(15, 2) DEFAULT 0,
      net_profit DECIMAL(15, 2) DEFAULT 0,
      barangay_distribution JSON NULL,
      transaction_data JSON NOT NULL,
      digital_signature CHAR(64) NOT NULL,
      system_verification_key VARCHAR(120) NOT NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_transaction_type (transaction_type),
      INDEX idx_timestamp (timestamp),
      INDEX idx_machinery_id (machinery_id),
      INDEX idx_booking_id (booking_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [updateTrigger] = await executor.execute(
    `SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = 'trg_machinery_blockchain_no_update'`
  );

  if (updateTrigger.length === 0) {
    await runRawSql(executor, `
      CREATE TRIGGER trg_machinery_blockchain_no_update
      BEFORE UPDATE ON machinery_blockchain_ledger
      FOR EACH ROW
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Blockchain ledger is immutable. Updates are not allowed.'
    `);
  }

  const [deleteTrigger] = await executor.execute(
    `SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = 'trg_machinery_blockchain_no_delete'`
  );

  if (deleteTrigger.length === 0) {
    await runRawSql(executor, `
      CREATE TRIGGER trg_machinery_blockchain_no_delete
      BEFORE DELETE ON machinery_blockchain_ledger
      FOR EACH ROW
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Blockchain ledger is immutable. Deletes are not allowed.'
    `);
  }
}

async function createFinancialBlock(payload, executor = pool) {
  await ensureLedgerSchema(executor);

  const [lastBlockRows] = await executor.execute(
    `SELECT block_id, current_hash FROM machinery_blockchain_ledger ORDER BY block_id DESC LIMIT 1`
  );

  const previousHash = lastBlockRows.length > 0 ? lastBlockRows[0].current_hash : GENESIS_HASH;
  const hashTimestamp = formatHashTimestamp(new Date());

  const transactionData = {
    machinery_id: payload.machinery_id || null,
    booking_id: payload.booking_id || null,
    income_amount: Number(payload.income_amount || 0),
    expense_amount: Number(payload.expense_amount || 0),
    net_profit: Number(payload.net_profit || 0),
    barangay_distribution: payload.barangay_distribution || null,
    event_type: payload.transaction_type,
    metadata: payload.metadata || null
  };

  const serializedTransactionData = serializeTransactionData(transactionData);
  const currentHash = sha256(`${previousHash}${hashTimestamp}${serializedTransactionData}`);
  const digitalSignature = sha256(`${currentHash}${SYSTEM_VERIFICATION_KEY}${SIGNATURE_SECRET}`);

  const [insertResult] = await executor.execute(
    `INSERT INTO machinery_blockchain_ledger
      (previous_hash, current_hash, timestamp, transaction_type, machinery_id, booking_id,
       income_amount, expense_amount, net_profit, barangay_distribution, transaction_data,
       digital_signature, system_verification_key, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      previousHash,
      currentHash,
      hashTimestamp,
      payload.transaction_type,
      payload.machinery_id || null,
      payload.booking_id || null,
      Number(payload.income_amount || 0),
      Number(payload.expense_amount || 0),
      Number(payload.net_profit || 0),
      payload.barangay_distribution ? JSON.stringify(payload.barangay_distribution) : null,
      JSON.stringify(transactionData),
      digitalSignature,
      SYSTEM_VERIFICATION_KEY,
      payload.created_by || null
    ]
  );

  return {
    block_id: insertResult.insertId,
    previous_hash: previousHash,
    current_hash: currentHash,
    timestamp: hashTimestamp,
    digital_signature: digitalSignature,
    system_verification_key: SYSTEM_VERIFICATION_KEY
  };
}

async function getLedgerBlocks(options = {}, executor = pool) {
  await ensureLedgerSchema(executor);

  const limit = Math.min(Math.max(Number(options.limit || 200), 1), 1000);
  const params = [];
  let query = `
    SELECT
      block_id,
      previous_hash,
      current_hash,
      timestamp,
      transaction_type,
      machinery_id,
      booking_id,
      income_amount,
      expense_amount,
      net_profit,
      barangay_distribution,
      transaction_data,
      digital_signature,
      system_verification_key,
      created_by,
      created_at
    FROM machinery_blockchain_ledger
  `;

  if (options.transaction_type) {
    query += ' WHERE transaction_type = ?';
    params.push(options.transaction_type);
  }

  query += ' ORDER BY block_id DESC LIMIT ?';
  params.push(limit);

  const [rows] = await executor.execute(query, params);

  return rows.map((row) => ({
    ...row,
    barangay_distribution: normalizeDbJson(row.barangay_distribution),
    transaction_data: normalizeDbJson(row.transaction_data)
  }));
}

async function verifyLedger(executor = pool) {
  await ensureLedgerSchema(executor);

  const [rows] = await executor.execute(`
    SELECT
      block_id,
      previous_hash,
      current_hash,
      timestamp,
      DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') AS hash_timestamp,
      transaction_type,
      transaction_data,
      digital_signature,
      system_verification_key
    FROM machinery_blockchain_ledger
    ORDER BY block_id ASC
  `);

  let previousBlockHash = GENESIS_HASH;
  let validCount = 0;
  let tamperedCount = 0;

  const verificationResults = rows.map((row) => {
    const transactionData = normalizeDbJson(row.transaction_data);
    const serializedTransactionData = serializeTransactionData(transactionData);
    const hashTimestamp = row.hash_timestamp || formatHashTimestamp(row.timestamp);
    const recomputedHash = sha256(`${row.previous_hash}${hashTimestamp}${serializedTransactionData}`);
    const recomputedSignature = sha256(`${recomputedHash}${row.system_verification_key}${SIGNATURE_SECRET}`);

    const previousHashValid = row.previous_hash === previousBlockHash;
    const hashValid = row.current_hash === recomputedHash;
    const signatureValid = row.digital_signature === recomputedSignature;
    const isValid = previousHashValid && hashValid && signatureValid;

    if (isValid) {
      validCount += 1;
    } else {
      tamperedCount += 1;
    }

    previousBlockHash = row.current_hash;

    return {
      block_id: row.block_id,
      timestamp: row.timestamp,
      transaction_type: row.transaction_type,
      stored_hash: row.current_hash,
      recomputed_hash: recomputedHash,
      stored_previous_hash: row.previous_hash,
      expected_previous_hash: previousHashValid ? row.previous_hash : previousBlockHash,
      stored_signature: row.digital_signature,
      recomputed_signature: recomputedSignature,
      previous_hash_valid: previousHashValid,
      hash_valid: hashValid,
      signature_valid: signatureValid,
      is_valid: isValid
    };
  });

  return {
    total_blocks: rows.length,
    valid_blocks: validCount,
    tampered_blocks: tamperedCount,
    chain_valid: tamperedCount === 0,
    verification_results: verificationResults
  };
}

module.exports = {
  GENESIS_HASH,
  SYSTEM_VERIFICATION_KEY,
  ensureLedgerSchema,
  createFinancialBlock,
  getLedgerBlocks,
  verifyLedger
};
