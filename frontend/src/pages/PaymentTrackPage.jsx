import { useState, useEffect } from "react";
import { Edit, Trash2, Calendar, User, Database } from "lucide-react";

export default function PaymentTrackPage() {
  const [filters, setFilters] = useState({
    customer_id: "",
    from_date: "",
    to_date: "",
  });

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totals, setTotals] = useState({
    net_total: 0,
    total: 0,
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleShow = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: recordsPerPage,
        search: searchTerm,
        ...filters,
      }).toString();

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/payments/track?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setPayments(data.data);
        setTotalRecords(data.pagination.total);
        setTotals(data.totals || { net_total: 0, total: 0 });
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      alert("Failed to fetch payment details");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payment) => {
    alert(`Edit payment for Invoice: ${payment.invoice_number}`);
  };

  const handleDelete = async (payment) => {
    if (!confirm(`Are you sure you want to delete this payment?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/payments/${payment.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Payment deleted successfully");
        handleShow(); // Refresh the list
      } else {
        alert(data.message || "Failed to delete payment");
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("Failed to delete payment");
    }
  };

  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Payment Details</h1>
        <p className="text-slate-500 mt-2">Track and manage all payment transactions</p>
      </div>

      {/* Filter Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Filter Payments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer ID
              </div>
            </label>
            <input
              type="text"
              name="customer_id"
              value={filters.customer_id}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="Enter customer ID"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                From Date
              </div>
            </label>
            <input
              type="date"
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                To Date
              </div>
            </label>
            <input
              type="date"
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleShow}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Database className="h-4 w-4" />
              {loading ? "Loading..." : "Search"}
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
                placeholder="Search payments..."
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">No.</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Invoice Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Customer ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Mode</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Remarks</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Payment Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Net Amount</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payments.length === 0 ? (
                <tr>
                  <td
                    colSpan="11"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-lg font-medium mb-2">No payments found</div>
                      <p className="text-sm">{loading ? "Loading payments..." : "Click 'Search' to load payment data"}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment, index) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {(currentPage - 1) * recordsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(payment)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(payment)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {payment.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(payment.invoice_date).toLocaleDateString(
                        "en-GB"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {payment.customer_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                        {payment.payment_mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {payment.notes ? (
                        <span className="max-w-xs truncate">{payment.notes}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(payment.payment_date).toLocaleDateString(
                        "en-GB"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">
                      ₹{(payment.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                      ₹{(payment.net_amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-red-600">
                      ₹{(payment.balance || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Totals */}
        {payments.length > 0 && (
          <>
            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-end gap-8">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                  Net Total
                </span>
                <span className="text-xl font-bold text-slate-900">
                  ₹{totals.net_total.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                  Total
                </span>
                <span className="text-xl font-bold text-slate-900">
                  ₹{totals.total.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Pagination */}
            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm font-medium text-slate-600">
                Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * recordsPerPage + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(currentPage * recordsPerPage, totalRecords)}</span> of <span className="font-semibold text-slate-900">{totalRecords}</span> entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        : "border border-slate-300 text-slate-600 hover:bg-slate-50"
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
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
