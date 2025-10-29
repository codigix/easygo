import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const FranchiseListPage = () => {
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchFranchises();
  }, [pagination.page, statusFilter, searchTerm]);

  const fetchFranchises = async () => {
    try {
      setLoading(true);
      const response = await api.get("/franchises", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          status: statusFilter,
        },
      });

      if (response.data.success) {
        setFranchises(response.data.data.franchises);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching franchises:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this franchise?")) {
      try {
        await api.delete(`/franchises/${id}`);
        fetchFranchises();
      } catch (error) {
        alert(error.response?.data?.message || "Failed to delete franchise");
      }
    }
  };

  const handleStatusToggle = async (id, newStatus) => {
    try {
      await api.patch(`/franchises/${id}/status`, { status: newStatus });
      fetchFranchises();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">Franchisee Management</h1>
              <p className="text-emerald-100">
                Manage all your franchise partners
              </p>
            </div>
            <Link
              to="/franchises/create"
              className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 shadow-lg transition-all hover:shadow-xl"
            >
              + Add New Franchisee
            </Link>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-emerald-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Filter Options
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by code, name, email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Franchise List Card */}
        <div className="bg-white rounded-2xl shadow-md border border-emerald-100 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">
              Franchises
              {franchises.length > 0 && (
                <span className="text-emerald-600 ml-2">
                  ({pagination.total})
                </span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-slate-500">Loading...</div>
            </div>
          ) : franchises.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-500">No franchises found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-300 bg-gradient-to-r from-slate-50 to-slate-100">
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      FR Code
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Franchisee Name
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Owner Name
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {franchises.map((franchise) => (
                    <tr
                      key={franchise.id}
                      className="hover:bg-emerald-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {franchise.franchise_code}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {franchise.franchise_name}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {franchise.owner_name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {franchise.email}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {franchise.phone}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={franchise.status}
                          onChange={(e) =>
                            handleStatusToggle(franchise.id, e.target.value)
                          }
                          className={`px-3 py-1 text-xs font-medium rounded-full border-0 cursor-pointer ${
                            franchise.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : franchise.status === "inactive"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-3">
                          <Link
                            to={`/franchises/edit/${franchise.id}`}
                            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(franchise.id)}
                            className="text-red-600 hover:text-red-700 font-medium text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 flex justify-between items-center">
              <div className="text-sm text-slate-600">
                Showing {franchises.length} of {pagination.total} franchises
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  ← Previous
                </button>
                <span className="px-4 py-2 text-slate-700 font-medium">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FranchiseListPage;
