import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  MessageCircle,
  Loader,
  Download,
  CheckCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  Clock,
  RefreshCw,
} from "lucide-react";
import { chatbotService } from "../services/chatbotService";

// Typing animation component
const TypingIndicator = () => (
  <div className="flex space-x-2">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    <div
      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
      style={{ animationDelay: "0.1s" }}
    ></div>
    <div
      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
      style={{ animationDelay: "0.2s" }}
    ></div>
  </div>
);

// Parse markdown-like formatting
const formatMessage = (text) => {
  if (!text) return text;

  const lines = text.split("\n");
  return lines.map((line, idx) => {
    line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    return <div key={idx} dangerouslySetInnerHTML={{ __html: line }} />;
  });
};

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
    confirmed: { bg: "bg-blue-100", text: "text-blue-800", label: "Confirmed" },
    in_transit: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      label: "In Transit",
    },
    delivered: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Delivered",
    },
    cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

// Expandable charge breakdown row
const ChargeBreakdownRow = ({ booking, isExpanded, onToggle }) => {
  return (
    <>
      <tr
        className="border-b hover:bg-gray-100 cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-2 py-1 font-medium">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {booking.consignment_number}
          </div>
        </td>
        <td className="px-2 py-1 text-xs">
          <StatusBadge status={booking.status} />
        </td>
        <td className="px-2 py-1 text-xs">{booking.destination || "N/A"}</td>
        <td className="px-2 py-1 text-xs">{booking.weight || "N/A"} kg</td>
        <td className="px-2 py-1 text-xs">{booking.mode || "N/A"}</td>
        <td className="px-2 py-1 text-right text-xs font-semibold">
          ₹{parseFloat(booking.amount || 0).toFixed(2)}
        </td>
        <td className="px-2 py-1 text-center">
          {booking.invoice_id ? (
            <span className="text-xs text-green-600 font-medium">
              ✓ Available
            </span>
          ) : (
            <span className="text-xs text-gray-400">Pending</span>
          )}
        </td>
      </tr>

      {/* Expanded charge breakdown */}
      {isExpanded && (
        <tr className="bg-blue-50 border-b">
          <td colSpan="7" className="px-4 py-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-2 rounded border border-blue-100">
                <p className="text-xs text-gray-600">Base Amount</p>
                <p className="font-semibold text-sm">
                  ₹{parseFloat(booking.amount || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-2 rounded border border-blue-100">
                <p className="text-xs text-gray-600">Tax</p>
                <p className="font-semibold text-sm">
                  ₹{parseFloat(booking.tax_amount || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-2 rounded border border-blue-100">
                <p className="text-xs text-gray-600">Fuel Surcharge</p>
                <p className="font-semibold text-sm">
                  ₹{parseFloat(booking.fuel_amount || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-2 rounded border border-blue-100">
                <p className="text-xs text-gray-600">Other Charges</p>
                <p className="font-semibold text-sm">
                  ₹{parseFloat(booking.other_charges || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-2 rounded border border-green-200">
                <p className="text-xs text-gray-600">Total Amount</p>
                <p className="font-bold text-sm text-green-600">
                  ₹
                  {parseFloat(
                    (
                      parseFloat(booking.amount || 0) +
                      parseFloat(booking.tax_amount || 0) +
                      parseFloat(booking.fuel_amount || 0) +
                      parseFloat(booking.other_charges || 0)
                    ).toFixed(2)
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default function ChatbotAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! 👋 I'm your consignment assistant. I can help you find your shipments. Enter either:\n\n• **Consignment Number** (e.g., 'CODIGIIX INFOTECH108')\n• **Customer ID** (e.g., '12345')\n\nI'll show you all matching bookings with detailed charges breakdown!",
      sender: "assistant",
      type: "greeting",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [downloadedInvoices, setDownloadedInvoices] = useState(new Set());
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("chatbot_recent_searches") || "[]"
      ).slice(0, 3);
    } catch {
      return [];
    }
  });
  const [inputError, setInputError] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "amount",
    direction: "desc",
  });

  const messagesEndRef = useRef(null);
  const messageIdRef = useRef(2);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Input validation
  const validateInput = (input) => {
    if (!input.trim()) {
      setInputError("Please enter a consignment number or customer ID");
      return false;
    }

    const isNumeric = /^\d+$/.test(input.trim());
    const isAlphanumeric = /^[a-zA-Z0-9\s]+$/.test(input.trim());

    if (!isAlphanumeric) {
      setInputError("Invalid format. Use alphanumeric characters only.");
      return false;
    }

    if (isNumeric && input.length < 3) {
      setInputError("Customer ID should be at least 3 digits");
      return false;
    }

    setInputError("");
    return true;
  };

  // Save to recent searches
  const addToRecentSearches = (searchTerm) => {
    const updated = [
      searchTerm,
      ...recentSearches.filter((s) => s !== searchTerm),
    ].slice(0, 3);
    setRecentSearches(updated);
    localStorage.setItem("chatbot_recent_searches", JSON.stringify(updated));
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Toggle row expansion
  const toggleRowExpansion = (idx) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // Sort bookings
  const sortBookings = (bookings, key, direction) => {
    return [...bookings].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      if (key === "amount" || key === "weight") {
        aVal = parseFloat(aVal || 0);
        bVal = parseFloat(bVal || 0);
      }

      if (direction === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  };

  // Handle invoice download
  const handleDownloadInvoice = async (
    messageId,
    invoiceFile,
    invoiceId,
    consignmentNo
  ) => {
    try {
      setDownloadingInvoiceId(messageId);
      const token = localStorage.getItem("token");

      const url = new URL(
        `${import.meta.env.VITE_API_URL}/invoices/${invoiceId}/download`
      );
      if (consignmentNo) {
        url.searchParams.append("consignmentNo", consignmentNo);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Invoice download failed");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = invoiceFile || `invoice_${invoiceId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setDownloadedInvoices((prev) => new Set([...prev, messageId]));

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: messageIdRef.current++,
            text: `✅ **Download Complete!** Invoice for ${consignmentNo} downloaded successfully.`,
            sender: "assistant",
            type: "download_success",
          },
        ]);
      }, 500);
    } catch (error) {
      console.error("Download error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: messageIdRef.current++,
          text: `❌ **Download Failed** - Invoice not available for this consignment. Please try again or contact support.`,
          sender: "assistant",
          type: "download_error",
        },
      ]);
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  // Handle message send
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!validateInput(inputValue)) return;

    const userMessage = {
      id: messageIdRef.current++,
      text: inputValue,
      sender: "user",
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    addToRecentSearches(inputValue.trim());
    setInputValue("");
    setIsLoading(true);
    setExpandedRows(new Set());

    try {
      const token = localStorage.getItem("token");
      const searchInput = inputValue.trim();

      const params = new URLSearchParams();
      if (/^\d+$/.test(searchInput)) {
        params.append("customerId", searchInput);
      } else {
        params.append("consignmentNo", searchInput);
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/bookings/search-with-invoices?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const result = await response.json();

      if (result.success && result.data.bookings.length > 0) {
        const sortedBookings = sortBookings(
          result.data.bookings,
          sortConfig.key,
          sortConfig.direction
        );

        const assistantMessage = {
          id: messageIdRef.current++,
          sender: "assistant",
          type: "booking_table",
          bookings: sortedBookings,
          text: `Found ${result.data.count} booking(s)`,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: messageIdRef.current++,
            text: "❌ No bookings found. Please check the consignment number or customer ID and try again.",
            sender: "assistant",
            type: "not_found",
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: messageIdRef.current++,
          text: "⚠️ Sorry, I'm having trouble connecting. Please check your internet connection and try again.",
          sender: "assistant",
          type: "error",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Retry last search
  const handleRetry = () => {
    if (recentSearches.length > 0) {
      setInputValue(recentSearches[0]);
    }
  };

  return (
    <div className="fixed bottom-3 sm:bottom-4 md:bottom-6 right-3 sm:right-4 md:right-6 z-50 w-[calc(100vw-24px)] sm:w-96 max-w-[calc(100vw-24px)]">
      {/* Chatbot container */}
      <div
        className={`flex flex-col bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
          isMinimized ? "h-14 sm:h-16" : "h-[500px] sm:h-[600px]"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-t-lg flex items-center justify-between cursor-pointer hover:from-blue-700 hover:to-blue-800">
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <MessageCircle size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base truncate">
                Consignment Tracker
              </h3>
              <p className="text-xs opacity-75 truncate">
                Track your shipments
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:bg-blue-700 rounded-full p-1 sm:p-2 transition flex-shrink-0"
          >
            {isMinimized ? "+" : "−"}
          </button>
        </div>

        {/* Messages area */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`${
                      message.type === "booking_table"
                        ? "max-w-4xl w-full px-2 sm:px-3 md:px-4 py-2"
                        : "max-w-xs sm:max-w-sm px-3 sm:px-4 py-2"
                    } rounded-lg ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-none text-xs sm:text-sm"
                        : "bg-gray-200 text-gray-900 rounded-bl-none text-xs sm:text-sm"
                    }`}
                  >
                    {/* Booking table with expandable rows */}
                    {message.type === "booking_table" && message.bookings && (
                      <div className="space-y-2 sm:space-y-3 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <p className="font-semibold text-xs sm:text-sm">
                            {message.text}
                          </p>
                          <select
                            onChange={(e) => {
                              const [key, direction] =
                                e.target.value.split("-");
                              setSortConfig({ key, direction });
                            }}
                            className="text-xs bg-white text-gray-700 px-2 py-1 rounded border border-gray-300"
                          >
                            <option value="amount-desc">Amount ↓</option>
                            <option value="amount-asc">Amount ↑</option>
                            <option value="weight-desc">Weight ↓</option>
                            <option value="weight-asc">Weight ↑</option>
                          </select>
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden sm:block overflow-x-auto bg-white text-gray-900 rounded border border-gray-300">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-200 border-b">
                                <th className="px-2 py-2 text-left font-semibold text-xs">
                                  Consignment
                                </th>
                                <th className="px-2 py-2 text-left font-semibold text-xs">
                                  Status
                                </th>
                                <th className="px-2 py-2 text-left font-semibold text-xs">
                                  Destination
                                </th>
                                <th className="px-2 py-2 text-left font-semibold text-xs">
                                  Weight
                                </th>
                                <th className="px-2 py-2 text-left font-semibold text-xs">
                                  Mode
                                </th>
                                <th className="px-2 py-2 text-right font-semibold text-xs">
                                  Amount
                                </th>
                                <th className="px-2 py-2 text-center font-semibold text-xs">
                                  Invoice
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortBookings(
                                message.bookings,
                                sortConfig.key,
                                sortConfig.direction
                              ).map((booking, idx) => (
                                <ChargeBreakdownRow
                                  key={idx}
                                  booking={booking}
                                  isExpanded={expandedRows.has(idx)}
                                  onToggle={() => toggleRowExpansion(idx)}
                                />
                              ))}
                            </tbody>
                          </table>

                          {/* Download all invoices button */}
                          {message.bookings.some((b) => b.invoice_id) && (
                            <div className="px-3 py-2 border-t border-gray-300 bg-gray-50">
                              <button
                                onClick={() => {
                                  message.bookings.forEach((booking) => {
                                    if (booking.invoice_id) {
                                      handleDownloadInvoice(
                                        message.id,
                                        booking.invoice_number
                                          ? `${booking.invoice_number}.pdf`
                                          : `inv_${booking.invoice_id}.pdf`,
                                        booking.invoice_id,
                                        booking.consignment_number
                                      );
                                    }
                                  });
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                              >
                                <Download size={12} />
                                Download All Invoices
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Mobile Card View */}
                        <div className="sm:hidden space-y-2">
                          {sortBookings(
                            message.bookings,
                            sortConfig.key,
                            sortConfig.direction
                          ).map((booking, idx) => (
                            <div
                              key={idx}
                              onClick={() => toggleRowExpansion(idx)}
                              className="bg-white border border-gray-300 rounded p-2 cursor-pointer hover:bg-gray-50"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-xs truncate">
                                    {booking.consignment_number}
                                  </p>
                                  <div className="flex gap-1 mt-1">
                                    <StatusBadge status={booking.status} />
                                    {booking.invoice_id && (
                                      <span className="text-xs text-green-600 font-medium">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-semibold text-xs text-green-600">
                                    ₹
                                    {parseFloat(booking.amount || 0).toFixed(2)}
                                  </p>
                                  {expandedRows.has(idx) ? (
                                    <ChevronUp
                                      size={14}
                                      className="ml-auto mt-1"
                                    />
                                  ) : (
                                    <ChevronDown
                                      size={14}
                                      className="ml-auto mt-1"
                                    />
                                  )}
                                </div>
                              </div>

                              <div className="text-xs text-gray-600 space-y-1">
                                <p>📍 {booking.destination || "N/A"}</p>
                                <p>
                                  ⚖️ {booking.weight || "N/A"} kg | 📦{" "}
                                  {booking.mode || "N/A"}
                                </p>
                              </div>

                              {/* Mobile charge breakdown */}
                              {expandedRows.has(idx) && (
                                <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Base:</span>
                                    <span className="font-semibold">
                                      ₹
                                      {parseFloat(booking.amount || 0).toFixed(
                                        2
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Tax:</span>
                                    <span className="font-semibold">
                                      ₹
                                      {parseFloat(
                                        booking.tax_amount || 0
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Fuel:</span>
                                    <span className="font-semibold">
                                      ₹
                                      {parseFloat(
                                        booking.fuel_amount || 0
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">
                                      Other:
                                    </span>
                                    <span className="font-semibold">
                                      ₹
                                      {parseFloat(
                                        booking.other_charges || 0
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs pt-1 border-t border-gray-200 font-bold text-green-600">
                                    <span>Total:</span>
                                    <span>
                                      ₹
                                      {parseFloat(
                                        (
                                          parseFloat(booking.amount || 0) +
                                          parseFloat(booking.tax_amount || 0) +
                                          parseFloat(booking.fuel_amount || 0) +
                                          parseFloat(booking.other_charges || 0)
                                        ).toFixed(2)
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                  {booking.invoice_id && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadInvoice(
                                          message.id,
                                          booking.invoice_number
                                            ? `${booking.invoice_number}.pdf`
                                            : `inv_${booking.invoice_id}.pdf`,
                                          booking.invoice_id,
                                          booking.consignment_number
                                        );
                                      }}
                                      className="w-full mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 rounded flex items-center justify-center gap-1"
                                    >
                                      <Download size={12} />
                                      Download Invoice
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <p className="text-xs text-gray-600 italic">
                          💡 {window.innerWidth < 640 ? "Tap" : "Click"} to see
                          breakdown
                        </p>
                      </div>
                    )}

                    {/* Text message */}
                    {!message.booking &&
                      message.type !== "booking_table" &&
                      message.type !== "not_found" && (
                        <div className="text-sm">
                          {formatMessage(message.text)}
                        </div>
                      )}

                    {/* Not found message */}
                    {message.type === "not_found" && (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle
                            size={16}
                            className="mt-1 flex-shrink-0"
                          />
                          <p className="text-sm">{message.text}</p>
                        </div>
                        {recentSearches.length > 0 && (
                          <button
                            onClick={handleRetry}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                          >
                            <RefreshCw size={12} />
                            Try last search
                          </button>
                        )}
                      </div>
                    )}

                    {/* Error message */}
                    {message.type === "error" && (
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="mt-1 flex-shrink-0" />
                        <p className="text-sm">{message.text}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-900 px-4 py-3 rounded-lg rounded-bl-none">
                    <TypingIndicator />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-gray-200 p-2 sm:p-3 bg-white rounded-b-lg space-y-1.5 sm:space-y-2">
              <form
                onSubmit={handleSendMessage}
                className="flex gap-1 sm:gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setInputError("");
                  }}
                  placeholder="Consignment # or ID..."
                  disabled={isLoading}
                  className={`flex-1 px-2 sm:px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-xs sm:text-sm ${
                    inputError ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-2 sm:px-3 py-2 rounded-lg transition flex items-center justify-center gap-1 flex-shrink-0"
                  title="Search"
                >
                  {isLoading ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </form>

              {inputError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {inputError}
                </p>
              )}

              {/* Recent searches */}
              {recentSearches.length > 0 && !isLoading && (
                <div className="flex gap-1 flex-wrap">
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputValue(search);
                        handleSendMessage({ preventDefault: () => {} });
                      }}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded transition flex items-center gap-1 flex-shrink"
                      title={`Recent: ${search}`}
                    >
                      <Clock size={12} />
                      <span className="truncate">
                        {search.length > 15
                          ? search.substring(0, 15) + "..."
                          : search}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Help text */}
              <p className="text-xs text-gray-500 leading-tight">
                📝 Enter consignment number or customer ID to track
              </p>
            </div>
          </>
        )}
      </div>

      {/* Floating button when minimized */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
        >
          <MessageCircle size={16} />
          Open Tracker
        </button>
      )}
    </div>
  );
}
