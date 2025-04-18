import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  getLocalCart, 
  addToLocalCart, 
  incrementLocalCartItem, 
  decrementLocalCartItem,
  removeFromLocalCart,
  clearLocalCart,
  syncLocalCartWithServer
} from '../utils/localCartUtils';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'https://curvot.onrender.com/api';
const CART_API = `${API_URL}/cart`;

/**
 * Test the cart API connection
 * @returns {Promise} Test result
 */
export const testCartAPI = async () => {
    try {
        console.log('Testing cart API connection...');
        const response = await axios.get(`${CART_API}/test`, { timeout: 5000 });
        console.log('Cart API test response:', response.data);
        // API hoạt động, đánh dấu để biết không cần dùng local cart
        localStorage.setItem('useLocalCart', 'false');
        return response.data;
    } catch (error) {
        console.error('Không thể kết nối đến Cart API:', error);
        // API không hoạt động, đánh dấu để biết cần dùng local cart
        localStorage.setItem('useLocalCart', 'true');
        return { 
          success: false, 
          message: 'Không thể kết nối đến giỏ hàng trên server, sử dụng giỏ hàng cục bộ.',
          cartItems: getLocalCart().length
        };
    }
};

/**
 * Kiểm tra xem có nên dùng local cart không
 * @returns {boolean} True nếu nên dùng local cart
 */
const shouldUseLocalCart = () => {
  return localStorage.getItem('useLocalCart') === 'true';
};

/**
 * Lấy nội dung giỏ hàng
 * @returns {Promise} Thông tin giỏ hàng
 */
export const getCart = async () => {
    try {
        console.log('Calling getCart API or local');
        
        // Nếu flag useLocalCart = true, dùng local cart
        if (shouldUseLocalCart()) {
          console.log('Sử dụng giỏ hàng cục bộ');
          return { cart: getLocalCart() };
        }
        
        // Thử gọi API
        try {
            // First try to get the debug session to see what's in the cart on the server
            try {
                const debugSession = await axios.get(`${API_URL}/debug/session`);
                console.log('Server session data:', debugSession.data);
            } catch (e) {
                console.warn('Could not get debug session:', e);
            }
            
            const response = await axios.get(`${CART_API}/cart`, {
              withCredentials: true
            });
            console.log('Giỏ hàng response:', response);
            console.log('Giỏ hàng data:', response.data);
            
            // If response.data.cart is undefined or null, return an empty array
            if (!response.data.cart) {
                console.warn('Cart is undefined or null in response');
                return { success: true, cart: [] };
            }
            
            // Nếu lấy thành công giỏ hàng từ server, đồng bộ với giỏ hàng cục bộ
            if (response.data.success) {
              syncLocalCartWithServer(response.data.cart);
            }
            
            return response.data;
        } catch (error) {
            // API gặp lỗi, chuyển sang dùng local cart
            console.error('API error, switching to local cart:', error);
            localStorage.setItem('useLocalCart', 'true');
            const localCart = getLocalCart();
            return { success: true, cart: localCart };
        }
    } catch (error) {
        console.error('Lỗi khi lấy giỏ hàng:', error);
        // Trường hợp xấu nhất, trả về mảng rỗng
        return { success: true, cart: [] };
    }
};

/**
 * Thêm sản phẩm vào giỏ hàng
 * @param {string} productId - ID của sản phẩm
 * @returns {Promise} Kết quả thêm vào giỏ hàng
 */
