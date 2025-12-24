import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  assignDeliveryHandler,
  completeDeliveryHandler,
  failDeliveryHandler,
  getAssignableShipmentsHandler,
  getDeliveryExecutivesHandler,
  getDeliveryPerformanceHandler,
  getFailedDeliveriesHandler,
  getLiveTrackingHandler,
  getOutForDeliveryHandler,
  startDeliveryHandler,
} from "../controllers/deliveryController.js";

const router = express.Router();

router.use(authenticate);

router.get("/executives", getDeliveryExecutivesHandler);
router.get("/assignable", getAssignableShipmentsHandler);
router.post("/assign", assignDeliveryHandler);
router.get("/out-for-delivery", getOutForDeliveryHandler);
router.patch("/assignments/:id/start", startDeliveryHandler);
router.patch("/assignments/:id/pod", completeDeliveryHandler);
router.patch("/assignments/:id/fail", failDeliveryHandler);
router.get("/failed", getFailedDeliveriesHandler);
router.get("/performance", getDeliveryPerformanceHandler);
router.get("/live-tracking", getLiveTrackingHandler);

export default router;
