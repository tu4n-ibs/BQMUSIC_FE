import axiosClient from "./axiosClient";

const genreService = {
    /**
     * Get all genres or search by name
     * @param {string} name 
     * @returns {Promise<Object>} Response data
     */
    getAllGenres: async (name = "") => {
        // API endpoint: /genre?name=...
        const response = await axiosClient.get(`/genre${name ? `?name=${name}` : ""}`);
        return response.data;
    },

    /**
     * Create a new genre
     * @param {Object} genreData { name, description }
     * @returns {Promise<Object>} Response data
     */
    createGenre: async (genreData) => {
        // API endpoint: /genre
        const response = await axiosClient.post("/genre", genreData);
        return response.data;
    },

    /**
     * Update an existing genre
     * @param {string} id 
     * @param {Object} genreData { name, description }
     * @returns {Promise<Object>} Response data
     */
    updateGenre: async (id, genreData) => {
        // API endpoint: /genre/{id}
        const response = await axiosClient.put(`/genre/${id}`, genreData);
        return response.data;
    },
};

export default genreService;
