import React from "react";

export default function DeliveryAssignPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Assign Delivery
        </h1>
        <p className="text-slate-600">
          Assign shipments to delivery partners and routes
        </p>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <p className="text-slate-600">
            Assign shipments to delivery personnel based on location, capacity, and service type.
          </p>
          <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50">
            <p className="text-slate-600">
              Delivery assignment interface with route optimization will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
