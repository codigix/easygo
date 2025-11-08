import { useState } from "react";
import axios from "axios";
import { AlertCircle, Calendar, Download, TrendingUp, DollarSign, TrendingDown } from "lucide-react";

export default function CashCreditorsReportPage() {
  const [formData, setFormData] = useState({
    fromDate: "",
    toDate: "",
  });
  const [creditorsData, setCreditorsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [summary, setSummary] = useState({
    totalAmount: 0,
    paidAmount: 0,
    balanceAmount: 0,
  });

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    await fetchCreditorsReport(1);
  };

  const fetchCreditorsReport = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/reports/creditors-report`,
        {
          params: {
            fromDate: formData.fromDate,
            toDate: formData.toDate,
            search: searchText,
            page,
            limit: pagination.limit,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setCreditorsData(response.data.data);
        setSummary(
          response.data.summary || {
            totalAmount: 0,
            paidAmount: 0,
            balanceAmount: 0,
          }
        );
        setPagination({
          page,
          limit: pagination.limit,
          total: response.data.pagination?.total || response.data.total || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching creditors report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/reports/creditors-report/export`,
        {
          params: {
            fromDate: formData.fromDate,
            toDate: formData.toDate,
            search: searchText,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "creditors_report.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  const handlePageChange = (page) => {
    setPagination({ ...pagination, page });
    fetchCreditorsReport(page);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-lg bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-red-600 p-3">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900">
                  Cash Creditors Report
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Track creditor balances and payment status
                </p>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="border-b border-slate-200 p-6 bg-slate-50">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
                {/* From Date */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    From Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      name="fromDate"
                      value={formData.fromDate}
                      onChange={handleDateChange}
                      className="w-full rounded-lg border border-slate-300 px-10 py-2.5 text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
                    />
                  </div>
                </div>

                {/* To Date */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    To Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      name="toDate"
                      value={formData.toDate}
                      onChange={handleDateChange}
                      className="w-full rounded-lg border border-slate-300 px-10 py-2.5 text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 md:col-span-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-gradient-to-r from-red-600 to-orange-600 px-6 py-2.5 font-medium text-white hover:from-red-700 hover:to-orange-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={handleExportToExcel}
                    className="rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-2.5 font-medium text-white hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Controls Section */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-4">
              <label className="text-sm text-slate-600">
                Records per page:
              </label>
              <select
                value={pagination.limit}
                onChange={(e) => {
                  setPagination({
                    ...pagination,
                    limit: Number(e.target.value),
                    page: 1,
                  });
                }}
                className="rounded border border-slate-300 px-3 py-1 text-sm"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Search:</label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search..."
                className="rounded border border-slate-300 px-3 py-1 text-sm"
              />
            </div>
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-slate-600">Loading...</div>
              </div>
            ) : creditorsData.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="text-slate-600">No data available in table</div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Sr.No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Consignment No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Sender Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Sender Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Receiver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Receiver Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Destination Pincode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Booking Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Paid Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Balance Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {creditorsData.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-200 hover:bg-slate-50"
                    >
                      <td className="px-6 py-3 text-sm text-slate-900">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <button className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700">
                          Print
                        </button>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-900">
                        {row.consignment_number || "-"}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-900">
                        {row.sender_name || "-"}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-900">
                        {row.sender_phone || "-"}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-900">
                        {row.receiver || "-"}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-900">
                        {row.receiver_phone || "-"}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-900">
                        {row.destination_pincode || "-"}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-900">
                        {row.booking_date
                          ? new Date(row.booking_date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-slate-900">
                        ₹{parseFloat(row.amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-slate-900">
                        ₹{parseFloat(row.paid_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-slate-900">
                        ₹
                        {parseFloat(
                          (row.amount || 0) - (row.paid_amount || 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <div className="text-sm text-slate-600">
              Showing 0 to {creditorsData.length} of {pagination.total} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handlePageChange(Math.max(1, pagination.page - 1))
                }
                disabled={pagination.page === 1}
                className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  handlePageChange(
                    Math.min(
                      Math.ceil(pagination.total / pagination.limit) || 1,
                      pagination.page + 1
                    )
                  )
                }
                disabled={
                  pagination.page ===
                  Math.ceil(pagination.total / pagination.limit)
                }
                className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {/* Summary Section */}
          <div className="border-t border-slate-200 bg-gradient-to-r from-red-50 to-orange-50 px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Amount */}
              <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-100">Total Amount</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      ₹{summary.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-200 opacity-50" />
                </div>
              </div>

              {/* Paid Amount */}
              <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-100">Paid Amount</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      ₹{summary.paidAmount.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-200 opacity-50" />
                </div>
              </div>

              {/* Balance Amount */}
              <div className="rounded-lg bg-gradient-to-br from-red-500 to-red-600 p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-100">Balance Amount</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      ₹{summary.balanceAmount.toFixed(2)}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-200 opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
