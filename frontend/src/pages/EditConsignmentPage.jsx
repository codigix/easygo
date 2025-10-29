import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Edit3 } from "lucide-react";

export default function EditConsignmentPage() {
  const [searchParams] = useSearchParams();
  const bookingIdFromUrl = searchParams.get("id");

  const [filters, setFilters] = useState({
    customer_id: "",
    from_date: "",
    to_date: "",
  });

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleShow = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/filter?${query}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setBookings(data.data.bookings || []);
      } else {
        alert(data.message || "Failed to fetch bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (booking) => {
    setEditingId(booking.id);
    setEditForm(booking);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(editForm),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Booking updated successfully!");
        setEditingId(null);
        handleShow();
      } else {
        alert(data.message || "Failed to update booking");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("An error occurred");
    }
  };

  // Auto-load booking from URL parameter
  useEffect(() => {
    if (bookingIdFromUrl) {
      const fetchBooking = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/bookings/${bookingIdFromUrl}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          const data = await response.json();
          if (data.success && data.data) {
            setEditingId(bookingIdFromUrl);
            // Extract just the booking object, not the tracking
            setEditForm(data.data.booking || data.data);
          } else {
            alert("Failed to load booking");
          }
        } catch (error) {
          console.error("Error fetching booking:", error);
          alert("An error occurred while loading the booking");
        }
      };

      fetchBooking();
    }
  }, [bookingIdFromUrl]);

  const total = bookings.reduce(
    (sum, b) => sum + (parseFloat(b.total) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
              <Edit3 className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">
              Edit Consignment
            </h1>
          </div>
          <p className="text-slate-600 ml-12">
            Search and edit existing bookings and consignments
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="grid grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Customer ID
              </label>
              <input
                type="text"
                name="customer_id"
                value={filters.customer_id}
                onChange={handleFilterChange}
                placeholder="Optional"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleShow}
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:bg-emerald-300 transition"
            >
              {loading ? "Loading..." : "Show"}
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Sr No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                    Consignment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Weight
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Destination
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Pincode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Mode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Booking Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Insurance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Percentage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Risk surcharge
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Other Charge
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {bookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan="15"
                      className="px-4 py-8 text-center text-orange-600"
                    >
                      No data available in table
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking, idx) => (
                    <tr key={booking.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {booking.consignment_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {booking.char_wt}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {booking.destination}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {booking.pincode}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {booking.mode}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {booking.type}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {booking.amount}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {booking.booking_date}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {booking.insurance}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {booking.percentage}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {booking.risk_surcharge}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {booking.other_charges}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {booking.total}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleEdit(booking)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
          <div className="flex justify-end">
            <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md font-medium">
              Total: {total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Edit Consignment
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Customer ID
                </label>
                <input
                  type="text"
                  name="customer_id"
                  value={editForm.customer_id || ""}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Receiver
                </label>
                <input
                  type="text"
                  name="receiver"
                  value={editForm.receiver || ""}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={editForm.pincode || ""}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mode
                </label>
                <select
                  name="mode"
                  value={editForm.mode || ""}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="AR">AR</option>
                  <option value="SR">SR</option>
                  <option value="Express">Express</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
