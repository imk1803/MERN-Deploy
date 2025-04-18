import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCategories, getCategoryById, createCategory, updateCategory } from '../../services/adminCategoryService';
import AdminSidebar from '../../components/AdminSidebar';
import 'bootstrap-icons/font/bootstrap-icons.css';

const CategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    image: null
  });
  
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Load categories and category data (if editing)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all categories for parent selection
        const categoriesResponse = await getCategories();
        
        if (categoriesResponse.success) {
          // setCategories(categoriesResponse.categories || []);
        }
        
        // If in edit mode, fetch the category data
        if (isEditMode) {
          const categoryResponse = await getCategoryById(id);
          
          if (categoryResponse.success) {
            const { category } = categoryResponse;
            setFormData({
              name: category.name || '',
              description: category.description || '',
              isActive: category.isActive,
              image: category.image
            });
            
            // Set preview if image exists
            if (category.image) {
              setPreviewUrl(
                category.image.startsWith('http') 
                  ? category.image 
                  : `https://curvot.onrender.com${category.image}`
              );
            }
          } else {
            setError(categoryResponse.message || 'Không thể tải thông tin danh mục');
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
        setError(err.response?.data?.message || 'Không thể kết nối đến máy chủ');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFormData({
        ...formData,
        image: selectedFile
      });
      
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
    setSaveLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Validate form
      if (!formData.name.trim()) {
        setError('Tên danh mục là bắt buộc');
        setSaveLoading(false);
        return;
      }
      
      // Create FormData object
      const submitData = new FormData();
      
      // Append category data
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) {
          submitData.append(key, formData[key]);
        }
      });
      
      // Append file if selected
      if (formData.image) {
        submitData.append('image', formData.image);
      }
      
      // Submit form
      let response;
      if (isEditMode) {
        response = await updateCategory(id, submitData);
      } else {
        response = await createCategory(submitData);
      }
      
      if (response.success) {
        setSuccess(true);
        if (!isEditMode) {
          // Reset form for new category
          setFormData({
            name: '',
            description: '',
            isActive: true,
            image: null
          });
          setPreviewUrl(null);
        }
        
        // Redirect after success
        setTimeout(() => {
          navigate('/admin/categories');
        }, 2000);
      } else {
        setError(response.message || 'Lỗi khi lưu danh mục');
      }
    } catch (err) {
      console.error('Lỗi khi lưu danh mục:', err);
      setError(err.response?.data?.message || 'Không thể kết nối đến máy chủ');
    } finally {
      setSaveLoading(false);
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
          </h1>
          <Link 
            to="/admin/categories" 
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md flex items-center"
          >
            <i className="bi bi-arrow-left mr-2"></i>
            Quay Lại
          </Link>
        </div>
        
        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <i className="bi bi-check-circle mr-2"></i>
              <span>
                {isEditMode 
                  ? 'Cập nhật danh mục thành công! Đang chuyển hướng...' 
                  : 'Tạo danh mục thành công! Đang chuyển hướng...'}
              </span>
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
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Tên Danh Mục <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Mô Tả
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="4"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      ></textarea>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                        Danh Mục Hoạt Động
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-4">
                      <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                        Hình Ảnh Danh Mục
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
                    </div>
                    
                    {previewUrl && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Xem trước:</p>
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-auto rounded-md object-cover max-h-48"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/200x200?text=No+Image";
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
                    disabled={saveLoading}
                  >
                    {saveLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <i className={`bi ${isEditMode ? 'bi-save' : 'bi-plus-circle'} mr-2`}></i>
                        {isEditMode ? 'Cập Nhật Danh Mục' : 'Thêm Danh Mục'}
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

export default CategoryForm; 