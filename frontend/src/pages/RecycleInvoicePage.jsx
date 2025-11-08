import { useState, useEffect } from "react";
import axios from "axios";
import { FileText, RotateCcw } from "lucide-react";

export default function RecycleInvoicePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  useEffect(() => {
    fetchRecycledInvoices();
  }, [currentPage, recordsPerPage]);

  const fetchRecycledInvoices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/invoices/recycle/list`,
        {
          params: {
            page: currentPage,
            limit: recordsPerPage,
            search: searchTerm,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setData(response.data.data.invoices || []);
      setPagination(response.data.data.pagination || {});
    } catch (error) {
      console.error("Error fetching recycled invoices:", error);
      alert("Failed to load recycled invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRecycledInvoices();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm("Are you sure you want to restore this invoice?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/invoices/${id}`,
        { status: "draft" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Invoice restored successfully");
      fetchRecycledInvoices();
    } catch (error) {
      console.error("Error restoring invoice:", error);
      alert("Failed to restore invoice");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg p-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-amber-500 rounded-lg p-3">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Recycled Invoices</h1>
                <p className="text-amber-100">View and restore deleted invoices</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">

        {/* Records Per Page and Search */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <select
              value={recordsPerPage}
              onChange={(e) => {
                setRecordsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-slate-600">records per page</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Invoice No or Customer ID"
              className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg mb-4">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700">
                <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                  Sr.No
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                  Invoice No
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                  Customer ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                  Invoice Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                  Net Amount
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No data available in table
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {(currentPage - 1) * recordsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {row.invoice_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {row.customer_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {new Date(row.invoice_date).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    ₹{Number(row.net_amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleRestore(row.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all text-sm font-medium shadow-md hover:shadow-lg"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

        {/* Pagination Info */}
        <div className="flex justify-between items-center border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-600">
            Showing{" "}
            {data.length === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1} to{" "}
            {Math.min(currentPage * recordsPerPage, pagination.total)} of{" "}
            {pagination.total} entries
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(pagination.pages, prev + 1))
              }
              disabled={currentPage === pagination.pages || data.length === 0}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
