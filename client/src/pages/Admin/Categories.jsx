import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, deleteCategory } from '../../services/adminCategoryService';
import 'bootstrap-icons/font/bootstrap-icons.css';
import AdminLayout from '../../components/AdminLayout';

// Simple CategoryList component to display categories without hierarchy
const CategoryList = ({ categories, onEdit, onDelete }) => {
  if (!categories || categories.length === 0) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => (
        <div key={category._id} className={`p-4 bg-white border rounded-lg shadow-sm ${!category.isActive ? 'opacity-60' : ''}`}>
          <div className="flex items-start mb-4">
            {category.image ? (
              <img 
                src={category.image.startsWith('http') ? category.image : `https://curvot.onrender.com${category.image}`}
                alt={category.name}
                className="h-12 w-12 rounded-full object-cover mr-3"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/60x60?text=No+Image";
                }}
              />
            ) : (
              <span className="h-12 w-12 mr-3 rounded-full bg-gray-200 flex items-center justify-center">
                <i className="bi bi-tag text-gray-500"></i>
              </span>
            )}
            <div className="flex-1">
              <h3 className="font-medium text-lg">{category.name}</h3>
              {!category.isActive && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Không hoạt động</span>
              )}
            </div>
          </div>
          
          {category.description && (
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{category.description}</p>
          )}
          
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => onEdit(category._id)}
              className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition-colors duration-200"
            >
              <i className="bi bi-pencil-fill mr-1"></i>
              Sửa
            </button>
            <button
              onClick={() => onDelete(category._id, category.name)}
              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors duration-200"
            >
              <i className="bi bi-trash-fill mr-1"></i>
              Xóa
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Delete Confirmation Modal component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, categoryName }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 animate-fadeIn">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
            <i className="bi bi-exclamation-triangle-fill text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Xác nhận xóa</h3>
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xóa danh mục "<span className="font-medium">{categoryName}</span>"?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Hành động này không thể hoàn tác.
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
          >
            Xóa danh mục
          </button>
        </div>
      </div>
    </div>
  );
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    categoryId: null,
    categoryName: ''
  });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getCategories();
      
      if (response.success) {
        setCategories(response.categories || []);
      } else {
        setError(response.message || 'Lỗi khi tải danh mục');
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh mục:', err);
      setError(err.response?.data?.message || 'Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleEditCategory = (categoryId) => {
    navigate(`/admin/categories/${categoryId}`);
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    // Open confirmation modal instead of using window.confirm
    setDeleteModal({
      isOpen: true,
      categoryId,
      categoryName
    });
  };
  
  const confirmDelete = async () => {
    try {
      setLoading(true);
      const response = await deleteCategory(deleteModal.categoryId);
      
      if (response.success) {
        // Close modal
        setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' });
        
        // Show success notification
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50';
        successMessage.innerHTML = '<div class="flex items-center"><i class="bi bi-check-circle-fill mr-2"></i>Đã xóa danh mục thành công!</div>';
        document.body.appendChild(successMessage);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 3000);
        
        // Refresh categories list
        fetchCategories();
      } else {
        setError(response.message || 'Lỗi khi xóa danh mục');
        setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' });
        setLoading(false);
      }
    } catch (err) {
      console.error('Lỗi khi xóa danh mục:', err);
      setError(err.response?.data?.message || 'Không thể kết nối đến máy chủ');
      setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' });
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Danh mục</h1>
          <Link 
            to="/admin/categories/add" 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center"
          >
            <i className="bi bi-plus-lg mr-2"></i>
            Thêm danh mục
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <i className="bi bi-folder text-5xl text-gray-300 mb-3"></i>
            <p className="text-gray-500">Không có danh mục nào. Hãy thêm danh mục mới!</p>
          </div>
        ) : (
          <CategoryList 
            categories={categories}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' })}
        onConfirm={confirmDelete}
        categoryName={deleteModal.categoryName}
      />
    </AdminLayout>
  );
};

export default Categories; 