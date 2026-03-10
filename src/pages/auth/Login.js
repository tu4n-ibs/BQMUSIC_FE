import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import userService from "../../services/userService";
import { getUserIdFromToken } from "../../utils/jwtUtils";
import BQMusicLogo from "../../components/common/BQMusicLogo";
import { getErrorMessage } from "../../utils/errorUtils";
import { toast } from "react-hot-toast";
import "./css/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleGoogleLogin = () => {
    window.location.href = "${process.env.REACT_APP_API_BASE_URL}/oauth2/authorization/google";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await userService.login({ email, password });

      const userObj = data.data || data;
      const token = data.token || userObj.token;
      const refreshToken = data.refreshToken || userObj.refreshToken;
      const role = data.role || userObj.role;

      // Extract numeric ID from JWT token
      const userId = getUserIdFromToken(token);

      login({
        token,
        refreshToken,
        role: role,
        idUser: userId,
        email: userObj.email || data.email || email,
        name: userObj.name,
        imageUrl: userObj.imageUrl
      });

      if (role && role.includes("ADMIN")) {
        navigate("/admin");
      } else {
        navigate("/newF");
      }
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="instagram-login-container">
      <div className="instagram-login-content">

        {/* Left Column: Intro */}
        <div className="welcome-section">
          <div className="instagram-logo">
            <BQMusicLogo />
          </div>
          <h1 className="welcome-title">
            Where Listeners Become <span className="highlight-text">a Community</span>.
          </h1>
        </div>

        {/* Right Column: Login Form */}
        <div className="login-section">
          <div className="login-card">
            <h2 className="login-title">Log into BQMUSIC</h2>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <input
                  type="email"
                  className="form-input"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="password"
                  className="form-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Log in'}
              </button>
            </form>

            <div className="divider-container">
              <div className="divider-line"></div>
              <span className="divider-text">OR</span>
              <div className="divider-line"></div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              className="google-login-button"
              onClick={handleGoogleLogin}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
                <path d="M23 12.27c0-.76-.07-1.49-.2-2.19H12v4.15h6.18c-.27 1.4-1.09 2.59-2.31 3.38l3.66 2.84C21.46 18.7 23 15.8 23 12.27z" fill="#4285F4" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09 0-.73.13-1.43.35-2.09L2.18 7.07C1.43 8.55 1 10.22 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 23c2.97 0 5.45-.98 7.27-2.65l-3.66-2.84c-1.02.69-2.32 1.09-3.61 1.09-2.86 0-5.29-1.93-6.16-4.53l-3.66 2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              </svg>
              Log in with Google
            </button>

            <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }} className="auth-link">
              Forgot password?
            </a>

            <div className="signup-box">
              Don't have an account? <button onClick={() => navigate("/register")}>Register</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;