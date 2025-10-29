import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  saveCourierRates,
  getCompanyRates,
  getRatesByCourierType,
  calculateRate,
  deleteCompanyRates,
} from "../controllers/courierCompanyRatesController.js";

const router = express.Router();

// Middleware
router.use(authenticate);

// Save/Update all courier rates for a company
router.post("/", saveCourierRates);

// Get all rates for a company
router.get("/company/:company_id", getCompanyRates);

// Get rates by courier type
router.get("/company/:company_id/courier/:courier_type", getRatesByCourierType);

// Calculate rate for booking (used during booking creation)
router.post("/calculate", calculateRate);

// Delete all rates for a company
router.delete("/company/:company_id", deleteCompanyRates);

export default router;
