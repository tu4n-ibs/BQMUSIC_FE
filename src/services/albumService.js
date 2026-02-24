import axiosClient from "./axiosClient";

const albumService = {
    /**
     * Create a new album
     * @param {Object} albumData { name, description, userId }
     * @returns {Promise<Object>} Response data
     */
    createAlbum: async (albumData) => {
        // API endpoint: /album
        const response = await axiosClient.post("/album", albumData);
        return response.data;
    },

    /**
     * Add a song to an existing album
     * @param {string} albumId 
     * @param {string} songId 
     * @returns {Promise<Object>} Response data
     */
    addSongToAlbum: async (albumId, songId) => {
        // API endpoint: /album/add-new-song
        const response = await axiosClient.post("/album/add-new-song", {
            albumId,
            songId
        });
        return response.data;
    },

    /**
     * Get albums for a specific user
     * @param {string} userId 
     * @returns {Promise<Object>} Response data
     */
    getUserAlbums: async (userId) => {
        // Assuming there's an endpoint to get user albums
        // If not provided exactly, common pattern is /album/user/{userId} or /album?userId=...
        const response = await axiosClient.get(`/album?userId=${userId}`);
        return response.data;
    }
};

export default albumService;
