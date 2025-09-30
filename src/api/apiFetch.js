export const apiFetch = async (endpoint, options = {}) => {
  const token = JSON.parse(localStorage.getItem("token-auth"))?.token;
  const deviceId = localStorage.getItem("deviceId");

  // ✅ Check if body is FormData (don't set Content-Type manually)
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(deviceId ? { "x-device-id": deviceId } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`https://mygram-1-1nua.onrender.com/${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    // ⚠️ Handle network errors (no server response)
    console.error("Network error:", err);
    return { error: "Network error. Please check your connection." };
  }

  // ✅ Parse JSON safely (fallback to text if not valid JSON)
  let data;
  const text = await response.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  // ⚠️ Handle unauthorized / device removal
  if (data?.error?.includes("Device removed")) {
    alert("This device has been removed. Redirecting to login...");
    localStorage.removeItem("token-auth");
    localStorage.removeItem("deviceId");
    window.location.href = "/login";
    return;
  }

  // ⚠️ Handle expired/invalid token (common case)
  if (response.status === 401 || data?.error?.includes("Invalid token")) {
    alert("Session expired. Please log in again.");
    localStorage.removeItem("token-auth");
    window.location.href = "/login";
    return;
  }

  return data;
};
