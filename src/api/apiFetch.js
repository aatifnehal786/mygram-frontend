
import useUserStore from "../store/useUserStore";
export const apiFetch = async (endpoint, options = {}) => {
  const token = useUserStore.getState().loggedUser?.token;
  const deviceId = localStorage.getItem("deviceId");

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(deviceId && { "x-device-id": deviceId }),
    ...options.headers,
  };

  let response;
  try {
    const apiUrl = "https://mygram-mvc.onrender.com";
    response = await fetch(`${apiUrl}/${endpoint}`, {
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

    
     
    
  

  return data;
};