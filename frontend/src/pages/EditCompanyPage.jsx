import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Info, Edit3, Search } from "lucide-react";

const EditCompanyPage = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    // Filter companies based on search term
    if (searchTerm) {
      const filtered = companies.filter(
        (company) =>
          company.company_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          company.company_id
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          company.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    } else {
      setFilteredCompanies(companies);
    }
    setCurrentPage(1);
  }, [searchTerm, companies]);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/rates/company`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setCompanies(response.data.data);
        setFilteredCompanies(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      alert("Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this company?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/rates/company/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("Company deleted successfully!");
        fetchCompanies();
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      alert(error.response?.data?.message || "Failed to delete company");
    }
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/rates/company/${editingCompany.id}`,
        editingCompany,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        alert("Company updated successfully!");
        setShowEditModal(false);
        fetchCompanies();
      }
    } catch (error) {
      console.error("Error updating company:", error);
      alert(error.response?.data?.message || "Failed to update company");
    }
  };

  const handlePrint = (company) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Company Details - ${company.company_name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
          }
          .status-active {
            background-color: #d4edda;
            color: #155724;
          }
          .status-inactive {
            background-color: #f8d7da;
            color: #721c24;
          }
        </style>
      </head>
      <body>
        <h1>Company Details</h1>
        <table>
          <tr><th>Company ID</th><td>${company.company_id || "N/A"}</td></tr>
          <tr><th>Company Name</th><td>${company.company_name}</td></tr>
          <tr><th>Company Address</th><td>${
            company.company_address || "N/A"
          }</td></tr>
          <tr><th>Phone</th><td>${company.phone || "N/A"}</td></tr>
          <tr><th>Email</th><td>${company.email || "N/A"}</td></tr>
          <tr><th>GST No</th><td>${company.gst_no || "N/A"}</td></tr>
          <tr><th>Insurance %</th><td>${
            company.insurance_percent || "0"
          }</td></tr>
          <tr><th>Minimum Risk Surcharge</th><td>${
            company.minimum_risk_surcharge || "0"
          }</td></tr>
          <tr><th>Other Details</th><td>${
            company.other_details || "N/A"
          }</td></tr>
          <tr><th>Topay Charge</th><td>${company.topay_charge || "0"}</td></tr>
          <tr><th>COD Charge</th><td>${company.cod_charge || "0"}</td></tr>
          <tr><th>Fuel Surcharge %</th><td>${
            company.fuel_surcharge_percent || "0"
          }</td></tr>
          <tr><th>GEC Fuel Surcharge %</th><td>${
            company.gec_fuel_surcharge_percent || "0"
          }</td></tr>
          <tr><th>Royalty Charges %</th><td>${
            company.royalty_charges_percent || "0"
          }</td></tr>
          <tr><th>PAN No</th><td>${company.pan_no || "N/A"}</td></tr>
          <tr><th>Due Days</th><td>${company.due_days || "0"}</td></tr>
          <tr><th>Status</th><td><span class="status status-${
            company.status
          }">${
      company.status === "active" ? "Active" : "Inactive"
    }</span></td></tr>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Pagination calculations
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredCompanies.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(filteredCompanies.length / recordsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                <Edit3 className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-slate-900">
                  Edit Company Rates
                </h1>
                <p className="text-slate-500 mt-1">
                  Manage and edit courier company information
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Info
                className="h-6 w-6 text-emerald-600 cursor-pointer hover:text-emerald-700 transition"
                title="Edit company information"
              />
              <button
                onClick={() => navigate("/ratemaster/add-company")}
                className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
              >
                + Add Company
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-700">Show</label>
            <select
              value={recordsPerPage}
              onChange={(e) => {
                setRecordsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm font-medium text-slate-700">
              records per page
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search company..."
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Sr No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Company Id
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-8 text-center text-slate-500 font-medium"
                    >
                      No companies found
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((company, index) => (
                    <tr
                      key={company.id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                        {indexOfFirstRecord + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            company.status === "active"
                              ? "text-emerald-700 bg-emerald-100"
                              : "text-red-700 bg-red-100"
                          }`}
                        >
                          {company.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                        {company.company_id || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                        {company.company_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {company.phone || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {company.email || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">
                        {company.company_address || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                        <button
                          onClick={() => handleEdit(company)}
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-md hover:bg-emerald-200 transition font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-md hover:bg-red-200 transition font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-50/50 px-6 py-4 flex justify-between items-center border-t border-slate-200">
            <div className="text-sm font-medium text-slate-700">
              Showing {indexOfFirstRecord + 1} to{" "}
              {Math.min(indexOfLastRecord, filteredCompanies.length)} of{" "}
              {filteredCompanies.length} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 transition"
              >
                ← Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 border rounded-lg text-sm transition ${
                      currentPage === page
                        ? "bg-emerald-600 text-white border-emerald-600 font-medium"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 transition"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Edit Company
            </h2>
            <form onSubmit={handleUpdateCompany} className="space-y-4">
              {/* Company ID and Company Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Id <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingCompany.company_id || ""}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        company_id: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingCompany.company_name || ""}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        company_name: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Company Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editingCompany.company_address || ""}
                  onChange={(e) =>
                    setEditingCompany({
                      ...editingCompany,
                      company_address: e.target.value,
                    })
                  }
                  required
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Phone and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingCompany.phone || ""}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        phone: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editingCompany.email || ""}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        email: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* GST No and Insurance % */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingCompany.gst_no || ""}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        gst_no: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insurance %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCompany.insurance_percent || ""}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        insurance_percent: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Minimum Risk Surcharge and Other Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Risk Surcharge
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCompany.minimum_risk_surcharge || ""}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        minimum_risk_surcharge: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Details
                  </label>
                  <input
                    type="text"
                    value={editingCompany.other_details || ""}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        other_details: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Topay Charge and COD Charge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topay Charge
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCompany.topay_charge || ""}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        topay_charge: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    COD Charge
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCompany.cod_charge || ""}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        cod_charge: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Fuel Surcharge % and GEC Fuel Surcharge % */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Surcharge %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCompany.fuel_surcharge_percent || ""}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        fuel_surcharge_percent: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GEC Fuel Surcharge %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCompany.gec_fuel_surcharge_percent || ""}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        gec_fuel_surcharge_percent: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Royalty Charges % and PAN No */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Royalty Charges %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCompany.royalty_charges_percent || ""}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        royalty_charges_percent: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pan No
                  </label>
                  <input
                    type="text"
                    value={editingCompany.pan_no || ""}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        pan_no: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Due Days and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Days
                  </label>
                  <input
                    type="number"
                    value={editingCompany.due_days || ""}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        due_days: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingCompany.status}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        status: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditCompanyPage;
