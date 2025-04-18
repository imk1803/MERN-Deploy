import axios from 'axios';

// Đường dẫn API có thể cần điều chỉnh tùy theo cấu trúc backend
const API_URL = process.env.REACT_APP_API_URL || 'https://curvot.onrender.com/api/admin/orders';

// Create axios instance with common config
const adminAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Add interceptor to automatically add token to header
adminAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Get all orders with optional filters
 * @param {Object} options - Filter options (status, search, dateFrom, dateTo, page, limit)
 * @returns {Promise} Orders with pagination
 */
export const getOrders = async (options = {}) => {
  try {
    // Construct query parameters from options
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.search) params.append('search', options.search);
    if (options.dateFrom) params.append('dateFrom', options.dateFrom);
    if (options.dateTo) params.append('dateTo', options.dateTo);
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    
    console.log(`Calling API with search: "${options.search}"`);
    console.log(`Full params: ${params.toString()}`);
    
    // Tăng timeout cho request lên 30s để tránh timeout khi tìm kiếm
    const response = await adminAxios.get(`/?${params.toString()}`, {
      timeout: 30000 // 30 seconds
    });
    
    // Log response data for debugging
    console.log(`API returned ${response.data.orders?.length || 0} orders`);
    
    // Kiểm tra cấu trúc phản hồi và điều chỉnh theo cấu trúc API thực tế
    return {
      success: true,
      orders: response.data.orders || response.data || [],
      pagination: response.data.pagination || {
        total: response.data.length || 0,
        page: parseInt(options.page) || 1,
        limit: parseInt(options.limit) || 10,
        totalPages: Math.ceil((response.data.length || 0) / (parseInt(options.limit) || 10))
      }
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Không thể kết nối đến máy chủ',
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

/**
 * Get a single order by ID
 * @param {string} orderId - ID of the order
 * @returns {Promise} Order details
 */
export const getOrderById = async (orderId) => {
  try {
    console.log(`Calling API: ${API_URL}/${orderId}`);
    const response = await adminAxios.get(`/${orderId}`);
    return {
      success: true,
      order: response.data.order || response.data || {}
    };
  } catch (error) {
    console.error(`Error fetching order ID ${orderId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Không thể kết nối đến máy chủ',
      order: {}
    };
  }
};

/**
 * Update an order's status
 * @param {string} orderId - ID of the order to update
 * @param {string} status - New status for the order
 * @returns {Promise} Updated order details
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    console.log(`Calling API: ${API_URL}/${orderId}/status with status=${status}`);
    const response = await axios.patch(`${API_URL}/${orderId}/status`, { status }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return {
      success: true,
      order: response.data.order || response.data || {}
    };
  } catch (error) {
    console.error(`Error updating order status for ID ${orderId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Không thể kết nối đến máy chủ'
    };
  }
};

/**
 * Delete an order
 * @param {string} orderId - ID of the order to delete
 * @returns {Promise} Result of deletion
 */
export const deleteOrder = async (orderId) => {
  try {
    console.log(`Calling API: ${API_URL}/${orderId} (DELETE)`);
    const response = await adminAxios.delete(`/${orderId}`);
    return {
      success: true,
      message: response.data.message || 'Đã xóa đơn hàng thành công'
    };
  } catch (error) {
    console.error(`Error deleting order ID ${orderId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Không thể kết nối đến máy chủ'
    };
  }
};

/**
 * Get order statistics
 * @returns {Promise} Order statistics data
 */
export const getOrderStats = async () => {
  try {
    console.log(`Calling API: ${API_URL}/stats`);
    const response = await adminAxios.get('/stats');
    return {
      success: true,
      stats: response.data || {}
    };
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Không thể kết nối đến máy chủ',
      stats: {}
    };
  }
}; 