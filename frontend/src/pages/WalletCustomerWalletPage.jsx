import { useState } from "react";
import { walletService } from "../services/walletService.js";

export default function WalletCustomerWalletPage() {
  const [customerId, setCustomerId] = useState("");
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const fetchWalletData = async () => {
    if (!customerId.trim()) {
      setError("Enter a customer ID");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [summaryRes, txRes] = await Promise.all([
        walletService.getSummary(customerId.trim()),
        walletService.getTransactions(customerId.trim()),
      ]);
      if (!summaryRes.success) {
        throw new Error(summaryRes.message || "Failed to fetch wallet summary");
      }
      if (!txRes.success) {
        throw new Error(txRes.message || "Failed to fetch transactions");
      }
      setSummary(summaryRes.data);
      setTransactions(txRes.data.data || []);
      setPagination(txRes.data.pagination || null);
    } catch (err) {
      setError(err.message || "Unable to fetch wallet data");
      setSummary(null);
      setTransactions([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!customerId.trim()) {
      setError("Enter a customer ID to download ledger");
      return;
    }
    setDownloading(true);
    setError("");
    try {
      const blob = await walletService.downloadLedger(customerId.trim());
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${customerId.trim()}-wallet-ledger.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to download ledger");
    } finally {
      setDownloading(false);
    }
  };

  const balance = summary?.wallet?.balance || 0;
  const totalCredits = summary?.totals?.total_credits || 0;
  const totalDebits = summary?.totals?.total_debits || 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Customer Wallet</h1>
        <p className="text-slate-600">Real-time balance, ledger, and recharge history</p>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm space-y-6">
        <div className="grid gap-4 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Customer ID</label>
            <input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              placeholder="Enter customer ID"
            />
          </div>
          <div className="flex items-end gap-3 md:col-span-3">
            <button
              onClick={fetchWalletData}
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Fetch Wallet"}
            </button>
            <button
              onClick={handleDownload}
              disabled={!summary || downloading}
              className="rounded-lg border border-emerald-600 px-6 py-3 text-emerald-700 font-semibold hover:bg-emerald-50 disabled:opacity-50"
            >
              {downloading ? "Preparing..." : "Download Ledger"}
            </button>
          </div>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
            <p className="text-sm text-emerald-700 font-semibold">Current Balance</p>
            <p className="mt-3 text-3xl font-bold text-emerald-900">₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
            <p className="text-sm text-blue-700 font-semibold">Total Credits</p>
            <p className="mt-3 text-3xl font-bold text-blue-900">₹{totalCredits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm">
            <p className="text-sm text-rose-700 font-semibold">Total Debits</p>
            <p className="mt-3 text-3xl font-bold text-rose-900">₹{totalDebits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
            <p className="text-sm text-slate-500">Last 20 ledger entries</p>
          </div>
          {pagination && (
            <p className="text-sm text-slate-500">
              Showing {transactions.length} of {pagination.total}
            </p>
          )}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Reference</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Closing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    {summary ? "No transactions found" : "Search for a customer to view ledger"}
                  </td>
                </tr>
              )}
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">
                    <span
                      className={
                        tx.type === "CREDIT"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{tx.source}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{tx.reference_id || "-"}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold">
                    {tx.type === "DEBIT" ? "-" : ""}₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-700">
                    ₹{tx.closing_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
