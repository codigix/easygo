import React, { useEffect, useMemo, useState } from "react";
import { Calendar, PhoneCall, RefreshCcw, Shield, UserPlus } from "lucide-react";
import dayjs from "dayjs";
import { fleetService } from "../services/fleetService";

const DRIVER_STATUSES = ["AVAILABLE", "ON_ROUTE", "INACTIVE"];
const STATUS_STYLES = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  ON_ROUTE: "bg-sky-100 text-sky-700",
  INACTIVE: "bg-slate-100 text-slate-600",
};

export default function FleetDriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    driver_code: "",
    license_number: "",
    license_expiry: dayjs().add(6, "month").format("YYYY-MM-DD"),
    current_hub: "",
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const response = await fleetService.getDrivers();
      if (response?.success) {
        setDrivers(response.data || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to fetch drivers");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      driver_code: "",
      license_number: "",
      license_expiry: dayjs().add(6, "month").format("YYYY-MM-DD"),
      current_hub: "",
    });
  };

  const handleCreateDriver = async (event) => {
    event.preventDefault();
    if (!form.name || !form.phone || !form.license_number) {
      setError("Name, phone, and license are mandatory");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await fleetService.createDriver(form);
      resetForm();
      await loadDrivers();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create driver");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (driverId, status) => {
    try {
      await fleetService.updateDriverStatus(driverId, status);
      await loadDrivers();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update driver status");
    }
  };

  const stats = useMemo(() => {
    return drivers.reduce(
      (acc, driver) => {
        acc[driver.status] = (acc[driver.status] || 0) + 1;
        return acc;
      },
      { AVAILABLE: 0, ON_ROUTE: 0, INACTIVE: 0 }
    );
  }, [drivers]);

  const expiringSoon = (licenseDate) => {
    if (!licenseDate) {
      return false;
    }
    return dayjs(licenseDate).diff(dayjs(), "day") <= 45;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Driver Control Tower</h1>
          <p className="text-slate-600">Availability, compliance, and live assignments.</p>
        </div>
        <button
          onClick={loadDrivers}
          className="inline-flex items-center gap-2 rounded border border-emerald-200 px-4 py-2 text-emerald-700 hover:bg-emerald-50"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <DriverStatCard label="Available" value={stats.AVAILABLE} hint="Ready for dispatch" />
        <DriverStatCard label="On Route" value={stats.ON_ROUTE} hint="Active loads" tone="sky" />
        <DriverStatCard label="Inactive" value={stats.INACTIVE} hint="Training / leave" tone="slate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Driver Roster</h2>
              <p className="text-sm text-slate-500">License compliance and hub readiness</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-10 text-center text-slate-500">Loading drivers...</div>
            ) : drivers.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No drivers registered yet</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500">
                    <th className="pb-2">Driver</th>
                    <th className="pb-2">License</th>
                    <th className="pb-2">Expiry</th>
                    <th className="pb-2">Hub</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drivers.map((driver) => (
                    <tr key={driver.id} className="text-slate-700">
                      <td className="py-3">
                        <p className="font-semibold text-slate-900">{driver.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <PhoneCall size={12} /> {driver.phone}
                        </p>
                      </td>
                      <td className="py-3">{driver.license_number}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            expiringSoon(driver.license_expiry) ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Calendar size={12} /> {driver.license_expiry ? dayjs(driver.license_expiry).format("DD MMM YYYY") : "—"}
                        </span>
                      </td>
                      <td className="py-3">{driver.current_hub || "—"}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[driver.status]}`}>
                          {driver.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <select
                          value={driver.status}
                          onChange={(event) => handleStatusChange(driver.id, event.target.value)}
                          className="rounded border border-slate-200 px-2 py-1 text-xs"
                        >
                          {DRIVER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Onboard Driver</h2>
          </div>
          <form className="space-y-4" onSubmit={handleCreateDriver}>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Sanika Patil"
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleFormChange}
                placeholder="9XXXXXXXXX"
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Driver Code</label>
                <input
                  name="driver_code"
                  value={form.driver_code}
                  onChange={handleFormChange}
                  placeholder="DRV-001"
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Current Hub</label>
                <input
                  name="current_hub"
                  value={form.current_hub}
                  onChange={handleFormChange}
                  placeholder="Pune Hub"
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">License Number</label>
              <input
                name="license_number"
                value={form.license_number}
                onChange={handleFormChange}
                placeholder="MH-XX-XXXX"
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">License Expiry</label>
              <input
                type="date"
                name="license_expiry"
                value={form.license_expiry}
                onChange={handleFormChange}
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Shield size={16} />
              {saving ? "Saving..." : "Add Driver"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function DriverStatCard({ label, value, hint, tone = "emerald" }) {
  const toneClasses = {
    emerald: "border-emerald-200",
    sky: "border-sky-200",
    slate: "border-slate-200",
  };
  return (
    <div className={`rounded-lg border ${toneClasses[tone]} bg-white p-4 shadow-sm`}>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}
