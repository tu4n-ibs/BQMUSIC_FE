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
    createPost: async (postData) => {
        // According to user request: 
        // { "content": "string", "visibility": "PUBLIC", "targetType": "SONG", "targetId": "string" }
        return axiosClient.post('/posts', postData);
    },

    /**
     * Create a new post in a group
     * @param {string} groupId 
     * @param {Object} postData { content, visibility, targetType, targetId }
     * @param {File} imageFile (Optional)
     * @returns {Promise}
     */
    createGroupPost: async (groupId, postData) => {
        return axiosClient.post(`/posts/group/${groupId}`, postData);
    },

    /**
     * Get all posts (Feed)
     * @param {number} page
     * @param {number} size
     * @returns {Promise}
     */
    getAllPosts: async (page = 0, size = 20) => {
        return axiosClient.get(`/posts?page=${page}&size=${size}`);
    },

    /**
     * Get new feed posts personalized for the current user
     * @param {number} page
     * @param {number} size
     * @returns {Promise}
     */
    getNewFeedPosts: async (page = 0, size = 20) => {
        return axiosClient.get(`/posts/new-feed?page=${page}&size=${size}`);
    },

    /**
     * Share an existing post
     * @param {Object} shareData { originalPostId, content, visibility, contextType, contextId }
     * @returns {Promise}
     */
    sharePost: async (shareData) => {
        // According to user request:
        // { "originalPostId": "string", "content": "string", "visibility": "PUBLIC", "contextType": "PROFILE", "contextId": "string" }
        return axiosClient.post('/posts/share', shareData);
    },

    /**
     * Get all posts of a specific user
     * @param {string} userId 
     * @param {number} page 
     * @param {number} size 
     * @param {string} sort 
     * @returns {Promise}
     */
    getUserPosts: async (userId, page = 0, size = 10, sort = 'createdAt,desc', postType = null) => {
        let url = `/posts/user/${userId}?page=${page}&size=${size}&sort=${sort}`;
        if (postType) {
            url += `&postType=${postType}`;
        }
        return axiosClient.get(url);
    },

    /**
     * Get details of a specific post
     * @param {string} postId 
     * @returns {Promise}
     */
    getPostById: async (postId) => {
        return axiosClient.get(`/posts/post/${postId}`);
    },

    /**
     * Get pending posts for a group (Admin only)
     */
    getPendingPostsByGroup: async (groupId, query = '', page = 0, size = 10) => {
        const response = await axiosClient.get(`/posts/group/${groupId}/pending`, {
            params: { query, page, size }
        });
        return response.data.data.content || [];
    },

    /**
     * Approve or reject a post (Admin only)
     * @param {string} postId 
     * @param {boolean} approve 
     */
    reviewPost: async (postId, approve) => {
        return axiosClient.post(`/posts/post/${postId}/review?approve=${approve}`);
    },

    /**
     * Search for songs, albums, groups, or users
     * @param {string} keyword 
     * @param {string} type SONG, ALBUM, GROUP, USER
     */
    search: async (keyword, type = 'SONG') => {
        return axiosClient.get(`/posts/search?keyword=${keyword}&type=${type}`);
    }
};

export default postService;
