import React from "react";

export default function PickupStatusPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Pickup Status
        </h1>
        <p className="text-slate-600">
          Track pickup status and SLA performance
        </p>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <p className="text-slate-600">
            Monitor pickup requests in real-time with status updates, SLA tracking, and exception alerts.
          </p>
          <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50">
            <p className="text-slate-600">
              Pickup status dashboard and tracking interface will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
