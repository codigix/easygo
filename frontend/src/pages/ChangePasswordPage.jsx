import { useState } from "react";
import axios from "axios";
import { Lock, AlertCircle, CheckCircle, Loader } from "lucide-react";

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleToggleVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    if (!formData.oldPassword) {
      setError("Old password is required");
      return false;
    }

    if (!formData.newPassword) {
      setError("New password is required");
      return false;
    }

    if (!formData.confirmPassword) {
      setError("Confirm password is required");
      return false;
    }

    if (formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password do not match");
      return false;
    }

    if (formData.oldPassword === formData.newPassword) {
      setError("New password must be different from old password");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/change-password`,
        {
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccessMessage("Password changed successfully!");
        setFormData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        // Auto-dismiss success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to change password";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setError("");
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="bg-emerald-500 rounded-lg p-3">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Change Password</h1>
              <p className="text-emerald-100">Update your account password securely</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Form Section */}
          <div className="md:col-span-2">
            <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-800">
                    {successMessage}
                  </span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Old Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Old Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.old ? "text" : "password"}
                      name="oldPassword"
                      value={formData.oldPassword}
                      onChange={handleInputChange}
                      placeholder="Enter your current password"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility("old")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showPasswords.old ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Enter your new password"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility("new")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showPasswords.new ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your new password"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility("confirm")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showPasswords.confirm ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 transition-all text-sm font-semibold shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Password"
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              {/* Password Requirements */}
              <div className="mt-8 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-4">
                <h4 className="text-sm font-semibold text-emerald-900 mb-2">
                  Password Requirements:
                </h4>
                <ul className="text-sm text-emerald-800 space-y-1">
                  <li>• Minimum 6 characters long</li>
                  <li>• Must be different from current password</li>
                  <li>• New password and confirm password must match</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Help Panel */}
          <div className="md:col-span-1">
            <div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 sticky top-6 shadow-sm">
              <h3 className="text-sm font-semibold text-emerald-900 mb-4">
                Security Tips
              </h3>
              <ul className="space-y-3 text-sm text-emerald-800">
                <li>
                  <strong>Use strong passwords:</strong> Mix uppercase,
                  lowercase, numbers, and symbols for maximum security.
                </li>
                <li>
                  <strong>Never share:</strong> Keep your password confidential
                  and never share it with anyone.
                </li>
                <li>
                  <strong>Change regularly:</strong> Update your password
                  periodically for better security.
                </li>
                <li>
                  <strong>Unique password:</strong> Use different passwords for
                  different accounts.
                </li>
                <li>
                  <strong>Avoid patterns:</strong> Don't use sequential numbers
                  or keyboard patterns.
                </li>
              </ul>

              <div className="mt-6 rounded-lg bg-emerald-100 border border-emerald-300 p-3">
                <p className="text-xs text-emerald-900">
                  💡 <strong>Tip:</strong> After changing your password, you'll
                  be logged out for security. Sign in again with your new
                  password.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
