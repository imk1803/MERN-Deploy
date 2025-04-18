/**
 * Local Cart Utils
 * 
 * Quản lý giỏ hàng cục bộ thông qua localStorage khi không kết nối được đến server
 */

// Khóa sử dụng cho localStorage
const LOCAL_CART_KEY = 'localCart';

/**
 * Lấy giỏ hàng từ localStorage
 * @returns {Array} Mảng các sản phẩm trong giỏ hàng
 */
export const getLocalCart = () => {
  try {
    const cartJson = localStorage.getItem(LOCAL_CART_KEY);
    if (cartJson) {
      return JSON.parse(cartJson);
    }
    return [];
  } catch (error) {
    console.error('Lỗi khi lấy giỏ hàng từ localStorage:', error);
    return [];
  }
};

/**
 * Lưu giỏ hàng vào localStorage
 * @param {Array} cart - Mảng chứa thông tin giỏ hàng 
 * @returns {Array} Giỏ hàng đã lưu
 */
export const saveLocalCart = (cart) => {
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
    // Cập nhật thời gian cập nhật cuối cùng
    localStorage.setItem('cartLastUpdate', Date.now().toString());
    
    // Lưu số lượng sản phẩm vào localStorage để hiển thị badge
    const itemCount = calculateTotalItems(cart);
    localStorage.setItem('cartItemCount', itemCount.toString());
    
    return cart;
  } catch (error) {
    console.error('Lỗi khi lưu giỏ hàng vào localStorage:', error);
    return cart;
  }
};

/**
 * Thêm sản phẩm vào giỏ hàng cục bộ
 * @param {Object} product - Thông tin sản phẩm cần thêm
 * @param {number} quantity - Số lượng (mặc định là 1)
 * @returns {Array} Giỏ hàng cập nhật
 */
export const addToLocalCart = (product, quantity = 1) => {
  try {
    if (!product || !product._id) {
      console.error('Không thể thêm sản phẩm không hợp lệ vào giỏ hàng');
      return getLocalCart();
    }
    
    // Lấy giỏ hàng hiện tại
    const cart = getLocalCart();
    
    // Kiểm tra xem sản phẩm đã tồn tại chưa
    const existingItemIndex = cart.findIndex(item => item.productId === product._id);
    
    if (existingItemIndex >= 0) {
      // Tăng số lượng nếu đã tồn tại
      cart[existingItemIndex].quantity += quantity;
    } else {
      // Thêm sản phẩm mới vào giỏ hàng
      cart.push({
        _id: product._id,
        productId: product._id,
        quantity: quantity,
        name: product.name || `Sản phẩm ${product._id}`,
        price: product.price || 0,
        image: product.image || null,
        product: product // Lưu thông tin đầy đủ của sản phẩm
      });
    }
    
    // Lưu giỏ hàng cập nhật vào localStorage
    return saveLocalCart(cart);
  } catch (error) {
    console.error('Lỗi khi thêm sản phẩm vào giỏ hàng cục bộ:', error);
    return getLocalCart();
  }
};

/**
 * Tăng số lượng sản phẩm trong giỏ hàng
 * @param {string} productId - ID của sản phẩm
 * @returns {Array} Giỏ hàng cập nhật
 */
export const incrementLocalCartItem = (productId) => {
  try {
    const cart = getLocalCart();
    const itemIndex = cart.findIndex(item => item.productId === productId);
    
    if (itemIndex >= 0) {
      cart[itemIndex].quantity += 1;
      return saveLocalCart(cart);
    }
    
    return cart;
  } catch (error) {
    console.error('Lỗi khi tăng số lượng sản phẩm:', error);
    return getLocalCart();
  }
};

/**
 * Giảm số lượng sản phẩm trong giỏ hàng
 * @param {string} productId - ID của sản phẩm
 * @returns {Array} Giỏ hàng cập nhật
 */
