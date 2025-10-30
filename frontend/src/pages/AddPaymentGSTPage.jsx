import { useState, useEffect } from "react";
import { Info, TrendingUp, DollarSign, AlertCircle, Clock } from "lucide-react";

export default function AddPaymentGSTPage() {
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [summary, setSummary] = useState({
    paid_amount: 0,
    unpaid_amount: 0,
    total_sale: 0,
    partial_paid: 0,
  });

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/payments/invoice-summary?gst=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const handleShow = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: recordsPerPage,
        payment_status: paymentStatus,
        search: searchTerm,
        gst: "true",
      }).toString();

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/payments/invoice-list?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setInvoices(data.data);
        setTotalRecords(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      alert("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = (invoice) => {
    alert(`Add payment for Invoice: ${invoice.invoice_number}`);
  };

  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  const SummaryCard = ({ icon: Icon, label, amount, color, bgColor }) => (
    <div className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            ₹
            {amount.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className={`rounded-lg ${bgColor} p-3`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-bold text-slate-900">
            Add Payment (GST)
          </h1>
          <div className="group relative">
            <Info className="h-6 w-6 text-blue-500 cursor-help" />
            <div className="invisible group-hover:visible absolute left-0 bottom-full mb-2 w-48 bg-slate-900 text-white text-xs rounded-lg p-3 z-10">
              Manage and track GST invoice payments
            </div>
          </div>
        </div>
        <p className="text-slate-500">Track and manage all GST-applicable invoice payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={TrendingUp}
          label="Total Sale"
          amount={summary.total_sale}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <SummaryCard
          icon={DollarSign}
          label="Paid Amount"
          amount={summary.paid_amount}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <SummaryCard
          icon={AlertCircle}
          label="Unpaid Amount"
          amount={summary.unpaid_amount}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <SummaryCard
          icon={Clock}
          label="Partial Paid"
          amount={summary.partial_paid}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Filter Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Filter by Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            >
              <option value="All">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Unpaid</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          <div className="md:col-span-8 flex items-end">
            <button
              onClick={handleShow}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Load Invoices"}
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Show</span>
              <select
                value={recordsPerPage}
                onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-slate-600">entries</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all w-40"
                placeholder="Search invoices..."
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Customer ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Sub Total</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Fuel %</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Fuel Amt</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">GST %</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">GST Amt</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Net Amount</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan="12"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-lg font-medium mb-2">No invoices found</div>
                      <p className="text-sm">{loading ? "Loading invoices..." : "Click 'Load Invoices' to fetch data"}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleAddPayment(invoice)}
                        className="inline-flex rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        Add Payment
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {invoice.customer_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(invoice.invoice_date).toLocaleDateString(
                        "en-GB"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">
                      ₹{(invoice.sub_total || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                      {(invoice.fuel_surcharge_percent || 0).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">
                      ₹{(invoice.fuel_surcharge || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                      {(invoice.gst_percent || 0).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">
                      ₹{(invoice.gst_total || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                      ₹{(invoice.net_amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-emerald-600">
                      ₹{(invoice.paid_amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-red-600">
                      ₹{(invoice.balance || invoice.net_amount || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {invoices.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
            <div className="text-sm font-medium text-slate-600">
              Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * recordsPerPage + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(currentPage * recordsPerPage, totalRecords)}</span> of <span className="font-semibold text-slate-900">{totalRecords}</span> entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "border border-slate-300 text-slate-600 hover:bg-white"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
