import { useState } from "react";
import api from "../services/api";
import { Info, Barcode } from "lucide-react";

const StationaryBulkBarcodePage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
      ];
      if (!validTypes.includes(file.type)) {
        alert("Please select a valid Excel or CSV file");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await api.post(
        "/stationary/bulk-barcode/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(
        response.data.message || "File uploaded and processed successfully!"
      );
      setSelectedFile(null);
      // Reset file input
      document.getElementById("fileInput").value = "";
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        error.response?.data?.message ||
          "Failed to upload file. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get("/stationary/bulk-barcode/template", {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "barcode_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to download template. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
              <Barcode className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-slate-900">
                Print Bulk Barcode
              </h1>
              <p className="text-slate-500 mt-1">
                Generate and print barcodes in bulk from an Excel file
              </p>
            </div>
            <Info
              className="h-6 w-6 text-emerald-600 cursor-pointer hover:text-emerald-700 transition"
              title="Generate bulk barcodes"
            />
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="space-y-4">
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
                <Barcode className="h-12 w-12 text-slate-400 mx-auto mb-3" />
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
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition"
            >
              {uploading ? "Uploading..." : "Upload & Generate"}
            </button>
            <button
              onClick={handleExportExcel}
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
            📋 How It Works
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
              <span>
                Fill in the consignment numbers in the template (one per row)
              </span>
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
              <span>Barcodes will be generated and ready to print</span>
            </li>
          </ol>
        </div>

        {/* File Format Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="h-1 w-1 bg-emerald-600 rounded-full"></div>
            Supported File Formats
          </h3>
          <div className="flex flex-wrap gap-3">
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
        </div>
      </div>
    </div>
  );
};

export default StationaryBulkBarcodePage;
