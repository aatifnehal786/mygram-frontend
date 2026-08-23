import useUserStore from "../store/useUserStore";

export const apiFetch = async (endpoint, options = {}) => {
  const { token, loggedUser } = useUserStore.getState();
  const finalToken = token || loggedUser?.token || loggedUser?.user?.token;
  const isFormData = options.body instanceof FormData;
  const isFileDownload = options.isBlob;

  const headers = {
  ...(isFormData || isFileDownload? {} : { "Content-Type": "application/json" }),
  ...(finalToken? { Authorization: `Bearer ${finalToken}` } : {}),
  ...options.headers,
  };

  // FIX: If endpoint is already full URL (cloudinary), don't prepend apiUrl
  const isAbsoluteUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://');
  const apiUrl = "https://mygram-mvc.onrender.com";
  const url = isAbsoluteUrl? endpoint : `${apiUrl}/${endpoint.startsWith("/")? endpoint.slice(1) : endpoint}`;

  const response = await fetch(url, {...options, headers });

  if (isFileDownload) {
    if (!response.ok) throw new Error(`Failed ${response.status}`);
    return response;
  }

  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(data.message || `Failed ${response.status}`);
  return data;
};