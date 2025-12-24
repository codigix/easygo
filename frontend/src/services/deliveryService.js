import api from "./api";

const API_URL = "/delivery";

export const deliveryService = {
  getExecutives: async () => {
    const response = await api.get(`${API_URL}/executives`);
    return response.data;
  },
  getAssignableShipments: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append("page", params.page);
    if (params.limit) searchParams.append("limit", params.limit);
    if (params.search) searchParams.append("search", params.search);
    if (params.hub_id) searchParams.append("hub_id", params.hub_id);
    const response = await api.get(`${API_URL}/assignable?${searchParams.toString()}`);
    return response.data;
  },
  assignShipments: async (payload) => {
    const response = await api.post(`${API_URL}/assign`, payload);
    return response.data;
  },
  getOutForDelivery: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append("page", params.page);
    if (params.limit) searchParams.append("limit", params.limit);
    if (params.status) searchParams.append("status", params.status);
    if (params.delivery_executive_id)
      searchParams.append("delivery_executive_id", params.delivery_executive_id);
    if (params.route_code) searchParams.append("route_code", params.route_code);
    if (params.search) searchParams.append("search", params.search);
    const response = await api.get(`${API_URL}/out-for-delivery?${searchParams.toString()}`);
    return response.data;
  },
  startDelivery: async (assignmentId) => {
    const response = await api.patch(`${API_URL}/assignments/${assignmentId}/start`);
    return response.data;
  },
  completeDelivery: async (assignmentId, payload) => {
    const response = await api.patch(`${API_URL}/assignments/${assignmentId}/pod`, payload);
    return response.data;
  },
  failDelivery: async (assignmentId, payload) => {
    const response = await api.patch(`${API_URL}/assignments/${assignmentId}/fail`, payload);
    return response.data;
  },
  getFailedDeliveries: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append("page", params.page);
    if (params.limit) searchParams.append("limit", params.limit);
    if (params.failure_reason) searchParams.append("failure_reason", params.failure_reason);
    if (params.search) searchParams.append("search", params.search);
    const response = await api.get(`${API_URL}/failed?${searchParams.toString()}`);
    return response.data;
  },
  getPerformance: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.start_date) searchParams.append("start_date", params.start_date);
    if (params.end_date) searchParams.append("end_date", params.end_date);
    const response = await api.get(`${API_URL}/performance?${searchParams.toString()}`);
    return response.data;
  },
  getLiveTracking: async () => {
    const response = await api.get(`${API_URL}/live-tracking`);
    return response.data;
  },
};
