// src/pages/auth/OAuth2RedirectHandler.js
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getUserIdFromToken } from "../../utils/jwtUtils";
import axios from "axios";

const OAuth2RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const processLogin = async () => {
      // 1. Phân tích tham số URL
      const params = new URLSearchParams(location.search);
      const token = params.get("token");
      const refreshToken = params.get("refreshToken");
      const error = params.get("error");
      const emailParam = params.get("email");

      // 2. Xử lý lỗi từ Backend trả về (nếu có)
      if (error) {
        console.error("Lỗi OAuth2:", error);
        alert("Đăng nhập Google thất bại: " + error);
        navigate("/login");
        return;
      }

      // 3. Kiểm tra token
      if (token && refreshToken) {
        try {
          // Extract numeric ID from JWT token
          const userId = getUserIdFromToken(token);

          if (!userId) {
            throw new Error("Không thể giải mã ID người dùng từ Token");
          }

          // 5. Login qua Context với thông tin từ token/params
          // Roles will be determined by the backend or default to USER
          login({
            token,
            refreshToken,
            idUser: userId,
            email: emailParam || "", // Fallback if email not in params
            name: "", // Will be updated on profile load if needed
            imageUrl: "",
            role: ["USER"] // Default role, actual roles might be fetched later or embedded in token
          });

          // 6. Chuyển hướng
          navigate("/newF");
        } catch (err) {
          console.error("Lỗi xác thực người dùng sau khi OAuth2:", err);
          navigate("/login");
        }
      } else {
        console.error("Thiếu token từ Google");
        navigate("/login");
      }
    };

    processLogin();
  }, [location, navigate, login]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#fafafa'
    }}>
      <div className="spinner" style={{
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }}></div>
      <style>
        {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
      </style>
      <h3 style={{ color: '#262626', fontWeight: '600' }}>Đang xử lý đăng nhập...</h3>
    </div>
  );
};

export default OAuth2RedirectHandler;