import React, { useState } from "react";
import { getErrorMessage } from "../../utils/errorUtils";
import { useNavigate } from "react-router-dom";
import '../auth/css/Login.css';
import userService from "../../services/userService";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false); // True if email send success
    const [isVerified, setIsVerified] = useState(false); // True if OTP verified
    const [errorMessage, setErrorMessage] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();


    const handleSendOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await userService.sendOtpForgot(email);

            if (response && response.success) {
                setIsSent(true);
            } else {
                setErrorMessage(response.message || "Something went wrong. Please try again.");
            }
        } catch (err) {
            console.error(err);
            setErrorMessage(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await userService.verifyOtpForgot(email, otp);

            if (response && response.success) {
                setIsVerified(true);
                setSuccessMessage("OTP Verified! Please enter your new password.");
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setErrorMessage(response.message || "Invalid OTP. Please try again.");
            }
        } catch (err) {
            console.error(err);
            setErrorMessage(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match!");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await userService.resetPasswordForgot({
                email,
                newPassword,
                confirmPassword
            });

            if (response && response.success) {
                setSuccessMessage("Password reset successfully! Redirecting to login...");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setErrorMessage(response.message || "Failed to reset password.");
            }
        } catch (err) {
            console.error(err);
            setErrorMessage(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="instagram-login-container">
            <div className="instagram-login-content" style={{ display: 'flex', justifyContent: 'center' }}>

                <div className="login-card" style={{ textAlign: 'center', maxWidth: '400px' }}>

                    {/* Lock Icon */}
                    <div style={{ margin: '0 auto 20px', width: '90px', height: '90px', border: '2px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg aria-label="Lock Icon" color="#000" fill="#000" height="50" role="img" viewBox="0 0 96 96" width="50">
                            <circle cx="48" cy="48" fill="none" r="47" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></circle>
                            <path d="M66.098 48.014V34.545a18.098 18.098 0 1 0-36.196 0v13.469" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            <rect fill="none" height="28.098" rx="4" ry="4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" width="45.197" x="25.402" y="48.014"></rect>
                        </svg>
                    </div>

                    <h4 className="forgot-title">Trouble Logging In?</h4>

                    <p className="forgot-subtitle">
                        {isSent ? "Enter the code we sent to your email." : "Enter your email and we'll send you a link to get back into your account."}
                    </p>

                    {errorMessage && (
                        <div className="alert-message alert-error">
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className="alert-message alert-success">
                            {successMessage}
                        </div>
                    )}

                    {!isSent ? (
                        <form onSubmit={handleSendOtp} className="login-form">
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

                            <button
                                type="submit"
                                className="login-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Sending...' : 'Send Login Link'}
                            </button>
                        </form>
                    ) : !isVerified ? (
                        <form onSubmit={handleVerifyOtp} className="login-form">
                            <div className="alert-message alert-success" style={{ marginBottom: '15px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Email sent!</div>
                                <div>Check your email for the OTP code.</div>
                            </div>

                            <div className="form-group">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter OTP Code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    style={{ textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="login-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Verifying...' : 'Verify OTP'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsSent(false)}
                                className="change-email-button"
                            >
                                Change Email
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="login-form">
                            <div className="form-group">
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="login-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}

                    <div className="divider-container">
                        <div className="divider-line"></div>
                        <span className="divider-text">OR</span>
                        <div className="divider-line"></div>
                    </div>

                    <div className="auth-footer-link">
                        <button onClick={() => navigate("/register")}>Create New Account</button>
                    </div>

                    <div className="auth-card-footer">
                        <button onClick={() => navigate("/login")}>Back to Login</button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
