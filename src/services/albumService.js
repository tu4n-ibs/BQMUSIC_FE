import axiosClient from "./axiosClient";

const albumService = {
    /**
     * Create a new album
     * @param {{ name: string, description: string, imageUrl: string }} albumData
     * @returns {Promise<Object>} Response data
     */
    createAlbum: async (albumData) => {
        const response = await axiosClient.post("/album", albumData);
        return response.data;
    },

    /**
     * Update album image via multipart upload
     * @param {string} albumId
     * @param {File} imageFile
     * @returns {Promise<Object>} Response data
     */
    uploadAlbumImage: async (albumId, imageFile) => {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('albumId', albumId);
        const response = await axiosClient.post("/album/update-image", formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * Update album metadata
     * @param {string} albumId
     * @param {{ name: string, description: string, imageUrl: string }} albumData
     * @returns {Promise<Object>} Response data
     */
    updateAlbum: async (albumId, albumData) => {
        const response = await axiosClient.put(`/album/${albumId}`, albumData);
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
     * @param {string|number} userId 
     * @returns {Promise<Object>} Response data
     */
    getAlbumsByUserId: async (userId) => {
        const response = await axiosClient.get(`/album/user/${userId}`);
        return response.data;
    },

    /**
     * Get all albums (for admin)
     */
    getAllAlbums: async () => {
        const response = await axiosClient.get("/album");
        return response.data;
    },

    /**
     * Delete an album
     */
    deleteAlbum: async (albumId) => {
        const response = await axiosClient.delete(`/album/${albumId}`);
        return response.data;
    }
};

export default albumService;
