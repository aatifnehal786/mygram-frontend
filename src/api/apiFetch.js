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

  const res = await fetch(`https://mygram-mvc.onrender.com/${endpoint}`, {
    ...options,
    headers,
  });

  // ✅ Try parsing JSON, fallback to text
  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  // ⚠️ Auto logout if device removed
  if ( data.error?.includes("Device removed")) {
    alert("This device has been removed. Redirecting to login...");
    localStorage.removeItem("token-auth");
    localStorage.removeItem("deviceId");
    window.location.href = "/login";
    return;
  }



  return data;
};
