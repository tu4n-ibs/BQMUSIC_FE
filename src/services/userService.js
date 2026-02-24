import axiosClient from "./axiosClient";

const userService = {
    /**
     * Send OTP for forgot password
     * @param {string} email 
     * @returns {Promise<Object>} Response data
     */
    sendOtpForgot: async (email) => {
        // API endpoint: /user/send-otp-fp?email=...
        // Note: Using params for clearer query string handling, or direct string interpolation
        const response = await axiosClient.post(`/user/send-otp-fp?email=${email}`);
        return response.data;
    },

    /**
     * Verify OTP for forgot password
     * @param {string} email 
     * @param {string} otp 
     * @returns {Promise<Object>} Response data
     */
    verifyOtpForgot: async (email, otp) => {
        // API endpoint: /user/confirm-otp-fp?email=...&otp=...
        const response = await axiosClient.post(`/user/confirm-otp-fp?email=${email}&otp=${otp}`);
        return response.data;
    },

    /**
     * Send OTP for registration
     * @param {string} email 
     * @returns {Promise<Object>} Response data
     */
    sendOtpRegister: async (email) => {
        // API endpoint: /user/send-otp?email=...
        const response = await axiosClient.post(`/user/send-otp?email=${email}`);
        return response.data;
    },

    /**
     * Verify OTP for registration
     * @param {string} email 
     * @param {string} otp 
     * @returns {Promise<Object>} Response data
     */
    verifyOtpRegister: async (email, otp) => {
        // API endpoint: /user/verifi?email=...&otp=...
        const response = await axiosClient.post(`/user/verifi?email=${email}&otp=${otp}`);
        return response.data;
    },

    /**
     * Register new user
     * @param {Object} userData { name, password, rePassword, email }
     * @returns {Promise<Object>} Response data
     */
    register: async (userData) => {
        // API endpoint: /user/register
        // Payload: { "name": "...", "password": "...", "rePassword": "...", "email": "..." }
        const response = await axiosClient.post("/user/register", userData);
        return response.data;
    },

    /**
     * Reset password after OTP verification
     * @param {Object} resetData { email, newPassword, confirmPassword }
     * @returns {Promise<Object>} Response data
     */
    resetPasswordForgot: async (resetData) => {
        // API endpoint: /user/new-password-fp
        const response = await axiosClient.post("/user/new-password-fp", resetData);
        return response.data;
    },

    // Placeholder for other user services

};

export default userService;
