import { getDb } from "../config/database.js";

const getManagedConnection = async (connection) => {
  if (connection) {
    return { connection, managed: false };
  }
  const pooled = await getDb().getConnection();
  return { connection: pooled, managed: true };
};

const selectWallet = async (connection, franchiseId, customerId, lock = false) => {
  const [rows] = await connection.query(
    `SELECT * FROM wallets WHERE franchise_id = ? AND customer_id = ?${lock ? " FOR UPDATE" : ""}`,
    [franchiseId, customerId]
  );
  return rows[0] || null;
};

const ensureWalletRecord = async (connection, franchiseId, customerId) => {
  let wallet = await selectWallet(connection, franchiseId, customerId, true);
  if (!wallet) {
    const [insert] = await connection.query(
      `INSERT INTO wallets (franchise_id, customer_id, balance, credit_limit, allow_negative, status, created_at, updated_at)
       VALUES (?, ?, 0, 0, false, 'active', NOW(), NOW())`,
      [franchiseId, customerId]
    );
    const [[fresh]] = await connection.query(
      "SELECT * FROM wallets WHERE id = ? FOR UPDATE",
      [insert.insertId]
    );
    wallet = fresh;
  }
  return wallet;
};

const toAmount = (value) => {
  if (!value) {
    return 0;
  }
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const recordTransaction = async (
  connection,
  wallet,
  franchiseId,
  customerId,
  type,
  source,
  referenceId,
  amount,
  opening,
  closing,
  metadata
) => {
  const [tx] = await connection.query(
    `INSERT INTO wallet_transactions
       (wallet_id, franchise_id, customer_id, type, source, reference_id, amount, opening_balance, closing_balance, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      wallet.id,
      franchiseId,
      customerId,
      type,
      source,
      referenceId || null,
      amount,
      opening,
      closing,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
  return tx.insertId;
};

export const creditWallet = async ({
  franchiseId,
  customerId,
  amount,
  source,
  referenceId,
  metadata,
  connection,
}) => {
  const { connection: conn, managed } = await getManagedConnection(connection);
  const numericAmount = toAmount(amount);
  if (numericAmount <= 0) {
    throw new Error("Amount must be greater than zero");
  }
  try {
    if (!connection) {
      await conn.beginTransaction();
    }
    const wallet = await ensureWalletRecord(conn, franchiseId, customerId);
    if (wallet.status === "blocked") {
      throw new Error("Wallet is blocked");
    }
    const opening = toAmount(wallet.balance);
    const closing = Number((opening + numericAmount).toFixed(2));
    await conn.query(
      "UPDATE wallets SET balance = ?, last_recharged_at = NOW(), updated_at = NOW() WHERE id = ?",
      [closing, wallet.id]
    );
    const transactionId = await recordTransaction(
      conn,
      wallet,
      franchiseId,
      customerId,
      "CREDIT",
      source,
      referenceId,
      numericAmount,
      opening,
      closing,
      metadata
    );
    if (!connection) {
      await conn.commit();
    }
    return { wallet_id: wallet.id, balance: closing, transaction_id: transactionId };
  } catch (error) {
    if (!connection) {
      await conn.rollback();
    }
    throw error;
  } finally {
    if (!connection && managed) {
      conn.release();
    }
  }
};

export const debitWallet = async ({
  franchiseId,
  customerId,
  amount,
  source,
  referenceId,
  metadata,
  allowNegativeOverride = false,
  connection,
}) => {
  const { connection: conn, managed } = await getManagedConnection(connection);
  const numericAmount = toAmount(amount);
  if (numericAmount <= 0) {
    throw new Error("Amount must be greater than zero");
  }
  try {
    if (!connection) {
      await conn.beginTransaction();
    }
    const wallet = await ensureWalletRecord(conn, franchiseId, customerId);
    if (wallet.status === "blocked") {
      throw new Error("Wallet is blocked");
    }
    const opening = toAmount(wallet.balance);
    const limit = toAmount(wallet.credit_limit);
    const canGoNegative = wallet.allow_negative || allowNegativeOverride;
    const closing = Number((opening - numericAmount).toFixed(2));
    if (!canGoNegative && closing < 0) {
      throw new Error("Insufficient wallet balance");
    }
    if (canGoNegative && closing < -limit) {
      throw new Error("Wallet exceeded allowed credit limit");
    }
    await conn.query("UPDATE wallets SET balance = ?, updated_at = NOW() WHERE id = ?", [closing, wallet.id]);
    const transactionId = await recordTransaction(
      conn,
      wallet,
      franchiseId,
      customerId,
      "DEBIT",
      source,
      referenceId,
      numericAmount,
      opening,
      closing,
      metadata
    );
    if (!connection) {
      await conn.commit();
    }
    return { wallet_id: wallet.id, balance: closing, transaction_id: transactionId };
  } catch (error) {
    if (!connection) {
      await conn.rollback();
    }
    throw error;
  } finally {
    if (!connection && managed) {
      conn.release();
    }
  }
};

export const getWalletSummary = async (franchiseId, customerId) => {
  const db = getDb();
  const [[wallet]] = await db.query(
    "SELECT * FROM wallets WHERE franchise_id = ? AND customer_id = ?",
    [franchiseId, customerId]
  );
  const [[totals]] = await db.query(
    `SELECT 
       COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END), 0) AS total_credits,
       COALESCE(SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END), 0) AS total_debits
     FROM wallet_transactions WHERE franchise_id = ? AND customer_id = ?`,
    [franchiseId, customerId]
  );
  const [transactions] = await db.query(
    `SELECT id, type, source, reference_id, amount, opening_balance, closing_balance, metadata, created_at
     FROM wallet_transactions WHERE franchise_id = ? AND customer_id = ? ORDER BY created_at DESC LIMIT 20`,
    [franchiseId, customerId]
  );
  return {
    wallet: wallet || null,
    totals: totals || { total_credits: 0, total_debits: 0 },
    transactions: transactions.map((tx) => ({
      ...tx,
      metadata: tx.metadata ? JSON.parse(tx.metadata) : null,
    })),
  };
};

export const getWalletTransactions = async ({
  franchiseId,
  customerId,
  page = 1,
  limit = 20,
}) => {
  const db = getDb();
  const offset = (Number(page) - 1) * Number(limit);
  const [[countRow]] = await db.query(
    "SELECT COUNT(*) AS total FROM wallet_transactions WHERE franchise_id = ? AND customer_id = ?",
    [franchiseId, customerId]
  );
  const [rows] = await db.query(
    `SELECT id, type, source, reference_id, amount, opening_balance, closing_balance, metadata, created_at
     FROM wallet_transactions WHERE franchise_id = ? AND customer_id = ?
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [franchiseId, customerId, Number(limit), offset]
  );
  return {
    data: rows.map((row) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    })),
    pagination: {
      total: countRow.total || 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil((countRow.total || 0) / Number(limit)),
    },
  };
};

