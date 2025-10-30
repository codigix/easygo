import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getAllCompanies,
  getCompanyById,
  getCompanyByCompanyId,
  createCompany,
  updateCompany,
  deleteCompany,
  uploadCompaniesFromExcel,
  generateCompanyTemplate,
} from "../controllers/companyRateMasterController.js";

const router = express.Router();

// Middleware
router.use(authenticate);

// Get all companies for franchise
router.get("/", getAllCompanies);

// Get company by company_id (customer ID from booking)
router.get("/by-id/:company_id", getCompanyByCompanyId);

// Get company by database ID
router.get("/:id", getCompanyById);

// Create new company
router.post("/", createCompany);

// Update company
router.put("/:id", updateCompany);

// Delete company
router.delete("/:id", deleteCompany);

// Upload company rates from Excel
router.post("/upload", uploadCompaniesFromExcel);

// Generate company template for download
router.get("/template/download", generateCompanyTemplate);

export default router;
