import {
  getAssignableShipments,
  assignShipmentsToDelivery,
  getOutForDeliveryAssignments,
  startDeliveryAssignment,
  completeDeliveryAssignment,
  failDeliveryAssignment,
  getFailedDeliveries,
  getDeliveryExecutives,
  getDeliveryPerformanceMetrics,
  getLiveTrackingShipments,
} from "../services/deliveryService.js";

export const getDeliveryExecutivesHandler = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const executives = await getDeliveryExecutives(franchiseId);
    res.json({
      success: true,
      data: executives,
    });
  } catch (error) {
    console.error("Get delivery executives error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery executives",
    });
  }
};

export const getAssignableShipmentsHandler = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      hub_id: req.query.hub_id,
    };
    const result = await getAssignableShipments(franchiseId, filters);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get assignable shipments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shipments",
    });
  }
};

export const assignDeliveryHandler = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const userId = req.user.id;
    const result = await assignShipmentsToDelivery(req.body, franchiseId, userId);
    res.json({
      success: true,
      message: "Shipments assigned to delivery",
      data: result,
    });
  } catch (error) {
    console.error("Assign delivery error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to assign shipments",
    });
  }
};

export const getOutForDeliveryHandler = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      delivery_executive_id: req.query.delivery_executive_id,
      route_code: req.query.route_code,
      search: req.query.search,
    };
    const data = await getOutForDeliveryAssignments(franchiseId, filters);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Fetch out-for-delivery assignments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery assignments",
    });
  }
};

export const startDeliveryHandler = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { id } = req.params;
    const data = await startDeliveryAssignment(parseInt(id, 10), franchiseId);
    res.json({
      success: true,
      message: "Delivery started",
      data,
    });
  } catch (error) {
    console.error("Start delivery error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to start delivery",
    });
  }
};

export const completeDeliveryHandler = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const userId = req.user.id;
    const { id } = req.params;
    const data = await completeDeliveryAssignment(
      parseInt(id, 10),
      franchiseId,
      req.body,
      userId
    );
    res.json({
      success: true,
      message: "Shipment marked delivered",
      data,
    });
  } catch (error) {
    console.error("Complete delivery error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to complete delivery",
    });
  }
};

export const failDeliveryHandler = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const userId = req.user.id;
    const { id } = req.params;
    const data = await failDeliveryAssignment(
      parseInt(id, 10),
      franchiseId,
      req.body,
      userId
    );
    res.json({
      success: true,
      message: "Delivery updated",
      data,
    });
  } catch (error) {
    console.error("Fail delivery error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update delivery",
    });
  }
};

export const getFailedDeliveriesHandler = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      failure_reason: req.query.failure_reason,
      search: req.query.search,
    };
    const data = await getFailedDeliveries(franchiseId, filters);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Fetch failed deliveries error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch failed deliveries",
    });
  }
};

export const getDeliveryPerformanceHandler = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const filters = {
      start_date: req.query.start_date,
      end_date: req.query.end_date,
    };
    const data = await getDeliveryPerformanceMetrics(franchiseId, filters);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Delivery performance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery performance",
    });
  }
};

export const getLiveTrackingHandler = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const data = await getLiveTrackingShipments(franchiseId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Live tracking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch live tracking data",
    });
  }
};