const buildOrderReference = () => {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `WR-${Date.now()}-${random}`;
};

export const createRechargeIntent = async ({
  franchiseId,
  customerId,
  amount,
  gstPercent = 18,
  paymentMethod,
  gateway,
  connection,
}) => {
  const baseAmount = toAmount(amount);
  if (baseAmount <= 0) {
    throw new Error("Amount must be greater than zero");
  }
  const gstAmount = Number(((baseAmount * gstPercent) / 100).toFixed(2));
  const netAmount = Number((baseAmount + gstAmount).toFixed(2));
  const { connection: conn, managed } = await getManagedConnection(connection);
  try {
    if (!connection) {
      await conn.beginTransaction();
    }
    const wallet = await ensureWalletRecord(conn, franchiseId, customerId);
    const orderReference = buildOrderReference();
    const [insert] = await conn.query(
      `INSERT INTO wallet_recharges 
        (wallet_id, franchise_id, customer_id, payment_id, amount, gst_amount, net_amount, tax_percent, status, payment_method, gateway, order_reference, created_at, updated_at)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?, 'PENDING', ?, ?, ?, NOW(), NOW())`,
      [
        wallet.id,
        franchiseId,
        customerId,
        baseAmount,
        gstAmount,
        netAmount,
        gstPercent,
        paymentMethod || null,
        gateway || null,
        orderReference,
      ]
    );
    if (!connection) {
      await conn.commit();
    }
    return {
      recharge_id: insert.insertId,
      order_reference: orderReference,
      amount: baseAmount,
      gst_amount: gstAmount,
      net_amount: netAmount,
      tax_percent: gstPercent,
    };
  } catch (error) {
    if (!connection) {
      await conn.rollback();
    }
    throw error;
  } finally {
    if (!connection && managed) {
      conn.release();
    }
  }
};

