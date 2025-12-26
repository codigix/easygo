import {
  listCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  evaluateCoupon,
} from "../services/couponService.js";

export const getCoupons = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const coupons = await listCoupons(franchiseId);
    res.json({ success: true, data: coupons });
  } catch (error) {
    console.error("Get coupons error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch coupons" });
  }
};

export const createNewCoupon = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const result = await createCoupon(franchiseId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("Create coupon error:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to create coupon" });
  }
};

export const editCoupon = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { id } = req.params;
    await updateCoupon(franchiseId, id, req.body);
    res.json({ success: true, message: "Coupon updated" });
  } catch (error) {
    console.error("Update coupon error:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to update coupon" });
  }
};

export const changeCouponStatus = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { id } = req.params;
    const { status } = req.body;
    await toggleCouponStatus(franchiseId, id, status);
    res.json({ success: true, message: "Coupon status updated" });
  } catch (error) {
    console.error("Coupon status error:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to update status" });
  }
};

export const previewCouponApplication = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { customer_id, coupon_code, amount, context } = req.body;
    if (!customer_id || !coupon_code || !amount) {
      return res.status(400).json({ success: false, message: "Customer, code, and amount are required" });
    }
    const result = await evaluateCoupon({
      franchiseId,
      customerId: customer_id,
      couponCode: coupon_code,
      amount,
      context: context || "SHIPMENT",
    });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Preview coupon error:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to evaluate coupon" });
  }
};
