import express from "express";
import {
  getFleetSummary,
  getFleetVehicles,
  createFleetVehicle,
  updateFleetVehicle,
  updateFleetVehicleStatus,
  updateFleetVehicleTelemetry,
  getFleetDrivers,
  createFleetDriver,
  updateFleetDriver,
  updateFleetDriverStatus,
  getFleetRoutes,
  createFleetRoute,
  updateFleetRoute,
  getLoadPlanningOptionsHandler,
  createLoadPlanHandler,
  completeLoadPlanHandler,
  getLoadPlansHandler,
  getLoadPlanDetailHandler,
} from "../controllers/fleetController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/summary", authenticate, getFleetSummary);

router.get("/vehicles", authenticate, getFleetVehicles);
router.post("/vehicles", authenticate, createFleetVehicle);
router.put("/vehicles/:id", authenticate, updateFleetVehicle);
router.patch("/vehicles/:id/status", authenticate, updateFleetVehicleStatus);
router.patch("/vehicles/:id/telemetry", authenticate, updateFleetVehicleTelemetry);

router.get("/drivers", authenticate, getFleetDrivers);
router.post("/drivers", authenticate, createFleetDriver);
router.put("/drivers/:id", authenticate, updateFleetDriver);
router.patch("/drivers/:id/status", authenticate, updateFleetDriverStatus);

router.get("/routes", authenticate, getFleetRoutes);
router.post("/routes", authenticate, createFleetRoute);
router.put("/routes/:id", authenticate, updateFleetRoute);

router.get("/load-planning/options", authenticate, getLoadPlanningOptionsHandler);
router.post("/load-plans", authenticate, createLoadPlanHandler);
router.get("/load-plans", authenticate, getLoadPlansHandler);
router.get("/load-plans/:id", authenticate, getLoadPlanDetailHandler);
router.post("/load-plans/:id/complete", authenticate, completeLoadPlanHandler);

export default router;
