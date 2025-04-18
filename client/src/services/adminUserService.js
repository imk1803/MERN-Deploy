import axios from 'axios';
import authHeader from '../utils/authHeader';

const API_URL = 'https://curvot.onrender.com/api/admin/users';

/**
 * Log để debug request
 */
const logRequest = (method, url, headers) => {
  console.log(`[${method}] ${url}`);
  console.log('Headers:', JSON.stringify(headers, null, 2));
};

/**
 * Lấy danh sách người dùng với các tùy chọn lọc và phân trang
 * @param {Object} options - Các tùy chọn lọc và phân trang
 * @returns {Promise} Danh sách người dùng và thông tin phân trang
 */
export const getUsers = async ({ search = '', role = '', page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }) => {
  try {
    const response = await axios.get(API_URL, {
      headers: authHeader(),
      params: {
        search,
        role,
        page,
        limit,
        sortBy,
        sortOrder
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết người dùng
 * @param {string} userId - ID của người dùng
 * @returns {Promise} Thông tin người dùng
 */
export const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/${userId}`, {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
};

/**
 * Tạo người dùng mới
 * @param {Object} userData - Dữ liệu người dùng mới
 * @returns {Promise} Thông tin người dùng mới được tạo
 */
export const createUser = async (userData) => {
  try {
    const response = await axios.post(API_URL, {
      username: userData.username,
      password: userData.password,
      role: userData.role
    }, {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin người dùng
 * @param {string} userId - ID của người dùng cần cập nhật
 * @param {Object} userData - Dữ liệu người dùng cần cập nhật
 * @returns {Promise} Thông tin người dùng sau khi cập nhật
 */
export const updateUser = async (userId, userData) => {
  try {
    const updateData = {
      username: userData.username,
      role: userData.role
    };
    
    // Chỉ gửi password nếu có
    if (userData.password) {
      updateData.password = userData.password;
    }
    
    const response = await axios.put(`${API_URL}/${userId}`, updateData, {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Xóa người dùng
 * @param {string} userId - ID của người dùng cần xóa
 * @returns {Promise} Kết quả xóa
 */
export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/${userId}`, {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}; 