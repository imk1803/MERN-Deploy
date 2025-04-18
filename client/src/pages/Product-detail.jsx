import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import handleAddToCart from '../services/cartService';
import Spinner from '../components/Spinner';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'https://curvot.onrender.com';

// CSS animation styles
const styles = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .notification-animate {
      animation: fadeIn 0.3s ease-out forwards;
    }
  `
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/products/${id}`);
        setProduct(res.data.product);
        
        // Handle different category formats and extract the name
        const categoryData = res.data.product.category;
        if (categoryData) {
          if (typeof categoryData === 'object' && categoryData.name) {
            // If category is a populated object with name property
            setCategoryName(categoryData.name);
          } else if (typeof categoryData === 'object' && categoryData._id) {
            // If category is an object with just ID, fetch the category name
            fetchCategoryName(categoryData._id);
          } else if (typeof categoryData === 'string') {
            // If category is a string ID, fetch the category name
            fetchCategoryName(categoryData);
          } else {
            setCategoryName('Không xác định');
          }
        } else {
          setCategoryName('Không xác định');
        }
        setLoading(false);
      } catch (err) {
        console.error('Lỗi khi lấy chi tiết sản phẩm:', err);
        setError('Không thể tải chi tiết sản phẩm!');
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);
  
  // Function to fetch category name by ID
  const fetchCategoryName = async (categoryId) => {
    try {
      const res = await axios.get(`/api/products/categories/${categoryId}`);
      if (res.data && res.data.success && res.data.category) {
        setCategoryName(res.data.category.name);
      } else {
        setCategoryName('Không xác định');
      }
    } catch (err) {
      console.error('Error fetching category:', err);
      setCategoryName('Không xác định');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    
    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Helper function to safely get image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "https://placehold.co/400x300?text=No+Image";
    if (imageUrl.startsWith('http')) return imageUrl;
    return `https://curvot.onrender.com${imageUrl}`;
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <style>{styles.fadeIn}</style>
      
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

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Spinner />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 p-4 flex items-center justify-center bg-gray-50">
                <img
                  src={getImageUrl(product.image)}
                  alt={product.name}
                  className="max-w-full h-auto max-h-80 object-contain rounded-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/400x300?text=No+Image";
                  }}
                />
              </div>

              <div className="md:w-1/2 p-6">
                <h2 className="text-xl md:text-2xl font-bold mb-4">{product.name}</h2>
                <div className="mb-4">
                  <span className="text-gray-700 font-semibold">
                    Giá:{" "}
                    <span className="text-red-500 text-xl">
                      {product.price ? product.price.toLocaleString('vi-VN') : 0} VNĐ
                    </span>
                  </span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="font-semibold sm:w-24 mb-1 sm:mb-0">Danh mục:</span> 
                    <span>{categoryName}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="font-semibold sm:w-24 mb-1 sm:mb-0">Đánh giá:</span> 
                    <span className="flex items-center">
                      {product.rating}/5 
                      <span className="text-yellow-400 ml-1">⭐</span>
                    </span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Mô tả:</h3>
                  <p className="text-gray-600">{product.description}</p>
                </div>

                <button
                  onClick={() => handleAddToCart(product._id, showNotification)}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition flex items-center justify-center mb-4"
                >
                  <i className="fas fa-shopping-cart mr-2"></i> Thêm vào giỏ hàng
                </button>

                <button
                  onClick={() => navigate(-1)}
                  className="w-full text-center py-2 text-blue-500 hover:underline flex items-center justify-center"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Quay lại
                </button>
              </div>
            </div>
          )}
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

export default ProductDetail;
