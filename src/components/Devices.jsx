import { useEffect, useState } from "react";
import { apiFetch } from "../api/api"; // 👈 import the helper
import "./devices.css";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const currentDeviceId = localStorage.getItem("deviceId");

  const fetchDevices = async () => {
  setLoading(true);
  try {
    const { res, data } = await apiFetch("/devices"); // ✅ relative path
    if (res.ok) {
      setDevices(data.devices || []);
    } else {
      setMessage(data.message || "Failed to fetch devices");
    }
  } catch (err) {
    console.error("Error fetching devices:", err);
    setMessage("Error fetching devices");
  } finally {
    setLoading(false);
  }
};

const removeDevice = async (deviceId) => {
  try {
    const { res, data } = await apiFetch(`/devices/${deviceId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setDevices(data.devices || []); // ✅ ensure array
      setMessage("Device removed successfully");
    } else {
      setMessage(data.message || "Failed to remove device");
    }
  } catch (err) {
    console.error("Error removing device:", err);
    setMessage("Error removing device");
  }
};

const removeOtherDevices = async () => {
  try {
    const { res, data } = await apiFetch(`/devices/remove-others/${currentDeviceId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setDevices(data.devices || []);
      setMessage("Logged out from all other devices");
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
    <section className="container4">
      <h2>Authorized Devices</h2>
      {loading && <p>Loading...</p>}
      {message && <p>{message}</p>}

      {devices.length === 0 ? (
        <p>No devices found</p>
      ) : (
        <>
          <div className="device-actions">
            <button
              className="btn-warning"
              onClick={removeOtherDevices}
              disabled={!currentDeviceId}
            >
              Logout from all other devices
            </button>
           
          </div>

          <ul className="device-list">
            {devices.map((device, index) => (
              <li key={index} className="device-item">
                <p>
                  <strong>Device ID:</strong> {device.deviceId}
                </p>
                <p>
                  <strong>IP:</strong> {device.ip}
                </p>
                <p>
                  <strong>UserAgent:</strong> {device.userAgent || device.browser}
                </p>
                <p>
                  <strong>Last Used:</strong> {new Date(device.lastUsed).toLocaleString()}
                </p>
                <button
                  onClick={() => removeDevice(device.deviceId)}
                  className="btn-danger"
                  disabled={device.deviceId === currentDeviceId} // prevent removing current
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
