import React from "react";

export default function FleetVehiclesPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Vehicles
        </h1>
        <p className="text-slate-600">
          Manage fleet vehicles and specifications
        </p>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <p className="text-slate-600">
            Register vehicles, track specifications, maintenance schedules, and operational status.
          </p>
          <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50">
            <p className="text-slate-600">
              Vehicle management interface with fleet tracking will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
