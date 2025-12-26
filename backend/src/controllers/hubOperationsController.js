import {
  createManifest,
  getManifests,
  getManifestById,
  closeManifest,
  hubInScan,
  hubOutScan,
  remanifest,
  initiateRTO,
  getRTOManifests,
  completeRTO,
} from "../services/hubOperationsService.js";

export const createNewManifest = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const data = req.body;

    const manifest = await createManifest(data, franchiseId);

    res.json({
      success: true,
      message: "Manifest created successfully",
      data: manifest,
    });
  } catch (error) {
    console.error("Create manifest error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create manifest",
    });
  }
};

export const getManifestsList = async (req, res) => {
  try {
    const { getDb } = await import("../config/database.js");
    const db = getDb();
    const franchiseId = req.user.franchise_id;
    const { page = 1, status, origin_hub_id, courier_company_id } = req.query;

    const filters = {
      page: parseInt(page),
      status,
      origin_hub_id: origin_hub_id ? parseInt(origin_hub_id) : null,
      courier_company_id: courier_company_id ? parseInt(courier_company_id) : null,
    };

    const manifests = await getManifests(franchiseId, filters);

    let countQuery = `SELECT COUNT(DISTINCT m.id) as total FROM manifests m WHERE m.franchise_id = ?`;
    const countParams = [franchiseId];

    if (filters.status) {
      countQuery += ` AND m.status = ?`;
      countParams.push(filters.status);
    }
    if (filters.origin_hub_id) {
      countQuery += ` AND m.origin_hub_id = ?`;
      countParams.push(filters.origin_hub_id);
    }
    if (filters.courier_company_id) {
      countQuery += ` AND m.courier_company_id = ?`;
      countParams.push(filters.courier_company_id);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;
    const pages = Math.ceil(total / 20) || 1;

    res.json({
      success: true,
      data: {
        manifests,
        pagination: {
          page: parseInt(page),
          limit: 20,
          total,
          pages,
        },
      },
    });
  } catch (error) {
    console.error("Get manifests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch manifests",
    });
  }
};

export const getManifestDetail = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { id } = req.params;

    const manifest = await getManifestById(parseInt(id), franchiseId);

    if (!manifest) {
      return res.status(404).json({
        success: false,
        message: "Manifest not found",
      });
    }

    res.json({
      success: true,
      data: manifest,
    });
  } catch (error) {
    console.error("Get manifest detail error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch manifest",
    });
  }
};

export const closeManifestHandler = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { id } = req.params;

    await closeManifest(parseInt(id), franchiseId);

    res.json({
      success: true,
      message: "Manifest closed successfully",
    });
  } catch (error) {
    console.error("Close manifest error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to close manifest",
    });
  }
};

export const performHubInScan = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const data = req.body;
    data.scanned_by = req.user.id;

    const scan = await hubInScan(data, franchiseId);

    res.json({
      success: true,
      message: "Hub in-scan completed successfully",
      data: scan,
    });
  } catch (error) {
    console.error("Hub in-scan error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to perform in-scan",
    });
  }
};

export const performHubOutScan = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const data = req.body;
    data.scanned_by = req.user.id;

    const scan = await hubOutScan(data, franchiseId);

    res.json({
      success: true,
      message: "Hub out-scan completed successfully",
      data: scan,
    });
  } catch (error) {
    console.error("Hub out-scan error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to perform out-scan",
    });
  }
};

export const remanifestShipments = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { id } = req.params;
    const data = {
      manifest_id: parseInt(id),
      ...req.body,
    };

    const result = await remanifest(data, franchiseId);

    res.json({
      success: true,
      message: "Shipments remanifested successfully",
      data: result,
    });
  } catch (error) {
    console.error("Remanifest error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to remanifest",
    });
  }
};

export const initiateRTOHandler = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const data = req.body;

    const rto = await initiateRTO(data, franchiseId);

    res.json({
      success: true,
      message: "RTO initiated successfully",
      data: rto,
    });
  } catch (error) {
    console.error("Initiate RTO error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to initiate RTO",
    });
  }
};

export const getRTOList = async (req, res) => {
  try {
    const { getDb } = await import("../config/database.js");
    const db = getDb();
    const franchiseId = req.user.franchise_id;
    const { page = 1, status } = req.query;

    const filters = {
      page: parseInt(page),
      status,
    };

    const rtos = await getRTOManifests(franchiseId, filters);

    let countQuery = `SELECT COUNT(*) as total FROM rto_manifests WHERE franchise_id = ?`;
    const countParams = [franchiseId];

    if (filters.status) {
      countQuery += ` AND status = ?`;
      countParams.push(filters.status);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;
    const pages = Math.ceil(total / 20) || 1;

    res.json({
      success: true,
      data: {
        rtos,
        pagination: {
          page: parseInt(page),
          limit: 20,
          total,
          pages,
        },
      },
    });
  } catch (error) {
    console.error("Get RTO list error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch RTO manifests",
    });
  }
};

export const completeRTOHandler = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { id } = req.params;

    const result = await completeRTO(parseInt(id), franchiseId);

    res.json({
      success: true,
      message: "RTO completed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Complete RTO error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to complete RTO",
    });
  }
};
