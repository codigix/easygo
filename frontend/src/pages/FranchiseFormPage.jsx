import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

const FranchiseFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [currentStep, setCurrentStep] = useState(1); // 1: Franchisee, 2: Sectors, 3: Upload
  const [stepCompleted, setStepCompleted] = useState({
    franchisee: false,
    sectors: false,
  }); // Track which steps are completed
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    franchise_code: "",
    franchise_name: "",
    owner_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gst_number: "",
    cst_number: "",
    pan_number: "",
    service_tax_number: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
    branch_name: "",
    account_type: "savings",
    pdf_service_charge: 0,
    non_dest_charge: 0,
    is_gst_verified: false,
    is_approved_receiver: false,
    use_as_consignor: true,
    franchisee_remarks: "",
    subscription_start_date: "",
    subscription_end_date: "",
    subscription_status: "active",
    status: "active",
  });

  // Sectors state
  const [sectors, setSectors] = useState([
    {
      sector_name: "",
      pincodes: "",
      dox: false,
      nondox_air: false,
      nondox_sur: false,
      express_cargo: false,
      priority: false,
      ecom_priority: false,
      ecom_ge: false,
    },
  ]);

  // Upload state
  const [uploadUrls, setUploadUrls] = useState({
    logo_url: null,
    stamp_url: null,
    qr_code_url: null,
  });
  const [uploading, setUploading] = useState({
    logo: false,
    stamp: false,
    qr_code: false,
  });

  useEffect(() => {
    if (isEdit) {
      fetchFranchise();
      fetchSectors();
      // Mark franchisee as completed when editing existing
      setStepCompleted({ franchisee: true, sectors: true });
      setCurrentStep(2); // Start at sectors step for existing franchises
    }
  }, [id]);

  const fetchFranchise = async () => {
    try {
      const response = await api.get(`/franchises/${id}`);
      const franchise = response.data.data;
      setFormData(franchise);
      setUploadUrls({
        logo_url: franchise.logo_url,
        stamp_url: franchise.stamp_url,
        qr_code_url: franchise.qr_code_url,
      });
    } catch (error) {
      console.error("Error fetching franchise:", error);
      alert("Failed to load franchise data");
    }
  };

  const fetchSectors = async () => {
    try {
      const response = await api.get(`/sectors/franchise/${id}`);
      if (response.data.data.length > 0) {
        setSectors(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching sectors:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await api.put(`/franchises/${id}`, formData);
        setStepCompleted({ ...stepCompleted, franchisee: true });
        setCurrentStep(2); // Auto move to Sectors step
        alert("✅ Franchisee saved successfully! Moving to sectors...");
      } else {
        const response = await api.post("/franchises", formData);
        const newId = response.data.data.id;
        setStepCompleted({ ...stepCompleted, franchisee: true });
        alert("✅ Franchisee created successfully! Moving to sectors...");
        navigate(`/franchises/edit/${newId}`);
      }
    } catch (error) {
      console.error("Error saving franchise:", error);
      alert(error.response?.data?.message || "Failed to save franchise");
    } finally {
      setLoading(false);
    }
  };

  // Sector handlers
  const addSector = () => {
    setSectors([
      ...sectors,
      {
        sector_name: "",
        pincodes: "",
        dox: false,
        nondox_air: false,
        nondox_sur: false,
        express_cargo: false,
        priority: false,
        ecom_priority: false,
        ecom_ge: false,
      },
    ]);
  };

  const removeSector = (index) => {
    const newSectors = sectors.filter((_, i) => i !== index);
    setSectors(newSectors);
  };

  const handleSectorChange = (index, field, value) => {
    const newSectors = [...sectors];
    newSectors[index][field] = value;
    setSectors(newSectors);
  };

  const saveSectors = async () => {
    if (!isEdit) {
      alert("Please save the franchise first before adding sectors");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/sectors/franchise/${id}`, { sectors });
      setStepCompleted({ ...stepCompleted, sectors: true });
      setCurrentStep(3); // Auto move to Upload step
      alert("✅ Sectors saved successfully! Moving to upload...");
      fetchSectors();
    } catch (error) {
      console.error("Error saving sectors:", error);
      alert("Failed to save sectors");
    } finally {
      setLoading(false);
    }
  };

  // Upload handlers
  const handleFileUpload = async (type, file) => {
    if (!isEdit) {
      alert("Please save the franchise first before uploading files");
      return;
    }

    if (!file) return;

    setUploading({ ...uploading, [type]: true });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await api.post(`/uploads/franchise/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadUrls({
        ...uploadUrls,
        [`${type}_url`]: response.data.data.url,
      });

      alert("File uploaded successfully");
      fetchFranchise();
    } catch (error) {
      console.error("Upload error:", error);
      alert(error.response?.data?.message || "Failed to upload file");
    } finally {
      setUploading({ ...uploading, [type]: false });
    }
  };

  const handleFileRemove = async (type) => {
    if (!confirm("Are you sure you want to remove this file?")) return;

    setUploading({ ...uploading, [type]: true });

    try {
      await api.delete(`/uploads/franchise/${id}`, { data: { type } });

      setUploadUrls({
        ...uploadUrls,
        [`${type}_url`]: null,
      });

      alert("File removed successfully");
      fetchFranchise();
    } catch (error) {
      console.error("Remove error:", error);
      alert("Failed to remove file");
    } finally {
      setUploading({ ...uploading, [type]: false });
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          {isEdit ? "Edit Franchisee" : "Add New Franchisee"}
        </h1>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {/* Step 1 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mb-2 transition-all ${
                  currentStep >= 1 ? "bg-emerald-600" : "bg-gray-300"
                }`}
              >
                {stepCompleted.franchisee ? "✓" : "1"}
              </div>
              <p className="text-sm font-medium text-gray-700">
                Franchisee Info
              </p>
            </div>

            {/* Arrow 1 */}
            <div
              className={`flex-1 h-1 mx-2 mb-6 transition-all ${
                stepCompleted.franchisee ? "bg-emerald-600" : "bg-gray-300"
              }`}
            ></div>

            {/* Step 2 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mb-2 transition-all ${
                  currentStep >= 2 ? "bg-emerald-600" : "bg-gray-300"
                }`}
              >
                {stepCompleted.sectors ? "✓" : "2"}
              </div>
              <p className="text-sm font-medium text-gray-700">Sectors</p>
            </div>

            {/* Arrow 2 */}
            <div
              className={`flex-1 h-1 mx-2 mb-6 transition-all ${
                currentStep >= 3 ? "bg-emerald-600" : "bg-gray-300"
              }`}
            ></div>

            {/* Step 3 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mb-2 transition-all ${
                  currentStep >= 3 ? "bg-emerald-600" : "bg-gray-300"
                }`}
              >
                3
              </div>
              <p className="text-sm font-medium text-gray-700">Upload Files</p>
            </div>
          </div>
        </div>

        {/* Info Message */}
        {currentStep === 1 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📝 Step 1 of 3:</strong> Fill in the franchisee
              information and click Save to proceed to sectors.
            </p>
          </div>
        )}
        {currentStep === 2 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📝 Step 2 of 3:</strong> Add sectors for this franchisee
              and click Save to proceed to uploads.
            </p>
          </div>
        )}
        {currentStep === 3 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📝 Step 3 of 3:</strong> Upload logo, stamp, and QR code
              for this franchisee.
            </p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Step 1: Franchisee */}
          {currentStep === 1 && (
            <form id="franchisee-form" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    FR Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="franchise_code"
                    value={formData.franchise_code}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Franchisee Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="franchise_name"
                    value={formData.franchise_name}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Owner Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Invoice Start Prefix
                  </label>
                  <input
                    type="text"
                    name="invoice_prefix"
                    value={formData.invoice_prefix || ""}
                    onChange={handleChange}
                    placeholder="INV"
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    ARN (Application Reference Number)
                  </label>
                  <input
                    type="text"
                    name="arn"
                    value={formData.arn || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    GST No
                  </label>
                  <input
                    type="text"
                    name="gst_number"
                    value={formData.gst_number}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Pan No
                  </label>
                  <input
                    type="text"
                    name="pan_number"
                    value={formData.pan_number || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Service No
                  </label>
                  <input
                    type="text"
                    name="service_tax_number"
                    value={formData.service_tax_number || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Service Area
                  </label>
                  <input
                    type="text"
                    name="service_area"
                    value={formData.service_area || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Account Name
                  </label>
                  <input
                    type="text"
                    name="account_name"
                    value={formData.account_name || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Account No
                  </label>
                  <input
                    type="text"
                    name="account_number"
                    value={formData.account_number || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    name="ifsc_code"
                    value={formData.ifsc_code || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    name="branch_name"
                    value={formData.branch_name || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Account Type
                  </label>
                  <select
                    name="account_type"
                    value={formData.account_type || "savings"}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  >
                    <option value="savings">Savings</option>
                    <option value="current">Current</option>
                    <option value="cc">CC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subscription Start Date
                  </label>
                  <input
                    type="date"
                    name="subscription_start_date"
                    value={formData.subscription_start_date || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subscription End Date
                  </label>
                  <input
                    type="date"
                    name="subscription_end_date"
                    value={formData.subscription_end_date || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    GEC Service (Applicable/Not)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_gst_verified"
                      checked={formData.is_gst_verified || false}
                      onChange={handleChange}
                      className="mr-2 w-4 h-4"
                    />
                    <span className="text-sm text-gray-600">
                      Check the option if the GEC service is applicable for this
                      entry. Leave it unchecked if not applicable.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Template For the Invoice
                  </label>
                  <select
                    name="invoice_template"
                    value={formData.invoice_template || "template_1"}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  >
                    <option value="template_1">Template 1</option>
                    <option value="template_2">Template 2</option>
                    <option value="template_3">Template 3</option>
                  </select>
                </div>
              </div>
            </form>
          )}

          {/* Step 2: Sectors */}
          {currentStep === 2 && (
            <div>
              {/* Display Franchisee Data (Read-only) */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-60">
                <h3 className="text-lg font-semibold mb-4 text-gray-600">
                  📋 Franchisee Info (Read-only)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Code:</p>
                    <p className="text-gray-800">{formData.franchise_code}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Name:</p>
                    <p className="text-gray-800">{formData.franchise_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Owner:</p>
                    <p className="text-gray-800">{formData.owner_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Email:</p>
                    <p className="text-gray-800">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Service Area:</p>
                    <p className="text-gray-800">
                      {formData.service_area || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Account Name:</p>
                    <p className="text-gray-800">
                      {formData.account_name || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <hr className="my-6" />
              <h3 className="text-lg font-semibold mb-4">Add Sectors</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Note:</strong> Arrange the Priority based on the
                  sequence you prefer for displaying sectors, and fill in with
                  semi-colon.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="border px-2 py-3 text-sm">Sr.No</th>
                      <th className="border px-2 py-3 text-sm">Sector Name</th>
                      <th className="border px-2 py-3 text-sm">Pincode</th>
                      <th className="border px-2 py-3 text-sm">DOX</th>
                      <th className="border px-2 py-3 text-sm">NONDOX Air</th>
                      <th className="border px-2 py-3 text-sm">NONDOX Sur</th>
                      <th className="border px-2 py-3 text-sm">
                        EXPRESS CARGO
                      </th>
                      <th className="border px-2 py-3 text-sm">PRIORITY</th>
                      <th className="border px-2 py-3 text-sm">
                        ECOM PRIORITY
                      </th>
                      <th className="border px-2 py-3 text-sm">ECOM GE</th>
                      <th className="border px-2 py-3 text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectors.map((sector, index) => (
                      <tr key={index}>
                        <td className="border px-2 py-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border px-2 py-2">
                          <input
                            type="text"
                            value={sector.sector_name}
                            onChange={(e) =>
                              handleSectorChange(
                                index,
                                "sector_name",
                                e.target.value
                              )
                            }
                            className="w-full border rounded px-2 py-1"
                          />
                        </td>
                        <td className="border px-2 py-2">
                          <textarea
                            value={sector.pincodes}
                            onChange={(e) =>
                              handleSectorChange(
                                index,
                                "pincodes",
                                e.target.value
                              )
                            }
                            rows="2"
                            className="w-full border rounded px-2 py-1"
                          />
                        </td>
                        <td className="border px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={sector.dox}
                            onChange={(e) =>
                              handleSectorChange(index, "dox", e.target.checked)
                            }
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={sector.nondox_air}
                            onChange={(e) =>
                              handleSectorChange(
                                index,
                                "nondox_air",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={sector.nondox_sur}
                            onChange={(e) =>
                              handleSectorChange(
                                index,
                                "nondox_sur",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={sector.express_cargo}
                            onChange={(e) =>
                              handleSectorChange(
                                index,
                                "express_cargo",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={sector.priority}
                            onChange={(e) =>
                              handleSectorChange(
                                index,
                                "priority",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={sector.ecom_priority}
                            onChange={(e) =>
                              handleSectorChange(
                                index,
                                "ecom_priority",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={sector.ecom_ge}
                            onChange={(e) =>
                              handleSectorChange(
                                index,
                                "ecom_ge",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeSector(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={addSector}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Add New Sector
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Upload */}
          {currentStep === 3 && (
            <div>
              {/* Display Franchisee Data (Read-only) */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-60">
                <h3 className="text-lg font-semibold mb-4 text-gray-600">
                  📋 Franchisee Info (Read-only)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Code:</p>
                    <p className="text-gray-800">{formData.franchise_code}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Name:</p>
                    <p className="text-gray-800">{formData.franchise_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Owner:</p>
                    <p className="text-gray-800">{formData.owner_name}</p>
                  </div>
                </div>
              </div>

              {/* Display Sectors Data (Read-only) */}
              {sectors.length > 0 && (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-60">
                  <h3 className="text-lg font-semibold mb-4 text-gray-600">
                    📍 Sectors (Read-only)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="border px-2 py-1">Sector</th>
                          <th className="border px-2 py-1">Services</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectors.map((sector, idx) => (
                          <tr key={idx}>
                            <td className="border px-2 py-1 font-medium">
                              {sector.sector_name}
                            </td>
                            <td className="border px-2 py-1 text-xs">
                              {[
                                sector.dox && "DOX",
                                sector.nondox_air && "NONDOX Air",
                                sector.nondox_sur && "NONDOX Sur",
                                sector.express_cargo && "Express",
                                sector.priority && "Priority",
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <hr className="my-6" />
              <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
              <p className="text-sm text-red-600 mb-6">
                <strong>Note:</strong> It will appear on invoice & image must be
                .png or .jpg or .jpeg format
              </p>

              <div className="space-y-8">
                {/* Upload Logo */}
                <div className="flex items-center gap-6 pb-6 border-b">
                  <label className="w-48 font-medium">Upload Logo</label>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) =>
                        handleFileUpload("logo", e.target.files[0])
                      }
                      disabled={uploading.logo}
                      className="block w-full text-sm"
                    />
                  </div>
                  <div className="w-48 text-center">
                    {uploadUrls.logo_url ? (
                      <div>
                        <img
                          src={`${import.meta.env.VITE_API_URL}${
                            uploadUrls.logo_url
                          }`}
                          alt="Logo"
                          className="h-16 mx-auto mb-2"
                        />
                        <button
                          type="button"
                          onClick={() => handleFileRemove("logo")}
                          disabled={uploading.logo}
                          className="px-4 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span className="text-blue-600">Image not Uploaded</span>
                    )}
                  </div>
                </div>

                {/* Upload Stamp */}
                <div className="flex items-center gap-6 pb-6 border-b">
                  <label className="w-48 font-medium">Upload Stamp</label>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) =>
                        handleFileUpload("stamp", e.target.files[0])
                      }
                      disabled={uploading.stamp}
                      className="block w-full text-sm"
                    />
                  </div>
                  <div className="w-48 text-center">
                    {uploadUrls.stamp_url ? (
                      <div>
                        <img
                          src={`${import.meta.env.VITE_API_URL}${
                            uploadUrls.stamp_url
                          }`}
                          alt="Stamp"
                          className="h-16 mx-auto mb-2"
                        />
                        <button
                          type="button"
                          onClick={() => handleFileRemove("stamp")}
                          disabled={uploading.stamp}
                          className="px-4 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span className="text-blue-600">Image not Uploaded</span>
                    )}
                  </div>
                </div>

                {/* Upload QRCode */}
                <div className="flex items-center gap-6 pb-6">
                  <label className="w-48 font-medium">Upload QRCode</label>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) =>
                        handleFileUpload("qr_code", e.target.files[0])
                      }
                      disabled={uploading.qr_code}
                      className="block w-full text-sm"
                    />
                  </div>
                  <div className="w-48 text-center">
                    {uploadUrls.qr_code_url ? (
                      <div>
                        <img
                          src={`${import.meta.env.VITE_API_URL}${
                            uploadUrls.qr_code_url
                          }`}
                          alt="QR Code"
                          className="h-16 mx-auto mb-2"
                        />
                        <button
                          type="button"
                          onClick={() => handleFileRemove("qr_code")}
                          disabled={uploading.qr_code}
                          className="px-4 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span className="text-blue-600">Image not Uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between gap-4">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ← Previous
                </button>
              )}
            </div>
            <div className="flex gap-4">
              {currentStep <= 2 && (
                <button
                  type="button"
                  onClick={() => navigate("/franchises")}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              {currentStep === 1 && (
                <button
                  type="submit"
                  form="franchisee-form"
                  disabled={loading}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save & Next →"}
                </button>
              )}
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={saveSectors}
                  disabled={loading}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save & Next →"}
                </button>
              )}
              {currentStep === 3 && (
                <button
                  type="button"
                  onClick={() => navigate("/franchises")}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  ✓ Complete & Exit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FranchiseFormPage;
