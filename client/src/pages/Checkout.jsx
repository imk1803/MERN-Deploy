import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { initiateMomoPayment, initiateOnlineBankingPayment, getPaymentMethods } from '../services/paymentService';
import { useSelector } from 'react-redux';

const axiosInstance = axios.create({
  baseURL: 'https://curvot.onrender.com',
  withCredentials: true
});

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: userLoading } = useSelector((state) => state.user);
  
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [showBanks, setShowBanks] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    note: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  // Lấy giỏ hàng và phương thức thanh toán
  useEffect(() => {
    // Chỉ fetch data nếu người dùng đã đăng nhập
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Lấy giỏ hàng
        const cartRes = await axiosInstance.get('/api/cart/cart');
        if (!cartRes.data.cart || cartRes.data.cart.length === 0) {
          toast.error('Giỏ hàng trống, không thể thanh toán');
          navigate('/cart');
          return;
        }

        // Lấy chi tiết sản phẩm
        const cartWithDetails = await Promise.all(
          cartRes.data.cart.map(async (item) => {
            const productRes = await axiosInstance.get(`/api/products/${item.productId}`);
            const product = productRes.data.product || {};
            return {
              _id: item.productId,
              quantity: item.quantity,
              name: product.name || 'Sản phẩm không xác định',
              price: product.price || 0,
              image: product.image || null,
            };
          })
        );
        setCart(cartWithDetails);

        // Lấy phương thức thanh toán
        const paymentRes = await getPaymentMethods();
        setPaymentMethods(paymentRes.paymentMethods || []);
        
        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        toast.error('Không thể tải dữ liệu thanh toán');
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, user]);

  // Cập nhật formData khi user thay đổi
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePaymentMethodChange = (methodId) => {
    setSelectedPaymentMethod(methodId);
    setShowBanks(methodId === 'banking');
    if (methodId !== 'banking') {
      setSelectedBank('');
    }
  };

  const handleBankSelect = (bankId) => {
    setSelectedBank(bankId);
  };

  const validateForm = () => {
    const { name, email, phone, address } = formData;
    if (!name || !email || !phone || !address) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
      return false;
    }

    if (!selectedPaymentMethod) {
      toast.error('Vui lòng chọn phương thức thanh toán');
      return false;
    }

    if (selectedPaymentMethod === 'banking' && !selectedBank) {
      toast.error('Vui lòng chọn ngân hàng');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setProcessingPayment(true);
      
      // Tính tổng giá trị đơn hàng
      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Tạo đơn hàng
      const orderData = {
        ...formData,
        products: cart.map(item => ({
          productId: item._id,
          quantity: item.quantity
        })),
        paymentMethod: selectedPaymentMethod,
        totalAmount
      };
      
      if (selectedPaymentMethod === 'banking') {
        orderData.bankId = selectedBank;
      }
      
      console.log('Sending order data:', orderData);
      
      // Gửi đơn hàng lên server - Sử dụng API orders để đảm bảo gắn userID
      const orderRes = await axiosInstance.post('/api/orders', orderData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Order response:', orderRes.data);
      
      if (!orderRes.data.success) {
        toast.error(orderRes.data.message || 'Có lỗi xảy ra khi tạo đơn hàng');
        setProcessingPayment(false);
        return;
      }
      
      const orderId = orderRes.data.order._id;
      
      // Xử lý thanh toán theo phương thức đã chọn
      if (selectedPaymentMethod === 'momo') {
        // Thanh toán MoMo
        const paymentData = {
          orderId,
          amount: Math.round(totalAmount),
          orderInfo: `Thanh toán đơn hàng #${orderId}`
        };
        
        console.log('Payment data for MoMo:', paymentData);
        
        const momoRes = await initiateMomoPayment(paymentData);
        
        console.log('MoMo payment response:', momoRes);
        
        if (momoRes.success && momoRes.payUrl) {
          // Chuyển hướng đến trang thanh toán MoMo
          window.location.href = momoRes.payUrl;
        } else {
          toast.error('Không thể khởi tạo thanh toán MoMo');
        }
      } else if (selectedPaymentMethod === 'banking') {
        // Thanh toán chuyển khoản ngân hàng
        const paymentData = {
          orderId,
          amount: totalAmount,
          bankId: selectedBank,
          customerInfo: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone
          }
        };
        
        console.log('Payment data for banking:', paymentData);
        
        const bankingRes = await initiateOnlineBankingPayment(paymentData);
        console.log('Banking payment response:', bankingRes);
        
        if (bankingRes.success) {
          // Hiển thị thông tin chuyển khoản
          navigate(`/payment/banking/${orderId}`);
        } else {
          // Hiển thị thông báo lỗi từ server nếu có
          toast.error(bankingRes.message || 'Không thể khởi tạo thanh toán ngân hàng');
          setProcessingPayment(false);
          return; // Dừng xử lý tiếp theo
        }
      }
      
      // Xóa giỏ hàng sau khi đặt hàng thành công
      try {
        await axiosInstance.delete('/api/cart/clear');
      } catch (err) {
        console.error('Error clearing cart:', err);
        // Không ngăn người dùng tiếp tục nếu lỗi này xảy ra
      }
      
    } catch (err) {
      console.error('Error in checkout:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi xử lý thanh toán');
      setProcessingPayment(false);
    }
  };

  // Nếu đang tải dữ liệu user, hiện loading
  if (userLoading) {
    return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
  }
  
  // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-center mb-8">Thanh toán</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Thông tin giao hàng */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Thông tin giao hàng</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (tùy chọn)</label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                    ></textarea>
                  </div>
                </div>

                {/* Phương thức thanh toán */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Phương thức thanh toán</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {paymentMethods.map((method) => (
                      <div 
                        key={method.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedPaymentMethod === method.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 hover:border-blue-300'
                        }`}
                        onClick={() => handlePaymentMethodChange(method.id)}
                      >
                        <div className="flex items-center">
                          <img 
                            src={method.logo} 
                            alt={method.name} 
                            className="w-10 h-10 object-contain mr-3"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '';
                            }}
                          />
                          <div>
                            <p className="font-medium">{method.name}</p>
                            <p className="text-sm text-gray-500">{method.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hiển thị danh sách ngân hàng nếu phương thức là banking */}
                {showBanks && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Chọn ngân hàng</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {paymentMethods
                        .find(method => method.id === 'banking')?.banks
                        .map(bank => (
                          <div 
                            key={bank.id}
                            className={`border rounded-lg p-3 cursor-pointer transition-all flex flex-col items-center ${
                              selectedBank === bank.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-300 hover:border-blue-300'
                            }`}
                            onClick={() => handleBankSelect(bank.id)}
                          >
                            <img 
                              src={bank.logo} 
                              alt={bank.name} 
                              className="w-12 h-12 object-contain mb-2"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '';
                              }}
                            />
                            <p className="text-sm text-center font-medium">{bank.name}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processingPayment}
                  className={`w-full py-3 rounded-lg text-white font-medium ${
                    processingPayment 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {processingPayment ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    `Thanh toán ${totalAmount.toLocaleString('vi-VN')}đ`
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Đơn hàng của bạn */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Đơn hàng của bạn</h2>
              
              <div className="mb-4 max-h-96 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item._id} className="flex py-3 border-b">
                    <div className="w-16 h-16 flex-shrink-0">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-grow">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">SL: {item.quantity}</p>
                      <p className="text-sm font-medium text-red-600">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Tạm tính:</span>
                  <span>{totalAmount.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Phí vận chuyển:</span>
                  <span>Miễn phí</span>
                </div>
                <div className="flex justify-between font-semibold text-lg mt-2 pt-2 border-t">
                  <span>Tổng cộng:</span>
                  <span className="text-red-600">{totalAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 