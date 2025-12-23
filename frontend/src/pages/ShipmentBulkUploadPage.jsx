import React from "react";

export default function ShipmentBulkUploadPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Bulk Upload Shipments
        </h1>
        <p className="text-slate-600">
          Upload multiple shipments via Excel or CSV
        </p>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <p className="text-slate-600">
            Upload bulk shipments with validation and error reporting for efficient batch processing.
          </p>
          <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50">
            <p className="text-slate-600">
              Bulk upload interface with file parsing and validation will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
