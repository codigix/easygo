import { useState, useEffect } from "react";
import axios from "axios";
import { TrendingUp, TrendingDown, Search, BarChart3 } from "lucide-react";

export default function CustomerSalesComparisonPage() {
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({
    previousMonthTotal: 0,
    lastMonthTotal: 0,
    previousMonth: "August",
    lastMonth: "September",
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/reports/customer-sales-comparison`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReportData(response.data.data || []);
      setSummary(
        response.data.summary || {
          previousMonthTotal: 0,
          lastMonthTotal: 0,
          previousMonth: "August",
          lastMonth: "September",
        }
      );
    } catch (error) {
      console.error("Error fetching sales comparison:", error);
      alert("Failed to load sales comparison report");
    } finally {
      setLoading(false);
    }
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
          <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-cyan-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Customer Sales Comparison</h1>
        </div>
        <p className="text-slate-600 ml-13">Compare sales performance across months for your customers</p>
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
                Sr.No
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Company ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Company Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Previous Month ({summary.previousMonth})
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Last Month ({summary.lastMonth})
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Sales Difference
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                % Change
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="8"
                  className="px-6 py-8 text-center text-slate-500"
                >
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
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
                    {row.company_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {row.company_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                    ₹{Number(row.previous_month_sale || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                    ₹{Number(row.last_month_sale || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    <span className={Number(row.sales_difference || 0) >= 0 ? "text-emerald-700" : "text-red-700"}>
                      ₹{Number(row.sales_difference || 0).toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    <span className={Number(row.percentage_change || 0) >= 0 ? "text-emerald-700" : "text-red-700"}>
                      {row.percentage_change}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {row.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {page}
            </button>
          ))}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="px-6 py-5 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                {summary.previousMonth} Total Sale
              </span>
              <span className="block font-bold text-2xl text-blue-900 mt-1">
                ₹{Number(summary.previousMonthTotal || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="px-6 py-5 bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                {summary.lastMonth} Total Sale
              </span>
              <span className="block font-bold text-2xl text-emerald-900 mt-1">
                ₹{Number(summary.lastMonthTotal || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-12 h-12 bg-emerald-200 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
