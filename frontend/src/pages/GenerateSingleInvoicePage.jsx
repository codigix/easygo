import { useState, useEffect } from "react";
import {
  Info,
  FileText,
  Plus,
  Search,
  Loader,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function GenerateSingleInvoicePage() {
  const [customerId, setCustomerId] = useState("");
  const [consignments, setConsignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    invoice_date: new Date().toISOString().split("T")[0],
    period_from: "",
    period_to: "",
    address: "",
    invoice_discount: false,
    invoice_discount_value: 0,
    reverse_charge: false,
    reverse_charge_value: 0,
    gst_percent: 18,
    fuel_surcharge_percent: 0,
    royalty_charge: 0,
    docket_charge: 0,
    other_charge: 0,
  });

  const handleCustomerIdChange = (e) => {
    setCustomerId(e.target.value);
    setError("");
    setConsignments([]);
  };

  const fetchConsignmentsForCustomer = async () => {
    if (!customerId.trim()) {
      setError("Please enter a customer ID");
      return;
    }

    setSearching(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");

      // Fetch unbilled consignments
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/bookings?customerId=${encodeURIComponent(
          customerId
        )}&unbilledOnly=true&limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success && data.data) {
        const unbilledConsignments = data.data.filter(
          (booking) => !booking.invoice_id
        );

        if (unbilledConsignments.length === 0) {
          setError("No unbilled consignments found for this customer");
          setConsignments([]);
        } else {
          setConsignments(unbilledConsignments);
          setSuccess(
            `Found ${unbilledConsignments.length} unbilled consignment(s)`
          );

          // Auto-fill form with company rate master settings
          await fetchCompanySettings(customerId, token);
        }
      } else {
        setError(data.message || "Failed to fetch consignments");
        setConsignments([]);
      }
    } catch (error) {
      console.error("Error fetching consignments:", error);
      setError("Failed to fetch consignments");
      setConsignments([]);
    } finally {
      setSearching(false);
    }
  };

  const fetchCompanySettings = async (customerId, token) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/company-rates/by-id/${encodeURIComponent(customerId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success && data.data) {
        const company = data.data;

        // Auto-fill form with company settings
        setFormData((prev) => ({
          ...prev,
          gst_percent: company.gst_percent || 18,
          fuel_surcharge_percent: company.fuel_surcharge_percent || 0,
          royalty_charge: company.royalty_charges_percent || 0,
          docket_charge: company.topay_charge || 0,
          other_charge: company.cod_charge || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching company settings:", error);
      // Use default values if company settings fail to load
      console.log("Using default charge values");
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleGenerateInvoice = async () => {
    if (!customerId || consignments.length === 0) {
      setError("Please select a valid customer with unbilled consignments");
      return;
    }

    if (!formData.period_from || !formData.period_to) {
      setError("Please select period from and to dates");
      return;
    }

    setGeneratingInvoice(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/invoices/generate-customer-bulk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customer_id: customerId,
            ...formData,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setGeneratedInvoice(data.data);
        setSuccess(
          `✅ Invoice Generated Successfully! Invoice #${data.data.invoice_number} - ${data.data.consignment_count} consignments included`
        );
        // Reset form
        setCustomerId("");
        setConsignments([]);
        setFormData({
          invoice_date: new Date().toISOString().split("T")[0],
          period_from: "",
          period_to: "",
          address: "",
          invoice_discount: false,
          invoice_discount_value: 0,
          reverse_charge: false,
          reverse_charge_value: 0,
          gst_percent: 18,
          fuel_surcharge_percent: 0,
          royalty_charge: 0,
          docket_charge: 0,
          other_charge: 0,
        });
      } else {
        setError(data.message || "Failed to generate invoice");
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
      setError("Failed to generate invoice: " + error.message);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    let totalWeight = 0;

    consignments.forEach((c) => {
      subtotal += parseFloat(c.total) || 0;
      totalWeight += parseFloat(c.act_wt) || 0;
    });

    const fuelSurcharge =
      (subtotal * parseFloat(formData.fuel_surcharge_percent || 0)) / 100;
    const royalty = (subtotal * parseFloat(formData.royalty_charge || 0)) / 100;
    const docket = (subtotal * parseFloat(formData.docket_charge || 0)) / 100;
    const other = parseFloat(formData.other_charge || 0);

    const chargeableAmount =
      subtotal + fuelSurcharge + royalty + docket + other;

    // Apply invoice discount if selected
    const invoiceDiscount = formData.invoice_discount
      ? parseFloat(formData.invoice_discount_value || 0)
      : 0;
    const amountAfterDiscount = chargeableAmount - invoiceDiscount;

    // Calculate GST on discounted amount
    const gst =
      (amountAfterDiscount * parseFloat(formData.gst_percent || 18)) / 100;

    // Calculate net amount before reverse charge
    let netAmount = amountAfterDiscount + gst;

    // Apply reverse charge if selected
    const reverseCharge = formData.reverse_charge
      ? parseFloat(formData.reverse_charge_value || 0)
      : 0;
    netAmount = netAmount + reverseCharge;

    return {
      subtotal: subtotal.toFixed(2),
      fuelSurcharge: fuelSurcharge.toFixed(2),
      royalty: royalty.toFixed(2),
      docket: docket.toFixed(2),
      other: other.toFixed(2),
      chargeableAmount: chargeableAmount.toFixed(2),
      invoiceDiscount: invoiceDiscount.toFixed(2),
      amountAfterDiscount: amountAfterDiscount.toFixed(2),
      gst: gst.toFixed(2),
      reverseCharge: reverseCharge.toFixed(2),
      netAmount: netAmount.toFixed(2),
      totalWeight: totalWeight.toFixed(2),
      count: consignments.length,
    };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
              <FileText className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">
                Generate Single Invoice
              </h1>
              <p className="text-slate-600">
                Create one invoice for all bulk consignments of a customer
              </p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex gap-3 items-start">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-900 font-medium">{success}</p>
              {generatedInvoice && (
                <p className="text-emerald-800 text-sm mt-1">
                  Invoice Total: ₹{generatedInvoice.net_amount}
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-900">{error}</p>
          </div>
        )}

        {/* Customer Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <div className="h-1 w-1 bg-emerald-600 rounded-full"></div>
            Customer & Consignments
          </h2>

          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Customer ID *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerId}
                  onChange={handleCustomerIdChange}
                  placeholder="Enter customer ID (e.g., 12345)"
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  onClick={fetchConsignmentsForCustomer}
                  disabled={searching || !customerId.trim()}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:bg-emerald-300 transition flex items-center gap-2"
                >
                  {searching ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Consignments Preview */}
          {consignments.length > 0 && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="text-sm text-emerald-900">
                  <p className="font-semibold">
                    {consignments.length} Unbilled Consignment(s) Found
                  </p>
                  <p className="text-emerald-800 mt-1">
                    Total Weight: {totals.totalWeight} kg | Subtotal: ₹
                    {totals.subtotal}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                        Consignment #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                        Destination
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                        Weight
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">
                        Mode
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-700">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {consignments.map((consignment, idx) => (
                      <tr key={consignment.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                          {consignment.consignment_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {consignment.destination || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {consignment.act_wt || 0} kg
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {consignment.mode || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 text-right">
                          ₹{parseFloat(consignment.total || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Settings */}
        {consignments.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  Invoice Dates
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      name="invoice_date"
                      value={formData.invoice_date}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Period From *
                    </label>
                    <input
                      type="date"
                      name="period_from"
                      value={formData.period_from}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Period To *
                    </label>
                    <input
                      type="date"
                      name="period_to"
                      value={formData.period_to}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  Tax & Charges (%)
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      GST %
                    </label>
                    <input
                      type="number"
                      name="gst_percent"
                      value={formData.gst_percent}
                      onChange={handleFormChange}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.5"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Fuel Surcharge %
                    </label>
                    <input
                      type="number"
                      name="fuel_surcharge_percent"
                      value={formData.fuel_surcharge_percent}
                      onChange={handleFormChange}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.5"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Royalty %
                    </label>
                    <input
                      type="number"
                      name="royalty_charge"
                      value={formData.royalty_charge}
                      onChange={handleFormChange}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.5"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  Additional Charges
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Docket Charge %
                    </label>
                    <input
                      type="number"
                      name="docket_charge"
                      value={formData.docket_charge}
                      onChange={handleFormChange}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.5"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Other Charge (₹)
                    </label>
                    <input
                      type="number"
                      name="other_charge"
                      value={formData.other_charge}
                      onChange={handleFormChange}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  Invoice Options
                </h3>

                <div className="space-y-4">
                  {/* Invoice Discount */}
                  <div className="border border-slate-200 rounded-lg p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="invoice_discount"
                        checked={formData.invoice_discount}
                        onChange={handleFormChange}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Invoice Discount
                      </span>
                    </label>
                    {formData.invoice_discount && (
                      <div className="mt-3 ml-7">
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          Discount Amount (₹)
                        </label>
                        <input
                          type="number"
                          name="invoice_discount_value"
                          value={formData.invoice_discount_value}
                          onChange={handleFormChange}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Reverse Charge */}
                  <div className="border border-slate-200 rounded-lg p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="reverse_charge"
                        checked={formData.reverse_charge}
                        onChange={handleFormChange}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Reverse Charge
                      </span>
                    </label>
                    {formData.reverse_charge && (
                      <div className="mt-3 ml-7">
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          Reverse Charge Amount (₹)
                        </label>
                        <input
                          type="number"
                          name="reverse_charge_value"
                          value={formData.reverse_charge_value}
                          onChange={handleFormChange}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Charges & Calculations Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-8">
                Charges & Calculations
              </h3>

              <div className="space-y-4">
                {/* Total */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                  <p className="text-sm font-medium text-slate-700">Total</p>
                  <p className="text-sm font-bold text-slate-900 text-right">
                    ₹{totals.subtotal}
                  </p>
                </div>

                {/* Fuel Surcharge */}
                {parseFloat(formData.fuel_surcharge_percent) > 0 && (
                  <div className="grid grid-cols-2 gap-4 pb-3">
                    <p className="text-sm text-slate-700">
                      Fuel/Surcharge Tax ({formData.fuel_surcharge_percent}%)
                    </p>
                    <p className="text-sm text-slate-900 text-right">
                      ₹{totals.fuelSurcharge}
                    </p>
                  </div>
                )}

                {/* Sub Total */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-200 bg-slate-50 px-4 rounded">
                  <p className="font-semibold text-slate-900">Sub Total</p>
                  <p className="font-bold text-slate-900 text-right">
                    ₹{totals.chargeableAmount}
                  </p>
                </div>

                {/* GST */}
                <div className="grid grid-cols-2 gap-4 pb-3 pt-4">
                  <p className="text-sm text-slate-700">
                    GST {formData.gst_percent}%
                  </p>
                  <p className="text-sm text-slate-900 text-right">
                    ₹{totals.gst}
                  </p>
                </div>

                {/* Royalty Charge */}
                {parseFloat(formData.royalty_charge) > 0 && (
                  <div className="grid grid-cols-2 gap-4 pb-3">
                    <p className="text-sm text-slate-700">
                      Royalty Charge ({formData.royalty_charge}%)
                    </p>
                    <p className="text-sm text-slate-900 text-right">
                      ₹{totals.royalty}
                    </p>
                  </div>
                )}

                {/* Docket Charge */}
                {parseFloat(formData.docket_charge) > 0 && (
                  <div className="grid grid-cols-2 gap-4 pb-3">
                    <p className="text-sm text-slate-700">
                      Docket Charge ({formData.docket_charge}%)
                    </p>
                    <p className="text-sm text-slate-900 text-right">
                      ₹{totals.docket}
                    </p>
                  </div>
                )}

                {/* Other Charge */}
                {parseFloat(totals.other) > 0 && (
                  <div className="grid grid-cols-2 gap-4 pb-3">
                    <p className="text-sm text-slate-700">Other Charge</p>
                    <p className="text-sm text-slate-900 text-right">
                      ₹{totals.other}
                    </p>
                  </div>
                )}

                {/* Invoice Discount */}
                {formData.invoice_discount &&
                  parseFloat(totals.invoiceDiscount) > 0 && (
                    <div className="grid grid-cols-2 gap-4 pb-3 text-red-600">
                      <p className="text-sm font-medium">Invoice Discount</p>
                      <p className="text-sm font-medium text-right">
                        -₹{totals.invoiceDiscount}
                      </p>
                    </div>
                  )}

                {/* Reverse Charge */}
                {formData.reverse_charge &&
                  parseFloat(totals.reverseCharge) > 0 && (
                    <div className="grid grid-cols-2 gap-4 pb-3 text-blue-600">
                      <p className="text-sm font-medium">Reverse Charge</p>
                      <p className="text-sm font-medium text-right">
                        +₹{totals.reverseCharge}
                      </p>
                    </div>
                  )}

                {/* Net Amount */}
                <div className="grid grid-cols-2 gap-4 pt-6 pb-4 border-t-2 border-emerald-300 bg-emerald-50 px-4 py-4 rounded-lg">
                  <p className="font-bold text-lg text-slate-900">Net Amount</p>
                  <p className="font-bold text-2xl text-emerald-600 text-right">
                    ₹{totals.netAmount}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setConsignments([]);
                  setCustomerId("");
                }}
                className="px-8 py-3 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 font-medium transition"
              >
                Clear
              </button>

              <button
                onClick={handleGenerateInvoice}
                disabled={generatingInvoice}
                className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:bg-emerald-300 transition flex items-center gap-2"
              >
                {generatingInvoice ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Generate Invoice
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
