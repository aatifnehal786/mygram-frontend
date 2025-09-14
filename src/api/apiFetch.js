import API_BASE_URL from "../config/api";

export const apiFetch = async (endpoint, options = {}) => {
  const token = JSON.parse(localStorage.getItem("token-auth"))?.token;
  const deviceId = localStorage.getItem("deviceId");

  // ✅ Build headers (skip Content-Type if using FormData)
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(deviceId ? { "x-device-id": deviceId } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  // ⚠️ Auto logout if device removed
  if (res.status === 403 && data.error?.includes("Device removed")) {
    alert("This device has been removed. Redirecting to login...");
    localStorage.removeItem("token-auth");
    localStorage.removeItem("deviceId");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};
