import React, { useState } from "react";
import { pickupService } from "../services/pickupService";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function PickupCreatePage() {
  const [formData, setFormData] = useState({
    pickupDate: "",
    timeSlot: "Morning",
    pickupType: "Door Pickup",
    priority: "Normal",
    customerName: "",
    mobileNumber: "",
    email: "",
    companyName: "",
    addressLine: "",
    city: "",
    pincode: "",
    zone: "Auto",
    noOfParcels: "",
    approxWeight: "",
    serviceType: "NON-DOX",
    paymentMode: "Prepaid",
    specialInstructions: "",
    isFragile: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const required = [
      "pickupDate",
      "timeSlot",
      "customerName",
      "mobileNumber",
      "addressLine",
      "city",
      "pincode",
      "noOfParcels",
    ];

    for (const field of required) {
      if (!formData[field]) {
        setError(`${field} is required`);
        return false;
      }
    }

    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      setError("Mobile number must be 10 digits");
      return false;
    }

    if (!/^\d{6}$/.test(formData.pincode)) {
      setError("Pincode must be 6 digits");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await pickupService.create(formData);
      setSuccess(`Pickup request created successfully! ID: ${response.data.pickupRequestId}`);
      
      setFormData({
        pickupDate: "",
        timeSlot: "Morning",
        pickupType: "Door Pickup",
        priority: "Normal",
        customerName: "",
        mobileNumber: "",
        email: "",
        companyName: "",
        addressLine: "",
        city: "",
        pincode: "",
        zone: "Auto",
        noOfParcels: "",
        approxWeight: "",
        serviceType: "NON-DOX",
        paymentMode: "Prepaid",
        specialInstructions: "",
        isFragile: false,
      });

      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create pickup request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Create Pickup Request
        </h1>
        <p className="text-slate-600">
          Fill in the form below to create a new pickup request
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            📍 Pickup Information
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pickup Date *
              </label>
              <input
                type="date"
                name="pickupDate"
                value={formData.pickupDate}
                onChange={handleInputChange}
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Time Slot *
              </label>
              <select
                name="timeSlot"
                value={formData.timeSlot}
                onChange={handleInputChange}
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pickup Type *
              </label>
              <select
                name="pickupType"
                value={formData.pickupType}
                onChange={handleInputChange}
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Door Pickup">Door Pickup</option>
                <option value="Walk-in">Walk-in</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Normal">Normal</option>
                <option value="Express">Express</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            👤 Sender Details
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Enter customer name"
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                placeholder="10 digit number"
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="customer@example.com"
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Company name (if any)"
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            📦 Pickup Address
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Address Line *
              </label>
              <textarea
                name="addressLine"
                value={formData.addressLine}
                onChange={handleInputChange}
                placeholder="Street address, building, flat number"
                rows="3"
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  placeholder="6 digits"
                  className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Zone
                </label>
                <select
                  name="zone"
                  value={formData.zone}
                  onChange={handleInputChange}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Auto">Auto Assign</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            📦 Shipment Summary
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Number of Parcels *
              </label>
              <input
                type="number"
                name="noOfParcels"
                value={formData.noOfParcels}
                onChange={handleInputChange}
                min="1"
                placeholder="1"
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Approximate Weight (Kg)
              </label>
              <input
                type="number"
                name="approxWeight"
                value={formData.approxWeight}
                onChange={handleInputChange}
                step="0.1"
                placeholder="Weight"
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Service Type
              </label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="DOX">DOX</option>
                <option value="NON-DOX">NON-DOX</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Payment Mode
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleInputChange}
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Prepaid">Prepaid</option>
                <option value="COD">COD</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            📝 Special Instructions
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Special Instructions
              </label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleInputChange}
                placeholder="Any special handling instructions..."
                rows="3"
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFragile"
                name="isFragile"
                checked={formData.isFragile}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isFragile" className="ml-3 text-sm font-medium text-slate-700">
                This shipment contains fragile items
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-700 disabled:bg-emerald-400"
          >
            {loading ? "Creating..." : "Create Pickup Request"}
          </button>
          <button
            type="reset"
            className="flex-1 rounded border border-slate-300 px-6 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
}
