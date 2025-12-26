import { env } from "../config/env.js";
import {
  getWalletSummary,
  getWalletTransactions,
  createRechargeIntent,
  getRechargeHistory,
  processRechargeWebhook,
  applyManualAdjustment,
} from "../services/walletService.js";

export const fetchWalletSummary = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { customer_id } = req.query;
    if (!customer_id) {
      return res.status(400).json({ success: false, message: "Customer ID is required" });
    }
    const summary = await getWalletSummary(franchiseId, customer_id);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error("Wallet summary error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch wallet summary" });
  }
};

export const fetchWalletTransactions = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { customer_id, page = 1, limit = 20, format } = req.query;
    if (!customer_id) {
      return res.status(400).json({ success: false, message: "Customer ID is required" });
    }
    const result = await getWalletTransactions({
      franchiseId,
      customerId: customer_id,
      page,
      limit: format === "csv" ? 500 : limit,
    });
    if (format === "csv") {
      const header = "Date,Type,Source,Reference,Amount,Opening,Closing";
      const rows = result.data
        .map((tx) => {
          const date = new Date(tx.created_at).toISOString();
          return [
            date,
            tx.type,
            tx.source,
            tx.reference_id || "",
            tx.amount,
            tx.opening_balance,
            tx.closing_balance,
          ]
            .map((value) => `"${value ?? ""}"`)
            .join(",");
        })
        .join("\n");
      const csv = `${header}\n${rows}`;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=wallet-ledger.csv");
      return res.send(csv);
    }
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Wallet transactions error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch wallet transactions" });
  }
};

export const createRechargeRequest = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { customer_id, amount, gst_percent, payment_method, gateway } = req.body;
    if (!customer_id || !amount) {
      return res.status(400).json({ success: false, message: "Customer ID and amount are required" });
    }
    const intent = await createRechargeIntent({
      franchiseId,
      customerId: customer_id,
      amount,
      gstPercent: gst_percent || 18,
      paymentMethod: payment_method,
      gateway,
    });
    res.status(201).json({ success: true, data: intent });
  } catch (error) {
    console.error("Recharge intent error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create recharge intent" });
  }
};

export const listRechargeHistory = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { customer_id, limit = 20 } = req.query;
    if (!customer_id) {
      return res.status(400).json({ success: false, message: "Customer ID is required" });
    }
    const history = await getRechargeHistory({
      franchiseId,
      customerId: customer_id,
      limit,
    });
    res.json({ success: true, data: history });
  } catch (error) {
    console.error("Recharge history error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch recharge history" });
  }
};

export const handleRechargeWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-wallet-webhook-secret"];
    if (signature !== env.walletWebhookSecret) {
      return res.status(401).json({ success: false, message: "Invalid webhook signature" });
    }
    const { order_reference, payment_id, status, amount } = req.body;
    if (!order_reference || !status) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }
    const result = await processRechargeWebhook({
      order_reference,
      payment_id,
      status,
      amount,
      payload: req.body,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Recharge webhook error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to process webhook" });
  }
};

export const applyManualWalletAdjustment = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { customer_id, amount, direction, reason } = req.body;
    if (!customer_id || !amount || !direction) {
      return res.status(400).json({ success: false, message: "Customer ID, amount, and direction are required" });
    }
    const result = await applyManualAdjustment({
      franchiseId,
      customerId: customer_id,
      amount,
      direction,
      reason,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Manual adjustment error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to adjust wallet" });
  }
};