export const getRechargeHistory = async ({ franchiseId, customerId, limit = 20 }) => {
  const db = getDb();
  const [walletRows] = await db.query(
    "SELECT id FROM wallets WHERE franchise_id = ? AND customer_id = ?",
    [franchiseId, customerId]
  );
  if (walletRows.length === 0) {
    return [];
  }
  const walletId = walletRows[0].id;
  const [rows] = await db.query(
    `SELECT id, order_reference, payment_id, amount, gst_amount, net_amount, tax_percent, status, payment_method, gateway, wallet_transaction_id, created_at
     FROM wallet_recharges WHERE wallet_id = ? ORDER BY created_at DESC LIMIT ?`,
    [walletId, Number(limit)]
  );
  return rows;
};

export const processRechargeWebhook = async ({
  order_reference,
  payment_id,
  status,
  amount,
  payload,
}) => {
  if (!order_reference || !status) {
    throw new Error("Invalid webhook payload");
  }
  const { connection: conn, managed } = await getManagedConnection(null);
  try {
    await conn.beginTransaction();
    const [[recharge]] = await conn.query(
      "SELECT * FROM wallet_recharges WHERE order_reference = ? FOR UPDATE",
      [order_reference]
    );
    if (!recharge) {
      throw new Error("Recharge record not found");
    }
    if (recharge.status === "SUCCESS") {
      await conn.commit();
      return { already_processed: true };
    }
    const netAmount = toAmount(recharge.net_amount);
    if (status === "SUCCESS" && amount && Math.abs(netAmount - toAmount(amount)) > 0.5) {
      throw new Error("Recharge amount mismatch");
    }
    await conn.query(
      "UPDATE wallet_recharges SET status = ?, payment_id = ?, payload = ?, updated_at = NOW() WHERE id = ?",
      [status, payment_id || recharge.payment_id, payload ? JSON.stringify(payload) : recharge.payload, recharge.id]
    );
    let transactionId = recharge.wallet_transaction_id;
    if (status === "SUCCESS") {
      const result = await creditWallet({
        franchiseId: recharge.franchise_id,
        customerId: recharge.customer_id,
        amount: netAmount,
        source: "RECHARGE",
        referenceId: order_reference,
        metadata: { recharge_id: recharge.id, gateway: recharge.gateway },
        connection: conn,
      });
      transactionId = result.transaction_id;
      await conn.query(
        "UPDATE wallet_recharges SET wallet_transaction_id = ? WHERE id = ?",
        [transactionId, recharge.id]
      );
    }
    await conn.commit();
    return { status, wallet_transaction_id: transactionId };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    if (managed) {
      conn.release();
    }
  }
};

export const applyManualAdjustment = async ({
  franchiseId,
  customerId,
  amount,
  direction,
  reason,
}) => {
  if (direction === "CREDIT") {
    return creditWallet({
      franchiseId,
      customerId,
      amount,
      source: "ADJUSTMENT",
      referenceId: reason || "manual",
      metadata: { reason },
    });
  }
  return debitWallet({
    franchiseId,
    customerId,
    amount,
    source: "ADJUSTMENT",
    referenceId: reason || "manual",
    metadata: { reason },
    allowNegativeOverride: true,
  });
};
