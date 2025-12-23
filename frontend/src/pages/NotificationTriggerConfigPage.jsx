import React from "react";

export default function NotificationTriggerConfigPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Trigger Configuration
        </h1>
        <p className="text-slate-600">
          Configure notification triggers and automation rules
        </p>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <p className="text-slate-600">
            Set up automated triggers for notifications based on events, status changes, and conditions.
          </p>
          <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50">
            <p className="text-slate-600">
              Notification trigger builder and configuration interface will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