export const decrementLocalCartItem = (productId) => {
  try {
    const cart = getLocalCart();
    const itemIndex = cart.findIndex(item => item.productId === productId);
    
    if (itemIndex >= 0) {
      // Nếu số lượng > 1, giảm xuống
      if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity -= 1;
      } else {
        // Nếu số lượng là 1, loại bỏ sản phẩm khỏi giỏ hàng
        cart.splice(itemIndex, 1);
      }
      
      return saveLocalCart(cart);
    }
    
    return cart;
  } catch (error) {
    console.error('Lỗi khi giảm số lượng sản phẩm:', error);
    return getLocalCart();
  }
};

/**
 * Xóa sản phẩm khỏi giỏ hàng
 * @param {string} productId - ID của sản phẩm
 * @returns {Array} Giỏ hàng cập nhật
 */
export const removeFromLocalCart = (productId) => {
  try {
    const cart = getLocalCart();
    const updatedCart = cart.filter(item => item.productId !== productId);
    
    return saveLocalCart(updatedCart);
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
    return getLocalCart();
  }
};

/**
 * Xóa toàn bộ giỏ hàng
 * @returns {Array} Giỏ hàng trống
 */
export const clearLocalCart = () => {
  try {
    return saveLocalCart([]);
  } catch (error) {
    console.error('Lỗi khi xóa toàn bộ giỏ hàng:', error);
    return [];
  }
};

/**
 * Tính tổng giá trị giỏ hàng
 * @param {Array} cart - Giỏ hàng (nếu không cung cấp, sẽ lấy từ localStorage)
 * @returns {number} Tổng giá trị giỏ hàng
 */
export const calculateTotal = (cart = null) => {
  try {
    const cartItems = cart || getLocalCart();
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  } catch (error) {
    console.error('Lỗi khi tính tổng giá trị giỏ hàng:', error);
    return 0;
  }
};

/**
 * Tính tổng số lượng các sản phẩm trong giỏ hàng
 * @param {Array} cart - Giỏ hàng (nếu không cung cấp, sẽ lấy từ localStorage)
 * @returns {number} Tổng số lượng
 */
export const calculateTotalItems = (cart = null) => {
  try {
    const cartItems = cart || getLocalCart();
    return cartItems.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  } catch (error) {
    console.error('Lỗi khi tính tổng số lượng sản phẩm:', error);
    return 0;
  }
};

/**
 * Hàm trợ giúp để đồng bộ giỏ hàng cục bộ với giỏ hàng trên server
 * @param {Array} serverCart - Giỏ hàng từ server 
 * @returns {Array} Giỏ hàng đã đồng bộ
 */
export const syncLocalCartWithServer = (serverCart) => {
  try {
    if (!serverCart || !Array.isArray(serverCart)) {
      return getLocalCart();
    }
    
    // Lấy giỏ hàng cục bộ
    const localCart = getLocalCart();
    
    // Nếu giỏ hàng cục bộ trống, sử dụng giỏ hàng từ server
    if (localCart.length === 0) {
      return saveLocalCart(serverCart);
    }
    
    // Nếu giỏ hàng từ server trống, giữ nguyên giỏ hàng cục bộ
    if (serverCart.length === 0) {
      return localCart;
    }
    
    // Hợp nhất giỏ hàng
    const mergedCart = [...serverCart];
    
    // Thêm sản phẩm từ giỏ hàng cục bộ vào giỏ hàng từ server nếu chưa tồn tại
    localCart.forEach(localItem => {
      const existInServer = mergedCart.some(serverItem => 
        serverItem.productId === localItem.productId);
      
      if (!existInServer) {
        mergedCart.push(localItem);
      }
    });
    
    return saveLocalCart(mergedCart);
  } catch (error) {
    console.error('Lỗi khi đồng bộ giỏ hàng:', error);
    return getLocalCart();
  }
};

export default {
  getLocalCart,
  saveLocalCart,
  addToLocalCart,
  incrementLocalCartItem,
  decrementLocalCartItem,
  removeFromLocalCart,
  clearLocalCart,
  calculateTotal,
  calculateTotalItems,
  syncLocalCartWithServer
}; 