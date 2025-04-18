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
        // Set timestamp for cart update to trigger refresh on Cart page
        localStorage.setItem('cartLastUpdate', Date.now().toString());
        
        // First try to get the debug session to see what's in the cart on the server
        let sessionData = null;
        try {
            const debugSession = await apiClient.get('/debug/session');
            console.log('Server session before adding:', debugSession.data);
            sessionData = debugSession.data;
        } catch (e) {
            console.warn('Could not get debug session:', e);
        }
        
        // Add product to cart on server
        const response = await apiClient.post(`/cart/add/${productId}`);
        console.log('Add to cart response:', response.data);
        
        // Set cookie manually if needed using the session ID from the response
        if (response.data && response.data.sessionId) {
            try {
                document.cookie = `shop.sid=${response.data.sessionId}; domain=curvot.onrender.com; path=/; secure; samesite=none; max-age=86400`;
                console.log('Set session cookie manually:', document.cookie);
                localStorage.setItem('tempSessionId', response.data.sessionId);
            } catch (e) {
                console.warn('Could not set cookie manually:', e);
            }
        }
        
        // Load current manual cart
        let manualCart = [];
        try {
            const savedCart = localStorage.getItem('manualCart');
            if (savedCart) {
                manualCart = JSON.parse(savedCart);
            }
        } catch (e) {
            console.warn('Error loading manual cart from localStorage:', e);
        }
        
        // Try to get product details
        let productDetails = null;
        try {
            const productRes = await apiClient.get(`/products/${productId}`);
            productDetails = productRes.data.product;
        } catch (e) {
            console.warn('Could not get product details:', e);
        }
        
        // Update manual cart in localStorage as backup
        if (productDetails) {
            const existingItemIndex = manualCart.findIndex(item => item._id === productId);
            
            if (existingItemIndex >= 0) {
                // Update existing item
                manualCart[existingItemIndex].quantity += 1;
            } else {
                // Add new item
                manualCart.push({
                    _id: productId,
                    productId: productId,
                    quantity: 1,
                    name: productDetails.name,
                    price: productDetails.price,
                    image: productDetails.image
                });
            }
            
            // Save updated cart to localStorage
            localStorage.setItem('manualCart', JSON.stringify(manualCart));
            console.log('Updated manual cart in localStorage:', manualCart);
        } else if (response.data && response.data.cart) {
            // If we couldn't get product details but have cart from response, use that
            localStorage.setItem('manualCart', JSON.stringify(response.data.cart));
        }
        
        // Verify cart was updated in server session
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
