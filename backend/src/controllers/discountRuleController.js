import {
  listDiscountRules,
  createDiscountRule,
  updateDiscountRule,
  evaluateDiscountRules,
} from "../services/discountRuleService.js";

export const getDiscountRules = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const rules = await listDiscountRules(franchiseId);
    res.json({ success: true, data: rules });
  } catch (error) {
    console.error("Get discount rules error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch discount rules" });
  }
};

export const createNewDiscountRule = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const result = await createDiscountRule(franchiseId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("Create discount rule error:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to create discount rule" });
  }
};

export const editDiscountRule = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { id } = req.params;
    await updateDiscountRule(franchiseId, id, req.body);
    res.json({ success: true, message: "Discount rule updated" });
  } catch (error) {
    console.error("Update discount rule error:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to update rule" });
  }
};

export const evaluateRulePreview = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ success: false, message: "Amount is required" });
    }
    const result = await evaluateDiscountRules({
      franchiseId,
      context: req.body,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Evaluate discount rule error:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to evaluate rule" });
  }
};
