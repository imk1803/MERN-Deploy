import axios from 'axios';

const paymentAPI = axios.create({
  baseURL: 'https://curvot.onrender.com/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Initiate a payment with MoMo
 * @param {Object} orderData - Order data including amount, orderId, etc.
 * @returns {Promise} - Response from the payment gateway
 */
const initiateMomoPayment = async (orderData) => {
  try {
    console.log('Initiating MoMo payment with data:', orderData);
    const response = await paymentAPI.post('/payment/momo/create', orderData);
    console.log('MoMo payment response from API:', response.data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khởi tạo thanh toán MoMo:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Initiate an online banking payment
 * @param {Object} orderData - Order data including amount, orderId, bank info, etc.
 * @returns {Promise} - Response from the payment gateway
 */
const initiateOnlineBankingPayment = async (orderData) => {
  try {
    console.log('Initiating banking payment with data:', orderData);
    const response = await paymentAPI.post('/payment/banking/create', orderData);
    console.log('Banking payment response from API:', response.data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khởi tạo thanh toán qua ngân hàng:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
    } else if (error.request) {
      console.error('Error request:', error.request);
    }
    
    // Trả về đối tượng lỗi để xử lý ở UI
    return {
      success: false,
      message: error.response?.data?.message || 'Không thể kết nối đến máy chủ thanh toán'
    };
  }
};

/**
 * Verify payment status
 * @param {String} paymentId - Payment reference ID
 * @param {String} type - Payment type (momo, banking)
 * @returns {Promise} - Payment verification response
 */
const verifyPayment = async (paymentId, type) => {
  try {
    console.log(`Verifying payment for ${type}, ID: ${paymentId}`);
    
    // Xử lý riêng cho từng loại thanh toán
    if (type === 'momo') {
      // Đối với momo, thử gọi trực tiếp verify đơn hàng thay vì qua endpoint riêng
      const response = await paymentAPI.get(`/payment/verify/${paymentId}`);
      console.log('Verify response:', response.data);
      return response.data;
    } 
    
    // Các loại thanh toán khác
    const response = await paymentAPI.get(`/payment/${type}/verify/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi xác minh thanh toán:', error);
    throw error;
  }
};

/**
 * Get payment methods
 * @returns {Promise} - Available payment methods
 */
const getPaymentMethods = async () => {
  try {
    const response = await paymentAPI.get('/payment/methods');
    return response.data;
  } catch (error) {
    console.error('Lỗi lấy phương thức thanh toán:', error);
    throw error;
  }
};

export {
  initiateMomoPayment,
  initiateOnlineBankingPayment,
  verifyPayment,
  getPaymentMethods
}; 