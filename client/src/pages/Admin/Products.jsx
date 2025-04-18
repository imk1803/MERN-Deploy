import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct } from '../../services/adminProductService';
import { getCategories } from '../../services/adminCategoryService';
import 'bootstrap-icons/font/bootstrap-icons.css';
import AdminLayout from '../../components/AdminLayout';

// Delete Confirmation Modal component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, productName }) => {
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
            Bạn có chắc chắn muốn xóa sản phẩm "<span className="font-medium">{productName}</span>"?
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
            Xóa sản phẩm
          </button>
        </div>
      </div>
    </div>
  );
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalItems: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sort: 'newest'
  });
  const [categories, setCategories] = useState([]);
  
  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    productId: null,
    productName: ''
  });

  // Fetch products data
  const fetchProductsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch categories first if not already loaded
      if (categories.length === 0) {
        try {
          const categoriesResponse = await getCategories();
          if (categoriesResponse.success) {
            setCategories(categoriesResponse.categories);
          } else {
            console.error('Failed to load categories:', categoriesResponse.message);
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      }
      
      // Lấy giá trị từ state filters
      const { search, category, sort } = filters;
      const currentPage = pagination.page;
      const currentLimit = pagination.limit;
      
      console.log('Fetching products with filters:', { search, category, sort, page: currentPage, limit: currentLimit });
      
      // Gọi API với các tham số lọc
      const response = await getProducts({
        search,
        category,
        sort,
        page: currentPage,
        limit: currentLimit
      });
      
      if (response.success) {
        setProducts(response.products);
        setPagination(prev => ({
          ...prev,
          totalPages: response.pagination.totalPages,
          total: response.pagination.total,
          totalItems: response.pagination.total
        }));
      } else {
        setError(response.message || 'Có lỗi xảy ra khi tải dữ liệu');
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách sản phẩm:', err);
      setError(err.response?.data?.message || 'Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  }, [filters, categories.length, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchProductsData();
  }, [fetchProductsData]);

  const handleDeleteProduct = async (id, name) => {
    // Open confirmation modal instead of using window.confirm
    setDeleteModal({
      isOpen: true,
      productId: id,
      productName: name
    });
  };
  
  const confirmDelete = async () => {
    try {
      setLoading(true);
      const response = await deleteProduct(deleteModal.productId);
      
      if (response.success) {
        // Close modal
        setDeleteModal({ isOpen: false, productId: null, productName: '' });
        
        // Show success notification
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50';
        successMessage.innerHTML = '<div class="flex items-center"><i class="bi bi-check-circle-fill mr-2"></i>Đã xóa sản phẩm thành công!</div>';
        document.body.appendChild(successMessage);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 3000);
        
        // Update the products list
        setProducts(products.filter(product => product._id !== deleteModal.productId));
      } else {
        setError(response.message || 'Có lỗi xảy ra khi xóa sản phẩm');
        setDeleteModal({ isOpen: false, productId: null, productName: '' });
      }
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err);
      setError(err.response?.data?.message || 'Không thể kết nối đến server');
      setDeleteModal({ isOpen: false, productId: null, productName: '' });
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset to page 1 when filters change
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // No need to call fetchProductsData here as it will be triggered by the useEffect
  };

  // Pagination controls
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        page: newPage
      }));
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý sản phẩm</h1>
          <Link 
            to="/admin/products/add" 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
          >
            <i className="bi bi-plus-lg mr-2"></i>
            Thêm sản phẩm
          </Link>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <form onSubmit={handleSearchSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label htmlFor="search" className="block text-xs font-medium text-gray-500 mb-1">
                  Tìm kiếm
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="search"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="w-full p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                  <button 
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 flex items-center justify-center"
                  >
                    <i className="bi bi-search"></i>
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="category" className="block text-xs font-medium text-gray-500 mb-1">
                  Danh mục
                </label>
                <select
                  id="category"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="sort" className="block text-xs font-medium text-gray-500 mb-1">
                  Sắp xếp
                </label>
                <select
                  id="sort"
                  name="sort"
                  value={filters.sort}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="price_low">Giá thấp đến cao</option>
                  <option value="price_high">Giá cao đến thấp</option>
                  <option value="name_asc">Tên A-Z</option>
                  <option value="name_desc">Tên Z-A</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <i className="bi bi-exclamation-triangle-fill mr-2"></i>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4">Đang tải dữ liệu...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Hình ảnh</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sản phẩm</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.image ? (
                        <img
                          src={product.image.startsWith('http') ? product.image : `https://curvot.onrender.com${product.image}`}
                          alt={product.name}
                          className="h-16 w-16 rounded-md object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/80x80?text=No+Image";
                          }}
                        />
                      ) : (
                        <img 
                          src="https://placehold.co/80x80?text=No+Image" 
                          alt="Sản phẩm" 
                          className="h-16 w-16 rounded-md object-cover" 
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(product.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {product.categoryName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.rating ? (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-800 mr-1">{product.rating}</span>
                          <i className="bi bi-star-fill text-yellow-400"></i>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.description ? (
                        <span className="text-sm text-gray-800 truncate block max-w-[150px]">
                          {product.description}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/admin/products/${product._id}`}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition-colors duration-200"
                        >
                          <i className="bi bi-pencil-fill mr-1"></i>
                          Sửa
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(product._id, product.name)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors duration-200"
                        >
                          <i className="bi bi-trash-fill mr-1"></i>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Hiển thị <span className="font-medium">{products.length ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> đến <span className="font-medium">
                    {products.length ? Math.min(pagination.page * pagination.limit, pagination.totalItems || 0) : 0}
                  </span> trong <span className="font-medium">{pagination.totalItems || 0}</span> sản phẩm
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`px-3 py-1 rounded-md ${
                      pagination.page === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNumber = i + 1 + Math.max(0, Math.min(pagination.totalPages - 5, pagination.page - 3));
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-1 rounded-md ${
                          pagination.page === pageNumber
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`px-3 py-1 rounded-md ${
                      pagination.page === pagination.totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <i className="bi bi-inbox text-4xl text-gray-400 mb-3"></i>
          <p className="text-gray-500">Không tìm thấy sản phẩm nào.</p>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, productId: null, productName: '' })}
        onConfirm={confirmDelete}
        productName={deleteModal.productName}
      />
    </AdminLayout>
  );
};

export default Products;
