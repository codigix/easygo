import React, { useState } from "react";
import { shipmentService } from "../services/shipmentService";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function ShipmentCreatePage() {
  const [formData, setFormData] = useState({
    sender_name: "",
    sender_phone: "",
    sender_address: "",
    sender_pincode: "",
    sender_city: "",
    sender_state: "",
    receiver_name: "",
    receiver_phone: "",
    receiver_address: "",
    receiver_pincode: "",
    receiver_city: "",
    receiver_state: "",
    weight: "",
    dimensions: "",
    pieces: "1",
    content_description: "",
    declared_value: "",
    service_type: "EXPRESS",
    shipment_source: "MANUAL",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      "sender_name",
      "sender_phone",
      "sender_address",
      "sender_pincode",
      "receiver_name",
      "receiver_phone",
      "receiver_address",
      "receiver_pincode",
      "weight",
      "service_type",
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`${field.replace(/_/g, " ")} is required`);
        return false;
      }
    }

    if (!/^\d{10}$/.test(formData.sender_phone)) {
      setError("Sender phone must be 10 digits");
      return false;
    }

    if (!/^\d{10}$/.test(formData.receiver_phone)) {
      setError("Receiver phone must be 10 digits");
      return false;
    }

    if (!/^\d{6}$/.test(formData.sender_pincode)) {
      setError("Sender pincode must be 6 digits");
      return false;
    }

    if (!/^\d{6}$/.test(formData.receiver_pincode)) {
      setError("Receiver pincode must be 6 digits");
      return false;
    }

    const weight = parseFloat(formData.weight);
    if (isNaN(weight) || weight <= 0) {
      setError("Weight must be greater than 0");
      return false;
    }

    if (weight > 30) {
      setError("Weight cannot exceed 30 kg");
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
      const response = await shipmentService.createShipment(formData);
      setSuccess(
        `Shipment created successfully! CN: ${response.data.shipment_cn}`
      );

      setFormData({
        sender_name: "",
        sender_phone: "",
        sender_address: "",
        sender_pincode: "",
        sender_city: "",
        sender_state: "",
        receiver_name: "",
        receiver_phone: "",
        receiver_address: "",
        receiver_pincode: "",
        receiver_city: "",
        receiver_state: "",
        weight: "",
        dimensions: "",
        pieces: "1",
        content_description: "",
        declared_value: "",
        service_type: "EXPRESS",
        shipment_source: "MANUAL",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create shipment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Create Shipment
        </h1>
        <p className="text-slate-600">
          Create new shipments with sender and receiver details
        </p>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-700">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-700">
            <CheckCircle size={20} />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Sender Details
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Name *
                </label>
                <input
                  type="text"
                  name="sender_name"
                  value={formData.sender_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="sender_phone"
                  value={formData.sender_phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="10 digit number"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Address *
                </label>
                <textarea
                  name="sender_address"
                  value={formData.sender_address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  rows="2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Pincode *
                </label>
                <input
                  type="text"
                  name="sender_pincode"
                  value={formData.sender_pincode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="6 digit"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  City
                </label>
                <input
                  type="text"
                  name="sender_city"
                  value={formData.sender_city}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  State
                </label>
                <input
                  type="text"
                  name="sender_state"
                  value={formData.sender_state}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Receiver Details
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Name *
                </label>
                <input
                  type="text"
                  name="receiver_name"
                  value={formData.receiver_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="receiver_phone"
                  value={formData.receiver_phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="10 digit number"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Address *
                </label>
                <textarea
                  name="receiver_address"
                  value={formData.receiver_address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  rows="2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Pincode *
                </label>
                <input
                  type="text"
                  name="receiver_pincode"
                  value={formData.receiver_pincode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="6 digit"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  City
                </label>
                <input
                  type="text"
                  name="receiver_city"
                  value={formData.receiver_city}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  State
                </label>
                <input
                  type="text"
                  name="receiver_state"
                  value={formData.receiver_state}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Package Details
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Dimensions (L×W×H)
                </label>
                <input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="e.g., 20x15x10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Pieces
                </label>
                <input
                  type="number"
                  name="pieces"
                  value={formData.pieces}
                  onChange={handleInputChange}
                  min="1"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Service Type *
                </label>
                <select
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                >
                  <option value="EXPRESS">EXPRESS</option>
                  <option value="STANDARD">STANDARD</option>
                  <option value="ECONOMY">ECONOMY</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Content Description
                </label>
                <textarea
                  name="content_description"
                  value={formData.content_description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Declared Value
                </label>
                <input
                  type="number"
                  name="declared_value"
                  value={formData.declared_value}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 flex justify-end gap-3">
            <button
              type="reset"
              className="rounded-lg bg-slate-200 px-6 py-2 font-medium text-slate-900 hover:bg-slate-300"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Shipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
