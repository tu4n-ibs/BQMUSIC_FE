import axiosClient from "./axiosClient";

const groupService = {
    /**
     * Get all groups (Discovery)
     * @returns {Promise<Array>} List of groups
     */
    getGroups: async () => {
        try {
            const response = await axiosClient.get("/groups");
            return response.data.data || [];
        } catch (error) {
            console.error("Error fetching groups:", error);
            return [];
        }
    },

    /**
     * Create a new group
     * @param {Object} groupData { name, description, imageUrl, isPrivate, requirePostApproval }
     * @returns {Promise<Object>} Response data
     */
    createGroup: async (groupData) => {
        try {
            const response = await axiosClient.post("/groups", groupData);
            return response.data;
        } catch (error) {
            console.error("Error creating group:", error);
            throw error;
        }
    },

    getGroupById: async (id) => {
        try {
            const response = await axiosClient.get(`/groups/${id}`);
            return response.data.data;
        } catch (error) {
            console.error("Error fetching group details:", error);
            throw error;
        }
    },

    /**
     * Send a join request or join community directly (depending on group privacy)
     * @param {number|string} id Group ID
     */
    joinGroup: async (id) => {
        try {
            const response = await axiosClient.post(`/groups/${id}/join-requests`);
            return response.data;
        } catch (error) {
            console.error("Error joining group:", error);
            // Re-throw so the component can show a toast message using error.response.data
            throw error;
        }
    },

    /**
     * Leave a group (for members)
     */
    leaveGroup: async (id) => {
        try {
            const response = await axiosClient.post(`/groups/${id}/leave`);
            return response.data;
        } catch (error) {
            console.error("Error leaving group:", error);
            throw error;
        }
    },

    /**
     * Ban a user from a group (Admin only)
     */
    banUser: async (groupId, targetUserId) => {
        try {
            const response = await axiosClient.post(`/groups/${groupId}/bans/${targetUserId}`);
            return response.data;
        } catch (error) {
            console.error("Error banning user:", error);
            throw error;
        }
    },

    /**
     * Unban a user from a group (Admin only)
     */
    unbanUser: async (groupId, targetUserId) => {
        try {
            const response = await axiosClient.delete(`/groups/${groupId}/bans/${targetUserId}`);
            return response.data;
        } catch (error) {
            console.error("Error unbanning user:", error);
            throw error;
        }
    },

    /**
     * Get list of groups a user has joined or is admin of
     */
    getUserGroups: async (userId) => {
        try {
            const response = await axiosClient.get(`/groups/user/${userId}`);
            return response.data.data || [];
        } catch (error) {
            console.error("Error fetching user's groups:", error);
            throw error;
        }
    },

    /**
     * Toggle group privacy (Admin only)
     */
    togglePrivateGroup: async (id) => {
        try {
            const response = await axiosClient.patch(`/groups/${id}/toggle-private`);
            return response.data;
        } catch (error) {
            console.error("Error toggling group privacy:", error);
            throw error;
        }
    },

    /**
     * Toggle post approval requirement (Admin only)
     */
    togglePostApproval: async (id) => {
        try {
            const response = await axiosClient.patch(`/groups/${id}/toggle-post-approval`);
            return response.data;
        } catch (error) {
            console.error("Error toggling post approval:", error);
            throw error;
        }
    },

    /**
     * Get pending join requests for a group (Admin only)
     */
    getJoinRequests: async (groupId) => {
        try {
            const response = await axiosClient.get(`/groups/${groupId}/join-requests/pending`);
            return response.data.data.content || [];
        } catch (error) {
            console.error("Error fetching join requests:", error);
            throw error;
        }
    },

    /**
     * Review a join request (Admin only)
     * @param {number|string} groupId Group ID
     * @param {number|string} requestId Request ID
     * @param {boolean} approve True to approve, false to reject
     */
    reviewJoinRequest: async (groupId, requestId, approve) => {
        try {
            const response = await axiosClient.patch(`/groups/${groupId}/join-requests/${requestId}/review?approve=${approve}`);
            return response.data;
        } catch (error) {
            console.error(`Error reviewing join request ${requestId}:`, error);
            throw error;
        }
    },

    /**
     * Get group posts
     */
    getGroupPosts: async (groupId) => {
        try {
            const response = await axiosClient.get(`/posts/group/${groupId}`);
            // The API returns ApiResponse<Page<PostResponsePage>>
            return response.data.data.content || [];
        } catch (error) {
            console.error("Error fetching group posts:", error);
            return [];
        }
    }
};

export default groupService;
