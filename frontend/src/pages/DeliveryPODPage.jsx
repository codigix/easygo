import React from "react";

export default function DeliveryPODPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Proof of Delivery (POD)
        </h1>
        <p className="text-slate-600">
          Record and manage delivery confirmations
        </p>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <p className="text-slate-600">
            Capture signature, photo, and recipient information as proof of delivery.
          </p>
          <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50">
            <p className="text-slate-600">
              POD capture interface with signature and photo upload will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
