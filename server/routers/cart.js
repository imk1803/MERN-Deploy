const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Simple test route to check if cart router is working
router.get('/test', (req, res) => {
    console.log('Cart test route accessed');
    res.status(200).json({
        success: true,
        message: 'Cart API is working',
        timestamp: new Date().toISOString()
    });
});

// Middleware: Đảm bảo req.session.cart luôn tồn tại
router.use((req, res, next) => {
    console.log('Cart middleware - Session ID:', req.session.id);
    console.log('Cart middleware - Cart before init:', req.session.cart);
    
    if (!req.session.cart) {
        req.session.cart = [];
    }
    
    console.log('Cart middleware - Cart after init:', req.session.cart);
    next();
});

// ========================== THÊM SẢN PHẨM VÀO GIỎ HÀNG ==========================
router.post('/add/:id', async (req, res) => {
    try {
        console.log('Add to cart request for product ID:', req.params.id);
        
        const product = await Product.findById(req.params.id);
        if (!product) {
            console.log('Product not found with ID:', req.params.id);
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        console.log('Product found:', product.name);
        const existing = req.session.cart.find(item => item.productId.toString() === product._id.toString());

        if (existing) {
            console.log('Increasing quantity for existing product in cart');
            existing.quantity += 1;
        } else {
            console.log('Adding new product to cart');
            req.session.cart.push({
                productId: product._id.toString(),
                quantity: 1,
                productName: product.name,
                productPrice: product.price,
                productImage: product.image
            });
        }

        console.log('Cart after update:', req.session.cart);
        
        // Đảm bảo lưu session trước khi gửi phản hồi
        req.session.save((err) => {
            if (err) {
                console.error('Lỗi lưu session:', err);
                return res.status(500).json({ success: false, message: 'Lỗi lưu session' });
            }
            console.log('Session saved successfully');
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
