import { useEffect, useState } from "react";
import { walletService } from "../services/walletService.js";

const defaultForm = {
  rule_name: "",
  rule_type: "CUSTOMER",
  applies_to: "SHIPMENT",
  discount_type: "PERCENT",
  value: 5,
  max_discount: 0,
  priority: 100,
  status: "ACTIVE",
  description: "",
  condition_json: "{\n  \"customer_ids\": [],\n  \"customer_tiers\": [],\n  \"service_types\": []\n}",
};

const previewDefaults = {
  amount: 500,
  customer_id: "",
  customer_tier: "",
  service_type: "",
  from_pincode: "",
  to_pincode: "",
};

const ruleTypes = [
  { label: "Customer", value: "CUSTOMER" },
  { label: "Route", value: "ROUTE" },
  { label: "Volume", value: "VOLUME" },
  { label: "SLA", value: "SLA" },
];

const discountTypes = [
  { label: "Percent", value: "PERCENT" },
  { label: "Flat", value: "FLAT" },
];

const appliesToOptions = [
  { label: "Shipment", value: "SHIPMENT" },
  { label: "Recharge", value: "RECHARGE" },
];

const statusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

export default function WalletDiscountRulesPage() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewInput, setPreviewInput] = useState(previewDefaults);
  const [previewResult, setPreviewResult] = useState(null);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await walletService.getDiscountRules();
      if (!response.success) {
        throw new Error(response.message || "Failed to load discount rules");
      }
      setRules(response.data || []);
    } catch (err) {
      setError(err.message || "Unable to load discount rules");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.rule_name.trim()) {
      setError("Rule name is required");
      return;
    }
    const payload = {
      rule_name: form.rule_name.trim(),
      rule_type: form.rule_type,
      applies_to: form.applies_to,
      discount_type: form.discount_type,
      value: Number(form.value) || 0,
      max_discount: Number(form.max_discount) || 0,
      priority: Number(form.priority) || 100,
      status: form.status,
      description: form.description.trim() || null,
      condition_json: {},
    };
    if (form.condition_json.trim()) {
      try {
        payload.condition_json = JSON.parse(form.condition_json);
      } catch (err) {
        setError("Condition JSON is invalid");
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await walletService.updateDiscountRule(editingId, payload);
      } else {
        await walletService.createDiscountRule(payload);
      }
      setForm(defaultForm);
      setEditingId(null);
      await loadRules();
    } catch (err) {
      setError(err.message || "Unable to save discount rule");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rule) => {
    setEditingId(rule.id);
    setError("");
    setForm({
      rule_name: rule.rule_name || "",
      rule_type: rule.rule_type || defaultForm.rule_type,
      applies_to: rule.applies_to || defaultForm.applies_to,
      discount_type: rule.discount_type || defaultForm.discount_type,
      value: Number(rule.value || 0),
      max_discount: Number(rule.max_discount || 0),
      priority: Number(rule.priority || 100),
      status: rule.status || defaultForm.status,
      description: rule.description || "",
      condition_json: JSON.stringify(rule.condition_json || {}, null, 2),
    });
  };

  const handleReset = () => {
    setEditingId(null);
    setForm(defaultForm);
    setError("");
  };

  const handlePreviewChange = (field, value) => {
    setPreviewInput((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreview = async (event) => {
    event.preventDefault();
    if (!previewInput.amount) {
      setPreviewError("Amount is required");
      return;
    }
    setPreviewError("");
    setPreviewResult(null);
    try {
      const response = await walletService.evaluateDiscountRule({
        ...previewInput,
        amount: Number(previewInput.amount) || 0,
      });
      if (!response.success) {
        throw new Error(response.message || "Failed to evaluate rules");
      }
      setPreviewResult(response.data ?? {});
    } catch (err) {
      setPreviewError(err.message || "Unable to evaluate rules");
    }
  };

  const formatDiscount = (rule) => {
    if (rule.discount_type === "PERCENT") {
      return `${Number(rule.value || 0).toFixed(2)}%`;
    }
    return `₹${Number(rule.value || 0).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Discount Rules</h1>
        <p className="text-slate-600">Automate pricing adjustments for premium customers, routes, and SLA events</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Edit Rule" : "Create Rule"}</h2>
            {editingId && (
              <button type="button" onClick={handleReset} className="text-sm font-semibold text-emerald-700 hover:underline">
                Cancel Edit
              </button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Rule Name</label>
              <input
                type="text"
                value={form.rule_name}
                onChange={(e) => handleFormChange("rule_name", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="Platinum Tier 8%"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Rule Type</label>
              <select
                value={form.rule_type}
                onChange={(e) => handleFormChange("rule_type", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                {ruleTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-700">Applies To</label>
              <select
                value={form.applies_to}
                onChange={(e) => handleFormChange("applies_to", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                {appliesToOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Discount Type</label>
              <select
                value={form.discount_type}
                onChange={(e) => handleFormChange("discount_type", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                {discountTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Priority</label>
              <input
                type="number"
                min="1"
                value={form.priority}
                onChange={(e) => handleFormChange("priority", Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-700">Value</label>
              <input
                type="number"
                min="0"
                value={form.value}
                onChange={(e) => handleFormChange("value", Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Max Discount</label>
              <input
                type="number"
                min="0"
                value={form.max_discount}
                onChange={(e) => handleFormChange("max_discount", Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => handleFormChange("status", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              placeholder="Auto discount for platinum customers"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Conditions JSON</label>
            <textarea
              rows={6}
              value={form.condition_json}
              onChange={(e) => handleFormChange("condition_json", e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 font-mono text-sm focus:border-emerald-500 focus:outline-none"
            />
            <p className="mt-2 text-xs text-slate-500">Use fields like customer_ids, customer_tiers, service_types, routes, min_amount, max_amount</p>
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : editingId ? "Update Rule" : "Create Rule"}
          </button>
        </form>

        <form onSubmit={handlePreview} className="rounded-lg border border-blue-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Evaluate Discount Rule</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Amount</label>
              <input
                type="number"
                min="0"
                value={previewInput.amount}
                onChange={(e) => handlePreviewChange("amount", Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Customer ID</label>
              <input
                type="text"
                value={previewInput.customer_id}
                onChange={(e) => handlePreviewChange("customer_id", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-700">Customer Tier</label>
              <input
                type="text"
                value={previewInput.customer_tier}
                onChange={(e) => handlePreviewChange("customer_tier", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="GOLD"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Service Type</label>
              <input
                type="text"
                value={previewInput.service_type}
                onChange={(e) => handlePreviewChange("service_type", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="EXPRESS"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">From Pincode</label>
              <input
                type="text"
                value={previewInput.from_pincode}
                onChange={(e) => handlePreviewChange("from_pincode", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">To Pincode</label>
            <input
              type="text"
              value={previewInput.to_pincode}
              onChange={(e) => handlePreviewChange("to_pincode", e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {previewError && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{previewError}</p>}
          <button
            type="submit"
            className="rounded-lg border border-blue-600 px-6 py-3 text-blue-700 font-semibold hover:bg-blue-50"
          >
            Evaluate Rules
          </button>
          {previewResult && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-1">
              {previewResult?.rule ? (
                <>
                  <p className="text-sm text-blue-800">Best Match: <span className="font-semibold">{previewResult.rule.rule_name}</span></p>
                  <p className="text-sm text-blue-800">Discount Amount: <span className="font-semibold">₹{Number(previewResult.discount || 0).toFixed(2)}</span></p>
                </>
              ) : (
                <p className="text-sm text-blue-800">No applicable discount rules for this scenario</p>
              )}
            </div>
          )}
        </form>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Configured Rules</h2>
            <p className="text-sm text-slate-500">Sorted by priority. Highest discount wins.</p>
          </div>
          {loading && <p className="text-sm text-slate-500">Refreshing...</p>}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Conditions</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                    {loading ? "Loading rules..." : "No discount rules configured"}
                  </td>
                </tr>
              )}
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{rule.rule_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{rule.rule_type}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDiscount(rule)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{rule.priority}</td>
                  <td className="px-4 py-3 text-sm font-semibold">
                    <span className={rule.status === "ACTIVE" ? "text-emerald-600" : "text-slate-500"}>{rule.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">
                    <pre className="whitespace-pre-line break-words">
                      {JSON.stringify(rule.condition_json || {}, null, 2)}
                    </pre>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleEdit(rule)}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Edit
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
