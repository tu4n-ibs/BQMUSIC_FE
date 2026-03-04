import { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';
import { getUserAvatar } from '../utils/userUtils';

/**
 * Hook to manage user suggestions and follow state
 */
export const useSuggestions = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSuggestions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await userService.getSuggestions();
            const mappedSuggestions = data.map((user) => ({
                id: user.userId || user.idUser || user.id,
                username: user.name || "Anonymous User",
                avatar: getUserAvatar(user.imageUrl),
                mutual: 'Suggested for you',
                isFollowed: false // API suggestions are typically for users not yet followed
            }));
            setSuggestions(mappedSuggestions);
            setError(null);
        } catch (err) {
            console.error("Error loading suggestions:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleFollow = async (targetId) => {
        if (!targetId) return;

        const userIndex = suggestions.findIndex(u => u.id === targetId);
        if (userIndex === -1) return;

        const isCurrentlyFollowed = suggestions[userIndex].isFollowed;

        // Optimistic UI update
        const newSuggestions = [...suggestions];
        newSuggestions[userIndex].isFollowed = !isCurrentlyFollowed;
        setSuggestions(newSuggestions);

        try {
            if (isCurrentlyFollowed) {
                await userService.unfollowUser(targetId);
            } else {
                await userService.followUser(targetId);
            }
        } catch (err) {
            console.error("Follow error:", err);
            // Revert on error
            const revertedSuggestions = [...suggestions];
            revertedSuggestions[userIndex].isFollowed = isCurrentlyFollowed;
            setSuggestions(revertedSuggestions);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, [fetchSuggestions]);

    return {
        suggestions,
        loading,
        error,
        handleFollow,
        refetch: fetchSuggestions
    };
};

export default useSuggestions;
