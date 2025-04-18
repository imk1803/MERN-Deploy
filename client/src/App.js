import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile } from './store/userSlice';
import { Provider } from 'react-redux';
import store from './store/store';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import ProductList from './pages/Product-list';
import ProductDetail from './pages/Product-detail';
import About from './pages/About';
import Profile from './pages/Profile';
import PaymentResult from './pages/PaymentResult';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import Header from './components/Header';
import Footer from './components/Footer';
import SearchResult from './components/SearchResult';
import { NotificationProvider } from './contexts/NotificationContext';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminProducts from './pages/Admin/Products';
import AddProduct from './pages/Admin/AddProduct';
import EditProduct from './pages/Admin/EditProduct';
import Categories from './pages/Admin/Categories';
import CategoryForm from './pages/Admin/CategoryForm';
import Orders from './pages/Admin/Orders';
import AdminOrderDetail from './pages/Admin/OrderDetail';
import Users from './pages/Admin/Users';
import UserForm from './pages/Admin/UserForm';
import ProtectedRoute from './components/ProtectedRoute';
import UserProtectedRoute from './components/UserProtectedRoute';
import AccessDenied from './pages/AccessDenied';
import { Toaster } from 'react-hot-toast';

// Layout component that conditionally renders Header and Footer
const AppLayout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Header />}
      {children}
      {!isAdminRoute && <Footer />}
    </>
  );
};

const AppContent = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.user);

  useEffect(() => {
    // Chỉ gọi fetchUserProfile khi có token
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch]);

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={
        <UserProtectedRoute>
          <Checkout />
        </UserProtectedRoute>
      } />
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/about" element={<About />} />
      <Route path="/search" element={<SearchResult />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/payment/result" element={<PaymentResult />} />
      <Route path="/payment/:type" element={<PaymentResult />} />
      <Route path="/payment/:type/:id" element={<PaymentResult />} />
      <Route path="/payment/success" element={<PaymentResult />} />
      
      {/* User Order Routes */}
      <Route path="/my-orders" element={
        <UserProtectedRoute>
          <MyOrders />
        </UserProtectedRoute>
      } />
      <Route path="/my-orders/:id" element={
        <UserProtectedRoute>
          <OrderDetails />
        </UserProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/products" element={
        <ProtectedRoute>
          <AdminProducts />
        </ProtectedRoute>
      } />
      <Route path="/admin/products/add" element={
        <ProtectedRoute>
          <AddProduct />
        </ProtectedRoute>
      } />
      <Route path="/admin/products/:id" element={
        <ProtectedRoute>
          <EditProduct />
        </ProtectedRoute>
      } />
      
      {/* Category Management Routes */}
      <Route path="/admin/categories" element={
        <ProtectedRoute>
          <Categories />
        </ProtectedRoute>
      } />
      <Route path="/admin/categories/add" element={
        <ProtectedRoute>
          <CategoryForm />
        </ProtectedRoute>
      } />
      <Route path="/admin/categories/:id" element={
        <ProtectedRoute>
          <CategoryForm />
        </ProtectedRoute>
      } />
      
      {/* Order Management Routes */}
      <Route path="/admin/orders" element={
        <ProtectedRoute>
          <Orders />
        </ProtectedRoute>
      } />
      <Route path="/admin/orders/:id" element={
        <ProtectedRoute>
          <AdminOrderDetail />
        </ProtectedRoute>
      } />
      
      {/* User Management Routes */}
      <Route path="/admin/users" element={
        <ProtectedRoute>
          <Users />
        </ProtectedRoute>
      } />
      <Route path="/admin/users/add" element={
        <ProtectedRoute>
          <UserForm />
        </ProtectedRoute>
      } />
      <Route path="/admin/users/:id" element={
        <ProtectedRoute>
          <UserForm />
        </ProtectedRoute>
      } />
      
      <Route path="/access-denied" element={<AccessDenied />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <NotificationProvider>
        <Router>
          <AppLayout>
            <AppContent />
          </AppLayout>
        </Router>
        <Toaster position="top-right" toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#2ecc71',
            },
          },
          error: {
            style: {
              background: '#e74c3c',
            },
          },
        }} />
      </NotificationProvider>
    </Provider>
  );
};

export default App;