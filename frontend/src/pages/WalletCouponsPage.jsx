import { useEffect, useState } from "react";
import { walletService } from "../services/walletService.js";

const defaultForm = {
  code: "",
  title: "",
  discount_type: "FLAT",
  value: 100,
  max_discount: 0,
  min_order_value: 0,
  usage_limit: "",
  per_user_limit: "",
  applicable_on: "SHIPMENT",
  status: "ACTIVE",
};

export default function WalletCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewInput, setPreviewInput] = useState({
    customer_id: "",
    coupon_code: "",
    amount: 500,
    context: "SHIPMENT",
  });
  const [previewResult, setPreviewResult] = useState(null);

  const loadCoupons = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await walletService.getCoupons();
      if (!response.success) {
        throw new Error(response.message || "Failed to load coupons");
      }
      setCoupons(response.data || []);
    } catch (err) {
      setError(err.message || "Unable to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.title.trim()) {
      setError("Code and title are required");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const response = await walletService.createCoupon({
        ...form,
        code: form.code.trim().toUpperCase(),
      });
      if (!response.success) {
        throw new Error(response.message || "Failed to create coupon");
      }
      setForm(defaultForm);
      await loadCoupons();
    } catch (err) {
      setError(err.message || "Unable to create coupon");
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (coupon) => {
    try {
      await walletService.updateCouponStatus(coupon.id, coupon.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
      await loadCoupons();
    } catch (err) {
      setError(err.message || "Unable to update coupon status");
    }
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!previewInput.customer_id.trim() || !previewInput.coupon_code.trim()) {
      setError("Enter customer and coupon to preview");
      return;
    }
    setError("");
    try {
      const response = await walletService.previewCoupon({
        customer_id: previewInput.customer_id.trim(),
        coupon_code: previewInput.coupon_code.trim(),
        amount: Number(previewInput.amount) || 0,
        context: previewInput.context,
      });
      if (!response.success) {
        throw new Error(response.message || "Failed to preview coupon");
      }
      setPreviewResult(response.data);
    } catch (err) {
      setPreviewResult(null);
      setError(err.message || "Unable to preview coupon");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Coupons</h1>
        <p className="text-slate-600">Create, activate, and preview marketing coupons</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleCreate} className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Create Coupon</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => handleChange("code", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="EXPRESS10"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="10% Express Discount"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-700">Type</label>
              <select
                value={form.discount_type}
                onChange={(e) => handleChange("discount_type", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="FLAT">Flat</option>
                <option value="PERCENT">Percent</option>
                <option value="BONUS">Recharge Bonus</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Value</label>
              <input
                type="number"
                min="0"
                value={form.value}
                onChange={(e) => handleChange("value", Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Max Discount</label>
              <input
                type="number"
                min="0"
                value={form.max_discount}
                onChange={(e) => handleChange("max_discount", Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-700">Min Order Value</label>
              <input
                type="number"
                min="0"
                value={form.min_order_value}
                onChange={(e) => handleChange("min_order_value", Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Usage Limit</label>
              <input
                type="number"
                min="0"
                value={form.usage_limit}
                onChange={(e) => handleChange("usage_limit", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Per User Limit</label>
              <input
                type="number"
                min="0"
                value={form.per_user_limit}
                onChange={(e) => handleChange("per_user_limit", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="Unlimited"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Applies To</label>
              <select
                value={form.applicable_on}
                onChange={(e) => handleChange("applicable_on", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="SHIPMENT">Shipment</option>
                <option value="RECHARGE">Recharge</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {creating ? "Saving..." : "Create Coupon"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <form onSubmit={handlePreview} className="rounded-lg border border-blue-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Preview Coupon</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Customer ID</label>
              <input
                type="text"
                value={previewInput.customer_id}
                onChange={(e) => setPreviewInput((prev) => ({ ...prev, customer_id: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Coupon Code</label>
              <input
                type="text"
                value={previewInput.coupon_code}
                onChange={(e) => setPreviewInput((prev) => ({ ...prev, coupon_code: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Order Amount</label>
              <input
                type="number"
                min="0"
                value={previewInput.amount}
                onChange={(e) => setPreviewInput((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Context</label>
              <select
                value={previewInput.context}
                onChange={(e) => setPreviewInput((prev) => ({ ...prev, context: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="SHIPMENT">Shipment</option>
                <option value="RECHARGE">Recharge</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg border border-blue-600 px-6 py-3 text-blue-700 font-semibold hover:bg-blue-50"
          >
            Preview Discount
          </button>
          {previewResult && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                Discount Amount: <span className="font-semibold">₹{(previewResult.discount || previewResult.bonus || 0).toFixed(2)}</span>
              </p>
              {previewResult.bonus > 0 && (
                <p className="text-xs text-blue-600 mt-1">Bonus will be credited on recharge</p>
              )}
            </div>
          )}
        </form>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Active Coupons</h2>
            <p className="text-sm text-slate-500">Manage usage caps and validity</p>
          </div>
          {loading && <p className="text-sm text-slate-500">Refreshing...</p>}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Usage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No coupons available
                  </td>
                </tr>
              )}
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{coupon.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{coupon.discount_type}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">₹{Number(coupon.value).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {coupon.usage_limit ? `${coupon.usage_limit} total` : "Unlimited"}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">
                    <span
                      className={
                        coupon.status === "ACTIVE"
                          ? "text-emerald-600"
                          : "text-slate-500"
                      }
                    >
                      {coupon.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleStatus(coupon)}
                      type="button"
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {coupon.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
