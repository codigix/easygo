import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Info, FileText } from "lucide-react";
import EmailModal from "../components/EmailModal";

export default function GenerateInvoicePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customer_id: "",
    consignment_no: "",
    address: "",
    invoice_no: "",
    invoice_date: new Date().toISOString().split("T")[0],
    period_from: "",
    period_to: "",
    invoice_discount: false,
    reverse_charge: false,
    gst_percent: 18,
  });

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculations, setCalculations] = useState({
    total: 0,
    fuel_surcharge_tax_percent: 0,
    subtotal: 0,
    royalty_charge: 0,
    docket_charge: 0,
    other_charge: 0,
    net_amount: 0,
  });

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [generatedInvoiceNumber, setGeneratedInvoiceNumber] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleShowBookings = async () => {
    // Allow flexible filtering: customer_id, consignment_no, or date range (any combination)
    const hasDateRange = formData.period_from && formData.period_to;
    const hasConsignmentNo = formData.consignment_no;
    const hasCustomerId = formData.customer_id;

    // Check for incomplete date range (only one date selected)
    if (
      (formData.period_from && !formData.period_to) ||
      (!formData.period_from && formData.period_to)
    ) {
      alert(
        "Please select BOTH Period From and Period To dates, or leave both empty"
      );
      return;
    }

    // At least one filter must be provided
    if (!hasCustomerId && !hasConsignmentNo && !hasDateRange) {
      alert(
        "Please provide at least one filter: Customer ID, Consignment Number, or Date Range"
      );
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Build URL with available filters
      let url = `${import.meta.env.VITE_API_URL}/bookings/filter?`;
      const params = [];

      if (formData.customer_id) {
        params.push(`customer_id=${formData.customer_id}`);
      }
      if (formData.consignment_no) {
        params.push(`consignment_no=${formData.consignment_no}`);
      }
      if (hasDateRange) {
        params.push(`from_date=${formData.period_from}`);
        params.push(`to_date=${formData.period_to}`);
      }

      url += params.join("&");

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const fetchedBookings = data.data?.bookings || [];
        setBookings(fetchedBookings);
        calculateTotals(fetchedBookings);
        if (fetchedBookings.length === 0) {
          alert("No bookings found for the selected criteria");
        }
      } else {
        alert(data.message || "Failed to fetch bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      alert("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (bookingsList) => {
    const total = bookingsList.reduce(
      (sum, b) => sum + (parseFloat(b.total) || 0),
      0
    );
    const subtotal = total;
    const fuelSurcharge = (subtotal * formData.gst_percent) / 100;
    const netAmount = subtotal + fuelSurcharge;

    setCalculations({
      total: total.toFixed(2),
      fuel_surcharge_tax_percent: formData.gst_percent,
      subtotal: subtotal.toFixed(2),
      royalty_charge: 0,
      docket_charge: 0,
      other_charge: 0,
      net_amount: netAmount.toFixed(2),
    });
  };

  const fetchCustomerEmail = async (customerId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/rates/company/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success && data.data?.email) {
        return data.data.email;
      }
      return "";
    } catch (error) {
      console.error("Error fetching customer email:", error);
      return "";
    }
  };

  const handleGenerate = async () => {
    if (!formData.customer_id || bookings.length === 0) {
      alert("Please fill customer details and fetch bookings");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Remove invoice_no from request as it's auto-generated on the backend
      const { invoice_no, ...formDataWithoutInvoiceNo } = formData;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/invoices/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formDataWithoutInvoiceNo,
            bookings: bookings.map((b) => b.id),
            ...calculations,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        // Extract invoice ID and number from response
        const { id: invoiceId, invoice_number: invoiceNumber } =
          data.data || {};

        if (invoiceId && invoiceNumber) {
          // Store generated invoice number for display
          setGeneratedInvoiceNumber(invoiceNumber);

          // Fetch customer email
          const email = await fetchCustomerEmail(formData.customer_id);

          // Store invoice data for email modal
          setCurrentInvoice({ id: invoiceId, invoice_number: invoiceNumber });
          setCustomerEmail(email);

          // Show email modal immediately after invoice generation
          setShowEmailModal(true);

          // Reset form after showing modal (but keep the generated invoice number)
          setFormData({
            customer_id: "",
            consignment_no: "",
            address: "",
            invoice_no: "",
            invoice_date: new Date().toISOString().split("T")[0],
            period_from: "",
            period_to: "",
            invoice_discount: false,
            reverse_charge: false,
            gst_percent: 18,
          });
          setBookings([]);
        } else {
          alert("Invoice generated successfully! Invoice ID: " + invoiceId);
        }
      } else {
        alert(data.message || "Failed to generate invoice");
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    await handleGenerate();
  };

  const handleSendEmail = async () => {
    if (!currentInvoice) {
      alert("Please generate an invoice first");
      return;
    }
    setShowEmailModal(true);
  };

  const handleEmailSuccess = () => {
    setShowEmailModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
              <FileText className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-slate-900">
                Generate Invoice
              </h1>
              <p className="text-slate-500 mt-1">
                Create invoices from multiple bookings with a single click
              </p>
            </div>
            <Info
              className="h-6 w-6 text-emerald-600 cursor-pointer hover:text-emerald-700 transition"
              title="Generate invoice for multiple bookings"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Filters Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <div className="h-1 w-1 bg-emerald-600 rounded-full"></div>
              Filter Bookings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Customer ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  placeholder="Enter customer ID"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm bg-white focus:bg-slate-50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Consignment No{" "}
                  <span className="text-slate-400 text-xs font-normal">
                    (Optional)
                  </span>
                </label>
                <input
                  type="text"
                  name="consignment_no"
                  value={formData.consignment_no}
                  onChange={handleInputChange}
                  placeholder="Search by consignment number"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm bg-white focus:bg-slate-50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Enter billing address"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm bg-white focus:bg-slate-50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Invoice Details Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <div className="h-1 w-1 bg-emerald-600 rounded-full"></div>
              Invoice Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Invoice No
                </label>
                <div className="w-full rounded-lg border border-emerald-300 px-4 py-3 text-sm bg-white text-emerald-700 flex items-center font-semibold shadow-xs">
                  <span className="text-base">
                    {generatedInvoiceNumber || "Auto-generated on save"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Invoice Date
                </label>
                <input
                  type="date"
                  name="invoice_date"
                  value={formData.invoice_date}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              <div className="pt-2 border-t border-emerald-200">
                <label className="block text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">
                  Period
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">
                      From
                    </label>
                    <input
                      type="date"
                      name="period_from"
                      value={formData.period_from}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">
                      To
                    </label>
                    <input
                      type="date"
                      name="period_to"
                      value={formData.period_to}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Show Bookings Button */}
        <div className="flex justify-end">
          <button
            onClick={handleShowBookings}
            disabled={loading}
            className="px-8 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Loading...
              </span>
            ) : (
              "Fetch Bookings"
            )}
          </button>
        </div>

        {/* Bookings Table */}
        {bookings.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <div className="h-1 w-1 bg-emerald-600 rounded-full"></div>
              Selected Bookings ({bookings.length})
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 bg-gradient-to-r from-slate-50 to-slate-100">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Sr.No
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Consignment
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Destination
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Weight
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Pincode
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Mode
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Booking Date
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">
                    Insurance
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">
                    Bill Amt
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">
                    %
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">
                    Other Ch.
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">
                    Risk Surcharge
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-emerald-700">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookings.map((booking, index) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-emerald-50/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-medium">
                      {booking.consignment_no}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {booking.destination || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {booking.char_wt}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {booking.pincode}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{booking.mode}</td>
                    <td className="px-4 py-3 text-right text-slate-900">
                      {booking.amount || 0}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {booking.booking_date}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {booking.insurance || 0}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {booking.bill_amount || 0}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {booking.percentage || 0}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {booking.other_charges || 0}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {booking.risk_surcharge || 0}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      {booking.total || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Options & Settings Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Discount & Reverse Charge Options */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <div className="h-1 w-1 bg-emerald-600 rounded-full"></div>
              Invoice Options
            </h2>
            <div className="space-y-5">
              <div className="pb-5 border-b border-slate-200">
                <label className="text-sm font-semibold text-slate-700 mb-3 block">
                  Invoice Discount
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invoice_discount"
                      checked={formData.invoice_discount}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          invoice_discount: true,
                        }))
                      }
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invoice_discount"
                      checked={!formData.invoice_discount}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          invoice_discount: false,
                        }))
                      }
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-3 block">
                  Reverse Charge
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reverse_charge"
                      checked={formData.reverse_charge}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          reverse_charge: true,
                        }))
                      }
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reverse_charge"
                      checked={!formData.reverse_charge}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          reverse_charge: false,
                        }))
                      }
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">No</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Calculations Summary */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <div className="h-1 w-1 bg-emerald-600 rounded-full"></div>
              Charges & Calculations
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Total
                  </label>
                  <div className="text-2xl font-bold text-slate-900">
                    {calculations.total}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Fuel/Surcharge Tax (%)
                  </label>
                  <input
                    type="number"
                    name="fuel_surcharge_tax_percent"
                    value={calculations.fuel_surcharge_tax_percent}
                    onChange={(e) =>
                      setCalculations((prev) => ({
                        ...prev,
                        fuel_surcharge_tax_percent: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-right bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-emerald-200">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Sub Total
                  </label>
                  <div className="text-lg font-semibold text-emerald-700">
                    {calculations.subtotal}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    GST %
                  </label>
                  <input
                    type="number"
                    name="gst_percent"
                    value={formData.gst_percent}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-right bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Royalty Charge
                  </label>
                  <input
                    type="number"
                    value={calculations.royalty_charge}
                    onChange={(e) =>
                      setCalculations((prev) => ({
                        ...prev,
                        royalty_charge: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-right bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Docket Charge
                  </label>
                  <input
                    type="number"
                    value={calculations.docket_charge}
                    onChange={(e) =>
                      setCalculations((prev) => ({
                        ...prev,
                        docket_charge: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-right bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Other Charge
                </label>
                <input
                  type="number"
                  value={calculations.other_charge}
                  onChange={(e) =>
                    setCalculations((prev) => ({
                      ...prev,
                      other_charge: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-right bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-3 border-t-2 border-emerald-300 bg-white rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">
                    Net Amount
                  </span>
                  <span className="text-2xl font-bold text-emerald-700">
                    {calculations.net_amount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end pt-4">
          <button
            onClick={handleSendEmail}
            className="px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg"
          >
            Send via Email
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || bookings.length === 0}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            Generate
          </button>
          <button
            onClick={handleSave}
            disabled={loading || bookings.length === 0}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            Save
          </button>
        </div>
      </div>

      {/* Email Modal */}
      <EmailModal
        isOpen={showEmailModal}
        invoiceId={currentInvoice?.id}
        invoiceNumber={currentInvoice?.invoice_number}
        customerEmail={customerEmail}
        onClose={() => setShowEmailModal(false)}
        onSuccess={handleEmailSuccess}
      />
    </div>
  );
}
