import { useEffect, useState } from "react";
import { apiFetch } from "../api/apiFetch"; // 👈 import the helper
import "./devices.css";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const currentDeviceId = localStorage.getItem("deviceId");

  const fetchDevices = async () => {
  setLoading(true);
  try {
    const data = await apiFetch("api/devices"); // ✅ relative path
  setDevices(data.devices || []);
  } catch (err) {
    console.error("Error fetching devices:", err);
    setMessage("Error fetching devices");
  } finally {
    setLoading(false);
  }
};

const removeDevice = async (deviceId) => {
  try {
    const  data  = await apiFetch(`api/${deviceId}`, {
      method: "DELETE",
    });

   
      setDevices(data.devices || []); // ensure array
      setMessage("Device removed successfully");
      setTimeout(() => setMessage(""), 5000)
   ;
    
  } catch (err) {
    console.error("Error removing device:", err);
    setMessage("Error removing device");
  }
};

const removeOtherDevices = async () => {
  try {
    const data = await apiFetch(`api/devices/remove-others/${currentDeviceId}`, {
      method: "DELETE",
    });

    if (data) {
      setDevices(data.devices || []);
      setMessage("Logged out from all other devices");
      setTimeout(() => setMessage(""), 5000)
    } else {
      setMessage(data.message || "Failed to remove devices");
    }
  } catch (err) {
    console.error("Error removing other devices:", err);
    setMessage("Error removing devices");
  }
};

// ✅ Auto-fetch on mount
useEffect(() => {
  fetchDevices();
}, []);


  return (
  <section className="max-w-4xl mx-auto px-4 py-6">

    <h2 className="text-xl font-semibold mb-4">
      Authorized Devices
    </h2>

    {loading && (
      <p className="text-sm text-gray-500 mb-3">Loading...</p>
    )}

    {message && (
      <p className="text-sm text-green-600 mb-3">{message}</p>
    )}

    {devices.length === 0 ? (
      <p className="text-sm text-gray-500">
        No devices found
      </p>
    ) : (
      <>
        {/* Actions */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={removeOtherDevices}
            disabled={!currentDeviceId}
            className="
              bg-yellow-500 text-white px-4 py-2 rounded-md text-sm
              hover:bg-yellow-600 transition
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Logout from all other devices
          </button>
        </div>

        {/* Device List */}
        <ul className="space-y-3">
          {devices.map((device, index) => (
            <li
              key={index}
              className="
                bg-white border rounded-lg p-4
                flex flex-col sm:flex-row sm:justify-between sm:items-center
                gap-3 shadow-sm
              "
            >
              {/* Info */}
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <span className="font-medium">Device ID:</span>{" "}
                  <span className="break-all">{device.deviceId}</span>
                </p>
                <p>
                  <span className="font-medium">IP:</span> {device.ip}
                </p>
                <p>
                  <span className="font-medium">User Agent:</span>{" "}
                  {device.userAgent || device.browser}
                </p>
                <p className="text-xs text-gray-500">
                  Last used:{" "}
                  {new Date(device.lastUsed).toLocaleString()}
                </p>
              </div>

              {/* Action */}
              <button
                onClick={() => removeDevice(device.deviceId)}
                disabled={device.deviceId === currentDeviceId}
                className="
                  bg-red-500 text-white px-4 py-2 rounded-md text-sm
                  hover:bg-red-600 transition
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </>
    )}
  </section>
);

}
