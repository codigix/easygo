import {
  getFleetOverview,
  getVehicles,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
  updateVehicleTelemetry,
  getDrivers,
  createDriver,
  updateDriver,
  updateDriverStatus,
  getRoutes,
  createRoute,
  updateRoute,
  getLoadPlanningOptions,
  createLoadPlan,
  completeLoadPlan,
  getLoadPlans,
  getLoadPlanDetail,
} from "../services/fleetService.js";

export const getFleetSummary = async (req, res) => {
  try {
    const data = await getFleetOverview(req.user.franchise_id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch fleet summary" });
  }
};

export const getFleetVehicles = async (req, res) => {
  try {
    const data = await getVehicles(req.user.franchise_id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch vehicles" });
  }
};

export const createFleetVehicle = async (req, res) => {
  try {
    const vehicle = await createVehicle(req.user.franchise_id, req.body);
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Failed to create vehicle" });
  }
};

export const updateFleetVehicle = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid vehicle id" });
    }
    const vehicle = await updateVehicle(id, req.user.franchise_id, req.body);
    res.json({ success: true, data: vehicle });
  } catch (error) {
    const status = error.message === "Vehicle not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message || "Failed to update vehicle" });
  }
};

export const updateFleetVehicleStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid vehicle id" });
    }
    const vehicle = await updateVehicleStatus(id, req.user.franchise_id, req.body.status);
    res.json({ success: true, data: vehicle });
  } catch (error) {
    const status = error.message === "Vehicle not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message || "Failed to update vehicle status" });
  }
};

export const updateFleetVehicleTelemetry = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid vehicle id" });
    }
    const vehicle = await updateVehicleTelemetry(id, req.user.franchise_id, req.body);
    res.json({ success: true, data: vehicle });
  } catch (error) {
    const status = error.message === "Vehicle not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message || "Failed to update telemetry" });
  }
};

export const getFleetDrivers = async (req, res) => {
  try {
    const data = await getDrivers(req.user.franchise_id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch drivers" });
  }
};

export const createFleetDriver = async (req, res) => {
  try {
    const driver = await createDriver(req.user.franchise_id, req.body);
    res.status(201).json({ success: true, data: driver });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Failed to create driver" });
  }
};

export const updateFleetDriver = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid driver id" });
    }
    const driver = await updateDriver(id, req.user.franchise_id, req.body);
    res.json({ success: true, data: driver });
  } catch (error) {
    const status = error.message === "Driver not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message || "Failed to update driver" });
  }
};

export const updateFleetDriverStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid driver id" });
    }
    const driver = await updateDriverStatus(id, req.user.franchise_id, req.body.status);
    res.json({ success: true, data: driver });
  } catch (error) {
    const status = error.message === "Driver not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message || "Failed to update driver status" });
  }
};

export const getFleetRoutes = async (req, res) => {
  try {
    const routes = await getRoutes(req.user.franchise_id);
    res.json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch routes" });
  }
};

export const createFleetRoute = async (req, res) => {
  try {
    const route = await createRoute(req.user.franchise_id, req.body);
    res.status(201).json({ success: true, data: route });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Failed to create route" });
  }
};

export const updateFleetRoute = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid route id" });
    }
    const route = await updateRoute(id, req.user.franchise_id, req.body);
    res.json({ success: true, data: route });
  } catch (error) {
    const status = error.message === "Route not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message || "Failed to update route" });
  }
};

export const getLoadPlanningOptionsHandler = async (req, res) => {
  try {
    const routeId = req.query.route_id ? parseInt(req.query.route_id, 10) : undefined;
    const data = await getLoadPlanningOptions(req.user.franchise_id, routeId);
    res.json({ success: true, data });
  } catch (error) {
    const status = error.message === "Route not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message || "Failed to fetch load planning data" });
  }
};

export const createLoadPlanHandler = async (req, res) => {
  try {
    const plan = await createLoadPlan(req.user.franchise_id, req.body, req.user.id);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Failed to create load plan" });
  }
};

export const completeLoadPlanHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid load plan id" });
    }
    const plan = await completeLoadPlan(req.user.franchise_id, id, req.body || {}, req.user.id);
    res.json({ success: true, data: plan });
  } catch (error) {
    const status = error.message === "Load plan not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message || "Failed to complete load plan" });
  }
};

export const getLoadPlansHandler = async (req, res) => {
  try {
    const plans = await getLoadPlans(req.user.franchise_id, {
      status: req.query.status,
    });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch load plans" });
  }
};

export const getLoadPlanDetailHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid load plan id" });
    }
    const plan = await getLoadPlanDetail(req.user.franchise_id, id);
    res.json({ success: true, data: plan });
  } catch (error) {
    const status = error.message === "Load plan not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message || "Failed to fetch load plan" });
  }
};
