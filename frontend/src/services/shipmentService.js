import api from "./api.js";

const API_URL = "/shipments";

export const shipmentService = {
  // Create shipment
  createShipment: async (data) => {
    const response = await api.post(API_URL, data);
    return response.data;
  },

  getServiceTypes: async () => {
    const response = await api.get("/rates/service-types/list");
    return response.data;
  },

  // Get all shipments
  getShipments: async (page = 1, limit = 20, filters = {}) => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", limit);

    if (filters.status) params.append("status", filters.status);
    if (filters.search) params.append("search", filters.search);
    if (filters.shipment_source) params.append("shipment_source", filters.shipment_source);

    const response = await api.get(`${API_URL}?${params.toString()}`);
    return response.data;
  },

  // Get shipment details
  getShipmentById: async (id) => {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  },

  // Update shipment status
  updateShipmentStatus: async (id, data) => {
    const response = await api.patch(`${API_URL}/${id}`, data);
    return response.data;
  },

  // Delete shipment
  deleteShipment: async (id) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  },

  // Bulk upload shipments
  bulkUploadShipments: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`${API_URL}/bulk-upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Get shipment exceptions
  getShipmentExceptions: async (page = 1, limit = 20, filters = {}) => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", limit);

    if (filters.status) params.append("status", filters.status);

    const response = await api.get(`${API_URL}/exceptions/list?${params.toString()}`);
    return response.data;
  },

  // Create exception for shipment
  createException: async (shipmentId, data) => {
    const response = await api.post(`${API_URL}/${shipmentId}/exceptions`, data);
    return response.data;
  },

  // Resolve exception
  resolveException: async (shipmentId, exceptionId, data) => {
    const response = await api.patch(
      `${API_URL}/${shipmentId}/exceptions/${exceptionId}`,
      data
    );
    return response.data;
  },
};
