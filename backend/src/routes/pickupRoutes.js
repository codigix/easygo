import express from "express";
import * as pickupController from "../controllers/pickupController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/stats", pickupController.getPickupStats);
router.post("/", pickupController.createPickupRequest);
router.get("/", pickupController.getPickupRequests);
router.get("/:id", pickupController.getPickupRequestById);
router.put("/:id", pickupController.updatePickupStatus);
router.post("/:id/schedule", pickupController.schedulePickup);
router.post("/:id/assign", pickupController.assignPickup);
router.post("/:id/complete", pickupController.markPickupComplete);
router.post("/:id/fail", pickupController.markPickupFailed);

export default router;
