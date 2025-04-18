require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

// Debug environment variables
console.log('⚙️ Environment:', process.env.NODE_ENV);
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? 'Configured' : 'Missing');
console.log('🗄️ MongoDB URI:', process.env.MONGODB_URI ? 'Configured' : 'Using default');

// Import models
const Order = require('./models/Order');

// Import routes
const userRoutes = require('./routers/users');
const productRoutes = require('./routers/products');
const searchRoutes = require('./routers/search');
const cartRoutes = require('./routers/cart');
const checkoutRoutes = require('./routers/checkout');
const paymentRoutes = require('./routers/payment');
const aboutRoutes = require('./routers/about');
const adminUserRoutes = require('./routers/admin-user');
const adminProductRoutes = require('./routers/admin-product');
const adminOrderRoutes = require('./routers/admin-order');
const adminStatsRoutes = require('./routers/admin-stats');
const adminCategoryRoutes = require('./routers/admin-category');
const ordersRoutes = require('./routers/orders');

const app = express();
const PORT = process.env.PORT || 5000;

// ========================== DATABASE CONNECTION ==========================
mongoose.connect(process.env.MONGODB_URI || '', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1); // Exit if database connection fails
});

// Monitor MongoDB connection
mongoose.connection.on('error', err => {
    console.error('MongoDB Error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('❌ MongoDB Disconnected');
});

// ========================== MIDDLEWARE ==========================
// Security Middleware
app.use(express.json({ limit: '10mb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser()); // Add cookie parser middleware

// CORS Configuration - Fixed to avoid duplication
app.use(cors({
    origin: process.env.CLIENT_URL || 'https://curvot.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
}));

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    console.log('Request cookies:', req.cookies);
    console.log('Request headers:', req.headers);
    next();
});

// Session Configuration
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Determine environment for cookie settings
const isProduction = process.env.NODE_ENV === 'production';
console.log('Environment:', isProduction ? 'production' : 'development');

// Session configuration
const sessionConfig = {
    name: 'shop.sid', // Set a specific cookie name
    secret: process.env.SESSION_SECRET || 'shop-session-secret-123',
    resave: true, // Changed to ensure session is saved on every request
    saveUninitialized: true, // Create session for all visitors
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/shop',
        ttl: 24 * 60 * 60, // 1 day
        autoRemove: 'interval',
        autoRemoveInterval: 60, // In minutes
        touchAfter: 24 * 3600 // Time period in seconds to force session update
    }),
    cookie: {
        secure: false, // Disable secure cookies for both environments for testing
        httpOnly: true,
        sameSite: 'lax', // Use 'lax' to ensure cookies work across domains
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
};

// Log session configuration for debugging
console.log('Session configuration:', {
    name: sessionConfig.name,
    secret: sessionConfig.secret ? 'Set' : 'Not set',
    cookie: sessionConfig.cookie
});

app.use(session(sessionConfig));

// Auto-save the session for every request
app.use((req, res, next) => {
    const originalEnd = res.end;
    
    res.end = function() {
        if (req.session && req.session.save) {
            req.session.save((err) => {
                if (err) {
                    console.error('Error auto-saving session:', err);
                }
                originalEnd.apply(res, arguments);
            });
        } else {
            originalEnd.apply(res, arguments);
        }
    };
    
    next();
});

// Test middleware to verify session is working
app.use((req, res, next) => {
    // Log the session ID for all requests
    console.log(`Request path: ${req.originalUrl}, Session ID: ${req.session.id}`);
    
    // Count page views for this session
    req.session.views = (req.session.views || 0) + 1;
    console.log(`Session views: ${req.session.views}`);
    
    next();
});

// Export session config for use in other modules
const serverConfig = {
    sessionConfig,
    sessionName: sessionConfig.name
};

// Export the server configuration
module.exports = serverConfig;

// ========================== ROUTES ==========================
// Debug route to check session
app.get('/api/debug/session', (req, res) => {
    res.json({
        sessionId: req.session.id,
        cart: req.session.cart || [],
        user: req.session.user || null
    });
});

// API Routes with version prefix
const API_PREFIX = '/api';
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}/checkout`, checkoutRoutes);
app.use(`${API_PREFIX}/payment`, paymentRoutes);
app.use(`${API_PREFIX}/about`, aboutRoutes);
app.use(`${API_PREFIX}/orders`, ordersRoutes);

// Admin Routes with authentication check
app.use(`${API_PREFIX}/admin/users`, adminUserRoutes);
app.use(`${API_PREFIX}/admin/products`, adminProductRoutes);
app.use(`${API_PREFIX}/admin/orders`, adminOrderRoutes);
app.use(`${API_PREFIX}/admin/categories`, adminCategoryRoutes);
app.use(`${API_PREFIX}/admin`, adminStatsRoutes);

// Health Check Route
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'API endpoint không tồn tại'
    });
});

// ========================== ERROR HANDLING ==========================
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' 
            ? err.message 
            : 'Có lỗi xảy ra từ server!',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ========================== SERVER STARTUP ==========================
const server = app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('💤 Server closed. Database connections terminated.');
            process.exit(0);
        });
    });
});

// Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    server.close(() => {
        process.exit(1);
    });
});