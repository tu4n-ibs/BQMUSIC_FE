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

    /**
     * Get user details by ID
     * @param {string} userId 
     * @returns {Promise<Object>} Response data
     */
    getUserById: async (userId) => {
        // API endpoint: /user/userId/{id}
        const response = await axiosClient.get(`/user/userId/${userId}`);
        return response.data;
    },

    /**
     * Get user details by email
     * @param {string} email 
     * @returns {Promise<Object>} Response data
     */
    getUserByEmail: async (email) => {
        const response = await axiosClient.get(`/user/${email}`);
        return response.data;
    },

    /**
     * Update user profile
     * @param {string} userId 
     * @param {FormData|Object} formData 
     * @returns {Promise<Object>} Response data
     */
    updateUser: async (userId, formData) => {
        const response = await axiosClient.put(`/user/userId/${userId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * Update user avatar image
     * @param {File} file 
     * @returns {Promise<Object>} Response data
     */
    updateImage: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosClient.post('/user/update-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * Update user display name
     * @param {string} name 
     * @returns {Promise<Object>} Response data
     */
    updateName: async (name) => {
        const response = await axiosClient.post(`/user/update-name?name=${encodeURIComponent(name)}`);
        return response.data;
    },

    /**
     * Login user
     * @param {Object} credentials { email, password }
     * @returns {Promise<Object>} Response data
     */
    login: async (credentials) => {
        // API endpoint: /auth
        const response = await axiosClient.post("/auth", credentials);
        return response.data;
    },

    /**
     * Change password for logged-in user
     * @param {Object} data { email, oldPassword, newPassword, confirmPassword }
     * @returns {Promise<Object>} Response data
     */
    changePassword: async (data) => {
        // API endpoint: /user/change-password
        const response = await axiosClient.post("/user/change-password", data);
        return response.data;
    },

    /**
     * Get all users (Admin)
     * @returns {Promise<Object>} List of users
     */
    getAllUsers: async () => {
        const response = await axiosClient.get("/user");
        return response.data;
    },

    /**
     * Delete a user (Admin)
     * @param {string} userId 
     * @returns {Promise<Object>} Response data
     */
    deleteUser: async (userId) => {
        const response = await axiosClient.delete(`/user/userId/${userId}`);
        return response.data;
    },

    /**
     * Follow a user
     * @param {string} userId 
     * @returns {Promise<Object>} Response data
     */
    followUser: async (userId) => {
        const response = await axiosClient.post(`/follow-user/${userId}/follow`);
        return response.data;
    },

    /**
     * Unfollow a user
     * @param {string} userId 
     * @returns {Promise<Object>} Response data
     */
    unfollowUser: async (userId) => {
        const response = await axiosClient.delete(`/follow-user/${userId}/unfollow`);
        return response.data;
    },
};

export default userService;
