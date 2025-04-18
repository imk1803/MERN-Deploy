import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';


const AddUser = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    username: '',
    password: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await axios.post('https://curvot.onrender.com/api/admin/users', user, { withCredentials: true });
      setLoading(false);
      navigate('/admin/users');
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi thêm người dùng');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Sidebar */}
        <div className="admin-sidebar">
          <h4>Admin Panel</h4>
          <Link to="/admin/dashboard"><i className="fas fa-tachometer-alt"></i> Dashboard</Link>
          <Link to="/admin/users"><i className="fas fa-users"></i> Users</Link>
          <Link to="/admin/products"><i className="fas fa-box"></i> Products</Link>
          <Link to="/admin/orders"><i className="fas fa-shopping-cart"></i> Orders</Link>
          <Link to="/"><i className="fas fa-arrow-left"></i> Quay lại trang chủ</Link>
        </div>

        {/* Main Content */}
        <div className="admin-content container">
          <h2 className="text-center mb-4">Thêm Người dùng mới</h2>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="card shadow p-4">
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Tên người dùng</label>
              <input 
                type="text" 
                className="form-control" 
                id="username" 
                name="username" 
                value={user.username}
                onChange={handleChange}
                required 
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Mật khẩu</label>
              <input 
                type="password" 
                className="form-control" 
                id="password" 
                name="password" 
                value={user.password}
                onChange={handleChange}
                required 
              />
            </div>

            <div className="mb-3">
              <label htmlFor="role" className="form-label">Vai trò</label>
              <select 
                className="form-select" 
                id="role" 
                name="role" 
                value={user.role}
                onChange={handleChange}
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="d-flex gap-2">
              <button 
                type="submit" 
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Thêm người dùng'}
              </button>
              <Link to="/admin/users" className="btn btn-secondary">Hủy</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUser; 