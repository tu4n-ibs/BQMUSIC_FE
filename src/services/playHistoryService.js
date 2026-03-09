import axiosClient from './axiosClient';

/**
 * Play History Service
 * Handles fetching user play history.
 */
const playHistoryService = {
    /**
     * Get play history for the current user
     * @param {number} page 
     * @param {number} size 
     * @returns {Promise}
     */
    getHistory: async (page = 0, size = 20) => {
        return axiosClient.get(`/play-history?page=${page}&size=${size}`);
    }
};

export default playHistoryService;
