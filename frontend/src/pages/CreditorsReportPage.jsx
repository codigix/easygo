import { useState, useEffect } from "react";
import axios from "axios";
import { User, Calendar, FileText, TrendingUp, DollarSign, AlertCircle, Search } from "lucide-react";

export default function CreditorsReportPage() {
  const [filters, setFilters] = useState({
    customerId: "",
    fromDate: "",
    toDate: "",
    status: "All",
    invoiceType: "All",
  });

  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({ total: 0, paid: 0, balance: 0 });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/reports/creditors`,
        {
          params: filters,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReportData(response.data.data || []);
      setSummary(response.data.summary || { total: 0, paid: 0, balance: 0 });
    } catch (error) {
      console.error("Error fetching creditors report:", error);
      alert("Failed to load creditors report");
    } finally {
      setLoading(false);
    }
  };

  const handleShow = () => {
    setCurrentPage(1);
    fetchReport();
  };

  const handleExportToExcel = () => {
    alert("Export to Excel - Feature coming soon!");
  };

  const filteredData = reportData.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Creditor's Report</h1>
        </div>
        <p className="text-slate-600 ml-13">Track and manage outstanding amounts from your creditors</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-50 p-6 rounded-xl mb-6 border border-slate-200">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <User className="w-4 h-4 mr-2 text-slate-500" />
            Customer ID
          </label>
          <input
            type="text"
            name="customerId"
            value={filters.customerId}
            onChange={handleFilterChange}
            placeholder="Enter customer ID"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <Calendar className="w-4 h-4 mr-2 text-slate-500" />
            From Date
          </label>
          <input
            type="date"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <Calendar className="w-4 h-4 mr-2 text-slate-500" />
            To Date
          </label>
          <input
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <TrendingUp className="w-4 h-4 mr-2 text-slate-500" />
            Status
          </label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          >
            <option value="All">All</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Partial">Partial</option>
          </select>
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <FileText className="w-4 h-4 mr-2 text-slate-500" />
            Invoice Type
          </label>
          <select
            name="invoiceType"
            value={filters.invoiceType}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          >
            <option value="All">All</option>
            <option value="GST">GST</option>
            <option value="Non-GST">Non-GST</option>
          </select>
        </div>
      </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleShow}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium"
        >
          Show Report
        </button>
        <button
          onClick={handleExportToExcel}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md font-medium"
        >
          Export to Excel
        </button>
      </div>

      {/* Records Per Page and Search */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <select
            value={recordsPerPage}
            onChange={(e) => {
              setRecordsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-slate-600 font-medium">records per page</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-300">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="bg-transparent outline-none text-sm w-48"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-200">
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Sr No.
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Invoice ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Paid Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Invoice Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Due Days
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="10"
                  className="px-6 py-8 text-center text-slate-500"
                >
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan="10"
                  className="px-6 py-8 text-center text-slate-500"
                >
                  No data available in table
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {row.invoice_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {row.customer_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {row.invoice_type}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                    ₹{Number(row.total_amount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm text-emerald-700 font-semibold">
                    ₹{Number(row.paid_amount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-700 font-semibold">
                    ₹{Number(row.balance_amount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        row.payment_status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : row.payment_status === "partial"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {row.payment_status || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {new Date(row.invoice_date).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {row.due_days}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Info */}
      <div className="flex justify-between items-center mb-8">
        <div className="text-sm text-slate-600 font-medium">
          Showing {filteredData.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(endIndex, filteredData.length)} of {filteredData.length}{" "}
          entries
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages || filteredData.length === 0}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="px-6 py-5 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Amount</span>
              <span className="block font-bold text-2xl text-blue-900 mt-1">
                ₹{Number(summary.total || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="px-6 py-5 bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Paid Amount</span>
              <span className="block font-bold text-2xl text-emerald-900 mt-1">
                ₹{Number(summary.paid || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-12 h-12 bg-emerald-200 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="px-6 py-5 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Balance</span>
              <span className="block font-bold text-2xl text-red-900 mt-1">
                ₹{Number(summary.balance || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-12 h-12 bg-red-200 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
