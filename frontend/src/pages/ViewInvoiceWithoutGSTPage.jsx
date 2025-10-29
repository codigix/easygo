import { useState } from "react";
import { Search, Eye, Edit, FileText } from "lucide-react";

export default function ViewInvoiceWithoutGSTPage() {
  const [filters, setFilters] = useState({
    company_name: "",
    from_date: "",
    to_date: "",
  });

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams({
        ...filters,
        without_gst: true,
        page: pagination.page,
        limit: pagination.limit,
      }).toString();

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/invoices?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setInvoices(data.data);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      alert("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id) => {
    alert(`View Invoice ID: ${id}`);
  };

  const handleEdit = (id) => {
    alert(`Edit Invoice ID: ${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
              <FileText className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">
                View Invoices (Without GST)
              </h1>
              <p className="text-slate-600">
                View and manage invoices without GST
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <div className="h-1 w-1 bg-amber-600 rounded-full"></div>
            Filter Invoices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                name="company_name"
                value={filters.company_name}
                onChange={handleFilterChange}
                placeholder="Enter company name"
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                name="from_date"
                value={filters.from_date}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                name="to_date"
                value={filters.to_date}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium disabled:bg-amber-300 transition"
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <select
                value={pagination.limit}
                onChange={(e) =>
                  setPagination((prev) => ({
                    ...prev,
                    limit: Number(e.target.value),
                    page: 1,
                  }))
                }
                className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-sm text-slate-600">records per page</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Search:</span>
              <input
                type="text"
                placeholder="Search..."
                className="rounded-md border border-slate-300 px-3 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                    Invoice Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                    Customer Id
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                    Period From
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                    Period To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                    Fuel Surcharge(%)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                    Fuel Surcharge Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                    Discount(%)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                    Discount Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                    Other Charge
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                    Net Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {invoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan="12"
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No invoices found. Use filters and click Submit to search.
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {invoice.invoice_date}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {invoice.customer_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {invoice.period_from}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {invoice.period_to}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {invoice.total_amount}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {invoice.fuel_surcharge_percent}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {invoice.fuel_surcharge_total}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {invoice.discount_percent}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {invoice.discount_amount}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {invoice.other_charge}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                        {invoice.net_amount}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(invoice.id)}
                            className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(invoice.id)}
                            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-6 border-t border-slate-200">
            <div className="text-sm text-slate-600">
              Showing{" "}
              {Math.min(
                (pagination.page - 1) * pagination.limit + 1,
                pagination.total
              )}{" "}
              to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} entries
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                ← Previous
              </button>
              <button className="rounded-lg bg-amber-600 px-3 py-1 text-sm font-medium text-white">
                {pagination.page}
              </button>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: prev.page + 1,
                  }))
                }
                disabled={
                  pagination.page * pagination.limit >= pagination.total
                }
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
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
