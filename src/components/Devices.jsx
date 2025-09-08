import { useEffect, useState } from "react";
import "./devices.css"; // Import CSS file

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = JSON.parse(localStorage.getItem("token-auth"))?.token;
  const currentDeviceId = localStorage.getItem("deviceId"); // 👈 current device id

  // Fetch devices
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://mygram-1-1nua.onrender.com/get-devices", {
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

  // Remove single device
  const removeDevice = async (deviceId) => {
    if (!window.confirm("Are you sure you want to remove this device?")) return;

    try {
      const res = await fetch(`https://mygram-1-1nua.onrender.com/remove-device/${deviceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Device removed successfully");
        setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
      } else {
        setMessage(data.message || "Failed to remove device");
      }
    } catch (err) {
      console.error("Error removing device:", err);
      setMessage("Error removing device");
    }
  };

  // Remove all other devices
  const removeOtherDevices = async () => {
    if (!window.confirm("This will logout all other devices. Continue?")) return;

    try {
      const res = await fetch(
        `https://mygram-1-1nua.onrender.com/remove-other-devices/${currentDeviceId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setMessage("Logged out from all other devices");
        setDevices((prev) => prev.filter((d) => d.deviceId === currentDeviceId));
      } else {
        setMessage(data.message || "Failed to logout from other devices");
      }
    } catch (err) {
      console.error("Error removing other devices:", err);
      setMessage("Error removing other devices");
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
          <button
            className="btn-warning"
            onClick={removeOtherDevices}
            disabled={!currentDeviceId}
          >
            Logout from all other devices
          </button>

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
                  <strong>Last Used:</strong>{" "}
                  {new Date(device.lastUsed).toLocaleString()}
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
