import axiosClient from './axiosClient';

/**
 * Song Service
 * Handles all song-related API calls.
 */
const songService = {
    /**
     * Update song image
     * @param {string|number} songId 
     * @param {File} file 
     * @returns {Promise}
     */
    updateSongImage: async (songId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return axiosClient.put(`/song/update-image?songId=${songId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    /**
     * Upload a new song
     * @param {string} name 
     * @param {string|number} genreId 
     * @param {File} musicFile 
     * @returns {Promise}
     */
    uploadSong: async (name, genreId, musicFile) => {
        const formData = new FormData();
        formData.append('file', musicFile);

        // Note: Query parameters name and genreId are sent as requested
        return axiosClient.post(`/song?name=${encodeURIComponent(name)}&genreId=${encodeURIComponent(genreId)}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    /**
     * Get songs by user ID with pagination
     * @param {string|number} userId 
     * @param {number} page 
     * @param {number} size 
     * @returns {Promise}
     */
    getUserSongs: async (userId, page = 0, size = 20) => {
        return axiosClient.get(`/song/songs/${userId}?page=${page}&size=${size}`);
    },

    /**
     * Get all songs (Legacy support/Search)
     * @returns {Promise}
     */
    getAllSongs: async () => {
        return axiosClient.get('/song');
    },

    /**
     * Get a specific song by ID
     * @param {string|number} songId
     * @returns {Promise}
     */
    getSongById: async (songId) => {
        return axiosClient.get(`/song/${songId}`);
    },

    /**
     * Search songs by name (Mocked for UI/UX demonstration)
     * @param {string} query 
     * @returns {Promise}
     */
    searchSongs: async (query) => {
        // Since backend search isn't implemented yet, we'll fetch all and filter
        const response = await axiosClient.get('/song');
        const songs = response.data?.data || response.data || [];
        const filtered = songs.filter(s => s.name?.toLowerCase().includes(query.toLowerCase()));
        return { data: { data: filtered } };
    },

    /**
     * Record a play for a song
     * @param {string|number} songId 
     * @param {number} durationPlayed 
     * @returns {Promise}
     */
    recordPlay: async (songId, durationPlayed = 0) => {
        return axiosClient.post(`/song/${songId}/play?durationPlayed=${durationPlayed}`);
    }
};

export default songService;
