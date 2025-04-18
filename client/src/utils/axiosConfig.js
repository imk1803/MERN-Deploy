import axios from 'axios';

// API URL - hardcode để tránh sai sót
const API_URL = 'https://curvot.onrender.com/api';

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
  // Đặt tham số cố định cho domain thực tế
  const instance = axios.create({
    baseURL,
    withCredentials: true,
    credentials: 'include', // Yêu cầu browser gửi cookies
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    // Add timeout and retry configuration
    timeout: 10000, // 10 seconds timeout
  });

  // Add request interceptor for auth headers and cookies
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
      console.log('Request withCredentials:', config.withCredentials);
      console.log('Document cookies:', document.cookie);
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor for error handling and cookie storage
  instance.interceptors.response.use(
    (response) => {
      // Log successful responses for debugging
      console.log(`API Response (${response.status}):`, response.config.url);
      
      // Check if set-cookie header is present
      if (response.headers['set-cookie']) {
        console.log('Received set-cookie header');
      }
      
      return response;
    },
    (error) => {
      console.error('API Error:', error.response?.data || error.message);
      console.error('Request that failed:', error.config?.method, error.config?.url);
      
      return Promise.reject(error);
    }
  );

  return instance;
};

// Default API instance
export const apiClient = createAxiosInstance();

// Kiểm tra xem có đang dùng đúng domain không
console.log('Current domain:', window.location.origin);
console.log('Target domain:', API_URL);

// Function to manually check if the client has a session cookie
export const checkSessionCookie = () => {
  const cookies = document.cookie.split(';').map(cookie => cookie.trim());
  const sessionCookie = cookies.find(cookie => cookie.startsWith('shop.sid='));
  console.log('Current cookies:', cookies);
  console.log('Session cookie found:', sessionCookie || 'None');
  return sessionCookie ? true : false;
};

export default apiClient; 