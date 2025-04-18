import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrderById, updateOrderStatus } from '../../services/adminOrderService';
import AdminSidebar from '../../components/AdminSidebar';
import 'bootstrap-icons/font/bootstrap-icons.css';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [statusSuccess, setStatusSuccess] = useState(false);

  // Fetch order details
  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getOrderById(id);
      
      if (response.success) {
        setOrder(response.order);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi tải thông tin đơn hàng');
      }
    } catch (err) {
      console.error('Lỗi khi lấy thông tin đơn hàng:', err);
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    try {
      setStatusLoading(true);
      setStatusError(null);
      setStatusSuccess(false);
      
      const response = await updateOrderStatus(id, newStatus);
      
      if (response.success) {
        setOrder(response.order);
        setStatusSuccess(true);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setStatusSuccess(false);
        }, 3000);
      } else {
        setStatusError(response.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái đơn hàng:', err);
      setStatusError('Không thể kết nối đến máy chủ');
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-indigo-100 text-indigo-800';
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'failed':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'processing':
        return 'Đang xử lý';
      case 'paid':
        return 'Đã thanh toán';
      case 'failed':
        return 'Thanh toán thất bại';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng</h1>
          <Link 
            to="/admin/orders" 
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md flex items-center"
          >
            <i className="bi bi-arrow-left mr-2"></i>
            Quay lại
          </Link>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <i className="bi bi-exclamation-triangle-fill mr-2"></i>
            {error}
          </div>
        )}
        
        {/* Status Update Messages */}
        {statusSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <i className="bi bi-check-circle-fill mr-2"></i>
            Cập nhật trạng thái đơn hàng thành công!
          </div>
        )}
        
        {statusError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <i className="bi bi-exclamation-triangle-fill mr-2"></i>
            {statusError}
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4">Đang tải dữ liệu...</p>
          </div>
        ) : order ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Order Information */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-medium">Thông tin đơn hàng</h2>
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Mã đơn hàng</p>
                    <p className="font-semibold">#{order._id.toString().slice(-8)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Ngày đặt hàng</p>
                    <p className="font-semibold">{formatDate(order.createdAt)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Phương thức thanh toán</p>
                    <p className="font-semibold">{order.paymentMethod || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Tài khoản đặt hàng</p>
                    <p className="font-semibold">{order.user?.username || 'Khách vãng lai'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Người nhận</p>
                    <p className="font-semibold">{order.name || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold">{order.email || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="font-semibold">{order.phone || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Tổng tiền</p>
                    <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Địa chỉ giao hàng</p>
                    <p className="font-semibold">{order.address}{order.city ? `, ${order.city}` : ''}</p>
                  </div>
                  
                  {order.note && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Ghi chú</p>
                      <p className="font-semibold">{order.note}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Order Status Update */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-medium">Cập nhật trạng thái</h2>
                </div>
                
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleStatusUpdate('pending')}
                      disabled={statusLoading || order.status === 'pending'}
                      className={`px-3 py-2 rounded-md text-sm ${
                        order.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Chờ xác nhận
                    </button>
                    
                    <button 
                      onClick={() => handleStatusUpdate('processing')}
                      disabled={statusLoading || order.status === 'processing'}
                      className={`px-3 py-2 rounded-md text-sm ${
                        order.status === 'processing' 
                          ? 'bg-indigo-100 text-indigo-800' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Đang xử lý
                    </button>
                    
                    <button 
                      onClick={() => handleStatusUpdate('paid')}
                      disabled={statusLoading || order.status === 'paid'}
                      className={`px-3 py-2 rounded-md text-sm ${
                        order.status === 'paid' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Đã thanh toán
                    </button>
                    
                    <button 
                      onClick={() => handleStatusUpdate('failed')}
                      disabled={statusLoading || order.status === 'failed'}
                      className={`px-3 py-2 rounded-md text-sm ${
                        order.status === 'failed' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Thanh toán thất bại
                    </button>
                    
                    <button 
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={statusLoading || order.status === 'cancelled'}
                      className={`px-3 py-2 rounded-md text-sm ${
                        order.status === 'cancelled' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Đã hủy
                    </button>
                  </div>
                  
                  {statusLoading && (
                    <div className="mt-3 text-sm text-gray-500 flex items-center">
                      <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-indigo-500 rounded-full"></div>
                      Đang cập nhật...
                    </div>
                  )}
                </div>
              </div>
              
              {/* Order Items */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-medium">Sản phẩm</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left bg-gray-50">
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {order.products && order.products.map((item) => (
                        <tr key={item.productId?._id || item.productId} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {item.productId?.image ? (
                                <img
                                  src={item.productId.image.startsWith('http') 
                                    ? item.productId.image 
                                    : `https://curvot.onrender.com${item.productId.image}`}
                                  alt={item.productId.name}
                                  className="h-12 w-12 rounded-md object-cover mr-3"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://placehold.co/80x80?text=No+Image";
                                  }}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-md bg-gray-200 flex items-center justify-center mr-3">
                                  <i className="bi bi-box text-gray-500"></i>
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">
                                  {item.productId?.name || 'Sản phẩm không xác định'}
                                </div>
                                {item.productId?.categoryName && (
                                  <div className="text-xs text-gray-500">
                                    {item.productId.categoryName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.productId?.price || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency((item.productId?.price || 0) * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-right font-medium">Tổng cộng:</td>
                        <td className="px-6 py-4 font-bold text-indigo-700">{formatCurrency(order.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Customer Information */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-medium">Thông tin khách hàng</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Họ tên</p>
                    <p className="font-semibold">{order.name || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold">{order.email || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="font-semibold">{order.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-medium">Thông tin giao hàng</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Địa chỉ</p>
                    <p className="font-semibold">{order.address || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Thành phố</p>
                    <p className="font-semibold">{order.city || 'N/A'}</p>
                  </div>
                  
                  {order.note && (
                    <div>
                      <p className="text-sm text-gray-500">Ghi chú</p>
                      <p className="italic">{order.note}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {order.paymentDetails && Object.keys(order.paymentDetails).some(key => order.paymentDetails[key]) && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-medium">Chi tiết thanh toán</h2>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {order.paymentDetails.method && (
                      <div>
                        <p className="text-sm text-gray-500">Phương thức</p>
                        <p className="font-semibold">{order.paymentDetails.method}</p>
                      </div>
                    )}
                    
                    {order.paymentDetails.bankId && (
                      <div>
                        <p className="text-sm text-gray-500">Ngân hàng</p>
                        <p className="font-semibold">{order.paymentDetails.bankId}</p>
                      </div>
                    )}
                    
                    {order.paymentDetails.transactionId && (
                      <div>
                        <p className="text-sm text-gray-500">Mã giao dịch</p>
                        <p className="font-semibold">{order.paymentDetails.transactionId}</p>
                      </div>
                    )}
                    
                    {order.paymentDetails.amount && (
                      <div>
                        <p className="text-sm text-gray-500">Số tiền</p>
                        <p className="font-semibold">{formatCurrency(order.paymentDetails.amount)}</p>
                      </div>
                    )}
                    
                    {order.paymentDetails.paidAt && (
                      <div>
                        <p className="text-sm text-gray-500">Thời gian thanh toán</p>
                        <p className="font-semibold">{formatDate(order.paymentDetails.paidAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <i className="bi bi-inbox text-4xl text-gray-400 mb-3 block"></i>
            <p className="text-gray-500">Không tìm thấy đơn hàng.</p>
            <Link
              to="/admin/orders"
              className="inline-block mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
            >
              <i className="bi bi-arrow-left mr-2"></i>
              Quay lại danh sách
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail; 