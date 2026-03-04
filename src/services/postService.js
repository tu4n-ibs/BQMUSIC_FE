import axiosClient from './axiosClient';

/**
 * Post Service
 * Handles all post-related API calls.
 */
const postService = {
    /**
     * Create a new post
     * @param {Object} postData { content, visibility, targetType, targetId }
     * @param {File} imageFile (Optional)
     * @returns {Promise}
     */
    createPost: async (postData, imageFile) => {
        // According to user request: 
        // { "content": "string", "visibility": "FRIEND", "targetType": "SONG", "targetId": "string" }

        if (!imageFile) {
            // If no image, send as plain JSON
            return axiosClient.post('/posts', postData);
        }

        // If there's an image, use multipart
        const formData = new FormData();
        formData.append('post', new Blob([JSON.stringify(postData)], { type: "application/json" }));
        formData.append('image', imageFile);

        return axiosClient.post('/posts', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    /**
     * Create a new post in a group
     * @param {string} groupId 
     * @param {Object} postData { content, visibility, targetType, targetId }
     * @param {File} imageFile (Optional)
     * @returns {Promise}
     */
    createGroupPost: async (groupId, postData, imageFile) => {
        if (!imageFile) {
            return axiosClient.post(`/posts/group/${groupId}`, postData);
        }

        const formData = new FormData();
        formData.append('post', new Blob([JSON.stringify(postData)], { type: "application/json" }));
        formData.append('image', imageFile);

        return axiosClient.post(`/posts/group/${groupId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    /**
     * Get all posts (Feed)
     * @param {number} page
     * @param {number} size
     * @returns {Promise}
     */
    getAllPosts: async (page = 0, size = 20) => {
        return axiosClient.get(`/posts/test-find-all-post?page=${page}&size=${size}`);
    },

    /**
     * Share an existing post
     * @param {Object} shareData { originalPostId, content, visibility, contextType, contextId }
     * @returns {Promise}
     */
    sharePost: async (shareData) => {
        // According to user request:
        // { "originalPostId": "string", "content": "string", "visibility": "FRIEND", "contextType": "PROFILE", "contextId": "string" }
        return axiosClient.post('/posts/share', shareData);
    }
};

export default postService;
