import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUserAvatar } from '../../utils/userUtils';
import './css/RightSidebar.css';

const DEFAULT_AVATAR_URL = "https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg?w=360";

const RightSidebar = ({ currentUser: propUser, suggestions = [], onFollow }) => {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();

    // Use prop user if available, otherwise fallback to auth user
    const user = propUser || (authUser ? {
        id: authUser.id,
        username: authUser.email || authUser.username,
        name: authUser.name || "User",
        avatar: getUserAvatar(authUser.imageUrl)
    } : null);

    const handleProfileClick = (userId) => {
        if (userId) {
            navigate(`/user/${userId}`);
        }
    };

    // If no user is available, don't crash
    if (!user) return null;

    return (
        <aside className="fixed right-0 top-0 h-screen w-[320px] px-8 py-8 overflow-y-auto hidden lg:block right-sidebar">
            {/* --- CURRENT USER DISPLAY --- */}
            <div className="flex items-center justify-between mb-6">
                <div
                    className="flex items-center gap-3 w-full cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleProfileClick(user.id)}
                >
                    <img
                        src={user.avatar || DEFAULT_AVATAR_URL}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        onError={(e) => { e.target.src = DEFAULT_AVATAR_URL }}
                    />
                    <div className="flex-1 min-w-0">
                        {/* Display email */}
                        <div className="user-name truncate" title={user.username || user.email}>
                            {user.username || user.email || "Not logged in"}
                        </div>
                        {/* Display name */}
                        <div className="user-meta truncate" title={user.name}>
                            {user.name}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <span className="section-title">Suggested for you</span>
                </div>
                <div className="space-y-3">
                    {suggestions && suggestions.map(suggestion => (
                        <div key={suggestion.id} className="flex items-center justify-between suggestion-item">
                            <div
                                className="flex items-center gap-3 flex-1 min-w-0 mr-2 cursor-pointer group"
                                onClick={() => handleProfileClick(suggestion.id)}
                            >
                                <img
                                    src={suggestion.avatar || DEFAULT_AVATAR_URL}
                                    alt={suggestion.username}
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 group-hover:ring-2 group-hover:ring-indigo-500 transition-all"
                                    onError={(e) => { e.target.src = DEFAULT_AVATAR_URL }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="username truncate group-hover:text-indigo-400 transition-colors" title={suggestion.username}>{suggestion.username}</div>
                                    <div className="mutual truncate" title={suggestion.mutual}>{suggestion.mutual}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => onFollow && onFollow(suggestion.id)}
                                className={`transition-colors ${suggestion.isFollowed ? 'btn-unfollow' : 'btn-follow'}`}
                            >
                                {suggestion.isFollowed ? "Unfollow" : "Follow"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-8 space-y-2 footer-text">
                <div>© 2026 BQMUSIC FROM BTHTEAMS</div>
            </div>
        </aside>
    );
};

export default RightSidebar;
