import { useEffect, useState } from "react";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = JSON.parse(localStorage.getItem("token-auth"))?.token;

  // Fetch devices from backend
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/get-devices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
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

  // Remove a device
  const removeDevice = async (deviceId) => {
    if (!window.confirm("Are you sure you want to remove this device?")) return;

    try {
      const res = await fetch(`http://localhost:8000/remove-device/${deviceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Device removed successfully");
        // Refresh device list
        setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
      } else {
        setMessage(data.message || "Failed to remove device");
      }
    } catch (err) {
      console.error("Error removing device:", err);
      setMessage("Error removing device");
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <section className="container">
      <h2>Authorized Devices</h2>
      {loading && <p>Loading...</p>}
      {message && <p>{message}</p>}

      {devices.length === 0 ? (
        <p>No devices found</p>
      ) : (
        <ul className="device-list">
          {devices.map((device, index) => (
            <li key={index} className="device-item">
              <p><strong>Device ID:</strong> {device.deviceId}</p>
              <p><strong>IP:</strong> {device.ip}</p>
              <p><strong>UserAgent:</strong> {device.userAgent || device.browser}</p>
              <p><strong>Last Used:</strong> {new Date(device.lastUsed).toLocaleString()}</p>
              <button onClick={() => removeDevice(device.deviceId)} className="btn-danger">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
