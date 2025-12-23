import React from "react";

export default function TrackingPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Live Tracking
        </h1>
        <p className="text-slate-600">
          Internal tracking with live map view and status updates
        </p>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <p className="text-slate-600">
            Track shipments in real-time with live map, branch scan history, vehicle location, and delay alerts.
          </p>
          <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50">
            <p className="text-slate-600">
              Live tracking map and tracking interface will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
