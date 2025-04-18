import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import axios from 'axios';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products từ API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://curvot.onrender.com/api/products?limit=6', {
          withCredentials: true
        });
        if (response.data.success) {
          setProducts(response.data.products || []);
        } else {
          console.error('API trả về lỗi:', response.data);
        }
      } catch (error) {
        console.error('❌ Lỗi lấy danh sách sản phẩm:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Xử lý hiển thị đường dẫn ảnh
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    return imagePath.startsWith('http') ? imagePath : `https://curvot.onrender.com${imagePath}`;
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      {/* Swiper Carousel */}
      <div className="container mx-auto p-4">
        {products.length > 0 && (
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            loop={true}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation
            className="mySwiper"
          >
            {products.slice(0, 5).map((product) => (
              <SwiperSlide key={product._id}>
                <Link to={`/products/${product._id}`}>
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="rounded-lg shadow-lg w-full object-cover h-64 hover:scale-105 transition-transform duration-300"
                  />
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>

      {/* Tiêu đề sản phẩm nổi bật */}
      <h1 className="text-center text-2xl font-bold mt-6 mb-4 text-gray-800">
        🔥 Sản phẩm nổi bật
      </h1>

      {/* Danh sách sản phẩm */}
      {loading ? (
        <div className="container mx-auto p-4 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.length === 0 ? (
            <p className="text-center col-span-3">Chưa có sản phẩm!</p>
          ) : (
            products.map((product) => (
              <div
                key={product._id}
                className="bg-white p-4 rounded-lg shadow-lg flex flex-col h-full"
              >
                <Link to={`/products/${product._id}`} className="flex flex-col h-full">
                  <div className="w-full h-48 overflow-hidden rounded-lg">
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex flex-col flex-grow mt-2">
                    <h2 className="text-xl font-semibold line-clamp-2 h-14 overflow-hidden" title={product.name}>
                      {product.name}
                    </h2>
                    <p className="text-red-500 font-bold text-lg mt-auto">
                      {product.price.toLocaleString('vi-VN')} VNĐ
                    </p>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {/* Nút xem tất cả sản phẩm */}
      <div className="container mx-auto p-4 flex justify-center mt-4 mb-8">
        <Link 
          to="/products" 
          className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Xem tất cả sản phẩm
        </Link>
      </div>

      {/* Giỏ hàng */}
      <Link
        to="/cart"
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center"
      >
        🛒 Giỏ hàng
      </Link>
    </div>
  );
};

export default Home;
