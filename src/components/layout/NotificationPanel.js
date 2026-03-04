import React, { useState } from 'react';
import { Heart, UserPlus, MessageSquare, AtSign, Music } from 'lucide-react';
import userService from '../../services/userService';
import { useSuggestions } from '../../hooks/useSuggestions';
import './css/NotificationPanel.css';
import { getUserAvatar } from '../../utils/userUtils';

const MOCK_NOTIFICATIONS = {
    new: [],
    thisWeek: [],
    earlier: []
};

const NotificationPanel = ({ isOpen, onMouseEnter, onMouseLeave }) => {
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const { suggestions, handleFollow } = useSuggestions();
    const closeTimeoutRef = React.useRef(null);

    const handleMouseEnter = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }
        onMouseEnter();
    };

    const handleMouseLeave = () => {
        closeTimeoutRef.current = setTimeout(() => {
            onMouseLeave();
        }, 150); // slight delay to allow smooth mouse transit
    };

    const handleToggleFollowNotification = async (section, notificationId, userId) => {
        const sectionItems = notifications[section];
        const item = sectionItems.find(n => n.id === notificationId);

        try {
            if (item.isFollowed) {
                await userService.unfollowUser(userId);
            } else {
                await userService.followUser(userId);
            }

            setNotifications(prev => ({
                ...prev,
                [section]: prev[section].map(n =>
                    n.id === notificationId ? { ...n, isFollowed: !n.isFollowed } : n
                )
            }));
        } catch (error) {
            console.error("Error toggling follow status:", error);
        }
    };

    const renderNotificationIcon = (type) => {
        switch (type) {
            case 'follow': return <UserPlus className="w-3.5 h-3.5 text-indigo-500" />;
            case 'like': return <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />;
            case 'comment': return <MessageSquare className="w-3.5 h-3.5 text-blue-500" />;
            case 'mention': return <AtSign className="w-3.5 h-3.5 text-purple-500" />;
            default: return <Music className="w-3.5 h-3.5 text-slate-500" />;
        }
    };

    const renderSection = (title, items, key) => (
        items.length > 0 && (
            <div className="notification-section">
                <h3 className="section-title">{title}</h3>
                <div className="notification-list">
                    {items.map(notif => (
                        <div key={notif.id} className="notification-item">
                            <div className="user-avatar-wrapper">
                                <img src={notif.avatar} alt={notif.user} className="user-avatar" />
                                <div className="type-icon-badge">
                                    {renderNotificationIcon(notif.type)}
                                </div>
                            </div>
                            <div className="notification-info">
                                <div>
                                    <span className="user-name">{notif.user}</span>
                                    <span className="notification-text">{notif.text}</span>
                                </div>
                                <span className="notification-time">{notif.time}</span>
                            </div>
                            <div className="notification-action">
                                {notif.type === 'follow' ? (
                                    <button
                                        onClick={() => handleToggleFollowNotification(key, notif.id, notif.user)}
                                        className={`btn-follow-action ${notif.isFollowed ? 'following' : ''}`}
                                    >
                                        {notif.isFollowed ? 'Following' : 'Follow'}
                                    </button>
                                ) : notif.media ? (
                                    <img src={notif.media} alt="content" className="media-preview" />
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    );

    const hasNotifications = notifications.new.length > 0 || notifications.thisWeek.length > 0 || notifications.earlier.length > 0;

    return (
        <>
            <div
                className={`notification-panel ${isOpen ? 'open' : ''}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="notification-panel-header">
                    <h2 className="notification-panel-title">Notifications</h2>
                </div>

                <div className="notification-panel-content">
                    {hasNotifications ? (
                        <>
                            {renderSection('New', notifications.new, 'new')}
                            {renderSection('This Week', notifications.thisWeek, 'thisWeek')}
                            {renderSection('Earlier', notifications.earlier, 'earlier')}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full border-2 border-slate-700 flex items-center justify-center mx-auto mb-4">
                                <Heart className="w-8 h-8 text-slate-500" />
                            </div>
                            <p className="text-sm font-bold mb-2">Activity on your posts</p>
                            <p className="text-xs text-slate-500">When someone likes or comments on one of your posts, you'll see it here.</p>
                        </div>
                    )}

                    {suggestions && suggestions.length > 0 && (
                        <div className="mt-8">
                            <h3 className="section-title">Suggestions for you</h3>
                            <div className="notification-list">
                                {suggestions.slice(0, 5).map(user => (
                                    <div key={user.id} className="notification-item">
                                        <div className="user-avatar-wrapper">
                                            <img src={getUserAvatar(user.imageUrl)} alt={user.name} className="user-avatar" />
                                        </div>
                                        <div className="notification-info">
                                            <div>
                                                <span className="user-name">{user.username || user.email?.split('@')[0]}</span>
                                                <span className="notification-text text-xs">{user.name}</span>
                                            </div>
                                            <span className="notification-time opacity-70">Suggested for you</span>
                                        </div>
                                        <div className="notification-action">
                                            <button
                                                onClick={() => handleFollow(user.id)}
                                                className={`btn-follow-action ${user.isFollowed ? 'following' : ''}`}
                                            >
                                                {user.isFollowed ? 'Following' : 'Follow'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationPanel;
