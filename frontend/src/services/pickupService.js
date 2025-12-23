import api from "./api";

export const pickupService = {
  create: async (data) => {
    try {
      const response = await api.post("/pickups", data);
      return response.data;
    } catch (error) {
      console.error("Create pickup error:", error);
      throw error;
    }
  },

  getAll: async (params = {}) => {
    try {
      const response = await api.get("/pickups", { params });
      return response.data;
    } catch (error) {
      console.error("Get all pickups error:", error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/pickups/${id}`);
      return response.data;
    } catch (error) {
      console.error("Get pickup error:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/pickups/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Update pickup error:", error);
      throw error;
    }
  },

  schedule: async (id, data) => {
    try {
      const response = await api.post(`/pickups/${id}/schedule`, data);
      return response.data;
    } catch (error) {
      console.error("Schedule pickup error:", error);
      throw error;
    }
  },

  assign: async (id, data) => {
    try {
      const response = await api.post(`/pickups/${id}/assign`, data);
      return response.data;
    } catch (error) {
      console.error("Assign pickup error:", error);
      throw error;
    }
  },

  markComplete: async (id) => {
    try {
      const response = await api.post(`/pickups/${id}/complete`);
      return response.data;
    } catch (error) {
      console.error("Mark complete error:", error);
      throw error;
    }
  },

  markFailed: async (id, data) => {
    try {
      const response = await api.post(`/pickups/${id}/fail`, data);
      return response.data;
    } catch (error) {
      console.error("Mark failed error:", error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await api.get("/pickups/stats");
      return response.data;
    } catch (error) {
      console.error("Get stats error:", error);
      throw error;
    }
  },
};
