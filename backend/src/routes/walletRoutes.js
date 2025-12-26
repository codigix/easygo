import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  fetchWalletSummary,
  fetchWalletTransactions,
  createRechargeRequest,
  listRechargeHistory,
  handleRechargeWebhook,
  applyManualWalletAdjustment,
} from "../controllers/walletController.js";
import {
  getCoupons,
  createNewCoupon,
  editCoupon,
  changeCouponStatus,
  previewCouponApplication,
} from "../controllers/couponController.js";
import {
  getDiscountRules,
  createNewDiscountRule,
  editDiscountRule,
  evaluateRulePreview,
} from "../controllers/discountRuleController.js";

const router = express.Router();

router.post("/recharge/webhook", handleRechargeWebhook);

router.use(authenticate);

router.get("/customer/summary", fetchWalletSummary);
router.get("/customer/transactions", fetchWalletTransactions);
router.post("/recharge/intents", createRechargeRequest);
router.get("/recharge/history", listRechargeHistory);
router.post("/manual-adjustment", authorize("admin"), applyManualWalletAdjustment);

router.get("/coupons", getCoupons);
router.post("/coupons", authorize("admin", "franchisee", "staff", "cashier"), createNewCoupon);
router.put("/coupons/:id", authorize("admin", "franchisee", "staff", "cashier"), editCoupon);
router.patch("/coupons/:id/status", authorize("admin", "franchisee", "staff", "cashier"), changeCouponStatus);
router.post("/coupons/apply", previewCouponApplication);

router.get("/discount-rules", getDiscountRules);
router.post("/discount-rules", authorize("admin", "franchisee", "staff", "cashier"), createNewDiscountRule);
router.put("/discount-rules/:id", authorize("admin", "franchisee", "staff", "cashier"), editDiscountRule);
router.post("/discount-rules/evaluate", evaluateRulePreview);

export default router;
