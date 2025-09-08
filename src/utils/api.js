import { useNavigate } from "react-router-dom";

export const apiFetch = async (url, options = {}) => {
  const token = JSON.parse(localStorage.getItem("token-auth"))?.token;
  const deviceId = localStorage.getItem("deviceId");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-device-id": deviceId,
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();

  // ⚠️ Auto logout if device removed
  if (res.status === 403 && data.error?.includes("Device removed")) {
    alert("This device has been removed. Redirecting to login...");
    localStorage.removeItem("token-auth");
    localStorage.removeItem("deviceId");
    window.location.href = "/login"; // navigate to login
    return;
  }

  return { res, data };
};
