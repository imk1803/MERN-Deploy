import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://curvot.onrender.com/api/admin/categories';

// Create axios instance with common config
const adminAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Add interceptor to automatically add token to header
adminAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Get all categories with hierarchical structure
 * @returns {Promise} Categories in hierarchical and flat structure
 */
export const getCategories = async () => {
  try {
    const response = await adminAxios.get('/');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Unable to connect to server',
      categories: [],
      flatCategories: []
    };
  }
};

/**
 * Get a single category by ID
 * @param {string} categoryId - ID of the category
 * @returns {Promise} Category details
 */
export const getCategoryById = async (categoryId) => {
  try {
    const response = await adminAxios.get(`/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching category ID ${categoryId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Unable to connect to server'
    };
  }
};

/**
 * Create a new category
 * @param {FormData} categoryData - Form data with category info and image
 * @returns {Promise} New category details
 */
export const createCategory = async (categoryData) => {
  try {
    const response = await adminAxios.post('/', categoryData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Unable to connect to server'
    };
  }
};

/**
 * Update a category
 * @param {string} categoryId - ID of the category to update
 * @param {FormData} categoryData - Form data with updated category info
 * @returns {Promise} Updated category details
 */
export const updateCategory = async (categoryId, categoryData) => {
  try {
    const response = await adminAxios.put(`/${categoryId}`, categoryData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating category ID ${categoryId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Unable to connect to server'
    };
  }
};

/**
 * Delete a category
 * @param {string} categoryId - ID of the category to delete
 * @returns {Promise} Result of deletion
 */
export const deleteCategory = async (categoryId) => {
  try {
    const response = await adminAxios.delete(`/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting category ID ${categoryId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Unable to connect to server'
    };
  }
}; 