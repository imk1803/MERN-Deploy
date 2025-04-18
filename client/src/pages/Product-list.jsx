import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import handleAddToCart from '../services/cartService';

// CSS animation styles
// eslint-disable-next-line no-unused-vars
const styles = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .notification-animate {
      animation: fadeIn 0.3s ease-out forwards;
    }
    
    .dropdown {
      animation: fadeIn 0.2s ease-out forwards;
    }
  `
};

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef(null);

  const limit = 9; // Hiển thị 9 sản phẩm mỗi trang để tối ưu bố cục grid 3x3

  // Cấu hình axios để luôn gửi cookie (session ID)
  axios.defaults.withCredentials = true;

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    
    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };
  
  // Lắng nghe click bên ngoài dropdown để đóng nó
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Lấy danh sách danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('https://curvot.onrender.com/api/products/categories');
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        } else {
          console.error('Response không phải mảng danh mục:', res.data);
          setCategories([]);
        }
      } catch (err) {
        console.error('❌ Lỗi lấy danh mục:', err);
        setCategories([]);
      }
    };
    
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const page = parseInt(searchParams.get('page')) || 1;
        const category = searchParams.get('category') || '';
        
        // Tạo query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        queryParams.append('limit', limit);
        if (category) {
          queryParams.append('category', category);
        }
        
        const res = await axios.get(`https://curvot.onrender.com/api/products?${queryParams.toString()}`);
        
        if (res.data.success) {
          setProducts(res.data.products || []);
          setTotalPages(res.data.pagination.totalPages || 1);
          setCurrentPage(page);
        } else {
          console.error('API trả về lỗi:', res.data);
          setProducts([]);
          showNotification('Không thể tải danh sách sản phẩm!', 'error');
        }
      } catch (err) {
        console.error('❌ Lỗi lấy sản phẩm:', err);
        setProducts([]);
        showNotification('Không thể tải danh sách sản phẩm!', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams, limit]);

  const handlePageChange = (newPage) => {
    // Giữ nguyên category khi chuyển trang
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    setSearchParams(newParams);
  };
  
  const handleCategoryChange = (categoryId) => {
    const newParams = new URLSearchParams();
    newParams.set('page', 1); // Reset về trang 1
    if (categoryId) {
      newParams.set('category', categoryId);
    }
    setSearchParams(newParams);
    setShowDropdown(false); // Đóng dropdown sau khi chọn
  };
  
  // Lấy category hiện tại từ URL
  const currentCategory = searchParams.get('category') || '';
  
  // Tìm tên của danh mục đang chọn
  const getCurrentCategoryName = () => {
    if (!currentCategory) return 'Tất cả danh mục';
    
    const selectedCategory = categories.find(c => c._id === currentCategory);
    return selectedCategory ? selectedCategory.name : 'Tất cả danh mục';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6">
        {notification.show && (
          <div 
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg notification-animate ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white flex items-center`}
          >
            <span className="mr-2">
              {notification.type === 'success' ? '✓' : '✕'}
            </span>
            {notification.message}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar with categories - Desktop */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Danh mục</h2>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => handleCategoryChange(null)}
                    className={`w-full text-left px-3 py-2 rounded-md ${
                      !currentCategory ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                    }`}
                  >
                    Tất cả sản phẩm
                  </button>
                </li>
                {categories.map((category) => (
                  <li key={category._id}>
                    <button
                      onClick={() => handleCategoryChange(category._id)}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        currentCategory === category._id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                      }`}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-xl sm:text-2xl font-bold">Danh sách sản phẩm</h1>
                
                {/* Category dropdown for mobile */}
                <div className="relative w-full sm:w-auto md:hidden" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center justify-between w-full sm:w-64 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <span>{getCurrentCategoryName()}</span>
                    <svg className={`ml-2 h-5 w-5 text-gray-400 transition-transform ${showDropdown ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                      <ul className="py-1 max-h-60 overflow-auto">
                        <li>
                          <button
                            onClick={() => {
                              handleCategoryChange(null);
                              setShowDropdown(false);
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm ${
                              !currentCategory ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                            }`}
                          >
                            Tất cả sản phẩm
                          </button>
                        </li>
                        {categories.map((category) => (
                          <li key={category._id}>
                            <button
                              onClick={() => {
                                handleCategoryChange(category._id);
                                setShowDropdown(false);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                currentCategory === category._id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                              }`}
                            >
                              {category.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <p className="text-gray-500">Không tìm thấy sản phẩm.</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <Link to={`/products/${product._id}`} className="flex flex-col flex-grow">
                        <div className="w-full h-48 overflow-hidden">
                          <img 
                            src={product.image.startsWith('http') ? product.image : `https://curvot.onrender.com${product.image}`} 
                            alt={product.name} 
                            className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://placehold.co/400x300?text=No+Image";
                            }}
                          />
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                          <h2 className="text-lg font-semibold mb-1 line-clamp-2 h-14 overflow-hidden" title={product.name}>
                            {product.name}
                          </h2>
                          <p className="text-xs text-gray-500 mb-2">
                            {product.category && product.category.name ? product.category.name : 
                            product.categoryName ? product.categoryName : "Không có danh mục"}
                          </p>
                          <p className="mt-auto text-red-500 font-bold">{product.price ? product.price.toLocaleString('vi-VN') : 0}đ</p>
                        </div>
                      </Link>
                      <div className="px-4 pb-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(product._id, showNotification);
                          }}
                          className="w-full bg-blue-100 text-blue-500 py-2 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors"
                        >
                          <i className="fas fa-shopping-cart mr-2"></i> Thêm vào giỏ hàng
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="inline-flex rounded-md shadow-sm">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-blue-500 hover:bg-blue-50'
                        } border border-gray-300`}
                      >
                        &laquo; Trước
                      </button>
                      
                      <div className="hidden sm:flex">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNumber = i + 1 + Math.max(0, Math.min(totalPages - 5, currentPage - 3));
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                              className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${
                                currentPage === pageNumber
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white text-blue-500 hover:bg-blue-50'
                              } border-gray-300`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>
                      
                      <span className="sm:hidden px-4 py-2 text-sm font-medium border-t border-b border-r border-gray-300 bg-white">
                        {currentPage} / {totalPages}
                      </span>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-blue-500 hover:bg-blue-50'
                        } border border-t border-b border-r border-gray-300`}
                      >
                        Sau &raquo;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Link 
        to="/cart" 
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center"
      >
        <i className="fas fa-shopping-cart mr-2"></i>
        <span className="hidden sm:inline">Giỏ hàng</span>
      </Link>
    </div>
  );
};

export default ProductList;
