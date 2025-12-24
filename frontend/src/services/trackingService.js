import api from "./api";

const API_URL = "/tracking";

export const trackingService = {
  getShipmentTracking: async (consignment) => {
    const response = await api.get(`${API_URL}/shipments/${consignment}`);
    return response.data;
  },
  getShipmentLive: async (consignment) => {
    const response = await api.get(`${API_URL}/shipments/${consignment}/live`);
    return response.data;
  },
};
