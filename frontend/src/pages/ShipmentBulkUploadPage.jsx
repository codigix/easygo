import React, { useEffect, useState } from "react";
import { shipmentService } from "../services/shipmentService";
import { AlertCircle, CheckCircle, Upload } from "lucide-react";

const DEFAULT_SERVICE_TYPES = ["EXPRESS", "STANDARD", "ECONOMY"];

export default function ShipmentBulkUploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [serviceTypes, setServiceTypes] = useState(DEFAULT_SERVICE_TYPES);

  useEffect(() => {
    const loadServiceTypes = async () => {
      try {
        const response = await shipmentService.getServiceTypes();
        const types = response.data || [];

        if (types.length > 0) {
          setServiceTypes(types);
        }
      } catch (err) {
        console.error("Error fetching service types:", err);
      }
    };

    loadServiceTypes();
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Please upload a valid Excel or CSV file");
        return;
      }

      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file first");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setUploadResult(null);

    try {
      const response = await shipmentService.bulkUploadShipments(file);

      setUploadResult(response.data);
      setSuccess(response.message);
      setFile(null);

      if (e.target) {
        e.target.reset();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload shipments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Bulk Upload Shipments
        </h1>
        <p className="text-slate-600">
          Upload multiple shipments via Excel or CSV file
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              File Format Requirements
            </h3>
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
              <p className="mb-3 font-semibold">Required Columns:</p>
              <ul className="list-inside space-y-2 list-disc">
                <li>sender_name - Sender full name</li>
                <li>sender_phone - 10-digit phone number</li>
                <li>sender_address - Complete address</li>
                <li>sender_pincode - 6-digit pincode</li>
                <li>sender_city - City name</li>
                <li>sender_state - State name</li>
                <li>receiver_name - Receiver full name</li>
                <li>receiver_phone - 10-digit phone number</li>
                <li>receiver_address - Complete address</li>
                <li>receiver_pincode - 6-digit pincode</li>
                <li>receiver_city - City name</li>
                <li>receiver_state - State name</li>
                <li>weight - Weight in kg (max 30)</li>
                <li>
                  service_type - one of: {serviceTypes.length ? serviceTypes.join(", ") : DEFAULT_SERVICE_TYPES.join(", ")}
                </li>
              </ul>
              <p className="mt-3 font-semibold">Optional Columns:</p>
              <ul className="list-inside space-y-2 list-disc">
                <li>dimensions - Format: LxWxH</li>
                <li>pieces - Number of pieces</li>
                <li>content_description - Description of contents</li>
                <li>declared_value - Value for insurance</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 p-8">
              <label className="cursor-pointer">
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <Upload size={32} className="text-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      {file ? file.name : "Select or drag & drop your file"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Supports Excel (.xlsx, .xls) and CSV files
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setError("");
                }}
                className="rounded-lg bg-slate-200 px-6 py-2 font-medium text-slate-900 hover:bg-slate-300"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={!file || loading}
                className="flex-1 rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Uploading..." : "Upload Shipments"}
              </button>
            </div>
          </form>

          {uploadResult && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <h4 className="mb-4 font-semibold text-slate-900">Upload Results</h4>
              <div className="space-y-3">
                <div className="flex justify-between rounded-lg bg-white p-3">
                  <span className="text-slate-700">Total Rows Processed:</span>
                  <span className="font-semibold text-slate-900">
                    {uploadResult.total_rows}
                  </span>
                </div>
                <div className="flex justify-between rounded-lg bg-green-50 p-3">
                  <span className="text-green-700">Successfully Created:</span>
                  <span className="font-semibold text-green-700">
                    {uploadResult.success_count}
                  </span>
                </div>
                {uploadResult.error_count > 0 && (
                  <>
                    <div className="flex justify-between rounded-lg bg-red-50 p-3">
                      <span className="text-red-700">Errors:</span>
                      <span className="font-semibold text-red-700">
                        {uploadResult.error_count}
                      </span>
                    </div>
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div className="rounded-lg bg-white p-4">
                        <p className="mb-3 font-semibold text-slate-900">Error Details:</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {uploadResult.errors.map((error, index) => (
                            <p key={index} className="text-sm text-red-700">
                              • {error}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 border border-blue-200">
            <p className="font-semibold mb-2">Tips for successful upload:</p>
            <ul className="list-inside space-y-1 list-disc">
              <li>Ensure all required columns are present in your file</li>
              <li>Phone numbers must be exactly 10 digits</li>
              <li>Pincodes must be exactly 6 digits</li>
              <li>Weight must be between 0 and 30 kg</li>
              <li>Review error messages and fix the data before retrying</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
