import api from "./api";

const BASE = "/wallet";

export const walletService = {
  getSummary: async (customerId) => {
    const response = await api.get(`${BASE}/customer/summary`, {
      params: { customer_id: customerId },
    });
    return response.data;
  },

  getTransactions: async (customerId, options = {}) => {
    const response = await api.get(`${BASE}/customer/transactions`, {
      params: {
        customer_id: customerId,
        page: options.page || 1,
        limit: options.limit || 20,
      },
    });
    return response.data;
  },

  downloadLedger: async (customerId) => {
    const response = await api.get(`${BASE}/customer/transactions`, {
      params: { customer_id: customerId, format: "csv" },
      responseType: "blob",
    });
    return response.data;
  },

  createRechargeIntent: async (payload) => {
    const response = await api.post(`${BASE}/recharge/intents`, payload);
    return response.data;
  },

  getRechargeHistory: async (customerId, limit = 20) => {
    const response = await api.get(`${BASE}/recharge/history`, {
      params: { customer_id: customerId, limit },
    });
    return response.data;
  },

  getCoupons: async () => {
    const response = await api.get(`${BASE}/coupons`);
    return response.data;
  },

  createCoupon: async (payload) => {
    const response = await api.post(`${BASE}/coupons`, payload);
    return response.data;
  },

  updateCoupon: async (id, payload) => {
    const response = await api.put(`${BASE}/coupons/${id}`, payload);
    return response.data;
  },

  updateCouponStatus: async (id, status) => {
    const response = await api.patch(`${BASE}/coupons/${id}/status`, { status });
    return response.data;
  },

  previewCoupon: async (payload) => {
    const response = await api.post(`${BASE}/coupons/apply`, payload);
    return response.data;
  },

  getDiscountRules: async () => {
    const response = await api.get(`${BASE}/discount-rules`);
    return response.data;
  },

  createDiscountRule: async (payload) => {
    const response = await api.post(`${BASE}/discount-rules`, payload);
    return response.data;
  },

  updateDiscountRule: async (id, payload) => {
    const response = await api.put(`${BASE}/discount-rules/${id}`, payload);
    return response.data;
  },

  evaluateDiscountRule: async (payload) => {
    const response = await api.post(`${BASE}/discount-rules/evaluate`, payload);
    return response.data;
  },
};
