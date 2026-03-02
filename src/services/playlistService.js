import axiosClient from './axiosClient';

/**
 * Playlist Service
 * Handles all playlist-related API calls.
 */
const playlistService = {
    /**
     * Get all playlists for the current user
     * @returns {Promise}
     */
    getPlaylists: async () => {
        return axiosClient.get('/playlist');
    },

    /**
     * Create a new playlist
     * @param {Object} data { name, description }
     * @returns {Promise}
     */
    createPlaylist: async (data) => {
        return axiosClient.post('/playlist', data);
    },

    /**
     * Add a song to a playlist
     * @param {string|number} songId 
     * @param {string|number} playlistId 
     * @returns {Promise}
     */
    addSongToPlaylist: async (songId, playlistId) => {
        return axiosClient.post('/playlist/add-new-song', {
            songId: String(songId),
            playListId: String(playlistId)
        });
    }
};

export default playlistService;
