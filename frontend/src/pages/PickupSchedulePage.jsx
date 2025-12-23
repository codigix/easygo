import React, { useState, useEffect } from "react";
import { pickupService } from "../services/pickupService";
import { AlertCircle, CheckCircle, Calendar, Clock } from "lucide-react";

export default function PickupSchedulePage() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [schedulingData, setSchedulingData] = useState({
    pickupDate: "",
    timeSlot: "Morning",
  });

  useEffect(() => {
    fetchPickups();
  }, []);

  const fetchPickups = async () => {
    setLoading(true);
    try {
      const response = await pickupService.getAll({
        status: "REQUESTED",
        limit: 50,
      });
      setPickups(response.data.pickups || []);
    } catch (err) {
      setError("Failed to fetch pickup requests");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleClick = (pickup) => {
    setSelectedPickup(pickup);
    setSchedulingData({
      pickupDate: pickup.pickup_date || "",
      timeSlot: pickup.time_slot || "Morning",
    });
  };

  const handleScheduleSubmit = async () => {
    if (!schedulingData.pickupDate) {
      setError("Please select a pickup date");
      return;
    }

    try {
      setLoading(true);
      await pickupService.schedule(selectedPickup.id, schedulingData);
      setSuccess("Pickup scheduled successfully!");
      setSelectedPickup(null);
      setTimeout(() => setSuccess(""), 3000);
      fetchPickups();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule pickup");
    } finally {
      setLoading(false);
    }
  };

  const filteredPickups = pickups.filter(
    (p) =>
      p.pickup_request_id.includes(searchTerm) ||
      p.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Pickup Schedule
        </h1>
        <p className="text-slate-600">
          Review and schedule pickup requests for execution
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Search by Request ID or Customer Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          <button
            onClick={fetchPickups}
            className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
          >
            Refresh
          </button>
        </div>

        {loading && !selectedPickup ? (
          <div className="flex h-48 items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto"></div>
              <p className="mt-2 text-slate-600">Loading pickups...</p>
            </div>
          </div>
        ) : filteredPickups.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50">
            <p className="text-slate-600">No pickup requests to schedule</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    Request ID
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    Customer Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    City
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    Parcels
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPickups.map((pickup) => (
                  <tr key={pickup.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-emerald-700">
                        {pickup.pickup_request_id}
                      </span>
                    </td>
                    <td className="px-4 py-3">{pickup.customer_name}</td>
                    <td className="px-4 py-3">{pickup.city}</td>
                    <td className="px-4 py-3 text-center">
                      {pickup.no_of_parcels}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                          pickup.priority === "Express"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {pickup.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                        {pickup.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleScheduleClick(pickup)}
                        className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        Schedule
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPickup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Schedule Pickup
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              {selectedPickup.pickup_request_id} - {selectedPickup.customer_name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pickup Date *
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <input
                    type="date"
                    value={schedulingData.pickupDate}
                    onChange={(e) =>
                      setSchedulingData((prev) => ({
                        ...prev,
                        pickupDate: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Time Slot *
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <select
                    value={schedulingData.timeSlot}
                    onChange={(e) =>
                      setSchedulingData((prev) => ({
                        ...prev,
                        timeSlot: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Morning">Morning (6 AM - 12 PM)</option>
                    <option value="Afternoon">Afternoon (12 PM - 6 PM)</option>
                    <option value="Evening">Evening (6 PM - 10 PM)</option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> Once scheduled, this pickup will move to the next stage for driver assignment.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleScheduleSubmit}
                  disabled={loading}
                  className="flex-1 rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:bg-emerald-400"
                >
                  {loading ? "Scheduling..." : "Confirm Schedule"}
                </button>
                <button
                  onClick={() => setSelectedPickup(null)}
                  className="flex-1 rounded border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
