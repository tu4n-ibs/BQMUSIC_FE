import axiosClient from "./axiosClient";

/**
 * Service to handle notification related API calls.
 */
const notificationService = {
    /**
     * Get all notifications for the current user.
     * API: GET ${process.env.REACT_APP_API_BASE_URL}/api/v1/notifications
     * @returns {Promise<Object>} List of notifications, newest first.
     */
    getAllNotifications: async () => {
        try {
            const response = await axiosClient.get("/notifications");
            return response.data;
        } catch (error) {
            console.error("Error fetching notifications:", error);
            throw error;
        }
    },

    /**
     * Mark a specific notification as read.
     * API: PATCH ${process.env.REACT_APP_API_BASE_URL}/api/v1/notifications/{notificationId}/read
     * @param {string|number} notificationId 
     * @returns {Promise<Object>} Response data
     */
    markAsRead: async (notificationId) => {
        try {
            const response = await axiosClient.patch(`/notifications/${notificationId}/read`);
            return response.data;
        } catch (error) {
            console.error(`Error marking notification ${notificationId} as read:`, error);
            throw error;
        }
    },

    /**
     * Mark all notifications as read for the current user.
     * API: PATCH ${process.env.REACT_APP_API_BASE_URL}/api/v1/notifications/read-all
     * @returns {Promise<Object>} Response data
     */
    markAllAsRead: async () => {
        try {
            const response = await axiosClient.patch("/notifications/read-all");
            return response.data;
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            throw error;
        }
    },
};

export default notificationService;
