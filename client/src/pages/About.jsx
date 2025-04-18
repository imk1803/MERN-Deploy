import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-6">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-bold text-center text-blue-500 mb-4">Về CurvoTech</h1>
          <p className="text-gray-700 text-lg text-center">
            Nơi cung cấp các dịch vụ công nghệ hàng đầu.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
            <img src="https://curvot.onrender.com/images/logoabout.jpg" alt="CurvoTech" className="h-25 w-25 rounded-lg shadow-md" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-blue-500">Sứ mệnh của chúng tôi</h2>
              <p className="text-gray-600 mt-2">
                CurvoTech cam kết mang đến cho khách hàng các dịch vụ công nghệ tiên tiến,
                giúp tối ưu hóa trải nghiệm người dùng và nâng cao hiệu suất công việc.
              </p>

              <h2 className="text-2xl font-semibold text-blue-500 mt-4">Dịch vụ của chúng tôi</h2>
              <ul className="list-disc list-inside text-gray-600 mt-2">
                <li>Thiết kế và phát triển website</li>
                <li>Cung cấp giải pháp AI và Machine Learning</li>
                <li>Dịch vụ lưu trữ và bảo mật dữ liệu</li>
                <li>Tư vấn chiến lược công nghệ</li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link to="/" className="text-blue-500 hover:underline">
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>

      <Link
        to="/cart"
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center"
      >
        🛒 Giỏ hàng
      </Link>
    </div>
  );
};

export default About;
