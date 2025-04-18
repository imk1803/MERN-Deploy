import axios from 'axios';

// API URL from environment variable or default to production URL
// Make sure it has no trailing slash
const API_URL = (process.env.REACT_APP_API_URL || 'https://curvot.onrender.com/api').replace(/\/$/, '');

// Log the API URL to help with debugging
console.log('API URL being used:', API_URL);

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
    },
    // Add timeout and retry configuration
    timeout: 10000, // 10 seconds timeout
    // Ensure cookies are included in all requests
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
  });

  // Add request interceptor for auth headers
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Ensure cookies are sent with each request
      config.withCredentials = true;
      
      // Log every request to help with debugging
      console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
      console.log('Request headers:', config.headers);
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor for error handling
  instance.interceptors.response.use(
    (response) => {
      // Log successful responses for debugging
      console.log(`API Response (${response.status}):`, response.config.url);
      return response;
    },
    (error) => {
      console.error('API Error:', error.response?.data || error.message);
      console.error('Request that failed:', error.config?.method, error.config?.url);
      
      // Check for session related errors
      if (error.response?.status === 401) {
        console.warn('Authentication error - session may have expired');
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
};

// Default API instance
export const apiClient = createAxiosInstance();

export default apiClient; 