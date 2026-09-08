import axios from "axios";

export const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Interceptor global: añade el token JWT automáticamente a las llamadas
// dirigidas a nuestra API (no a servicios externos como Cloudinary).
axios.interceptors.request.use((config) => {
  if (config.url && String(config.url).startsWith(API_URL)) {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export default axios;