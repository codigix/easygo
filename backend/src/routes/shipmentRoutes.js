import express from "express";
import multer from "multer";
import path from "path";
import { authenticate } from "../middleware/auth.js";
import {
  createNewShipment,
  getShipments,
  getShipmentDetail,
  updateShipmentStatus,
  deleteShipment,
  bulkUploadShipments,
  createShipmentException,
  resolveShipmentException,
  getShipmentExceptions,
} from "../controllers/shipmentController.js";

const router = express.Router();

const upload = multer({ dest: "uploads/temp/" });

// ⚠️  IMPORTANT: Specific routes MUST come before generic /:id route!

// GET operations
router.get("/", authenticate, getShipments);

// ✅ SPECIFIC ROUTES (must be before /:id)
router.get("/exceptions/list", authenticate, getShipmentExceptions);

// ✅ GENERIC ROUTE (after specific routes)
router.get("/:id", authenticate, getShipmentDetail);

// POST operations
router.post("/", authenticate, createNewShipment);
router.post("/bulk-upload", authenticate, upload.single("file"), bulkUploadShipments);
router.post("/:id/exceptions", authenticate, createShipmentException);

// PATCH operations
router.patch("/:id", authenticate, updateShipmentStatus);
router.patch("/:id/exceptions/:exceptionId", authenticate, resolveShipmentException);

// DELETE operations
router.delete("/:id", authenticate, deleteShipment);

export default router;
