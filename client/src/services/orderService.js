import axios from 'axios';
import authHeader from '../utils/authHeader';

// Đường dẫn API 
const API_URL = 'https://curvot.onrender.com/api';

/**
 * Log để debug request
 */
const logRequest = (method, url, headers) => {
  console.log(`[${method}] ${url}`);
  console.log('Headers:', JSON.stringify(headers, null, 2));
};

/**
 * Lấy danh sách đơn hàng của người dùng đã đăng nhập
 * @param {Object} options - Các tùy chọn lọc và phân trang
 * @param {string} options.status - Trạng thái đơn hàng (optional)
 * @param {number} options.page - Trang hiện tại
 * @param {number} options.limit - Số đơn hàng mỗi trang
 * @returns {Promise} Danh sách đơn hàng và thông tin phân trang
 */
export const getUserOrders = async (options = {}) => {
  try {
    const { status, page = 1, limit = 10 } = options;
    
    // Xây dựng query string
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page);
    params.append('limit', limit);
    
    const url = `${API_URL}/orders?${params.toString()}`;
    const headers = authHeader();
    
    // Log để debug
    logRequest('GET', url, headers);
    
    const response = await axios.get(url, { headers });
    
    return {
      success: true,
      orders: response.data.orders || [],
      pagination: response.data.pagination || {
        total: response.data.total || 0,
        page: response.data.page || 1,
        limit: response.data.limit || 10,
        totalPages: response.data.totalPages || 0
      }
    };
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn hàng:', error.response?.data || error.message);
    let errorMessage = 'Không thể kết nối đến máy chủ';
    
    if (error.response) {
      errorMessage = error.response.data.message || errorMessage;
    }
    
    return {
      success: false,
      message: errorMessage,
      orders: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      }
    };
  }
};

// Alias for backward compatibility
export const getMyOrders = getUserOrders;

/**
 * Lấy chi tiết đơn hàng theo ID
 * @param {string} orderId - ID của đơn hàng
 * @returns {Promise} Chi tiết đơn hàng
 */
export const getOrderById = async (orderId) => {
  try {
    const url = `${API_URL}/orders/${orderId}`;
    const headers = authHeader();
    
    // Log để debug
    logRequest('GET', url, headers);
    
    const response = await axios.get(url, { headers });
    
    return {
      success: true,
      order: response.data.order || response.data || {}
    };
  } catch (error) {
    console.error(`Lỗi khi lấy chi tiết đơn hàng ID ${orderId}:`, error.response?.data || error.message);
    let errorMessage = 'Không thể kết nối đến máy chủ';
    
    if (error.response) {
      errorMessage = error.response.data.message || errorMessage;
    }
    
    return {
      success: false,
      message: errorMessage,
      order: {}
    };
  }
};

/**
 * Hủy đơn hàng
 * @param {string} orderId - ID của đơn hàng
 */
export const cancelOrder = async (orderId) => {
  try {
    const url = `${API_URL}/orders/${orderId}/cancel`;
    const headers = authHeader();
    
    // Log để debug
    logRequest('PATCH', url, headers);
    
    const response = await axios.patch(url, {}, { headers });
    return response.data;
  } catch (error) {
    console.error('Error cancelling order:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Tạo đơn hàng mới
 * @param {Object} orderData - Dữ liệu đơn hàng cần tạo
 */
export const createOrder = async (orderData) => {
  try {
    const url = `${API_URL}/orders`;
    const headers = authHeader();
    
    // Log để debug
    logRequest('POST', url, headers);
    console.log('Order data:', JSON.stringify(orderData, null, 2));
    
    const response = await axios.post(url, orderData, { headers });
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error.response?.data || error.message);
    throw error;
  }
}; 