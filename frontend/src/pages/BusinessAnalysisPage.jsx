import { useState } from "react";
import axios from "axios";
import { Calendar, BarChart3, TrendingUp, TrendingDown, Search } from "lucide-react";

export default function BusinessAnalysisPage() {
  const [filters, setFilters] = useState({
    customerId: "",
    fromDate: "",
    toDate: "",
  });

  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    dtdcTotal: 0,
    profitLoss: 0,
    profitLossPercent: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
        `${import.meta.env.VITE_API_URL}/reports/business-analysis`,
        {
          params: filters,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReportData(response.data.data || []);
      setSummary(
        response.data.summary || {
          total: 0,
          dtdcTotal: 0,
          profitLoss: 0,
          profitLossPercent: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching business analysis:", error);
      alert("Failed to load business analysis");
    } finally {
      setLoading(false);
    }
  };

  const handleShow = () => {
    fetchReport();
  };

  const filteredData = reportData.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Business Analysis</h1>
        </div>
        <p className="text-slate-600 ml-13">Track consignment performance and profitability metrics</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-50 p-6 rounded-xl mb-6 border border-slate-200">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
            <BarChart3 className="w-4 h-4 mr-2 text-slate-500" />
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

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={handleShow}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium"
          >
            Show Report
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex justify-end mb-6">
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
                Consignment No
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Booking Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Weight
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Destination
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                DTDC Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Profit/Loss (%)
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
            ) : filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="px-6 py-8 text-center text-slate-500"
                >
                  No data available in table
                </td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {row.consignment_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {new Date(row.booking_date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {row.weight} kg
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {row.destination}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                    ₹{Number(row.amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                    ₹{Number(row.dtdc_amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    <span className={row.profit_loss_percent >= 0 ? "text-emerald-700" : "text-red-700"}>
                      {row.profit_loss_percent}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="px-6 py-5 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total</span>
              <span className="block font-bold text-2xl text-blue-900 mt-1">
                ₹{Number(summary.total || 0).toLocaleString("en-IN")}
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
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">DTDC Total</span>
              <span className="block font-bold text-2xl text-emerald-900 mt-1">
                ₹{Number(summary.dtdcTotal || 0).toLocaleString("en-IN")}
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
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Profit/Loss</span>
              <span className="block font-bold text-2xl text-red-900 mt-1">
                ₹{Number(summary.profitLoss || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-12 h-12 bg-red-200 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="px-6 py-5 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Profit/Loss %</span>
              <span className="block font-bold text-2xl text-orange-900 mt-1">
                {Number(summary.profitLossPercent || 0).toFixed(2)}%
              </span>
            </div>
            <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
