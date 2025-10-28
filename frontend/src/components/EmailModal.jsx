import React, { useState, useEffect } from "react";
import axios from "axios";

export default function EmailModal({
  isOpen,
  invoiceId,
  invoiceNumber,
  customerEmail,
  onClose,
  onSuccess,
}) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen && customerEmail) {
      setRecipientEmail(customerEmail);
      setSubject(`Invoice ${invoiceNumber}`);
      setMessage(
        `Please find attached your invoice ${invoiceNumber}. Thank you for your business!`
      );
    }
  }, [isOpen, customerEmail, invoiceNumber]);

  const handleClose = () => {
    setRecipientEmail("");
    setSubject("");
    setMessage("");
    setError("");
    setSuccess("");
    onClose();
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!recipientEmail) {
      setError("Please enter recipient email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/invoices/${invoiceId}/send-email`,
        {
          invoiceId,
          recipientEmail,
          subject: subject || `Invoice ${invoiceNumber}`,
          message:
            message || `Please find attached your invoice ${invoiceNumber}.`,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        const message = response.data.pdfGenerated
          ? `✓ Invoice sent successfully to ${recipientEmail} with PDF attachment`
          : `✓ Invoice sent successfully to ${recipientEmail} (sent as HTML)`;
        setSuccess(message);
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 2000);
      } else {
        setError(response.data.message || "Failed to send invoice email");
      }
    } catch (err) {
      console.error("Error sending email:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to send invoice email";

      // Check if it's a network error or server error
      if (!err.response) {
        setError("Network error. Please check your connection and try again.");
      } else if (err.response.status === 500) {
        setError(
          `Server error: ${errorMsg}. Please try again later or contact support.`
        );
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Send Invoice via Email
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Number
            </label>
            <input
              type="text"
              value={invoiceNumber || ""}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Invoice subject"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Sending...
                </>
              ) : (
                <>
                  <span>📧</span>
                  Send Invoice
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
