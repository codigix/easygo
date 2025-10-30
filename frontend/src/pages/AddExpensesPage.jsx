import { useState } from "react";
import axios from "axios";
import { DollarSign, Type, Tag } from "lucide-react";

export default function AddExpensesPage() {
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const categories = [
    "Fuel",
    "Rent",
    "Salary",
    "Utilities",
    "Maintenance",
    "Insurance",
    "Supplies",
    "Other",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.description || !formData.category) {
      setMessage("All fields are required");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/expenses`,
        {
          ...formData,
          amount: parseFloat(formData.amount),
          expense_date: new Date().toISOString().split("T")[0],
          payment_mode: "cash",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setMessage("Expense added successfully");
        setMessageType("success");
        setFormData({
          amount: "",
          description: "",
          category: "",
        });

        setTimeout(() => {
          setMessage("");
        }, 3000);
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      setMessage(
        error.response?.data?.message ||
          "Failed to add expense. Please try again."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-emerald-600 p-3">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900">
                  Add Expense
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Record a new business expense
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* Message */}
            {message && (
              <div
                className={`rounded-lg px-4 py-3 ${
                  messageType === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500 font-medium">₹</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all"
                />
              </div>
            </div>

            {/* Reason/Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the reason for this expense"
                rows="4"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                {loading ? "Adding..." : "Add Expense"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
