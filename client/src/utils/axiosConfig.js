import axios from 'axios';

// API URL from environment variable or default to production URL
const API_URL = process.env.REACT_APP_API_URL || 'https://curvot.onrender.com/api';

// Global axios configuration
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

/**
 * Create a pre-configured axios instance for API calls
 * @param {string} baseURL - Optional override for the base URL
 * @returns {AxiosInstance} A configured axios instance
 */
export const createAxiosInstance = (baseURL = API_URL) => {
  const instance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add request interceptor for auth headers
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error.response?.data || error.message);
      return Promise.reject(error);
    }
  );

  return instance;
};

// Default API instance
export const apiClient = createAxiosInstance();

export default apiClient; 