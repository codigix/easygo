import { useState } from "react";
import api from "../services/api";
import { Info, Package } from "lucide-react";

const StationaryAddPage = () => {
  const [formData, setFormData] = useState({
    receipt_date: new Date().toISOString().split("T")[0],
    start_no: "",
    end_no: "",
    no_of_leafs: "",
    no_of_books: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const calculateConsignments = () => {
    if (formData.start_no && formData.end_no) {
      const start = parseInt(formData.start_no);
      const end = parseInt(formData.end_no);
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        return end - start + 1;
      }
    }
    return 0;
  };

  const handleSubmit = async (e, printAfterSave = false) => {
    e.preventDefault();

    if (!formData.start_no || !formData.end_no) {
      alert("Please fill Start No and End No");
      return;
    }

    const totalConsignments = calculateConsignments();
    if (totalConsignments <= 0) {
      alert("End No must be greater than or equal to Start No");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        total_consignments: totalConsignments,
        used_consignments: 0,
        remaining_consignments: totalConsignments,
      };

      await api.post("/stationary/consignments", payload);

      alert("Stationary added successfully!");

      if (printAfterSave) {
        // Trigger print dialog
        window.print();
      }

      // Reset form
      setFormData({
        receipt_date: new Date().toISOString().split("T")[0],
        start_no: "",
        end_no: "",
        no_of_leafs: "",
        no_of_books: "",
      });
    } catch (error) {
      console.error("Error adding stationary:", error);
      alert(error.response?.data?.message || "Failed to add stationary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
              <Package className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-slate-900">
                Add Stationary
              </h1>
              <p className="text-slate-500 mt-1">
                Add new stationary consignment items to your inventory
              </p>
            </div>
            <Info
              className="h-6 w-6 text-emerald-600 cursor-pointer hover:text-emerald-700 transition"
              title="Add stationary consignments"
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <form onSubmit={(e) => handleSubmit(e, false)}>
            <div className="space-y-6">
              {/* Receipt Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Receipt Date<span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="receipt_date"
                  value={formData.receipt_date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm bg-white focus:bg-slate-50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              {/* Start No */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Start No<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="start_no"
                  value={formData.start_no}
                  onChange={handleChange}
                  required
                  placeholder="P0001"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm bg-white focus:bg-slate-50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              {/* End No */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  End No<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="end_no"
                  value={formData.end_no}
                  onChange={handleChange}
                  required
                  placeholder="P0100"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm bg-white focus:bg-slate-50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              {/* No of Leafs */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  No of Leafs
                </label>
                <input
                  type="number"
                  name="no_of_leafs"
                  value={formData.no_of_leafs}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm bg-white focus:bg-slate-50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              {/* No of Books */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  No of Books
                </label>
                <input
                  type="number"
                  name="no_of_books"
                  value={formData.no_of_books}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm bg-white focus:bg-slate-50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              {/* Total Consignments Display */}
              {formData.start_no && formData.end_no && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Total Consignments
                  </label>
                  <div className="text-3xl font-bold text-emerald-600">
                    {calculateConsignments()}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/20 disabled:opacity-50 transition"
                >
                  Save & Print
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StationaryAddPage;
