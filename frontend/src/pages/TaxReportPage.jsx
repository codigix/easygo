import { useState } from "react";
import axios from "axios";
import { Calendar, FileText, DollarSign, Search, BarChart3, Download } from "lucide-react";

export default function TaxReportPage() {
  const [filters, setFilters] = useState({
    customerId: "",
    fromDate: "",
    toDate: "",
  });

  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({ netTotal: 0 });
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
        `${import.meta.env.VITE_API_URL}/reports/tax-report`,
        {
          params: filters,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReportData(response.data.data || []);
      setSummary(response.data.summary || { netTotal: 0 });
    } catch (error) {
      console.error("Error fetching tax report:", error);
      alert("Failed to load tax report");
    } finally {
      setLoading(false);
    }
  };

  const handleShow = () => {
    fetchReport();
  };

  const handleExportToExcel = () => {
    alert("Export to Excel - Feature coming soon!");
  };

  const handleTallyExcel = () => {
    alert("Tally Excel - Feature coming soon!");
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
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Tax Report</h1>
        </div>
        <p className="text-slate-600 ml-13">GST, surcharge, and tax calculations for invoices</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-50 p-6 rounded-xl mb-6 border border-slate-200">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <FileText className="w-4 h-4 mr-2 text-slate-500" />
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
            From Date <span className="text-red-500">*</span>
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
            To Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          />
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
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md font-medium flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </button>
        <button
          onClick={handleTallyExcel}
          className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all shadow-sm hover:shadow-md font-medium flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Tally Excel
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
                Sr.No
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Customer ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Invoice No
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Invoice Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Period From
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Period To
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Fuel Surcharge (%)
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Fuel Surcharge Total
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Royalty Charges
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Docket Charges
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Discount (%)
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Discount Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Subtotal
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                CGST
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="15"
                  className="px-6 py-8 text-center text-slate-500"
                >
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan="15"
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
                    {row.customer_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {row.invoice_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {new Date(row.invoice_date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {new Date(row.period_from).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {new Date(row.period_to).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                    ₹{Number(row.total_amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {row.fuel_surcharge_percent}%
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                    ₹{Number(row.fuel_surcharge_total).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                    ₹{Number(row.royalty_charge).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                    ₹{Number(row.docket_charge).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {row.discount_percent}%
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                    ₹{Number(row.discount_amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                    ₹{Number(row.subtotal_amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                    ₹{Number(row.cgst).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-2 mb-8">
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

      {/* Summary Card */}
      <div className="px-6 py-5 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Net Total</span>
            <span className="block font-bold text-2xl text-purple-900 mt-1">
              ₹{Number(summary.netTotal || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
