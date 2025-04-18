import { apiClient } from '../utils/axiosConfig';

/**
 * Test the cart API connection
 * @returns {Promise} Test result
 */
export const testCartAPI = async () => {
    try {
        console.log('Testing cart API connection...');
        const response = await apiClient.get('/cart/test');
        console.log('Cart API test response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Cart API test failed:', error);
        throw error;
    }
};

/**
 * Lấy nội dung giỏ hàng
 * @returns {Promise} Thông tin giỏ hàng
 */
export const getCart = async () => {
    try {
        console.log('Calling getCart API');
        // First try to get the debug session to see what's in the cart on the server
        try {
            const debugSession = await apiClient.get('/debug/session');
            console.log('Server session data:', debugSession.data);
        } catch (e) {
            console.warn('Could not get debug session:', e);
        }
        
        const response = await apiClient.get('/cart/cart');
        console.log('Giỏ hàng response:', response);
        console.log('Giỏ hàng data:', response.data);
        
        // If response.data.cart is undefined or null, return an empty array
        if (!response.data.cart) {
            console.warn('Cart is undefined or null in response');
            return { success: true, cart: [] };
        }
        
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
        console.log('Adding to cart, product ID:', productId);
        
        // Store product ID in localStorage temporarily to verify cart is working
        localStorage.setItem('lastAddedProduct', productId);
        localStorage.setItem('cartAdded', 'true');
        
        // First try to get the debug session to see what's in the cart on the server
        try {
            const debugSession = await apiClient.get('/debug/session');
            console.log('Server session before adding:', debugSession.data);
        } catch (e) {
            console.warn('Could not get debug session:', e);
        }
        
        // Add product to cart
        const response = await apiClient.post(`/cart/add/${productId}`);
        console.log('Add to cart response:', response.data);
        
        // Verify cart was updated
        try {
            const cartRes = await apiClient.get('/cart/cart');
            console.log('Cart after adding product:', cartRes.data);
            
            // Check if product was actually added
            const added = cartRes.data.cart && cartRes.data.cart.some(
                item => item.productId === productId
            );
            
            if (!added) {
                console.warn('Product was not found in cart after adding');
            }
        } catch (e) {
            console.warn('Could not verify cart contents:', e);
        }
        
        return response.data;
    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error, 'Product ID:', productId);
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
        console.log('Handle add to cart for product:', productId);
        
        // Try to add product to cart multiple times if needed
        let attempts = 0;
        let result = null;
        
        while (attempts < 3) {
            try {
                result = await addToCart(productId);
                break; // Exit loop if successful
            } catch (err) {
                attempts++;
                console.warn(`Add to cart attempt ${attempts} failed:`, err);
                if (attempts < 3) {
                    // Wait before trying again
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    throw err; // Rethrow if all attempts failed
                }
            }
        }
        
        console.log('Add to cart result:', result);
        
        // Sử dụng thông báo nếu được cung cấp, ngược lại dùng alert
        if (typeof showNotification === 'function') {
            showNotification('Đã thêm sản phẩm vào giỏ hàng! Hãy vào giỏ hàng để xem.', 'success');
        } else {
            alert(`✅ Đã thêm sản phẩm vào giỏ hàng! Hãy vào giỏ hàng để xem.`);
        }
        
        return result;
    } catch (err) {
        console.error('❌ Lỗi thêm vào giỏ hàng:', err);
        if (typeof showNotification === 'function') {
            showNotification('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng!', 'error');
        } else {
            alert('❌ Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng!');
        }
        throw err;
    }
};

export default handleAddToCart;
