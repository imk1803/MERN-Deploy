import axios from 'axios';

// Sử dụng biến môi trường cho API URL
const API_URL = process.env.REACT_APP_API_URL || 'https://curvot.onrender.com/api/users';

// Tạo axios instance với cấu hình chung
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Xử lý lỗi chung
const handleError = (error) => {
  const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi';
  throw new Error(errorMessage);
};

// Thêm interceptor để xử lý request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Thêm interceptor để xử lý response
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu có lỗi 401 Unauthorized
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || '';
      
      // Kiểm tra nếu là lỗi mật khẩu hiện tại không đúng, không xóa token
      if (errorMessage.includes('hiện tại') || 
          errorMessage.includes('current password') || 
          errorMessage.includes('không đúng')) {
        console.log('Current password error, not removing token');
      } else {
        // Các lỗi xác thực khác thì xóa token
        localStorage.removeItem('token');
        console.log('Token removed due to 401 error: ', errorMessage);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Đăng ký tài khoản mới
 * @param {string} username - Tên đăng nhập
 * @param {string} password - Mật khẩu
 * @param {string} confirmPassword - Xác nhận mật khẩu
 * @returns {Promise} Thông tin người dùng sau khi đăng ký
 */
export const register = async (username, password, confirmPassword) => {
  try {
    const response = await axiosInstance.post('/register', {
      username,
      password,
      confirmPassword,
    });
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Đăng nhập
 * @param {string} username - Tên đăng nhập
 * @param {string} password - Mật khẩu
 * @returns {Promise} Thông tin người dùng sau khi đăng nhập
 */
export const login = async (username, password) => {
  try {
    const response = await axiosInstance.post('/login', {
      username,
      password,
    });
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Đăng xuất
 * @returns {Promise} Kết quả đăng xuất
 */
export const logout = async () => {
  try {
    const response = await axiosInstance.post('/logout');
    // Xóa token
    localStorage.removeItem('token');
    // Xóa headers authorization
    delete axiosInstance.defaults.headers.common['Authorization'];
    return response.data;
  } catch (error) {
    // Đảm bảo xóa token ngay cả khi có lỗi
    localStorage.removeItem('token');
    delete axiosInstance.defaults.headers.common['Authorization'];
    handleError(error);
  }
};

/**
 * Lấy thông tin người dùng
 * @returns {Promise} Thông tin người dùng
 */
export const getProfile = async () => {
  try {
    // Kiểm tra token trước khi gọi API
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    
    const response = await axiosInstance.get('/profile');
    return response.data;
  } catch (error) {
    // Lỗi đã được xử lý trong interceptor
    return Promise.reject(error);
  }
};

/**
 * Đổi mật khẩu
 * @param {string} currentPassword - Mật khẩu hiện tại
 * @param {string} newPassword - Mật khẩu mới
 * @returns {Promise} Kết quả đổi mật khẩu
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    // Kiểm tra token trước khi gọi API
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    
    const response = await axiosInstance.put('/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error) {
    // Đã được xử lý trong interceptor, chỉ cần chuyển tiếp lỗi
    return Promise.reject(error);
  }
};