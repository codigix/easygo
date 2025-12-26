import api from "./api";

const BASE_URL = "/fleet";

export const fleetService = {
  getSummary: async () => {
    const response = await api.get(`${BASE_URL}/summary`);
    return response.data;
  },
  getVehicles: async () => {
    const response = await api.get(`${BASE_URL}/vehicles`);
    return response.data;
  },
  createVehicle: async (payload) => {
    const response = await api.post(`${BASE_URL}/vehicles`, payload);
    return response.data;
  },
  updateVehicle: async (id, payload) => {
    const response = await api.put(`${BASE_URL}/vehicles/${id}`, payload);
    return response.data;
  },
  updateVehicleStatus: async (id, status) => {
    const response = await api.patch(`${BASE_URL}/vehicles/${id}/status`, { status });
    return response.data;
  },
  updateVehicleTelemetry: async (id, payload) => {
    const response = await api.patch(`${BASE_URL}/vehicles/${id}/telemetry`, payload);
    return response.data;
  },
  getDrivers: async () => {
    const response = await api.get(`${BASE_URL}/drivers`);
    return response.data;
  },
  createDriver: async (payload) => {
    const response = await api.post(`${BASE_URL}/drivers`, payload);
    return response.data;
  },
  updateDriver: async (id, payload) => {
    const response = await api.put(`${BASE_URL}/drivers/${id}`, payload);
    return response.data;
  },
  updateDriverStatus: async (id, status) => {
    const response = await api.patch(`${BASE_URL}/drivers/${id}/status`, { status });
    return response.data;
  },
  getRoutes: async () => {
    const response = await api.get(`${BASE_URL}/routes`);
    return response.data;
  },
  createRoute: async (payload) => {
    const response = await api.post(`${BASE_URL}/routes`, payload);
    return response.data;
  },
  updateRoute: async (id, payload) => {
    const response = await api.put(`${BASE_URL}/routes/${id}`, payload);
    return response.data;
  },
  getLoadPlanningOptions: async (routeId) => {
    const query = routeId ? `?route_id=${routeId}` : "";
    const response = await api.get(`${BASE_URL}/load-planning/options${query}`);
    return response.data;
  },
  createLoadPlan: async (payload) => {
    const response = await api.post(`${BASE_URL}/load-plans`, payload);
    return response.data;
  },
  getLoadPlans: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status) {
      searchParams.append("status", params.status);
    }
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await api.get(`${BASE_URL}/load-plans${suffix}`);
    return response.data;
  },
  getLoadPlanDetail: async (id) => {
    const response = await api.get(`${BASE_URL}/load-plans/${id}`);
    return response.data;
  },
  completeLoadPlan: async (id, payload) => {
    const response = await api.post(`${BASE_URL}/load-plans/${id}/complete`, payload);
    return response.data;
  },
};
