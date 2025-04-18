const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const Order = require('../models/Order');

// Hàm tiện ích để xóa giỏ hàng
const clearCart = async (req) => {
  try {
    // Nếu dùng session-based cart
    if (req.session && req.session.cart) {
      req.session.cart = [];
      await new Promise((resolve) => req.session.save(resolve));
      console.log('Giỏ hàng đã được xóa từ session');
    }
    
    // Gọi API để xóa giỏ hàng (đảm bảo xóa cả ở client)
    try {
      await axios.post('https://curvot.onrender.com/api/cart/clear', {}, {
        headers: {
          Cookie: req.headers.cookie // Chuyển tiếp cookie để xác thực session
        }
      });
      console.log('Đã gọi API xóa giỏ hàng thành công');
    } catch (clearError) {
      console.error('Lỗi khi gọi API xóa giỏ hàng:', clearError);
      // Tiếp tục xử lý nếu lỗi, không ném ngoại lệ
    }
  } catch (error) {
    console.error('Lỗi khi xóa giỏ hàng:', error);
    // Không ném ngoại lệ để không ảnh hưởng đến luồng thanh toán
  }
};

// Momo config - cấu hình Sandbox để testing
const MOMO_CONFIG = {
  partnerCode: 'MOMOBKUN20180529',       // Mã đối tác MoMo sandbox
  accessKey: 'klm05TvNBzhg7h7j',         // Access key MoMo sandbox
  secretKey: 'at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa', // Secret key MoMo sandbox
  redirectUrl: 'https://curvot.vercel.app/payment/result',
  ipnUrl: 'https://curvot.onrender.com/api/payment/momo/ipn',
  requestType: 'captureWallet',
  // Sử dụng endpoint Sandbox của MoMo
  endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create'
};

