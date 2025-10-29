import { useState } from "react";
import axios from "axios";
import { Info, Upload, CheckCircle, AlertCircle } from "lucide-react";

const ImportCompanyExcelPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
      ];

      if (
        !validTypes.includes(file.type) &&
        !file.name.match(/\.(xlsx|xls|csv)$/i)
      ) {
        alert("Please select a valid Excel or CSV file");
        return;
      }

      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/rates/company/import-excel`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setUploadResult({
          success: true,
          message: response.data.message,
          data: response.data.data,
        });
        setSelectedFile(null);
        // Reset file input
        document.getElementById("fileInput").value = "";
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadResult({
        success: false,
        message: error.response?.data?.message || "Failed to upload file",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleExportTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/rates/company/export-template`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "company_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading template:", error);
      alert("Failed to download template");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
              <Upload className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-slate-900">
                Import Companies
              </h1>
              <p className="text-slate-500 mt-1">
                Bulk import company data from an Excel or CSV file
              </p>
            </div>
            <Info
              className="h-6 w-6 text-emerald-600 cursor-pointer hover:text-emerald-700 transition"
              title="Import companies from Excel"
            />
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <div className="h-1 w-1 bg-emerald-600 rounded-full"></div>
            Upload Excel File
          </h2>

          {/* File Upload Area */}
          <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 hover:border-emerald-400 hover:bg-emerald-50/30 transition">
            <input
              id="fileInput"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">
                XLS, XLSX or CSV files (Max 10MB)
              </p>
            </div>
          </div>

          {selectedFile && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Selected file:
                </p>
                <p className="text-sm font-semibold text-emerald-600">
                  {selectedFile.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear
              </button>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div
              className={`p-6 rounded-xl border ${
                uploadResult.success
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {uploadResult.success ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-semibold ${
                      uploadResult.success ? "text-emerald-900" : "text-red-900"
                    }`}
                  >
                    {uploadResult.message}
                  </p>
                  {uploadResult.data && (
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span className="text-slate-700">
                          Successfully imported:{" "}
                          <strong>{uploadResult.data.successCount}</strong>{" "}
                          companies
                        </span>
                      </div>
                      {uploadResult.data.errorCount > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-slate-700">
                            Failed:{" "}
                            <strong>{uploadResult.data.errorCount}</strong>{" "}
                            companies
                          </span>
                        </div>
                      )}
                      {uploadResult.data.errors &&
                        uploadResult.data.errors.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-red-200">
                            <p className="font-medium text-red-900 mb-2">
                              Errors:
                            </p>
                            <ul className="space-y-1 text-red-800 text-xs ml-4">
                              {uploadResult.data.errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition"
            >
              {uploading ? "Uploading..." : "Upload & Import"}
            </button>
            <button
              onClick={handleExportTemplate}
              className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition"
            >
              Download Template
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-8 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="h-1 w-1 bg-emerald-600 rounded-full"></div>
            📋 How to Import Companies
          </h3>
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">
                1
              </span>
              <span>
                Click <strong>"Download Template"</strong> to get the Excel file
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">
                2
              </span>
              <span>Fill in the company details in the template</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">
                3
              </span>
              <span>Save your filled Excel file</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">
                4
              </span>
              <span>Upload the file using the area above</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">
                5
              </span>
              <span>Review the import results for any errors</span>
            </li>
          </ol>
        </div>

        {/* File Format Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="h-1 w-1 bg-emerald-600 rounded-full"></div>
            Supported File Formats
          </h3>
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold">
              .xlsx
            </span>
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
              .xls
            </span>
            <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold">
              .csv
            </span>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-4">
              <strong>Required Columns:</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: "company_id", desc: "Unique identifier (required)" },
                { label: "company_name", desc: "Company name (required)" },
                { label: "company_address", desc: "Full address" },
                { label: "phone", desc: "Contact phone" },
                { label: "email", desc: "Contact email" },
                { label: "rate", desc: "Base rate (required)" },
                { label: "dox_rk", desc: "Dox RK value" },
                { label: "minimum_rate_surcharge", desc: "Min rate surcharge" },
                { label: "fuel_surcharge", desc: "Fuel surcharge %" },
                { label: "obs_fuel_surcharge", desc: "OBS fuel surcharge" },
                { label: "royalty_charges", desc: "Royalty charges" },
                { label: "eco_bl", desc: "Eco BL value" },
                { label: "dox_roce", desc: "Dox Roce value" },
                { label: "name_average", desc: "Name average value" },
                { label: "other_remark", desc: "Additional remarks" },
                { label: "status", desc: "Status (active/inactive)" },
              ].map((col) => (
                <div
                  key={col.label}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                    {col.label}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{col.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-slate-100 rounded-2xl p-6 text-center">
          <p className="text-sm text-slate-600">
            Need help?{" "}
            <a
              href="#"
              className="text-emerald-600 font-semibold hover:underline"
            >
              Contact support
            </a>{" "}
            or refer to the user manual.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImportCompanyExcelPage;
