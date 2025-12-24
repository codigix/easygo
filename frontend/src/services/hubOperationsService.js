import api from "./api.js";

const API_URL = "/hub-operations";

export const hubOperationsService = {
  // Manifests
  createManifest: async (data) => {
    const response = await api.post(`${API_URL}/manifests`, data);
    return response.data;
  },

  getManifests: async (page = 1, filters = {}) => {
    const params = new URLSearchParams();
    params.append("page", page);
    if (filters.status) params.append("status", filters.status);
    if (filters.origin_hub_id) params.append("origin_hub_id", filters.origin_hub_id);
    if (filters.courier_company_id) params.append("courier_company_id", filters.courier_company_id);

    const response = await api.get(`${API_URL}/manifests?${params.toString()}`);
    return response.data;
  },

  getManifestById: async (id) => {
    const response = await api.get(`${API_URL}/manifests/${id}`);
    return response.data;
  },

  closeManifest: async (id) => {
    const response = await api.patch(`${API_URL}/manifests/${id}/close`);
    return response.data;
  },

  remanifest: async (id, data) => {
    const response = await api.post(`${API_URL}/manifests/${id}/remanifest`, data);
    return response.data;
  },

  // Hub Scans
  hubInScan: async (data) => {
    const response = await api.post(`${API_URL}/hub-scans/in-scan`, data);
    return response.data;
  },

  hubOutScan: async (data) => {
    const response = await api.post(`${API_URL}/hub-scans/out-scan`, data);
    return response.data;
  },

  // RTO
  initiateRTO: async (data) => {
    const response = await api.post(`${API_URL}/rto`, data);
    return response.data;
  },

  getRTOManifests: async (page = 1, filters = {}) => {
    const params = new URLSearchParams();
    params.append("page", page);
    if (filters.status) params.append("status", filters.status);

    const response = await api.get(`${API_URL}/rto?${params.toString()}`);
    return response.data;
  },

  completeRTO: async (id) => {
    const response = await api.patch(`${API_URL}/rto/${id}/complete`);
    return response.data;
  },
};