// Danh sách ngân hàng hỗ trợ
const SUPPORTED_BANKS = [
  { id: 'VIETCOMBANK', name: 'Vietcombank', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/02/Logo-Vietcombank.png' },
  { id: 'TECHCOMBANK', name: 'Techcombank', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2021/11/Logo-TCB-V.png' },
  { id: 'BIDV', name: 'BIDV', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-BIDV-.png' },
  { id: 'VIETINBANK', name: 'Vietinbank', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-VietinBank-CTG-Te.png' },
  { id: 'MBBANK', name: 'MB Bank', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/02/Logo-MB-Bank-MBB.png' },
  { id: 'TPBANK', name: 'TPBank', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/02/Logo-TPBank.png' },
];

// API lấy danh sách phương thức thanh toán
router.get('/methods', (req, res) => {
  const paymentMethods = [
    {
      id: 'momo',
      name: 'Ví MoMo',
      logo: 'https://static.mservice.io/img/logo-momo.png',
      description: 'Thanh toán nhanh chóng qua ví MoMo'
    },
    {
      id: 'banking',
      name: 'Chuyển khoản ngân hàng',
      logo: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png',
      description: 'Thanh toán bằng chuyển khoản ngân hàng',
      banks: SUPPORTED_BANKS
    }
  ];
  
  res.json({ success: true, paymentMethods });
});

// Tạo thanh toán MoMo
router.post('/momo/create', async (req, res) => {
  try {
    const { orderId, amount, orderInfo = 'Thanh toán đơn hàng' } = req.body;
    
    // Chuyển đổi amount sang kiểu số nguyên nếu cần
    const amountInt = parseInt(amount);
    
    // Tạo requestId duy nhất
    const requestId = `${Date.now()}`;
    
    // Tạo signature để xác thực - Đảm bảo thứ tự tham số đúng theo MoMo yêu cầu
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amountInt}&extraData=&ipnUrl=${MOMO_CONFIG.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${MOMO_CONFIG.redirectUrl}&requestId=${requestId}&requestType=${MOMO_CONFIG.requestType}`;
    
    console.log('Raw signature:', rawSignature);
    
    const signature = crypto.createHmac('sha256', MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest('hex');
    
    console.log('Generated signature:', signature);
    
    // Tạo payload cho MoMo API
    const requestBody = {
      partnerCode: MOMO_CONFIG.partnerCode,
      accessKey: MOMO_CONFIG.accessKey,
      requestId: requestId,
      amount: amountInt,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: MOMO_CONFIG.redirectUrl,
      ipnUrl: MOMO_CONFIG.ipnUrl,
      extraData: "",
      requestType: MOMO_CONFIG.requestType,
      signature: signature,
      lang: "vi"
    };
    
    console.log('Sending request to MoMo Sandbox:', JSON.stringify(requestBody));
    
    // Gọi API MoMo Sandbox
    const response = await axios.post(MOMO_CONFIG.endpoint, requestBody);
    
    console.log('MoMo Sandbox response:', response.data);
    
    // Tính thời gian hết hạn (1 ngày)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1);
    
    // Cập nhật thông tin đơn hàng với trạng thái chờ thanh toán và ngày hết hạn
    await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'pending',
        paymentDetails: {
          method: 'momo',
          amount: amountInt,
          requestId: requestId
        },
        expiryDate: expiryDate // Mặc định đơn hàng có thời hạn 1 ngày
      }
    );
    
    // Xóa giỏ hàng sau khi tạo đơn hàng
    await clearCart(req);
    
    // Trả về kết quả
    return res.json({
      success: true,
      payUrl: response.data.payUrl,
      orderId: orderId,
      requestId: requestId
    });
    
  } catch (error) {
    console.error('Lỗi khi tạo thanh toán MoMo:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Không thể khởi tạo thanh toán MoMo',
      error: error.response?.data || error.message
    });
  }
});

// Add this utility function to set expiry date for failed payments
const setFailedPaymentExpiry = async (orderId, reason) => {
    try {
        const oneDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        const expiryDate = new Date(Date.now() + oneDay);
        
        await Order.findByIdAndUpdate(orderId, {
            status: 'failed',
            expiryDate: expiryDate,
            'paymentDetails.failedAt': new Date(),
            'paymentDetails.failedReason': reason || 'Payment failed'
        });
        
        // Set up automatic deletion after expiry
        setTimeout(async () => {
            try {
                await Order.findByIdAndDelete(orderId);
                console.log(`Failed payment order ${orderId} deleted after expiry`);
            } catch (err) {
                console.error(`Error deleting expired order ${orderId}:`, err);
            }
        }, oneDay);
        
    } catch (err) {
        console.error('Error setting payment expiry:', err);
    }
};

// Update the MoMo IPN handler to handle failed payments and update successful payments
router.post('/momo/ipn', async (req, res) => {
    try {
        const { orderId, resultCode, message, transId, amount } = req.body;
        console.log('MoMo IPN:', req.body);

        // Verify the signature here...
        
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Xóa giỏ hàng bất kể kết quả thanh toán
        await clearCart(req);

        if (resultCode === 0) {
            // Payment successful
            await Order.findByIdAndUpdate(orderId, {
                status: 'paid',
                'paymentDetails.transactionId': transId,
                'paymentDetails.amount': amount,
                'paymentDetails.paidAt': new Date()
            });
            
            // Additional logic for successful payment if needed
            
            return res.status(200).json({ success: true, message: 'Payment successful' });
        } else {
            // Payment failed
            await setFailedPaymentExpiry(orderId, message);
            return res.status(200).json({ success: false, message: 'Payment failed', reason: message });
        }
    } catch (error) {
        console.error('MoMo IPN error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Tạo thanh toán chuyển khoản ngân hàng
router.post('/banking/create', async (req, res) => {
  try {
    const { orderId, amount, bankId, customerInfo } = req.body;
    
    // Tạo thông tin thanh toán
    const accountDetails = {
      bankId: bankId,
      accountNumber: '0123456789', // 
      accountName: 'CONG TY CurvoTech', // 
      amount: amount,
      content: `Thanh toan ${orderId}` // Nội dung chuyển khoản
    };
    
    // Lưu thông tin đơn hàng và cập nhật trạng thái
    const order = await Order.findOneAndUpdate(
      { _id: orderId },
      { 
        status: 'pending',
        paymentDetails: {
          method: 'banking',
          bankId: bankId,
          amount: amount,
          transferContent: accountDetails.content
        }
      },
      { new: true } // Trả về document sau khi cập nhật
    );
    
    // After creating the order, if there's an error in the bank transfer process
    if (!order || !order.paymentDetails) {
        await setFailedPaymentExpiry(orderId, 'Failed to set up bank transfer');
        return res.status(400).json({ success: false, message: 'Failed to set up bank transfer' });
    }
    
    // Xóa giỏ hàng sau khi tạo đơn hàng
    await clearCart(req);
    
    // Trả về thông tin thanh toán
    return res.json({
      success: true,
      paymentInfo: accountDetails,
      orderId: orderId
    });
    
  } catch (error) {
    console.error('Create banking payment error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Xác minh thanh toán Momo
router.get('/momo/verify/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Truy vấn thông tin đơn hàng theo id
    const order = await Order.findById(paymentId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Kiểm tra nếu đơn hàng đã thanh toán qua Momo
    if (order.paymentDetails && order.paymentDetails.method === 'momo') {
      if (order.status === 'paid') {
        // Đơn hàng đã được thanh toán
        return res.json({
          success: true,
          orderId: order._id,
          status: order.status,
          paymentDetails: order.paymentDetails
        });
      } else {
        // Nếu chưa cập nhật trạng thái, có thể do IPN chưa gọi hoặc lỗi
        // Thử cập nhật trạng thái nếu đã thanh toán bằng cách gọi API kiểm tra từ Momo
        // (Đây là phần có thể bổ sung để kiểm tra với Momo)
        
        // Cập nhật trạng thái thanh toán (giả định đã thanh toán vì frontend báo thành công)
        order.status = 'paid';
        order.paymentDetails = {
          ...order.paymentDetails,
          paidAt: new Date()
        };
        await order.save();
        
        // Xóa giỏ hàng bất kể kết quả thanh toán
        await clearCart(req);
        
        return res.json({
          success: true,
          orderId: order._id,
          status: 'paid',
          paymentDetails: order.paymentDetails,
          message: 'Cập nhật trạng thái thanh toán thành công'
        });
      }
    }
    
    if (!req.params.paymentId || !order) {
        await setFailedPaymentExpiry(order._id, 'Payment verification failed');
        return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
    
    // Xóa giỏ hàng bất kể kết quả thanh toán
    await clearCart(req);
    
    return res.status(400).json({
      success: false,
      message: 'Đơn hàng không sử dụng phương thức thanh toán Momo'
    });
    
  } catch (error) {
    console.error('Verify MoMo payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Xác minh thanh toán (chung)
router.get('/verify/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`Verifying payment for order: ${orderId}`);
    
    // Truy vấn thông tin đơn hàng
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log(`Order not found: ${orderId}`);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Xóa giỏ hàng khi người dùng xác minh thanh toán
    await clearCart(req);
    
    // Nếu là thanh toán Momo và status chưa phải paid, cập nhật thành paid
    if (order.paymentDetails && order.paymentDetails.method === 'momo' && order.status !== 'paid') {
      console.log(`Updating Momo payment status for order: ${orderId}`);
      // Cập nhật trạng thái thanh toán thành công
      order.status = 'paid';
      if (!order.paymentDetails.paidAt) {
        order.paymentDetails.paidAt = new Date();
      }
      // Xóa ngày hết hạn vì đơn hàng đã thanh toán thành công
      order.expiryDate = null;
      await order.save();
      console.log(`Payment status updated to 'paid' for order: ${orderId}`);
    }
    
    return res.json({
      success: true,
      orderId: order._id,
      status: order.status,
      paymentDetails: order.paymentDetails,
      expiryDate: order.expiryDate
    });
    
  } catch (error) {
    console.error('Lỗi khi xác minh thanh toán:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể xác minh thanh toán',
      error: error.message
    });
  }
});

// Cập nhật trạng thái đơn hàng (dùng cho thanh toán thất bại)
router.post('/update-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;
    
    console.log(`Updating order ${orderId} status to ${status}, reason: ${reason}`);
    
    // Chỉ chấp nhận status là 'failed' từ client
    if (status !== 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ chấp nhận cập nhật trạng thái thất bại'
      });
    }
    
    // Kiểm tra tồn tại đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Chỉ cập nhật nếu đơn hàng đang ở trạng thái chờ xử lý
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Không thể cập nhật trạng thái. Đơn hàng hiện tại đang ở trạng thái ${order.status}`
      });
    }
    
    // Cập nhật trạng thái và thiết lập thời gian hết hạn
    await setFailedPaymentExpiry(orderId, reason);
    
    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật trạng thái đơn hàng thành thất bại',
      orderId: orderId
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add a cleanup job to delete expired orders
const setupCleanupJob = () => {
    setInterval(async () => {
        try {
            const now = new Date();
            const result = await Order.deleteMany({
                status: 'failed',
                expiryDate: { $lt: now }
            });
            if (result.deletedCount > 0) {
                console.log(`Cleaned up ${result.deletedCount} expired failed payment orders`);
            }
        } catch (err) {
            console.error('Error in cleanup job:', err);
        }
    }, 60 * 60 * 1000); // Run every hour
};

// Call the cleanup job setup
setupCleanupJob();

module.exports = router; 