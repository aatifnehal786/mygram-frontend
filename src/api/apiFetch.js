export const apiFetch = async (endpoint, options = {}) => {
  const token = JSON.parse(localStorage.getItem("token-auth"))?.token;
  const deviceId = localStorage.getItem("deviceId");

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(deviceId && { "x-device-id": deviceId }),
    ...options.headers,
  };

  const isPublicRoute =
    endpoint.includes("login") ||
    endpoint.includes("verify-device-otp");

  let response;
  try {
    response = await fetch(`https://mygram-mvc.onrender.com/${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    console.error("Network error:", err);
    return { error: "Network error. Please check your connection." };
  }

  let data;
  const text = await response.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  // ✅ Skip auth handling for login/OTP
  if (!isPublicRoute) {
    if (response.status === 401) {
      alert("Session expired. Please log in again.");
      localStorage.removeItem("token-auth");
      localStorage.removeItem("deviceId");
      window.location.href = "/login";
      return;
    }

    if (response.status === 403) {
      return data; // let UI handle
    }
  }

  return data;
};