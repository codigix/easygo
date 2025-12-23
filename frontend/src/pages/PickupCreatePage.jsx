import React from "react";

export default function PickupCreatePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Create Pickup Request
        </h1>
        <p className="text-slate-600">
          Create and manage pickup requests for parcels and consignments
        </p>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <p className="text-slate-600">
            This page allows you to create new pickup requests with customer details, addresses, and scheduling.
          </p>
          <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50">
            <p className="text-slate-600">
              Pickup form and management interface will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
