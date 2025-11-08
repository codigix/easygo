import { useState } from "react";
import { User, DollarSign, Wallet, Printer, Search } from "lucide-react";

export default function CustomerCreditPage() {
  const [activeTab, setActiveTab] = useState("customer_id");
  const [customerId, setCustomerId] = useState("");
  const [creditData, setCreditData] = useState({
    total_credit: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleFetchCredit = async () => {
    if (!customerId.trim()) {
      alert("Please enter Customer ID");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/payments/customer-credit?customer_id=${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setCreditData(data.data);
      } else {
        alert(data.message || "Failed to fetch credit data");
      }
    } catch (error) {
      console.error("Error fetching credit:", error);
      alert("Failed to fetch customer credit");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Credit Inquiry</h1>
        <p className="text-slate-500 mt-2">View customer credit limit and available balance</p>
      </div>

      {/* Main Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab("customer_id")}
              className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === "customer_id"
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-800"
              }`}
            >
              <User className="h-4 w-4" />
              Look Up Customer
            </button>
            <button
              onClick={() => setActiveTab("total_credit")}
              className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === "total_credit"
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-800"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Total Credit
            </button>
            <button
              onClick={() => setActiveTab("last_balance")}
              className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === "last_balance"
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-800"
              }`}
            >
              <Wallet className="h-4 w-4" />
              Available Balance
            </button>
            <button
              onClick={handlePrint}
              className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === "print"
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-800"
              }`}
            >
              <Printer className="h-4 w-4" />
              Print Report
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {activeTab === "customer_id" && (
            <div className="space-y-8">
              <div className="max-w-2xl">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Customer ID
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="e.g., C12345"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleFetchCredit();
                      }
                    }}
                  />
                  <button
                    onClick={handleFetchCredit}
                    disabled={loading}
                    className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>

              {/* Display Results */}
              {customerId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                    <div className="inline-block rounded-lg bg-blue-600 p-3 mb-4">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-sm font-medium text-blue-700 mb-3">
                      Total Credit Limit
                    </div>
                    <div className="text-5xl font-bold text-blue-600">
                      ₹{(creditData.total_credit || 0).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                    <div className="inline-block rounded-lg bg-emerald-600 p-3 mb-4">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-sm font-medium text-emerald-700 mb-3">
                      Available Balance
                    </div>
                    <div className="text-5xl font-bold text-emerald-600">
                      ₹{(creditData.balance || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "total_credit" && (
            <div className="text-center py-16">
              {customerId && (
                <div className="inline-block">
                  <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-12 shadow-md">
                    <div className="inline-block rounded-lg bg-blue-600 p-4 mb-6">
                      <DollarSign className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-lg font-semibold text-blue-700 mb-6">
                      Total Credit Limit for {customerId}
                    </div>
                    <div className="text-6xl font-bold text-blue-600">
                      ₹{(creditData.total_credit || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              )}
              {!customerId && (
                <p className="text-slate-500">Please use the "Look Up Customer" tab to search first</p>
              )}
            </div>
          )}

          {activeTab === "last_balance" && (
            <div className="text-center py-16">
              {customerId && (
                <div className="inline-block">
                  <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-12 shadow-md">
                    <div className="inline-block rounded-lg bg-emerald-600 p-4 mb-6">
                      <Wallet className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-lg font-semibold text-emerald-700 mb-6">
                      Available Balance for {customerId}
                    </div>
                    <div className="text-6xl font-bold text-emerald-600">
                      ₹{(creditData.balance || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              )}
              {!customerId && (
                <p className="text-slate-500">Please use the "Look Up Customer" tab to search first</p>
              )}
            </div>
          )}

          {activeTab === "print" && (
            <div className="text-center py-16">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-3 rounded-lg bg-slate-600 px-10 py-4 text-base font-semibold text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg"
              >
                <Printer className="h-5 w-5" />
                Print Credit Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-6 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-shrink-0 text-blue-600 text-2xl">ℹ️</div>
          <div className="flex-1">
            <p className="font-semibold text-blue-900 mb-3">How to use this page:</p>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Enter a Customer ID in the "Look Up Customer" tab</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Click "Search" to fetch the customer's credit information</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Use the tabs to view total credit limit or available balance</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Generate a printable report using the "Print Report" tab</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
