const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Simple test route to check if cart router is working
router.get('/test', (req, res) => {
    console.log('Cart test route accessed');
    console.log('Current session ID:', req.session.id);
    console.log('Current cart content:', req.session.cart || []);
    
    res.status(200).json({
        success: true,
        message: 'Cart API is working',
        sessionId: req.session.id,
        cartItems: req.session.cart ? req.session.cart.length : 0,
        timestamp: new Date().toISOString(),
        hasSession: !!req.session,
        hasCookies: Object.keys(req.cookies || {}).length > 0,
        cookies: req.cookies || {}
    });
});

// Middleware: Đảm bảo req.session.cart luôn tồn tại
router.use((req, res, next) => {
    console.log('Cart middleware - Session ID:', req.session.id);
    console.log('Cart middleware - Request cookies:', req.cookies);
    console.log('Cart middleware - Cart before init:', req.session.cart);
    
    if (!req.session.cart) {
        console.log('Creating new cart in session');
        req.session.cart = [];
        // Force save changes to session
        req.session.save(err => {
            if (err) {
                console.error('Error saving empty cart to session:', err);
            } else {
                console.log('Empty cart initialized in session');
            }
            next();
        });
    } else {
        console.log('Cart middleware - Cart already exists with items:', req.session.cart.length);
        next();
    }
});

// ========================== THÊM SẢN PHẨM VÀO GIỎ HÀNG ==========================
router.post('/add/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        console.log('Add to cart request for product ID:', productId);
        console.log('Session ID:', req.session.id);
        
        // Ensure session cart exists
        if (!req.session.cart) {
            console.log('Creating cart array since it does not exist');
            req.session.cart = [];
        }
        
        const product = await Product.findById(productId);
        if (!product) {
            console.log('Product not found with ID:', productId);
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        console.log('Product found:', product.name, 'with ID:', product._id.toString());
        console.log('Current cart items:', req.session.cart.length);
        
        // Convert product._id to string for safe comparison
        const productIdString = product._id.toString();
        
        // Find if product already exists in cart
        let existing = null;
        for (let item of req.session.cart) {
            console.log('Comparing cart item:', item.productId, 'with product:', productIdString);
            if (item.productId === productIdString) {
                existing = item;
                break;
            }
        }

        if (existing) {
            console.log('Increasing quantity for existing product in cart');
            existing.quantity += 1;
        } else {
            console.log('Adding new product to cart');
            req.session.cart.push({
                productId: productIdString,
                quantity: 1,
                productName: product.name,
                productPrice: product.price,
                productImage: product.image
            });
        }

        console.log('Cart after update:', req.session.cart);
        console.log('Cart length after update:', req.session.cart.length);
        
        // Force immediate save session to database
        req.session.save((err) => {
            if (err) {
                console.error('Lỗi lưu session:', err);
                return res.status(500).json({ success: false, message: 'Lỗi lưu session' });
            }
            console.log('Session saved successfully');
            
            // Ensure the session cookie is sent back to client without using sessionConfig
            // Use the default session cookie name or get it from req.session
            
            res.status(200).json({ 
                success: true, 
                message: 'Đã thêm vào giỏ hàng', 
                cart: req.session.cart,
                sessionId: req.session.id
            });
        });
    } catch (err) {
        console.error('Lỗi thêm vào giỏ hàng:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
});

// ========================== TĂNG SỐ LƯỢNG ==========================
router.post('/increment/:id', (req, res) => {
    try {
        const { id } = req.params;
        console.log('Increment cart item:', id);
        console.log('Current cart:', req.session.cart);
        
        let found = false;
        for (let item of req.session.cart) {
            if (item.productId === id) {
                item.quantity += 1;
                found = true;
                console.log('Increased quantity to:', item.quantity);
                break;
            }
        }
        
        if (!found) {
            console.log('Item not found in cart');
        }
        
        req.session.save((err) => {
            if (err) {
                console.error('Lỗi lưu session:', err);
                return res.status(500).json({ success: false, message: 'Lỗi lưu session' });
            }
            console.log('Cart after increment:', req.session.cart);
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
        console.log('Decrement cart item:', id);
        
        let index = -1;
        for (let i = 0; i < req.session.cart.length; i++) {
            if (req.session.cart[i].productId === id) {
                index = i;
                break;
            }
        }
        
        if (index !== -1) {
            if (req.session.cart[index].quantity > 1) {
                req.session.cart[index].quantity -= 1;
                console.log('Decreased quantity to:', req.session.cart[index].quantity);
            } else {
                req.session.cart.splice(index, 1);
                console.log('Item removed from cart (quantity was 1)');
            }
        } else {
            console.log('Item not found in cart');
        }
        
        req.session.save((err) => {
            if (err) {
                console.error('Lỗi lưu session:', err);
                return res.status(500).json({ success: false, message: 'Lỗi lưu session' });
            }
            console.log('Cart after decrement:', req.session.cart);
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
        console.log('Remove item from cart:', id);
        console.log('Cart before removal:', req.session.cart);
        
        req.session.cart = req.session.cart.filter(item => item.productId !== id);
        console.log('Cart after removal:', req.session.cart);
        
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
        console.log('Clearing entire cart');
        req.session.cart = [];
        
        req.session.save((err) => {
            if (err) {
                console.error('Lỗi lưu session:', err);
                return res.status(500).json({ success: false, message: 'Lỗi lưu session' });
            }
            console.log('Cart cleared successfully');
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
        console.log('Get cart request received');
        console.log('Session ID:', req.session.id);
        console.log('Cart Data in session:', req.session.cart || []);
        
        // Ensure response always has a valid cart array
        const cartData = Array.isArray(req.session.cart) ? req.session.cart : [];
        
        // Deep clone cart to avoid reference issues
        const cartCopy = JSON.parse(JSON.stringify(cartData));
        
        console.log('Sending cart response:', { success: true, cart: cartCopy });
        res.status(200).json({ 
            success: true, 
            cart: cartCopy,
            sessionId: req.session.id
        });
    } catch (err) {
        console.error('Lỗi lấy giỏ hàng:', err);
        res.status(500).json({ success: false, message: "Lỗi lấy giỏ hàng" });
    }
});

module.exports = router;
