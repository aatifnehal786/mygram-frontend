import { useEffect, useState } from "react";
import "./devices.css"; // Import CSS file

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = JSON.parse(localStorage.getItem("token-auth"))?.token;
  const currentDeviceId = localStorage.getItem("deviceId"); // 👈 current device id

  // ✅ Fetch devices from backend
  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://mygram-1-1nua.onrender.com/devices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDevices(data.devices || []);
      } else {
        setMessage(data.message || "Failed to fetch devices");
      }
    } catch {
      setMessage("Error fetching devices");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Remove one device
  const removeDevice = async (deviceId) => {
    try {
      const res = await fetch(
        `https://mygram-1-1nua.onrender.com/devices/${deviceId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setDevices(data.devices); // always trust backend response
        setMessage("Device removed successfully");
      } else {
        setMessage(data.message || "Failed to remove device");
      }
    } catch {
      setMessage("Error removing device");
    }
  };

  // ✅ Remove all devices
  const removeAllDevices = async () => {
    try {
      const res = await fetch(
        `https://mygram-1-1nua.onrender.com/devices/remove-all`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setDevices([]); // backend already cleared
        setMessage("All devices removed");
      } else {
        setMessage(data.message || "Failed to remove devices");
      }
    } catch {
      setMessage("Error removing devices");
    }
  };

  // ✅ Remove all other devices
  const removeOtherDevices = async () => {
    try {
      const res = await fetch(
        `https://mygram-1-1nua.onrender.com/devices/remove-others/${currentDeviceId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setDevices(data.devices); // updated from backend
        setMessage("Logged out from all other devices");
      } else {
        setMessage(data.message || "Failed to remove devices");
      }
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
                  <strong>UserAgent:</strong>{" "}
                  {device.userAgent || device.browser}
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
