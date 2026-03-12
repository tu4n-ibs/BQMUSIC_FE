// src/pages/auth/OAuth2RedirectHandler.js
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getUserIdFromToken } from "../../utils/jwtUtils";
import { toast } from "react-hot-toast";

const OAuth2RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const processLogin = async () => {
      // 1. Parse URL parameters
      const params = new URLSearchParams(location.search);
      const token = params.get("token");
      const refreshToken = params.get("refreshToken");
      const error = params.get("error");
      const emailParam = params.get("email");
      const nameParam = params.get("name");
      const imageUrlParam = params.get("imageUrl");
      const rolesParam = params.get("roles");

      // 2. Handle errors from Backend (if any)
      if (error) {
        console.error("OAuth2 Error:", error);
        toast.error("Google Login failed: " + error);
        navigate("/login");
        return;
      }

      // 3. Check token
      if (token && refreshToken) {
        try {
          // Extract numeric ID from JWT token
          const userId = getUserIdFromToken(token);

          if (!userId) {
            throw new Error("Unable to decode user ID from Token");
          }

          // Parse roles from comma-separated string
          const roleArray = rolesParam ? rolesParam.split(",") : ["USER"];

          // 5. Login via Context with info from token/params
          login({
            token,
            refreshToken,
            idUser: userId,
            email: emailParam || "",
            name: nameParam || "",
            imageUrl: imageUrlParam || "",
            role: roleArray
          });

          // 6. Redirect
          navigate("/newF");
        } catch (err) {
          console.error("User authentication error after OAuth2:", err);
          navigate("/login");
        }
      } else {
        console.error("Missing token from Google");
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
      <h3 style={{ color: '#262626', fontWeight: '600' }}>Processing login...</h3>
    </div>
  );
};

export default OAuth2RedirectHandler;