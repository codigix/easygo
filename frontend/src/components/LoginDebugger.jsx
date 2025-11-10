import { useState } from "react";
import api from "../services/api";

export function LoginDebugger() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setStatus("🔄 Testing connection...\n");

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      setStatus((prev) => prev + `✅ API URL: ${apiUrl}\n`);

      const response = await api.get("/auth/health", { timeout: 5000 });
      setStatus(
        (prev) => prev + `✅ Backend is responding\nResponse: ${JSON.stringify(response.data)}\n`
      );
    } catch (error) {
      setStatus(
        (prev) =>
          prev +
          `❌ Connection Error: ${error.message}\n` +
          `Status: ${error.response?.status}\n` +
          `Response: ${JSON.stringify(error.response?.data)}\n`
      );
    }

    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    setStatus("🔄 Testing login...\n");

    try {
      const response = await api.post("/auth/login", {
        username: "admin",
        password: "password123",
      });

      setStatus(
        (prev) =>
          prev +
          `✅ Login successful!\n` +
          `Response: ${JSON.stringify(response.data, null, 2)}\n`
      );
    } catch (error) {
      setStatus(
        (prev) =>
          prev +
          `❌ Login Error: ${error.message}\n` +
          `Status: ${error.response?.status}\n` +
          `Response: ${JSON.stringify(error.response?.data, null, 2)}\n`
      );
    }

    setLoading(false);
  };

  const testDatabase = async () => {
    setLoading(true);
    setStatus("🔄 Testing database users...\n");

    try {
      const response = await api.get("/auth/debug/users");
      setStatus(
        (prev) =>
          prev +
          `✅ Database query successful!\n` +
          `Response: ${JSON.stringify(response.data, null, 2)}\n`
      );
    } catch (error) {
      setStatus(
        (prev) =>
          prev +
          `❌ Database Error: ${error.message}\n` +
          `Status: ${error.response?.status}\n` +
          `Response: ${JSON.stringify(error.response?.data, null, 2)}\n`
      );
    }

    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-gray-900 text-gray-100 rounded-lg p-4 overflow-auto text-xs font-mono border border-gray-700 shadow-lg z-50">
      <h3 className="font-bold mb-3 text-yellow-400">🔧 Login Debugger</h3>

      <div className="space-y-2 mb-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-2 rounded text-white text-xs"
        >
          Test API Connection
        </button>
        <button
          onClick={testLogin}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-2 rounded text-white text-xs"
        >
          Test Admin Login
        </button>
        <button
          onClick={testDatabase}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-3 py-2 rounded text-white text-xs"
        >
          Check Database Users
        </button>
      </div>

      <div className="bg-gray-800 p-2 rounded h-64 overflow-y-auto whitespace-pre-wrap text-green-400">
        {status || "Click a button to test..."}
      </div>
    </div>
  );
}
