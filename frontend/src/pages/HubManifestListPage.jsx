import React from "react";

export default function HubManifestListPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Manifest List
        </h1>
        <p className="text-slate-600">
          View and manage all hub manifests
        </p>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <p className="text-slate-600">
            View all manifests with status, destination, shipment count, and action controls.
          </p>
          <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50">
            <p className="text-slate-600">
              Manifest list table with filters and search will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
