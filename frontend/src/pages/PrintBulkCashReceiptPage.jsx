import { useState } from "react";
import axios from "axios";
import { Printer, ArrowRight } from "lucide-react";

export default function PrintBulkCashReceiptPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    from_consignment: "",
    to_consignment: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDownload = async () => {
    if (!formData.from_consignment || !formData.to_consignment) {
      alert("Please enter both From and To Consignment Numbers");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/cashcounter/bulk-print`,
        {
          params: {
            from: formData.from_consignment,
            to: formData.to_consignment,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        alert(
          `Found ${response.data.data.count} bookings. Opening print dialog...`
        );
        // In a real implementation, this would open a print preview with all receipts
        window.print();
      }
    } catch (error) {
      console.error("Bulk print error:", error);
      alert(error.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-600 p-3">
                <Printer className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900">
                  Print Bulk Receipt
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Print receipts for a range of consignments
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleDownload();
            }}
            className="p-8"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  From Consignment No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="from_consignment"
                  value={formData.from_consignment}
                  onChange={handleInputChange}
                  placeholder="Enter starting consignment number"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                />
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-slate-400" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  To Consignment No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="to_consignment"
                  value={formData.to_consignment}
                  onChange={handleInputChange}
                  placeholder="Enter ending consignment number"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                  {loading ? "Processing..." : "Download & Print"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
