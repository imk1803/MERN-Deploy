import { apiClient } from '../utils/axiosConfig';

/**
 * Lấy nội dung giỏ hàng
 * @returns {Promise} Thông tin giỏ hàng
 */
export const getCart = async () => {
    try {
        const response = await apiClient.get('/cart/cart');
        console.log('Giỏ hàng:', response.data);  // Log dữ liệu giỏ hàng để kiểm tra
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy giỏ hàng:', error);
        throw error;
    }
};

/**
 * Thêm sản phẩm vào giỏ hàng
 * @param {string} productId - ID của sản phẩm
 * @returns {Promise} Kết quả thêm vào giỏ hàng
 */
export const addToCart = async (productId) => {
    try {
        const response = await apiClient.post(`/cart/add/${productId}`);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
        throw error;
    }
};

/**
 * Tăng số lượng sản phẩm trong giỏ hàng
 * @param {string} productId - ID của sản phẩm
 * @returns {Promise} Kết quả cập nhật giỏ hàng
 */
export const incrementCartItem = async (productId) => {
    try {
        const response = await apiClient.post(`/cart/increment/${productId}`);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi tăng số lượng:', error);
        throw error;
    }
};

/**
 * Giảm số lượng sản phẩm trong giỏ hàng
 * @param {string} productId - ID của sản phẩm
 * @returns {Promise} Kết quả cập nhật giỏ hàng
 */
export const decrementCartItem = async (productId) => {
    try {
        const response = await apiClient.post(`/cart/decrement/${productId}`);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi giảm số lượng:', error);
        throw error;
    }
};

/**
 * Xóa sản phẩm khỏi giỏ hàng
 * @param {string} productId - ID của sản phẩm
 * @returns {Promise} Kết quả cập nhật giỏ hàng
 */
export const removeFromCart = async (productId) => {
    try {
        const response = await apiClient.post(`/cart/remove/${productId}`);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi xóa khỏi giỏ hàng:', error);
        throw error;
    }
};

/**
 * Xóa toàn bộ giỏ hàng
 * @returns {Promise} Kết quả xóa giỏ hàng
 */
export const clearCart = async () => {
    try {
        const response = await apiClient.post('/cart/clear');
        return response.data;
    } catch (error) {
        console.error('Lỗi khi xóa toàn bộ giỏ hàng:', error);
        throw error;
    }
};

/**
 * Thêm sản phẩm vào giỏ hàng với thông báo
 * @param {string} productId - ID của sản phẩm 
 * @param {Function} showNotification - Hàm hiển thị thông báo (tùy chọn)
 */
const handleAddToCart = async (productId, showNotification) => {
    try {
        await addToCart(productId);
        
        // Sử dụng thông báo nếu được cung cấp, ngược lại dùng alert
        if (typeof showNotification === 'function') {
            showNotification('Đã thêm sản phẩm vào giỏ hàng!', 'success');
        } else {
            alert(`✅ Đã thêm sản phẩm vào giỏ hàng!`);
        }
    } catch (err) {
        console.error('❌ Lỗi thêm vào giỏ hàng:', err);
        if (typeof showNotification === 'function') {
            showNotification('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng!', 'error');
        } else {
            alert('❌ Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng!');
        }
    }
};

export default handleAddToCart;
