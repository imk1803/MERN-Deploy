const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Middleware: Đảm bảo req.session.cart luôn tồn tại
router.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    next();
});

// ========================== THÊM SẢN PHẨM VÀO GIỎ HÀNG ==========================
router.post('/add/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        const existing = req.session.cart.find(item => item.productId.toString() === product._id.toString());

        if (existing) {
            existing.quantity += 1;
        } else {
            req.session.cart.push({
                productId: product._id.toString(),
                quantity: 1,
                productName: product.name,
                productPrice: product.price,
                productImage: product.image
            });
        }

        // Đảm bảo lưu session trước khi gửi phản hồi
        req.session.save((err) => {
            if (err) {
                console.error('Lỗi lưu session:', err);
                return res.status(500).json({ success: false, message: 'Lỗi lưu session' });
            }
            res.status(200).json({ success: true, message: 'Đã thêm vào giỏ hàng', cart: req.session.cart });
        });
    } catch (err) {
        console.error('Lỗi thêm vào giỏ hàng:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// ========================== TĂNG SỐ LƯỢNG ==========================
router.post('/increment/:id', (req, res) => {
    try {
        const { id } = req.params;
        const item = req.session.cart.find(item => item.productId === id);
        if (item) {
            item.quantity += 1;
        }
        
        req.session.save((err) => {
            if (err) {
                console.error('Lỗi lưu session:', err);
                return res.status(500).json({ success: false, message: 'Lỗi lưu session' });
            }
            res.json({ success: true, cart: req.session.cart });
        });
    } catch (err) {
        console.error('Lỗi tăng số lượng:', err);
        res.status(500).json({ success: false, message: "Lỗi tăng số lượng" });
    }
});

// ========================== GIẢM SỐ LƯỢNG ==========================
router.post('/decrement/:id', (req, res) => {
    try {
        const { id } = req.params;
        const index = req.session.cart.findIndex(item => item.productId === id);
        if (index !== -1) {
            if (req.session.cart[index].quantity > 1) {
                req.session.cart[index].quantity -= 1;
            } else {
                req.session.cart.splice(index, 1);
            }
        }
        
        req.session.save((err) => {
            if (err) {
                console.error('Lỗi lưu session:', err);
                return res.status(500).json({ success: false, message: 'Lỗi lưu session' });
            }
            res.json({ success: true, cart: req.session.cart });
        });
    } catch (err) {
        console.error('Lỗi giảm số lượng:', err);
        res.status(500).json({ success: false, message: "Lỗi giảm số lượng" });
    }
});

// ========================== XÓA ==========================
router.post('/remove/:id', (req, res) => {
    try {
        const { id } = req.params;
        req.session.cart = req.session.cart.filter(item => item.productId !== id);
        
        req.session.save((err) => {
            if (err) {
                console.error('Lỗi lưu session:', err);
                return res.status(500).json({ success: false, message: 'Lỗi lưu session' });
            }
            res.status(200).json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng', cart: req.session.cart });
        });
    } catch (err) {
        console.error('Lỗi xóa sản phẩm:', err);
        res.status(500).json({ success: false, message: "Lỗi xóa sản phẩm khỏi giỏ hàng" });
    }
});

// ========================== XÓA TOÀN BỘ GIỎ HÀNG ==========================
router.post('/clear', (req, res) => {
    try {
        req.session.cart = [];
        
        req.session.save((err) => {
            if (err) {
                console.error('Lỗi lưu session:', err);
                return res.status(500).json({ success: false, message: 'Lỗi lưu session' });
            }
            res.status(200).json({ success: true, message: "Đã xóa toàn bộ giỏ hàng", cart: [] });
        });
    } catch (err) {
        console.error('Lỗi xóa toàn bộ giỏ hàng:', err);
        res.status(500).json({ success: false, message: "Lỗi xóa toàn bộ giỏ hàng" });
    }
});

// ========================== XEM GIỎ HÀNG ==========================
router.get('/cart', (req, res) => {
    try {
        console.log('Cart Session:', req.session.id);
        console.log('Cart Data:', req.session.cart || []);
        res.status(200).json({ success: true, cart: req.session.cart || [] });
    } catch (err) {
        console.error('Lỗi lấy giỏ hàng:', err);
        res.status(500).json({ success: false, message: "Lỗi lấy giỏ hàng" });
    }
});

module.exports = router;
