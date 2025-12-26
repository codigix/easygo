import { useState } from "react";
import { walletService } from "../services/walletService.js";

const presetAmounts = [500, 1000, 2500, 5000];
const paymentOptions = [
  { label: "UPI", value: "UPI" },
  { label: "Card", value: "CARD" },
  { label: "Netbanking", value: "NETBANKING" },
];

export default function WalletRechargePage() {
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState(1000);
  const [gstPercent, setGstPercent] = useState(18);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [gateway, setGateway] = useState("Razorpay");
  const [intent, setIntent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePreset = (value) => {
    setAmount(value);
  };

  const createIntent = async () => {
    if (!customerId.trim() || !amount || Number(amount) <= 0) {
      setError("Enter customer ID and a valid amount");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await walletService.createRechargeIntent({
        customer_id: customerId.trim(),
        amount: Number(amount),
        gst_percent: Number(gstPercent),
        payment_method: paymentMethod,
        gateway,
      });
      if (!response.success) {
        throw new Error(response.message || "Failed to create recharge intent");
      }
      setIntent(response.data);
      await loadHistory();
    } catch (err) {
      setError(err.message || "Unable to create recharge intent");
      setIntent(null);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!customerId.trim()) {
      setError("Enter customer ID to load history");
      return;
    }
    setHistoryLoading(true);
    setError("");
    try {
      const response = await walletService.getRechargeHistory(customerId.trim());
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch history");
      }
      setHistory(response.data || []);
    } catch (err) {
      setError(err.message || "Unable to fetch recharge history");
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const netAmount = intent?.net_amount || 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Wallet Recharge</h1>
        <p className="text-slate-600">Create gateway-ready recharge intents with GST breakup</p>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">Customer ID</label>
            <input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. CUST001"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Payment Gateway</label>
            <input
              type="text"
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-semibold text-slate-700">Recharge Amount (₹)</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {presetAmounts.map((value) => (
                <button
                  key={value}
                  onClick={() => handlePreset(value)}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                    amount === value
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  ₹{value}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">GST %</label>
            <input
              type="number"
              min="0"
              value={gstPercent}
              onChange={(e) => setGstPercent(Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
            >
              {paymentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={createIntent}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Recharge"}
          </button>
          <button
            onClick={loadHistory}
            disabled={historyLoading}
            className="rounded-lg border border-emerald-600 px-6 py-3 text-emerald-700 font-semibold hover:bg-emerald-50 disabled:opacity-50"
          >
            {historyLoading ? "Loading..." : "Refresh History"}
          </button>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      </div>

      {intent && (
        <div className="rounded-lg border border-blue-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recharge Intent</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Order Reference</p>
              <p className="mt-2 font-semibold text-slate-900">{intent.order_reference}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Base Amount</p>
              <p className="mt-2 text-lg font-bold text-slate-900">₹{intent.amount.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">GST</p>
              <p className="mt-2 text-lg font-bold text-slate-900">₹{intent.gst_amount.toFixed(2)} ({intent.tax_percent}%)</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Total Payable</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">₹{netAmount.toFixed(2)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Share the order reference with the gateway. Wallet will be credited when the payment success webhook lands.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recharge History</h2>
            <p className="text-sm text-slate-500">Latest transactions for customer</p>
          </div>
          {customerId && (
            <p className="text-sm text-slate-500">Customer: {customerId.trim()}</p>
          )}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Order Ref</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Wallet Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    {historyLoading ? "Loading history..." : "No recharge records"}
                  </td>
                </tr>
              )}
              {history.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{entry.order_reference}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{entry.payment_method || entry.gateway || "-"}</td>
                  <td className="px-4 py-3 text-sm font-semibold">
                    <span
                      className={
                        entry.status === "SUCCESS"
                          ? "text-emerald-600"
                          : entry.status === "FAILED"
                          ? "text-rose-600"
                          : "text-slate-600"
                      }
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold">
                    ₹{Number(entry.net_amount || entry.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-500">
                    {entry.wallet_transaction_id || "-"}
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
