import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { getProductById, updateProduct } from '../../services/adminProductService';
import { getCategories } from '../../services/adminCategoryService';
import AdminSidebar from '../../components/AdminSidebar';
import 'bootstrap-icons/font/bootstrap-icons.css';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Product form state
  const [productData, setProductData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    rating: ''
  });
  
  // File upload state
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [currentImage, setCurrentImage] = useState('');
  
  // Load product data and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        
        // Fetch product details
        const productResponse = await getProductById(id);
        if (productResponse.success && productResponse.product) {
          const product = productResponse.product;
          setProductData({
            name: product.name || '',
            price: product.price || '',
            description: product.description || '',
            category: product.category?._id || product.category || '',
            rating: product.rating || ''
          });
          
          if (product.image) {
            setCurrentImage(product.image);
          }
        } else {
          setError('Không thể tải thông tin sản phẩm');
        }
        
        // Fetch categories
        const categoriesResponse = await getCategories();
        if (categoriesResponse.success) {
          // Make sure we only use the necessary fields from categories
          const simplifiedCategories = categoriesResponse.categories.map(cat => ({
            _id: cat._id,
            name: cat.name
          }));
          setCategories(simplifiedCategories);
        }
      } catch (err) {
        console.error('Error fetching product data:', err);
        setError(err.response?.data?.message || 'Không thể kết nối đến server');
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData({
      ...productData,
      [name]: value
    });
  };
  
  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(selectedFile);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Validate form
      if (!productData.name.trim()) {
        setError('Tên sản phẩm là bắt buộc');
        setLoading(false);
        return;
      }
      
      if (!productData.price || isNaN(parseFloat(productData.price)) || parseFloat(productData.price) <= 0) {
        setError('Giá sản phẩm không hợp lệ');
        setLoading(false);
        return;
      }
      
      // Create FormData object
      const formData = new FormData();
      
      // Append product data
      Object.keys(productData).forEach(key => {
        if (productData[key] !== undefined && productData[key] !== null) {
          formData.append(key, productData[key]);
        }
      });
      
      // Append file if selected
      if (file) {
        formData.append('image', file);
      }
      
      // Submit form
      const response = await updateProduct(id, formData);
      
      if (response.success) {
        setSuccess(true);
        
        // Update current image if new one was uploaded
        if (response.product && response.product.image) {
          setCurrentImage(response.product.image);
          setPreviewUrl('');
          setFile(null);
        }
        
        // Redirect after success
        setTimeout(() => {
          navigate('/admin/products');
        }, 2000);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi cập nhật sản phẩm');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err.response?.data?.message || 'Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };
  
  if (initialLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar location={location} />
        
        <div className="flex-1 p-8 overflow-auto">
          <div className="flex flex-col items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4">Đang tải thông tin sản phẩm...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar location={location} />
      
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Chỉnh Sửa Sản Phẩm</h1>
          <Link 
            to="/admin/products" 
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md flex items-center"
          >
            <i className="bi bi-arrow-left mr-2"></i>
            Quay lại
          </Link>
        </div>
        
        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <i className="bi bi-check-circle mr-2"></i>
              <span>Cập nhật sản phẩm thành công! Đang chuyển hướng...</span>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <i className="bi bi-exclamation-triangle mr-2"></i>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4">Đang tải dữ liệu sản phẩm...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Tên sản phẩm <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={productData.name}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                          Giá (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id="price"
                          name="price"
                          value={productData.price}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                          Danh mục sản phẩm
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={productData.category || ""}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- Chọn danh mục sản phẩm --</option>
                          {categories.map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                          Đánh giá (0-5)
                        </label>
                        <input
                          type="number"
                          id="rating"
                          name="rating"
                          value={productData.rating}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          min="0"
                          max="5"
                          step="0.1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả sản phẩm
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={productData.description}
                        onChange={handleInputChange}
                        rows="5"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-4">
                      <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                        Hình ảnh sản phẩm
                      </label>
                      <input
                        type="file"
                        id="image"
                        name="image"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Kích thước tối đa: 5MB. Định dạng: JPG, PNG, WEBP
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Để trống nếu không muốn thay đổi hình ảnh.
                      </p>
                    </div>
                    
                    {(previewUrl || currentImage) && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          {previewUrl ? 'Xem trước hình mới:' : 'Hình ảnh hiện tại:'}
                        </p>
                        <img
                          src={previewUrl ? previewUrl : (currentImage.startsWith('http') ? currentImage : `https://curvot.onrender.com${currentImage}`)}
                          alt="Hình sản phẩm"
                          className="w-full h-auto rounded-md object-cover max-h-48"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/400x300?text=No+Image";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-8">
                  <button
                    type="submit"
                    className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save mr-2"></i>
                        Cập nhật sản phẩm
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProduct; 