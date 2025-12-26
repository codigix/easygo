import React, { useState, useEffect } from "react";
import { pickupService } from "../services/pickupService";
import { fleetService } from "../services/fleetService";
import { AlertCircle, CheckCircle, User, Truck, MapPin } from "lucide-react";

export default function PickupAssignmentPage() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    driverName: "",
    vehicleNo: "",
    routeArea: "",
    expectedPickupTime: "",
  });
  const [drivers, setDrivers] = useState([]);
  const [driverVehicles, setDriverVehicles] = useState({});
  const [driversLoading, setDriversLoading] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(null);

  useEffect(() => {
    fetchPickups();
    fetchDrivers();
  }, []);

  const fetchPickups = async () => {
    setLoading(true);
    try {
      const response = await pickupService.getAll({
        status: "SCHEDULED",
        limit: 50,
      });
      setPickups(response.data.pickups || []);
    } catch (err) {
      setError("Failed to fetch scheduled pickups");
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    setDriversLoading(true);
    try {
      const [driversResponse, vehiclesResponse] = await Promise.all([
        fleetService.getDrivers(),
        fleetService.getVehicles(),
      ]);
      const driverList = driversResponse?.success ? driversResponse.data || [] : [];
      const vehicleList = vehiclesResponse?.success
        ? vehiclesResponse.data?.vehicles || vehiclesResponse.data || []
        : [];
      const vehicleMap = {};
      vehicleList.forEach((vehicle) => {
        vehicleMap[vehicle.id] = vehicle;
      });
      setDrivers(driverList);
      setDriverVehicles(vehicleMap);
    } catch (err) {
      setError((prev) => prev || "Failed to load drivers");
    } finally {
      setDriversLoading(false);
    }
  };

  const handleAssignClick = (pickup) => {
    setSelectedPickup(pickup);
    setSelectedDriverId(null);
    setAssignmentData({
      driverName: "",
      vehicleNo: "",
      routeArea: pickup.zone || "",
      expectedPickupTime: "",
    });
  };

  const resolveVehicleNumber = (driver) => {
    if (!driver) {
      return "";
    }
    if (driver.assigned_vehicle_id && driverVehicles[driver.assigned_vehicle_id]) {
      return driverVehicles[driver.assigned_vehicle_id].vehicle_number || "";
    }
    return "";
  };

  const availableDrivers = drivers.filter((driver) => driver.status === "AVAILABLE");

  const handleDriverSelect = (driver) => {
    const vehicleNumber = resolveVehicleNumber(driver);
    setSelectedDriverId(driver.id);
    setAssignmentData((prev) => ({
      ...prev,
      driverName: driver.name,
      vehicleNo: vehicleNumber,
    }));
  };

  const handleAssignSubmit = async () => {
    if (!assignmentData.driverName) {
      setError("Please select a driver");
      return;
    }

    try {
      setLoading(true);
      await pickupService.assign(selectedPickup.id, assignmentData);
      setSuccess("Pickup assigned successfully!");
      setSelectedPickup(null);
      setTimeout(() => setSuccess(""), 3000);
      fetchPickups();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign pickup");
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
          Pickup Assignment
        </h1>
        <p className="text-slate-600">
          Assign pickup requests to drivers for execution
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
            <p className="text-slate-600">No scheduled pickups to assign</p>
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
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    Zone
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    Pickup Date
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    Time Slot
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    Parcels
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
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {pickup.customer_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {pickup.mobile_number}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{pickup.zone}</td>
                    <td className="px-4 py-3">
                      {pickup.pickup_date
                        ? new Date(pickup.pickup_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">{pickup.time_slot}</td>
                    <td className="px-4 py-3 text-center">
                      {pickup.no_of_parcels}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleAssignClick(pickup)}
                        className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        Assign
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
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Assign Pickup to Driver
            </h2>

            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                <strong>Pickup Request:</strong> {selectedPickup.pickup_request_id}
              </p>
              <p className="text-sm text-blue-900">
                <strong>Customer:</strong> {selectedPickup.customer_name}
              </p>
              <p className="text-sm text-blue-900">
                <strong>Address:</strong> {selectedPickup.address_line}, {selectedPickup.city}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  <User className="inline mr-2 h-4 w-4" />
                  Select Driver *
                </label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {driversLoading ? (
                    <div className="col-span-full flex items-center justify-center rounded-lg border border-dashed border-slate-200 p-6 text-sm text-slate-600">
                      <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                      Loading drivers...
                    </div>
                  ) : availableDrivers.length === 0 ? (
                    <div className="col-span-full rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                      No available drivers. Update availability in Fleet & Routes → Drivers.
                    </div>
                  ) : (
                    availableDrivers.map((driver) => {
                      const vehicleNumber = resolveVehicleNumber(driver);
                      return (
                        <button
                          key={driver.id}
                          onClick={() => handleDriverSelect(driver)}
                          className={`rounded-lg border-2 p-4 text-left transition ${
                            selectedDriverId === driver.id
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-200 hover:border-emerald-300 bg-white"
                          }`}
                        >
                          <p className="font-medium text-slate-900">{driver.name}</p>
                          <p className="text-xs text-slate-600">{driver.phone}</p>
                          <div className="mt-2 flex flex-col text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Truck className="h-3 w-3" /> {vehicleNumber || "Assign vehicle"}
                            </span>
                            <span>Hub: {driver.current_hub || "Not set"}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {assignmentData.driverName && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <Truck className="inline mr-2 h-4 w-4" />
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      value={assignmentData.vehicleNo}
                      onChange={(e) =>
                        setAssignmentData((prev) => ({
                          ...prev,
                          vehicleNo: e.target.value,
                        }))
                      }
                      placeholder="e.g., MH14-JK-9217"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <MapPin className="inline mr-2 h-4 w-4" />
                      Route / Area
                    </label>
                    <input
                      type="text"
                      value={assignmentData.routeArea}
                      onChange={(e) =>
                        setAssignmentData((prev) => ({
                          ...prev,
                          routeArea: e.target.value,
                        }))
                      }
                      placeholder="e.g., Zone A, Downtown, North Area"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Expected Pickup Time
                    </label>
                    <input
                      type="time"
                      value={assignmentData.expectedPickupTime}
                      onChange={(e) =>
                        setAssignmentData((prev) => ({
                          ...prev,
                          expectedPickupTime: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-xs text-amber-700">
                      <strong>Note:</strong> Driver {assignmentData.driverName} will be assigned vehicle {assignmentData.vehicleNo || "TBD"}. They will receive a notification about this pickup.
                    </p>
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAssignSubmit}
                  disabled={loading || !assignmentData.driverName}
                  className="flex-1 rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:bg-emerald-400"
                >
                  {loading ? "Assigning..." : "Confirm Assignment"}
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
