import axiosClient from "./axiosClient";

const groupService = {
    /**
     * Get all groups (Discovery)
     * @returns {Promise<Array>} List of groups
     */
    getGroups: async () => {
        try {
            // Placeholder: Replace with real endpoint when available
            // const response = await axiosClient.get("/groups");
            // return response.data;

            // Mock data for initial UI development
            return [
                { id: 1, name: "Creative Hub", members: "14.2k", description: "A space for creators to collaborate.", imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=500&auto=format&fit=crop" },
                { id: 2, name: "Dev Community", members: "12.2k", description: "Sharing insights on modern web development.", imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=500&auto=format&fit=crop" },
                { id: 3, name: "Music Scene", members: "8.3k", description: "Electronic beats and ambient vibes.", imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop" }
            ];
        } catch (error) {
            console.error("Error fetching groups:", error);
            return [];
        }
    },

    /**
     * Get group details by ID
     * @param {number|string} id 
     * @returns {Promise<Object>} Group data
     */
    getGroupById: async (id) => {
        try {
            // const response = await axiosClient.get(`/groups/${id}`);
            // return response.data;

            return {
                id,
                name: id === 1 ? "Creative Hub" : "Group Name",
                members: "14.2k",
                about: "A space for creators to collaborate, share insights, and more. Join us to be part of something big.",
                location: "Global",
                founded: "July 2022",
                imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=500&auto=format&fit=crop"
            };
        } catch (error) {
            console.error("Error fetching group details:", error);
            return null;
        }
    },

    /**
     * Join/Leave group
     */
    joinGroup: async (id) => {
        return axiosClient.post(`/groups/${id}/join`);
    },

    leaveGroup: async (id) => {
        return axiosClient.delete(`/groups/${id}/leave`);
    },

    /**
     * Get group posts
     */
    getGroupPosts: async (groupId) => {
        try {
            // const response = await axiosClient.get(`/groups/${groupId}/posts`);
            // return response.data;

            return [
                {
                    id: 101,
                    authorName: "Alex Rivera",
                    authorAvatar: "https://i.pravatar.cc/150?u=alex",
                    content: "Just dropped our new Ambient Electronica playlist!",
                    musicLink: "https://example.com/music.mp3",
                    likes: 1200,
                    comments: 248,
                    shares: 95,
                    timestamp: "11 mins ago"
                }
            ];
        } catch (error) {
            console.error("Error fetching group posts:", error);
            return [];
        }
    }
};

export default groupService;
