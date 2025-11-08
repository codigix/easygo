import { useState } from "react";
import { Download, UploadCloud } from "lucide-react";

export default function ImportFromExcelBookingPage() {
  const [format1File, setFormat1File] = useState(null);
  const [format2File, setFormat2File] = useState(null);
  const [format3File, setFormat3File] = useState(null);
  const [importedData, setImportedData] = useState(null);
  const [importedFormat, setImportedFormat] = useState(null);

  const handleUpload = async (file, format) => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", format);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/import-excel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );
      const data = await response.json();
      if (data.success) {
        // Store imported data for display
        setImportedData(data.data.data || []);
        setImportedFormat(format);
        alert(
          `Format ${format} imported successfully! ${data.data.imported} rows imported.`
        );
        if (format === 1) setFormat1File(null);
        if (format === 2) setFormat2File(null);
        if (format === 3) setFormat3File(null);
      } else {
        alert(data.message || "Failed to import file");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    }
  };

  const downloadTemplate = (format) => {
    window.open(
      `${import.meta.env.VITE_API_URL}/bookings/download-template/${format}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
              <UploadCloud className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">
              Import Bookings from Excel
            </h1>
          </div>
          <p className="text-slate-600 ml-12">
            Upload and import booking data using pre-defined formats
          </p>
        </div>

        {/* First Format */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-start gap-3 mb-6">
            <span className="flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg font-bold text-sm flex-shrink-0">
              1
            </span>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Format 1</h2>
              <p className="text-sm text-slate-600">
                Basic consignment and customer data
              </p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <span className="inline-block w-5 h-5 bg-emerald-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                !
              </span>
              Required Steps
            </h3>
            <ol className="space-y-2 text-sm text-emerald-800">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 mt-0.5">1.</span>
                <span>Download the Format 1 template</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 mt-0.5">2.</span>
                <span>Fill in your consignment data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 mt-0.5">3.</span>
                <span>Upload the .xlsx or .xls file</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 mt-0.5">4.</span>
                <span>Ensure all required columns are filled</span>
              </li>
            </ol>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFormat1File(e.target.files[0])}
              className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            <button
              onClick={() => handleUpload(format1File, 1)}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition"
            >
              Upload
            </button>
            <button
              onClick={() => downloadTemplate(1)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 flex items-center gap-2 font-medium transition"
            >
              <Download className="h-4 w-4" /> Template
            </button>
          </div>

          <div className="bg-slate-50 border rounded-lg p-4">
            <h4 className="font-medium mb-2">Format Preview:</h4>
            <table className="w-full text-sm border">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border px-4 py-2">A</th>
                  <th className="border px-4 py-2">B</th>
                </tr>
                <tr>
                  <th className="border px-4 py-2">Consignment No*</th>
                  <th className="border px-4 py-2">Customer Id*</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-4 py-2">TT2300345</td>
                  <td className="border px-4 py-2">Test Logistic</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2"></td>
                  <td className="border px-4 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Format Preview */}
        <div className="bg-slate-50 border rounded-lg p-4 overflow-x-auto">
          <h4 className="font-medium text-slate-900 mb-3">Column Structure:</h4>
          <table className="w-full text-xs border border-slate-200">
            <thead className="bg-emerald-50">
              <tr>
                <th className="border border-slate-200 px-3 py-2 text-left">
                  Column A
                </th>
                <th className="border border-slate-200 px-3 py-2 text-left">
                  Column B
                </th>
              </tr>
              <tr>
                <th className="border border-slate-200 px-3 py-2 text-left">
                  Consignment No*
                </th>
                <th className="border border-slate-200 px-3 py-2 text-left">
                  Customer ID*
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200 px-3 py-2">TT2300345</td>
                <td className="border border-slate-200 px-3 py-2">
                  Test Logistics
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Second Format */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-start gap-3 mb-6">
          <span className="flex items-center justify-center w-8 h-8 bg-teal-100 text-teal-600 rounded-lg font-bold text-sm flex-shrink-0">
            2
          </span>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Format 2</h2>
            <p className="text-sm text-slate-600">
              Detailed consignment with charges
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <h3 className="font-semibold text-teal-900 mb-3 flex items-center gap-2">
            <span className="inline-block w-5 h-5 bg-teal-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
              !
            </span>
            Required Steps
          </h3>
          <ol className="space-y-2 text-sm text-teal-800">
            <li className="flex items-start gap-2">
              <span className="font-bold text-teal-600 mt-0.5">1.</span>
              <span>Download the Format 2 template</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-teal-600 mt-0.5">2.</span>
              <span>Fill in detailed booking information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-teal-600 mt-0.5">3.</span>
              <span>Include insurance and other charges</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-teal-600 mt-0.5">4.</span>
              <span>Upload the prepared file</span>
            </li>
          </ol>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFormat2File(e.target.files[0])}
            className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
          />
          <button
            onClick={() => handleUpload(format2File, 2)}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition"
          >
            Upload
          </button>
          <button
            onClick={() => downloadTemplate(2)}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 flex items-center gap-2 font-medium transition"
          >
            <Download className="h-4 w-4" /> Template
          </button>
        </div>

        <div className="bg-slate-50 border rounded-lg p-4 overflow-x-auto">
          <h4 className="font-medium mb-2">Format Preview:</h4>
          <table className="w-full text-sm border">
            <thead className="bg-slate-100">
              <tr>
                <th className="border px-4 py-2">A</th>
                <th className="border px-4 py-2">B</th>
                <th className="border px-4 py-2">C</th>
                <th className="border px-4 py-2">D</th>
                <th className="border px-4 py-2">E</th>
                <th className="border px-4 py-2">F</th>
                <th className="border px-4 py-2">G</th>
              </tr>
              <tr>
                <th className="border px-4 py-2">Sr.No</th>
                <th className="border px-4 py-2">Consignment No*</th>
                <th className="border px-4 py-2">Customer Id*</th>
                <th className="border px-4 py-2">Chargable Weight</th>
                <th className="border px-4 py-2">Insurance Amt</th>
                <th className="border px-4 py-2">FOV Per</th>
                <th className="border px-4 py-2">Other charges</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2">1</td>
                <td className="border px-4 py-2">TT2380345</td>
                <td className="border px-4 py-2">Test Logistic</td>
                <td className="border px-4 py-2">1.1</td>
                <td className="border px-4 py-2">100</td>
                <td className="border px-4 py-2">2</td>
                <td className="border px-4 py-2">50</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Third Format */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-start gap-3 mb-6">
          <span className="flex items-center justify-center w-8 h-8 bg-violet-100 text-violet-600 rounded-lg font-bold text-sm flex-shrink-0">
            3
          </span>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Format 3</h2>
            <p className="text-sm text-slate-600">
              Complete booking with optional amount
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-violet-50 border border-violet-200 rounded-lg">
          <h3 className="font-semibold text-violet-900 mb-3 flex items-center gap-2">
            <span className="inline-block w-5 h-5 bg-violet-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
              !
            </span>
            Required Steps
          </h3>
          <ol className="space-y-2 text-sm text-violet-800">
            <li className="flex items-start gap-2">
              <span className="font-bold text-violet-600 mt-0.5">1.</span>
              <span>Download the Format 3 template</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-violet-600 mt-0.5">2.</span>
              <span>Fill all required fields marked with *</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-violet-600 mt-0.5">3.</span>
              <span>Amount is optional - auto-calculated if empty</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-violet-600 mt-0.5">4.</span>
              <span>Upload the complete booking data</span>
            </li>
          </ol>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFormat3File(e.target.files[0])}
            className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          />
          <button
            onClick={() => handleUpload(format3File, 3)}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium transition"
          >
            Upload
          </button>
          <button
            onClick={() => downloadTemplate(3)}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 flex items-center gap-2 font-medium transition"
          >
            <Download className="h-4 w-4" /> Template
          </button>
        </div>

        <div className="bg-slate-50 border rounded-lg p-4 overflow-x-auto">
          <h4 className="font-medium mb-2">Format Preview:</h4>
          <table className="w-full text-sm border">
            <thead className="bg-slate-100">
              <tr>
                <th className="border px-2 py-2">Sr.No</th>
                <th className="border px-2 py-2">Consignment No*</th>
                <th className="border px-2 py-2">Chargable Weight</th>
                <th className="border px-2 py-2">Mode*</th>
                <th className="border px-2 py-2">Company Address</th>
                <th className="border px-2 py-2">Quantity*</th>
                <th className="border px-2 py-2">Pincode*</th>
                <th className="border px-2 py-2">Booking Date*</th>
                <th className="border px-2 py-2">Or Gt Amt or Cv</th>
                <th className="border px-2 py-2">Type or N*</th>
                <th className="border px-2 py-2">Customer Id*</th>
                <th className="border px-2 py-2">Other Charges</th>
                <th className="border px-2 py-2">Receiver</th>
                <th className="border px-2 py-2">Amount (Optional)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-2 py-2">1</td>
                <td className="border px-2 py-2">TT2380345</td>
                <td className="border px-2 py-2">1.1</td>
                <td className="border px-2 py-2">AR</td>
                <td className="border px-2 py-2">Pune</td>
                <td className="border px-2 py-2">2</td>
                <td className="border px-2 py-2">400001</td>
                <td className="border px-2 py-2">30/01/2020</td>
                <td className="border px-2 py-2"></td>
                <td className="border px-2 py-2">D</td>
                <td className="border px-2 py-2">Test Logistic</td>
                <td className="border px-2 py-2">50</td>
                <td className="border px-2 py-2">Bob</td>
                <td className="border px-2 py-2">50</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Imported Data Display */}
      {importedData && importedData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Imported Data Preview (Format {importedFormat})
            </h2>
            <button
              onClick={() => {
                setImportedData(null);
                setImportedFormat(null);
              }}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition text-sm"
            >
              Clear
            </button>
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-slate-200 border border-slate-200">
              <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <tr>
                  {importedData[0] &&
                    Object.keys(importedData[0]).map((key) => (
                      <th
                        key={key}
                        className="border border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase"
                      >
                        {key}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {importedData.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    {Object.values(row).map((value, colIdx) => (
                      <td
                        key={colIdx}
                        className="border border-slate-200 px-4 py-3 text-sm text-slate-900"
                      >
                        {value !== null && value !== undefined
                          ? String(value)
                          : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-900 font-medium flex items-center gap-2">
              <span className="inline-block w-5 h-5 bg-emerald-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                ✓
              </span>
              <strong>{importedData.length} rows</strong> imported successfully
              and saved to database
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
