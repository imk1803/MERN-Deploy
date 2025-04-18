import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { verifyPayment } from '../services/paymentService';
import { clearCart } from '../services/cartService';
import { toast } from 'react-hot-toast';

// Component modal xác nhận hủy thanh toán
const CancelConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận hủy thanh toán</h3>
        <p className="text-gray-700 mb-4">Bạn có chắc chắn muốn hủy thanh toán này? Hành động này không thể hoàn tác.</p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Không, giữ lại
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Có, hủy thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentResult = () => {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [searchParams] = useSearchParams();
  const { type } = useParams();
  const navigate = useNavigate();
  
  // State cho modal hủy thanh toán
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const verifyPaymentStatus = async () => {
      try {
        // Xóa giỏ hàng ngay lập tức khi hiển thị trang kết quả thanh toán
        await clearCart();
        console.log('Đã xóa giỏ hàng ở client');
      
        // Nếu là từ MoMo quay về
        if (searchParams.get('orderId')) {
          const orderId = searchParams.get('orderId');
          const resultCode = searchParams.get('resultCode');
          
          console.log(`MoMo payment return with orderId: ${orderId}, resultCode: ${resultCode}`);
          
          if (resultCode === '0') {
            try {
              // Thành công từ Momo, cập nhật trạng thái
              console.log('Payment successful according to MoMo, verifying with backend');
              const verifyResult = await verifyPayment(orderId, 'momo');
              console.log('Verification result:', verifyResult);
              
              if (verifyResult.success) {
                setStatus('success');
                setMessage('Thanh toán thành công! Đơn hàng của bạn đang được xử lý.');
                setOrderData(verifyResult);
              } else {
                // Hiếm khi xảy ra vì backend đã tự động cập nhật trạng thái
                setStatus('error');
                setMessage('Không thể xác minh trạng thái thanh toán. Vui lòng liên hệ hỗ trợ.');
              }
            } catch (error) {
              console.error('Verification error:', error);
              
              // Nếu MoMo báo thành công, hiển thị thành công cho người dùng
              // dù có lỗi khi xác minh (vì tiền đã bị trừ)
              setStatus('success');
              setMessage('Thanh toán đã được MoMo xác nhận. Vui lòng liên hệ hỗ trợ nếu đơn hàng không được cập nhật trong vài phút.');
            }
          } else {
            // Thất bại từ MoMo
            try {
              // Gọi API để cập nhật trạng thái đơn hàng thành 'failed'
              console.log('Payment failed according to MoMo, updating order status');
              const failedResponse = await axios.post(
                `https://curvot.onrender.com/api/payment/update-status/${orderId}`,
                { 
                  status: 'failed',
                  reason: searchParams.get('message') || 'Thanh toán MoMo thất bại'
                }
              );
              
              console.log('Failed payment status update:', failedResponse.data);
            } catch (error) {
              console.error('Error updating failed payment status:', error);
            }
            
            setStatus('error');
            setMessage(`Thanh toán thất bại: ${searchParams.get('message') || 'Lỗi không xác định'}`);
          }
        } 
        // Nếu là chuyển khoản ngân hàng
        else if (type === 'banking') {
          try {
            setStatus('pending');
            setMessage('Vui lòng hoàn tất chuyển khoản ngân hàng theo thông tin bên dưới.');

            // Lấy thông tin giao dịch từ server
            const orderId = window.location.pathname.split('/').pop();
            console.log('Banking orderId from path:', orderId);
            
            if (orderId) {
              const orderResponse = await axios.get(`https://curvot.onrender.com/api/payment/verify/${orderId}`);
              console.log('Banking order details:', orderResponse.data);
              
              if (orderResponse.data.success) {
                setOrderData(orderResponse.data);
                
                // Kiểm tra nếu thiếu paymentDetails, tạo thông tin thanh toán giả
                if (!orderResponse.data.paymentDetails) {
                  setOrderData({
                    ...orderResponse.data,
                    paymentDetails: {
                      bankId: orderResponse.data.paymentDetails?.bankId || 'VIETCOMBANK',
                      amount: orderResponse.data.totalAmount,
                      transferContent: `Thanh toan ${orderId}`
                    }
                  });
                }
              } else {
                setStatus('error');
                setMessage('Không thể tải thông tin thanh toán. Vui lòng liên hệ hỗ trợ.');
              }
            }
          } catch (error) {
            console.error('Lỗi lấy thông tin đơn hàng:', error);
            setStatus('error');
            setMessage('Đã xảy ra lỗi khi tải thông tin thanh toán. Vui lòng liên hệ hỗ trợ.');
          }
        }
        // Trường hợp thành công chung
        else if (type === 'success') {
          setStatus('success');
          setMessage('Đơn hàng đã được tạo thành công! Cảm ơn bạn đã mua sắm.');
        }
        // Trường hợp thất bại chung
        else if (type === 'failed') {
          try {
            // Lấy ID đơn hàng từ đường dẫn URL
            const orderId = window.location.pathname.split('/').pop();
            console.log('Failed payment orderId from path:', orderId);
            
            if (orderId) {
              // Gọi API để cập nhật trạng thái đơn hàng thành 'failed'
              const failedResponse = await axios.post(
                `https://curvot.onrender.com/api/payment/update-status/${orderId}`,
                { 
                  status: 'failed',
                  reason: 'Thanh toán bị hủy bởi người dùng'
                }
              );
              
              console.log('Failed payment status update:', failedResponse.data);
            }
          } catch (error) {
            console.error('Error updating failed payment status:', error);
          }
          
          setStatus('error');
          setMessage('Thanh toán đã bị hủy hoặc không thành công. Vui lòng thử lại sau hoặc chọn phương thức thanh toán khác.');
        }
        // Mặc định nếu không có thông tin
        else {
          setStatus('error');
          setMessage('Không tìm thấy thông tin thanh toán. Vui lòng kiểm tra lại đơn hàng của bạn.');
        }
      } catch (error) {
        console.error('Lỗi xác minh thanh toán:', error);
        setStatus('error');
        setMessage('Đã xảy ra lỗi khi xác minh thanh toán. Vui lòng liên hệ hỗ trợ.');
      }
    };

    verifyPaymentStatus();
  }, [searchParams, type]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return (
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        );
      case 'pending':
        return (
          <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-16 h-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-16 h-16 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
    }
  };

  const renderBankingDetails = () => {
    if (status !== 'pending') return null;

    // Nếu không có dữ liệu thanh toán, hiển thị thông tin mặc định
    if (!orderData?.paymentDetails) {
      return (
        <div className="mt-6 border rounded-lg p-6 bg-yellow-50">
          <h3 className="text-lg font-bold mb-4">Thông tin chuyển khoản</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Ngân hàng:</span>
              <span>VIETCOMBANK</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium">Số tài khoản:</span>
              <span>0123456789</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium">Chủ tài khoản:</span>
              <span>CONG TY CurvoTech</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium">Nội dung chuyển khoản:</span>
              <span className="font-bold">Thanh toan {window.location.pathname.split('/').pop()}</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-100 rounded-lg text-sm">
            <p className="font-medium">Lưu ý:</p>
            <ul className="list-disc pl-5 mt-1">
              <li>Vui lòng chuyển khoản chính xác số tiền và nội dung chuyển khoản</li>
              <li>Đơn hàng sẽ được xử lý trong vòng 24h sau khi nhận được thanh toán</li>
              <li>Nếu cần hỗ trợ, vui lòng liên hệ qua email: support@example.com</li>
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-6 border rounded-lg p-6 bg-yellow-50">
        <h3 className="text-lg font-bold mb-4">Thông tin chuyển khoản</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Ngân hàng:</span>
            <span>{orderData.paymentDetails.bankId}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Số tài khoản:</span>
            <span>0123456789</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Chủ tài khoản:</span>
            <span>CONG TY MERN</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Số tiền:</span>
            <span className="text-red-600 font-bold">
              {(orderData.paymentDetails.amount || orderData.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Nội dung chuyển khoản:</span>
            <span className="font-bold">
              {orderData.paymentDetails.transferContent || `Thanh toan ${orderData._id}`}
            </span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-100 rounded-lg text-sm">
          <p className="font-medium">Lưu ý:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>Vui lòng chuyển khoản chính xác số tiền và nội dung chuyển khoản</li>
            <li>Đơn hàng sẽ được xử lý trong vòng 24h sau khi nhận được thanh toán</li>
            <li>Nếu cần hỗ trợ, vui lòng liên hệ qua email: support@example.com</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen py-12">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-8">
        {getStatusIcon()}
        
        <h1 className={`text-2xl font-bold text-center mb-4 ${
          status === 'success' ? 'text-green-600' : 
          status === 'error' ? 'text-red-600' : 
          status === 'pending' ? 'text-yellow-600' : 'text-blue-600'
        }`}>
          {status === 'success' ? 'Thanh toán thành công!' : 
           status === 'error' ? 'Thanh toán thất bại!' :
           status === 'pending' ? 'Chờ thanh toán' : 'Đang xử lý...'}
        </h1>
        
        <p className="text-center text-gray-700 mb-6">{message}</p>
        
        {renderBankingDetails()}
        
        <div className="flex justify-center mt-8 space-x-4">
          <button 
            onClick={() => navigate('/products')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Tiếp tục mua sắm
          </button>
          
          {status === 'success' && (
            <button 
              onClick={() => navigate('/my-orders')}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Xem đơn hàng
            </button>
          )}
        </div>
        
        {status === 'pending' && (
          <div className="flex justify-center mt-4">
            <button 
              onClick={() => setShowCancelModal(true)}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Hủy thanh toán
            </button>
          </div>
        )}
      </div>
      
      {/* Modal xác nhận hủy thanh toán */}
      <CancelConfirmModal 
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={async () => {
          try {
            const orderId = window.location.pathname.split('/').pop();
            // Gọi API để cập nhật trạng thái đơn hàng thành 'failed'
            const response = await axios.post(
              `https://curvot.onrender.com/api/payment/update-status/${orderId}`,
              { 
                status: 'failed',
                reason: 'Thanh toán bị hủy bởi người dùng'
              }
            );
            
            console.log('Cancel payment response:', response.data);
            if (response.data.success) {
              // Đóng modal
              setShowCancelModal(false);
              // Chuyển đến trang thất bại thanh toán
              navigate('/payment/failed/' + orderId);
            }
          } catch (error) {
            console.error('Error cancelling payment:', error);
            toast.error('Có lỗi xảy ra khi hủy thanh toán');
            // Đóng modal
            setShowCancelModal(false);
          }
        }}
      />
    </div>
  );
};

export default PaymentResult; 