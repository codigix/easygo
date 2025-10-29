import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Printer, CheckCircle2 } from "lucide-react";

export default function CheckBookingListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    customer_id: "",
    from_date: "",
    to_date: "",
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleShow = async () => {
    setError("");

    if (!filters.from_date || !filters.to_date) {
      setError("From Date and To Date are required!");
      return;
    }

    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      console.log(
        "Fetching from:",
        `${import.meta.env.VITE_API_URL}/bookings/filter?${query}`
      );

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/filter?${query}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        setError(`API Error: ${data.message || "Failed to fetch bookings"}`);
        setBookings([]);
        return;
      }

      if (data.success) {
        setBookings(data.data.bookings || []);
        if (!data.data.bookings || data.data.bookings.length === 0) {
          setError("No bookings found for the selected criteria.");
        }
      } else {
        setError(data.message || "Failed to fetch bookings");
        setBookings([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError(`Error: ${error.message}`);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      [
        "Sr No",
        "Customer Id",
        "Consignment no",
        "Weight",
        "Quantity",
        "Destination",
        "Pincode",
        "Address",
        "Type",
        "Mode",
        "Amount",
        "Booking Date",
        "Insurance",
        "Bill Amount",
        "Percentage",
        "Risk surcharge",
        "Other Charges",
      ],
      ...bookings.map((b, i) => [
        i + 1,
        b.customer_id,
        b.consignment_number,
        b.char_wt,
        b.qty,
        b.destination,
        b.pincode,
        b.address,
        b.type,
        b.mode,
        b.amount,
        b.booking_date,
        b.insurance,
        b.bill_amount,
        b.percentage,
        b.risk_surcharge,
        b.other_charges,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "booking_list.csv";
    a.click();
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">
              Check Booking List
            </h1>
          </div>
          <p className="text-slate-600 ml-12">
            View and manage all bookings within a date range
          </p>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="grid grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Customer ID
              </label>
              <input
                type="text"
                name="customer_id"
                value={filters.customer_id}
                onChange={(e) =>
                  setFilters({ ...filters, customer_id: e.target.value })
                }
                placeholder="Optional"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                From Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="from_date"
                value={filters.from_date}
                onChange={(e) =>
                  setFilters({ ...filters, from_date: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                To Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="to_date"
                value={filters.to_date}
                onChange={(e) =>
                  setFilters({ ...filters, to_date: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleShow}
                disabled={loading}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 font-medium transition"
              >
                {loading ? "Loading..." : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={handleExport}
              disabled={bookings.length === 0}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:bg-slate-300 disabled:text-slate-500 font-medium transition"
            >
              <FileText className="h-4 w-4" /> Export CSV
            </button>
            <button
              onClick={handlePrint}
              disabled={bookings.length === 0}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center gap-2 disabled:bg-slate-300 disabled:text-slate-500 font-medium transition"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Sr No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Customer ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Consignment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Weight
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Destination
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Pincode
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Mode
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Booking Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Insurance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Bill Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Percentage
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Risk Surcharge
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Other Charges
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan="18"
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No bookings found. Use the filters above to search.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b, idx) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => navigate(`/booking/modify?id=${b.id}`)}
                          className="text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          View
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.customer_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.consignment_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.char_wt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.qty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.destination}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.pincode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.mode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.booking_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.insurance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.bill_amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.percentage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.risk_surcharge}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {b.other_charges}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {bookings.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-t border-slate-200">
              <div className="flex justify-end">
                <span className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold">
                  Total Records: {bookings.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
