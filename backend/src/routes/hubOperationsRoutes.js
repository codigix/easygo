import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createNewManifest,
  getManifestsList,
  getManifestDetail,
  closeManifestHandler,
  performHubInScan,
  performHubOutScan,
  remanifestShipments,
  initiateRTOHandler,
  getRTOList,
  completeRTOHandler,
} from "../controllers/hubOperationsController.js";

const router = express.Router();

// Manifests
router.post("/manifests", authenticate, createNewManifest);
router.get("/manifests", authenticate, getManifestsList);
router.get("/manifests/:id", authenticate, getManifestDetail);
router.patch("/manifests/:id/close", authenticate, closeManifestHandler);
router.post("/manifests/:id/remanifest", authenticate, remanifestShipments);

// Hub Scans
router.post("/hub-scans/in-scan", authenticate, performHubInScan);
router.post("/hub-scans/out-scan", authenticate, performHubOutScan);

// RTO
router.post("/rto", authenticate, initiateRTOHandler);
router.get("/rto", authenticate, getRTOList);
router.patch("/rto/:id/complete", authenticate, completeRTOHandler);

export default router;
