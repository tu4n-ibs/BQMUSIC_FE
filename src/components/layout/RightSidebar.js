import React from 'react';
import { useNavigate } from 'react-router-dom';
import './css/RightSidebar.css';

const DEFAULT_AVATAR_URL = "https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg?w=360";

const RightSidebar = ({ currentUser, suggestions, onFollow }) => {
    const navigate = useNavigate();

    const handleProfileClick = (userId) => {
        if (userId) {
            navigate(`/user/${userId}`);
        }
    };

    return (
        <aside className="fixed right-0 top-0 h-screen w-[320px] px-8 py-8 overflow-y-auto hidden lg:block right-sidebar">
            {/* --- CURRENT USER DISPLAY --- */}
            <div className="flex items-center justify-between mb-6">
                <div
                    className="flex items-center gap-3 w-full cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleProfileClick(currentUser.id)}
                >
                    <img
                        src={currentUser.avatar}
                        alt={currentUser.username}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        onError={(e) => { e.target.src = DEFAULT_AVATAR_URL }}
                    />
                    <div className="flex-1 min-w-0">
                        {/* Display email */}
                        <div className="user-name truncate" title={currentUser.username || currentUser.email}>
                            {currentUser.username || currentUser.email || "Not logged in"}
                        </div>
                        {/* Display name */}
                        <div className="user-meta truncate" title={currentUser.name}>
                            {currentUser.name}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                    <span className="section-title">Suggested for you</span>
                    <button className="text-xs font-semibold">See All</button>
                </div>
                <div className="space-y-3">
                    {suggestions.map(user => (
                        <div key={user.id} className="flex items-center justify-between suggestion-item">
                            <div
                                className="flex items-center gap-3 flex-1 min-w-0 mr-2 cursor-pointer group"
                                onClick={() => handleProfileClick(user.id)}
                            >
                                <img
                                    src={user.avatar}
                                    alt={user.username}
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 group-hover:ring-2 group-hover:ring-indigo-500 transition-all"
                                    onError={(e) => { e.target.src = DEFAULT_AVATAR_URL }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="username truncate group-hover:text-indigo-400 transition-colors" title={user.username}>{user.username}</div>
                                    <div className="mutual truncate" title={user.mutual}>{user.mutual}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => onFollow(user.id)}
                                className={`transition-colors ${user.isFollowed ? 'btn-unfollow' : 'btn-follow'}`}
                            >
                                {user.isFollowed ? "Unfollow" : "Follow"}
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
