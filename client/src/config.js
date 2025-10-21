// Central API base for the client. Use Vite's env var VITE_API_BASE to override in production.
export const API_BASE = import.meta.env.DEV
  ? "http://localhost:3000"
  : (import.meta.env.VITE_API_BASE || "https://api.filecloud.azaken.com");

export default API_BASE;
