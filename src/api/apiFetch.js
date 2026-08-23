import useUserStore from "../store/useUserStore";

export const apiFetch = async (endpoint, options = {}) => {
  const { token, loggedUser } = useUserStore.getState();
  const finalToken = token || loggedUser?.token || loggedUser?.user?.token;

  const isFormData = options.body instanceof FormData;

  const headers = {
  ...(isFormData? {} : { "Content-Type": "application/json" }),
  ...(finalToken? { Authorization: `Bearer ${finalToken}` } : {}),
  ...options.headers,
  };

  const cleanEndpoint = endpoint.startsWith("/")? endpoint.slice(1) : endpoint;
  const apiUrl = "https://mygram-mvc.onrender.com";

  const response = await fetch(`${apiUrl}/${cleanEndpoint}`, {
  ...options,
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    console.error(`API ERROR ${response.status} on ${cleanEndpoint}:`, data);

    // Special handling for Rate Limit
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      const msg = data.message || data.error || `Too many requests. Try again after ${retryAfter}s`;

      // Dispatch global event so Layout can show toast
      window.dispatchEvent(new CustomEvent('rate-limit-error', { detail: msg }));

      throw new Error(msg);
    }

    throw new Error(data.message || data.error || `Failed ${response.status}`);
  }

  if (data.error) throw new Error(data.error);

  return data;
};