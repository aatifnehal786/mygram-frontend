import useUserStore from "../store/useUserStore";

export const apiFetch = async (endpoint, options = {}) => {
  const { token, loggedUser } = useUserStore.getState();
  // try both new and old structure
  const finalToken = token || loggedUser?.token;

  const isFormData = options.body instanceof FormData;

  const headers = {
   ...(isFormData? {} : { "Content-Type": "application/json" }),
   ...(finalToken? { Authorization: `Bearer ${finalToken}` } : {}),
   ...options.headers,
  };

  let response;
  try {
    const cleanEndpoint = endpoint.startsWith('/')? endpoint.slice(1) : endpoint;
    const apiUrl = "https://mygram-mvc.onrender.com";
    response = await fetch(`${apiUrl}/${cleanEndpoint}`, {
     ...options,
      headers,
    });
  } catch (err) {
    return { error: "Network error" };
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text, status: response.status };
  }
};