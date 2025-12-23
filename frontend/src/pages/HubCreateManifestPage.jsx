import React from "react";

export default function HubCreateManifestPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Create Manifest
        </h1>
        <p className="text-slate-600">
          Create hub manifests for bulk shipment forwarding
        </p>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <p className="text-slate-600">
            Create manifests for grouping shipments by destination, vehicle, and route for hub-to-hub transfers.
          </p>
          <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50">
            <p className="text-slate-600">
              Manifest creation interface with shipment selection will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
