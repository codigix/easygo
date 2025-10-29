import { useState } from "react";
import { Upload } from "lucide-react";

export default function ImportLimitlessPage() {
  const [textFile, setTextFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);

  const handleTextUpload = async () => {
    if (!textFile) {
      alert("Please select a text file");
      return;
    }

    const formData = new FormData();
    formData.append("file", textFile);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/import-text`,
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
        alert("Text file imported successfully!");
        setTextFile(null);
      } else {
        alert(data.message || "Failed to import text file");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile) {
      alert("Please select an Excel file");
      return;
    }

    const formData = new FormData();
    formData.append("file", excelFile);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/import-excel-limitless`,
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
        alert("Excel file imported successfully!");
        setExcelFile(null);
      } else {
        alert(data.message || "Failed to import Excel file");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
              <Upload className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">
              Import from Limitless
            </h1>
          </div>
          <p className="text-slate-600 ml-12">
            Upload and import data from text or Excel files
          </p>
        </div>

        {/* Upload Cards */}
        <div className="grid grid-cols-2 gap-6">
          {/* Upload Text File */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg font-bold text-sm">
                1
              </span>
              Text File Import
            </h2>
            <div className="space-y-4">
              <div className="p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-emerald-400 transition">
                <input
                  type="file"
                  accept=".txt"
                  onChange={(e) => setTextFile(e.target.files[0])}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>
              {textFile && (
                <p className="text-sm text-emerald-700 font-medium">
                  Selected: {textFile.name}
                </p>
              )}
              <button
                onClick={handleTextUpload}
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition"
              >
                Upload Text File
              </button>
            </div>
          </div>

          {/* Upload Excel File */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-teal-100 text-teal-600 rounded-lg font-bold text-sm">
                2
              </span>
              Excel File Import
            </h2>
            <div className="space-y-4">
              <div className="p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-teal-400 transition">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setExcelFile(e.target.files[0])}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
              </div>
              {excelFile && (
                <p className="text-sm text-teal-700 font-medium">
                  Selected: {excelFile.name}
                </p>
              )}
              <button
                onClick={handleExcelUpload}
                className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition"
              >
                Upload Excel File
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
