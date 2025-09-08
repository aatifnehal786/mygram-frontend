import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api"; // 👈 import the helper
import "./devices.css";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const currentDeviceId = localStorage.getItem("deviceId");

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const { res, data } = await apiFetch("https://mygram-1-1nua.onrender.com/devices");
      if (res.ok) setDevices(data.devices || []);
      else setMessage(data.message || "Failed to fetch devices");
    } catch {
      setMessage("Error fetching devices");
    } finally {
      setLoading(false);
    }
  };

  const removeDevice = async (deviceId) => {
    try {
      const { res, data } = await apiFetch(`https://mygram-1-1nua.onrender.com/devices/${deviceId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDevices(data.devices); // update UI
        setMessage("Device removed successfully");
      } else setMessage(data.message || "Failed to remove device");
    } catch {
      setMessage("Error removing device");
    }
  };

  const removeAllDevices = async () => {
    try {
      const { res, data } = await apiFetch(`https://mygram-1-1nua.onrender.com/devices/remove-all`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDevices([]);
        setMessage("All devices removed");
      } else setMessage(data.message || "Failed to remove devices");
    } catch {
      setMessage("Error removing devices");
    }
  };

  const removeOtherDevices = async () => {
    try {
      const { res, data } = await apiFetch(
        `https://mygram-1-1nua.onrender.com/devices/remove-others/${currentDeviceId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setDevices(data.devices);
        setMessage("Logged out from all other devices");
      } else setMessage(data.message || "Failed to remove devices");
    } catch {
      setMessage("Error removing devices");
    }
  };

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
            <button className="btn-danger" onClick={removeAllDevices}>
              Remove All Devices
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