export const addToCart = async (productId, quantity = 1) => {
    try {
        console.log('Adding to cart, product ID:', productId);
        
        // Store product ID in localStorage temporarily to verify cart is working
        localStorage.setItem('lastAddedProduct', productId);
        localStorage.setItem('cartAdded', 'true');
        // Set timestamp for cart update to trigger refresh on Cart page
        localStorage.setItem('cartLastUpdate', Date.now().toString());
        
        // Nếu flag useLocalCart = true, dùng local cart
        if (shouldUseLocalCart()) {
            try {
                // Lấy thông tin sản phẩm từ localStorage hoặc từ API sản phẩm
                const productRes = await axios.get(`${API_URL}/products/${productId}`);
                if (productRes.data.success) {
                    const product = productRes.data.product;
                    const updatedCart = addToLocalCart(product, quantity);
                    toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
                    return { 
                      success: true, 
                      message: 'Đã thêm sản phẩm vào giỏ hàng cục bộ', 
                      cart: updatedCart 
                    };
                }
            } catch (error) {
                console.error('Lỗi khi thêm sản phẩm vào giỏ hàng cục bộ:', error);
                toast.error('Không thể thêm sản phẩm vào giỏ hàng');
                return { 
                  success: false, 
                  message: 'Lỗi khi thêm sản phẩm vào giỏ hàng cục bộ'
                };
            }
        }
        
        // Thử gọi API để thêm vào giỏ hàng
        try {
            const response = await axios.post(`${CART_API}/add`,
              { productId, quantity },
              { withCredentials: true }
            );
            
            if (response.data.success) {
              toast.success('Đã thêm sản phẩm vào giỏ hàng');
            }
            
            return response.data;
        } catch (error) {
            // API gặp lỗi, chuyển sang dùng local cart
            console.error('API error, switching to local cart:', error);
            localStorage.setItem('useLocalCart', 'true');
            
            // Thử thêm vào giỏ hàng cục bộ
            try {
                const productRes = await axios.get(`${API_URL}/products/${productId}`);
                if (productRes.data.success) {
                    const product = productRes.data.product;
                    const updatedCart = addToLocalCart(product, quantity);
                    toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
                    return { 
                      success: true, 
                      message: 'Đã thêm sản phẩm vào giỏ hàng cục bộ', 
                      cart: updatedCart 
                    };
                }
            } catch (productError) {
                console.error('Lỗi khi lấy thông tin sản phẩm:', productError);
            }
            
            toast.error('Không thể thêm sản phẩm vào giỏ hàng');
            return { 
              success: false, 
              message: 'Lỗi khi thêm sản phẩm vào giỏ hàng'
            };
        }
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
        // Nếu flag useLocalCart = true, dùng local cart
        if (shouldUseLocalCart()) {
            const updatedCart = incrementLocalCartItem(productId);
            toast.success('Đã tăng số lượng sản phẩm');
            return { 
              success: true, 
              message: 'Đã tăng số lượng sản phẩm trong giỏ hàng cục bộ', 
              cart: updatedCart 
            };
        }
        
        // Thử gọi API
        try {
            const response = await axios.put(`${CART_API}/increment/${productId}`, {}, 
              { withCredentials: true }
            );
            
            if (response.data.success) {
              toast.success('Đã tăng số lượng sản phẩm');
            }
            
            return response.data;
        } catch (error) {
            // API gặp lỗi, chuyển sang dùng local cart
            console.error('API error, switching to local cart:', error);
            localStorage.setItem('useLocalCart', 'true');
            
            const updatedCart = incrementLocalCartItem(productId);
            toast.success('Đã tăng số lượng sản phẩm');
            
            return { 
              success: true, 
              message: 'Đã tăng số lượng sản phẩm trong giỏ hàng cục bộ', 
              cart: updatedCart 
            };
        }
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
        // Nếu flag useLocalCart = true, dùng local cart
        if (shouldUseLocalCart()) {
            const updatedCart = decrementLocalCartItem(productId);
            toast.success('Đã giảm số lượng sản phẩm');
            return { 
              success: true, 
              message: 'Đã giảm số lượng sản phẩm trong giỏ hàng cục bộ', 
              cart: updatedCart 
            };
        }
        
        // Thử gọi API
        try {
            const response = await axios.put(`${CART_API}/decrement/${productId}`, {}, 
              { withCredentials: true }
            );
            
            if (response.data.success) {
              toast.success('Đã giảm số lượng sản phẩm');
            }
            
            return response.data;
        } catch (error) {
            // API gặp lỗi, chuyển sang dùng local cart
            console.error('API error, switching to local cart:', error);
            localStorage.setItem('useLocalCart', 'true');
            
            const updatedCart = decrementLocalCartItem(productId);
            toast.success('Đã giảm số lượng sản phẩm');
            
            return { 
              success: true, 
              message: 'Đã giảm số lượng sản phẩm trong giỏ hàng cục bộ', 
              cart: updatedCart 
            };
        }
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
        // Nếu flag useLocalCart = true, dùng local cart
        if (shouldUseLocalCart()) {
            const updatedCart = removeFromLocalCart(productId);
            toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
            return { 
              success: true, 
              message: 'Đã xóa sản phẩm khỏi giỏ hàng cục bộ', 
              cart: updatedCart 
            };
        }
        
        // Thử gọi API
        try {
            const response = await axios.delete(`${CART_API}/remove/${productId}`, 
              { withCredentials: true }
            );
            
            if (response.data.success) {
              toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
            }
            
            return response.data;
        } catch (error) {
            // API gặp lỗi, chuyển sang dùng local cart
            console.error('API error, switching to local cart:', error);
            localStorage.setItem('useLocalCart', 'true');
            
            const updatedCart = removeFromLocalCart(productId);
            toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
            
            return { 
              success: true, 
              message: 'Đã xóa sản phẩm khỏi giỏ hàng cục bộ', 
              cart: updatedCart 
            };
        }
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
        // Nếu flag useLocalCart = true, dùng local cart
        if (shouldUseLocalCart()) {
            const updatedCart = clearLocalCart();
            toast.success('Đã xóa toàn bộ giỏ hàng');
            return { 
              success: true, 
              message: 'Đã xóa toàn bộ giỏ hàng cục bộ', 
              cart: updatedCart 
            };
        }
        
        // Thử gọi API
        try {
            const response = await axios.delete(`${CART_API}/clear`, 
              { withCredentials: true }
            );
            
            if (response.data.success) {
              toast.success('Đã xóa toàn bộ giỏ hàng');
              // Đồng bộ xóa giỏ hàng cục bộ
              clearLocalCart();
            }
            
            return response.data;
        } catch (error) {
            // API gặp lỗi, chuyển sang dùng local cart
            console.error('API error, switching to local cart:', error);
            localStorage.setItem('useLocalCart', 'true');
            
            const updatedCart = clearLocalCart();
            toast.success('Đã xóa toàn bộ giỏ hàng');
            
            return { 
              success: true, 
              message: 'Đã xóa toàn bộ giỏ hàng cục bộ', 
              cart: updatedCart 
            };
        }
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
        const isLocal = shouldUseLocalCart();
        if (typeof showNotification === 'function') {
            showNotification(`Đã thêm sản phẩm vào giỏ hàng${isLocal ? ' (cục bộ)' : ''}! Hãy vào giỏ hàng để xem.`, 'success');
        } else {
            alert(`✅ Đã thêm sản phẩm vào giỏ hàng${isLocal ? ' (cục bộ)' : ''}! Hãy vào giỏ hàng để xem.`);
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
