import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { apiClient, checkSessionCookie } from '../utils/axiosConfig';
import { testCartAPI } from '../services/cartService';

const Cart = () => {
  console.log('Cart component rendering');

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.user);

  // Test API connection when component mounts
  useEffect(() => {
    async function testAPI() {
      try {
        // Check if we have a session cookie
        const hasCookie = checkSessionCookie();
        console.log('Session cookie check:', hasCookie);
        
        // Lưu sessionId tạm thời để theo dõi
        if (localStorage.getItem('tempSessionId')) {
          console.log('Previous session ID:', localStorage.getItem('tempSessionId'));
        }
        
        // Kiểm tra xem có đang ở đúng domain không
        const isCorrectDomain = window.location.origin === 'https://curvot.vercel.app';
        console.log('Is correct domain:', isCorrectDomain);
        
        // Kiểm tra độ dài của cookie hiện tại
        console.log('Document cookie length:', document.cookie.length);
        
        const result = await testCartAPI();
        console.log('Cart API test successful:', result);
        
        // Lưu session ID mới
        if (result.sessionId) {
          localStorage.setItem('tempSessionId', result.sessionId);
        }
        
        // Thử lưu cookie mới
        if (result.sessionId && !hasCookie) {
          try {
            document.cookie = `shop.sid=${result.sessionId}; domain=curvot.onrender.com; path=/; secure; samesite=none; max-age=86400`;
            console.log('Manually set cookie, now cookies:', document.cookie);
          } catch (e) {
            console.error('Failed to set cookie manually:', e);
          }
        }
        
        // If API test doesn't show any cart items but we think we should have some,
        // force a refresh to reload the cookies
        if (result.cartItems === 0 && localStorage.getItem('cartAdded')) {
          console.log('Cart appears empty but items should exist, refreshing page');
          // Instead of refreshing, try to load manual cart from localStorage
          const manualCart = localStorage.getItem('manualCart');
          if (manualCart) {
            try {
              const cartData = JSON.parse(manualCart);
              console.log('Loading cart from localStorage:', cartData);
              setCart(cartData);
              setLoading(false);
            } catch (e) {
              console.error('Failed to parse manual cart:', e);
            }
          }
        }
      } catch (err) {
        console.error('Cart API test failed:', err);
      }
    }
    testAPI();
  }, []);

  // Sử dụng useCallback để định nghĩa fetchCart với dependency ổn định
  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching cart data... (Attempt: ' + (retryCount + 1) + ')');
      
      // Check for session cookie
      const hasCookie = checkSessionCookie();
      console.log('Session cookie exists:', hasCookie);
      
      // Check session first for debugging
      try {
        const sessionData = await apiClient.get('/debug/session');
        console.log('Session data:', sessionData.data);
      } catch (sessErr) {
        console.warn('Could not fetch session data:', sessErr);
      }
      
      const res = await apiClient.get('/cart/cart');
      console.log('Cart response:', res);
      console.log('Cart data details:', res.data);
      
      // Check if cart data exists and is valid
      if (!res.data || !res.data.success) {
        console.error('Invalid cart response:', res.data);
        
        // Retry logic if we get invalid data (max 3 attempts)
        if (retryCount < 3) {
          console.log(`Retrying cart fetch (attempt ${retryCount + 1} of 3)...`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => fetchCart(), 1000); // Retry after 1 second
          return;
        }
        
        setError('Invalid cart data received from server');
        setCart([]);
        setLoading(false);
        return;
      }
      
      // Ensure cart is an array
      const cartData = res.data.cart || [];
      console.log('Cart items from server:', cartData);
      
      if (cartData.length === 0) {
        console.log('Cart is empty, setting empty cart state');
        setCart([]);
        setLoading(false);
        return;
      }
      
      // Update localStorage to indicate cart has items
      localStorage.setItem('cartAdded', 'true');
      
      // Lấy thông tin chi tiết cho từng sản phẩm trong giỏ hàng
      const cartWithDetails = await Promise.all(
        cartData.map(async (item) => {
          console.log('Processing cart item:', item);
          try {
            // Use data from cart item if available
            const cartItemData = {
              _id: item.productId,
              quantity: item.quantity || 1,
              name: item.productName || 'Sản phẩm không xác định',
              price: item.productPrice || 0,
              image: item.productImage || null,
            };
            
            // Try to fetch additional details from products API
            try {
              const productRes = await apiClient.get(`/products/${item.productId}`);
              console.log('Product details response:', productRes.data);
              const product = productRes.data.product || {};
              
              // Merge product data with cart data, preferring product data
              return {
                ...cartItemData,
                name: product.name || cartItemData.name,
                price: product.price || cartItemData.price,
                image: product.image || cartItemData.image,
              };
            } catch (prodErr) {
              console.warn(`Could not fetch details for product ${item.productId}:`, prodErr);
              // Return cart item data if product fetch fails
              return cartItemData;
            }
          } catch (err) {
            console.error(`Error processing cart item ${item.productId}:`, err);
            return {
              _id: item.productId || 'unknown',
              quantity: item.quantity || 1,
              name: item.productName || 'Sản phẩm không tồn tại',
              price: item.productPrice || 0,
              image: item.productImage || null,
            };
          }
        })
      );
      
      console.log('Processed cart items with details:', cartWithDetails);
      setCart(cartWithDetails);
      setRetryCount(0); // Reset retry counter on success
    } catch (err) {
      console.error('Lỗi khi tải giỏ hàng:', err);
      
      // Retry logic for errors (max 3 attempts)
      if (retryCount < 3) {
        console.log(`Retrying cart fetch after error (attempt ${retryCount + 1} of 3)...`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchCart(), 1500); // Retry after 1.5 seconds
        return;
      }
      
      setError(`Không thể tải giỏ hàng: ${err.message || err.toString()}`);
    } finally {
      if (retryCount >= 3 || cart.length > 0) {
        setLoading(false);
      }
    }
  }, [retryCount]);

  useEffect(() => {
    fetchCart();
    
    // Set up an interval to check for cart updates every 5 seconds
    // This helps when a product was added in another tab or window
    const checkInterval = setInterval(() => {
      // Check if there's a lastUpdateTime and if it's within the last minute
      const lastUpdateTime = localStorage.getItem('cartLastUpdate');
      if (lastUpdateTime) {
        const lastUpdate = parseInt(lastUpdateTime, 10);
        const now = Date.now();
        // If the cart was updated within the last minute, refresh it
        if (now - lastUpdate < 60000) {
          console.log('Detected recent cart update, refreshing cart data');
          fetchCart();
          // Clear the update flag after refreshing
          localStorage.removeItem('cartLastUpdate');
        }
      }
    }, 5000);
    
    // Clean up interval on unmount
    return () => clearInterval(checkInterval);
  }, [fetchCart]);

  // Debug log cho các state
  useEffect(() => {
    console.log('Current component state:');
    console.log('Loading:', loading);
    console.log('Cart:', cart);
    console.log('Error:', error);
  }, [loading, cart, error]);

  const handleAction = async (action, id, name) => {
    setProcessing(true);
    
    let endpoint, message;
    
    if (action === 'increment') {
      endpoint = `/cart/increment/${id}`;
      message = `Đã tăng số lượng ${name}`;
    } else if (action === 'decrement') {
      endpoint = `/cart/decrement/${id}`;
      message = `Đã giảm số lượng ${name}`;
    } else if (action === 'remove') {
      endpoint = `/cart/remove/${id}`;
      message = `Đã xóa ${name} khỏi giỏ hàng`;
    }
    
    try {
      await apiClient.post(endpoint);
      toast.success(message);
      
      // Lấy dữ liệu giỏ hàng cập nhật
      const cartRes = await apiClient.get('/cart/cart');
      
      if (!cartRes.data.cart || cartRes.data.cart.length === 0) {
        setCart([]);
        setProcessing(false);
        return;
      }
      
      const cartWithDetails = await Promise.all(
        cartRes.data.cart.map(async (item) => {
          try {
            const productRes = await apiClient.get(`/products/${item.productId}`);
            const product = productRes.data.product || {};
            return {
              _id: item.productId,
              quantity: item.quantity,
              name: product.name || 'Sản phẩm không xác định',
              price: product.price || 0,
              image: product.image || null,
            };
          } catch (err) {
            console.error(`Error fetching details for product ${item.productId}:`, err);
            return {
              _id: item.productId,
              quantity: item.quantity,
              name: 'Sản phẩm không tồn tại',
              price: 0,
              image: null
            };
          }
        })
      );
      setCart(cartWithDetails);
    } catch (error) {
      console.error(`Lỗi khi ${action === 'remove' ? 'xóa' : 'cập nhật'} sản phẩm:`, error);
      toast.error(`Không thể ${action === 'remove' ? 'xóa' : 'cập nhật'} sản phẩm. Vui lòng thử lại.`);
    } finally {
      setProcessing(false);
    }
  };

  const increment = (id, name) => handleAction('increment', id, name);
  const decrement = (id, name) => handleAction('decrement', id, name);
  const remove = (id, name) => handleAction('remove', id, name);

  const handleCheckout = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để tiếp tục thanh toán', { 
        duration: 4000,
        position: 'top-center' 
      });
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    
    if (cart.length === 0) {
      showNotification('Giỏ hàng trống, không thể thanh toán', 'error');
    } else {
      navigate('/checkout');
    }
  };

  const total = cart.reduce((sum, p) => sum + (p.price ? p.price * p.quantity : 0), 0);

  // Add explicit refresh button handler
  const handleRefresh = () => {
    console.log('Manual refresh requested');
    setLoading(true);
    setRetryCount(0);
    // Set a timestamp to force refresh
    localStorage.setItem('cartLastUpdate', Date.now().toString());
    fetchCart();
  };

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">🛒 Giỏ hàng của bạn</h1>
        <div className="py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state');
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">🛒 Giỏ hàng của bạn</h1>
        <div className="py-10 text-red-500">
          <p>{error}</p>
          <p className="text-xs mt-2">Chi tiết lỗi: {error && error.toString()}</p>
          <button 
            onClick={fetchCart}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  console.log('Rendering cart UI, cart length:', cart.length);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">🛒 Giỏ hàng của bạn</h1>
        <button 
          onClick={handleRefresh}
          className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition flex items-center"
        >
          <i className="fas fa-sync-alt mr-1"></i> Làm mới
        </button>
      </div>
      {cart.length === 0 ? (
        <div className="text-center py-8 bg-white p-4 rounded-lg shadow-md">
          <p className="mb-4 text-gray-600">Giỏ hàng của bạn đang trống!</p>
          <Link to="/products" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 inline-block">
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="lg:grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4 mb-6 lg:mb-0">
              {cart.map((product) => (
                <div key={product._id} className="flex flex-col sm:flex-row items-center bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="w-24 h-24 flex-shrink-0">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 flex items-center justify-center rounded-lg">
                        <span className="text-gray-500 text-sm">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-0 sm:ml-4 flex-grow mt-4 sm:mt-0 text-center sm:text-left">
                    <h2 className="text-lg font-semibold">{product.name}</h2>
                    <p className="text-gray-700">
                      Giá: <span className="font-medium text-red-600">{product.price ? product.price.toLocaleString() : 0} VND</span>
                    </p>
                    <p className="text-gray-700">
                      Tổng: <span className="font-medium text-red-600">{product.price ? (product.price * product.quantity).toLocaleString() : 0} VND</span>
                    </p>
                    <div className="flex items-center mt-2 justify-center sm:justify-start">
                      <span className="mr-2">Số lượng:</span>
                      <div className="flex items-center border border-gray-300 rounded">
                        <button 
                          onClick={() => decrement(product._id, product.name)} 
                          disabled={processing}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-l"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 border-l border-r border-gray-300">{product.quantity}</span>
                        <button 
                          onClick={() => increment(product._id, product.name)}
                          disabled={processing}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-r"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => remove(product._id, product.name)}
                    disabled={processing}
                    className="mt-4 sm:mt-0 sm:ml-4 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-colors flex items-center"
                  >
                    <i className="fas fa-trash-alt mr-2"></i> Xóa
                  </button>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white p-4 rounded-lg shadow-md sticky top-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-bold">Thông tin đơn hàng</h3>
                  <span className="text-gray-600">{cart.length} sản phẩm</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between mb-2">
                    <span>Tạm tính:</span>
                    <span>{total.toLocaleString()} VND</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2 mt-2">
                    <span>Tổng cộng:</span>
                    <span className="text-red-600">{total.toLocaleString()} VND</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={processing || cart.length === 0}
                    className={`w-full mt-4 py-3 rounded-lg text-white font-medium text-center 
                      ${processing || cart.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    {processing ? 'Đang xử lý...' : 'Tiến hành thanh toán'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Link to="/products" className="block text-center mt-8 text-blue-500 hover:underline">
        ← Tiếp tục mua sắm
      </Link>
    </div>
  );
};

export default Cart;
