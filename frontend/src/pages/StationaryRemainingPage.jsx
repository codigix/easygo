import { useState, useEffect } from "react";
import api from "../services/api";
import { Info, Search, Boxes } from "lucide-react";

const StationaryRemainingPage = () => {
  const [selectedType, setSelectedType] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [consignments, setConsignments] = useState([]);
  const [filteredConsignments, setFilteredConsignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedConsignment, setSelectedConsignment] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchConsignments();
  }, []);

  useEffect(() => {
    filterConsignments();
  }, [consignments, selectedType, searchTerm]);

  const fetchConsignments = async () => {
    setLoading(true);
    try {
      const response = await api.get("/stationary/consignments");
      setConsignments(response.data.data || []);
    } catch (error) {
      console.error("Error fetching consignments:", error);
      alert("Failed to fetch stationary data");
    } finally {
      setLoading(false);
    }
  };

  const filterConsignments = () => {
    let filtered = [...consignments];

    // Filter by type
    if (selectedType !== "All") {
      filtered = filtered.filter((item) => item.type === selectedType);
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.start_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.end_no.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredConsignments(filtered);
    setCurrentPage(1);
  };

  const calculateExpiringIn = (receiptDate) => {
    const receipt = new Date(receiptDate);
    const today = new Date();
    const diffTime = receipt - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: "Expired", color: "text-red-600" };
    } else if (diffDays === 0) {
      return { text: "Today", color: "text-orange-600" };
    } else {
      return { text: `${diffDays} Days`, color: "text-gray-700" };
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this consignment?")) {
      return;
    }

    try {
      await api.delete(`/stationary/consignments/${id}`);
      alert("Consignment deleted successfully");
      fetchConsignments();
    } catch (error) {
      console.error("Error deleting consignment:", error);
      alert("Failed to delete consignment");
    }
  };

  const handleView = (consignment) => {
    setSelectedConsignment(consignment);
  };

  // Calculate summary
  const summary = {
    daysLeft: consignments.reduce((acc, item) => {
      const days = calculateExpiringIn(item.receipt_date);
      return days.text !== "Expired" ? acc + 1 : acc;
    }, 0),
    totalConsignments: consignments.reduce(
      (acc, item) => acc + item.remaining_consignments,
      0
    ),
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredConsignments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredConsignments.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
              <Boxes className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-slate-900">
                Remaining Stationary
              </h1>
              <p className="text-slate-500 mt-1">
                View and manage your stationary inventory
              </p>
            </div>
            <Info
              className="h-6 w-6 text-emerald-600 cursor-pointer hover:text-emerald-700 transition"
              title="View remaining stationary items"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">
                Filter by Type<span className="text-red-500">*</span>
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
              >
                <option value="All">All</option>
                <option value="DOX">DOX</option>
                <option value="NONDOX">NONDOX</option>
                <option value="EXPRESS">EXPRESS</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by start/end no..."
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Table */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700 text-left">
                      Receipt Date
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700 text-left">
                      Expiring in
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700 text-left">
                      Start No
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700 text-left">
                      End No
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700 text-center">
                      Total
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700 text-center">
                      Used
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700 text-center">
                      Remaining
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No data found
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((item) => {
                      const expiringInfo = calculateExpiringIn(
                        item.receipt_date
                      );
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50 transition"
                        >
                          <td className="px-4 py-3 text-sm text-slate-900">
                            {new Date(item.receipt_date).toLocaleDateString(
                              "en-GB"
                            )}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm font-medium ${expiringInfo.color}`}
                          >
                            {expiringInfo.text}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900">
                            {item.start_no}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900">
                            {item.end_no}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-slate-900 font-medium">
                            {item.total_consignments}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-slate-900 font-medium">
                            {item.used_consignments}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-emerald-600 font-semibold">
                            {item.remaining_consignments}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleView(item)}
                                className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-md hover:bg-emerald-200 transition font-medium"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-md hover:bg-red-200 transition font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 bg-slate-50 border-t border-slate-200">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-white disabled:opacity-50 transition"
                >
                  ← Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-2 rounded-lg text-sm transition ${
                      currentPage === i + 1
                        ? "bg-emerald-600 text-white font-medium"
                        : "border border-slate-300 text-slate-700 hover:bg-white"
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
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-white disabled:opacity-50 transition"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-slate-200">
              <div className="text-center">
                <div className="text-sm font-medium text-slate-600 mb-1">
                  Days left
                </div>
                <div className="text-3xl font-bold text-emerald-600">
                  {summary.daysLeft}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-slate-600 mb-1">
                  Total Consignments
                </div>
                <div className="text-3xl font-bold text-emerald-600">
                  {summary.totalConsignments}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4 text-center flex items-center justify-center gap-2">
                <span className="h-2 w-2 bg-emerald-600 rounded-full"></span>
                Consignment Details
              </h3>
              {selectedConsignment ? (
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-white rounded-lg border border-emerald-100">
                    <span className="font-medium text-slate-700">Start:</span>
                    <div className="text-emerald-600 font-semibold">
                      {selectedConsignment.start_no}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-emerald-100">
                    <span className="font-medium text-slate-700">End:</span>
                    <div className="text-emerald-600 font-semibold">
                      {selectedConsignment.end_no}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-emerald-100">
                    <span className="font-medium text-slate-700">Total:</span>
                    <div className="text-emerald-600 font-semibold">
                      {selectedConsignment.total_consignments}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-emerald-100">
                    <span className="font-medium text-slate-700">Used:</span>
                    <div className="text-slate-900 font-semibold">
                      {selectedConsignment.used_consignments}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-emerald-100">
                    <span className="font-medium text-slate-700">
                      Remaining:
                    </span>
                    <div className="text-emerald-600 font-semibold">
                      {selectedConsignment.remaining_consignments}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-slate-600 text-sm py-4">
                  Click "View" on a row to see details
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationaryRemainingPage;
