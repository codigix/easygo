import { useState } from "react";
import axios from "axios";
import { AlertTriangle, Trash2 } from "lucide-react";

export default function DeleteCashConsignmentPage() {
  const [loading, setLoading] = useState(false);
  const [consignmentNo, setConsignmentNo] = useState("");

  const handleDelete = async () => {
    if (!consignmentNo) {
      alert("Please enter Consignment Number");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete consignment ${consignmentNo}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${
          import.meta.env.VITE_API_URL
        }/cashcounter/delete-booking/${consignmentNo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        alert("Consignment deleted successfully!");
        setConsignmentNo("");
      }
    } catch (error) {
      console.error("Delete booking error:", error);
      alert(error.response?.data?.message || "Failed to delete consignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-red-600 p-3">
                <Trash2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900">
                  Delete Consignment
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Permanently remove a consignment from the system
                </p>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-red-50 border-b border-red-200 px-6 py-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">
                  This action cannot be undone
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  Deleting a consignment will permanently remove it from the system.
                  Make sure you have entered the correct consignment number.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="p-8"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Consignment No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={consignmentNo}
                  onChange={(e) => setConsignmentNo(e.target.value)}
                  placeholder="Enter consignment number"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-medium rounded-lg hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {loading ? "Deleting..." : "Delete Consignment"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
