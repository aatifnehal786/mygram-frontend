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
      const res = await fetch("http://localhost:8000/devices", {
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
      // Optimistic update (remove from UI instantly)
      setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));

      const res = await fetch(`http://localhost:8000/devices/${deviceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Device removed successfully");
      } else {
        setMessage(data.message || "Failed to remove device");
        fetchDevices(); // rollback if failed
      }
    } catch {
      setMessage("Error removing device");
      fetchDevices();
    }
  };

  // ✅ Remove all devices
  const removeAllDevices = async () => {
    try {
      setDevices([]); // Optimistic clear

      const res = await fetch(`http://localhost:8000/devices/remove-all`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("All devices removed");
      } else {
        setMessage(data.message || "Failed to remove devices");
        fetchDevices();
      }
    } catch {
      setMessage("Error removing devices");
      fetchDevices();
    }
  };

  // ✅ Remove all other devices
  const removeOtherDevices = async () => {
    try {
      setDevices((prev) => prev.filter((d) => d.deviceId === currentDeviceId));

      const res = await fetch(
        `http://localhost:8000/devices/remove-others/${currentDeviceId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setMessage("Logged out from all other devices");
      } else {
        setMessage(data.message || "Failed to remove devices");
        fetchDevices();
      }
    } catch {
      setMessage("Error removing devices");
      fetchDevices();
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
