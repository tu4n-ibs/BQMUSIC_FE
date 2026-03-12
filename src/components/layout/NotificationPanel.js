import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, UserPlus, MessageSquare, AtSign, Music, CheckCheck, Heart, X } from 'lucide-react';
import userService from '../../services/userService';
import { useSuggestions } from '../../hooks/useSuggestions';
import { useNotification } from '../../context/NotificationContext';
import './css/NotificationPanel.css';
import { getUserAvatar } from '../../utils/userUtils';

const NotificationPanel = ({ isOpen, onClose, onMouseEnter, onMouseLeave }) => {
    const navigate = useNavigate();
    const { notifications, markAsRead, markAllAsRead } = useNotification();
    const { suggestions, handleFollow } = useSuggestions();
    const closeTimeoutRef = React.useRef(null);

    const handleClose = (e) => {
        if (e) e.stopPropagation();
        onClose();
    };

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

    const groupedNotifications = useMemo(() => {
        const sections = { new: [], thisWeek: [], earlier: [] };

        notifications.forEach(notif => {
            // Simple grouping logic: could be improved with date-fns/dayjs
            const createdAt = notif.createdAt ? new Date(notif.createdAt) : new Date();
            const now = new Date();
            const diffInDays = (now - createdAt) / (1000 * 60 * 60 * 24);

            if (diffInDays < 1) sections.new.push(notif);
            else if (diffInDays < 7) sections.thisWeek.push(notif);
            else sections.earlier.push(notif);
        });

        return sections;
    }, [notifications]);

    const handleNotificationClick = (notif) => {
        // 1. Mark as read
        if (!notif.isRead) {
            markAsRead(notif.id);
        }

        // 2. Navigate based on targetType
        const { targetType, targetId } = notif;
        const normalizedType = targetType?.toUpperCase();

        switch (normalizedType) {
            case 'POST':
            case 'COMMENT':
                if (targetId) {
                    navigate(`/posts/${targetId}`);
                }
                break;
            case 'GROUP':
                if (targetId) {
                    navigate(`/groups/${targetId}`);
                }
                break;
            case 'ALBUM':
                navigate('/my-albums');
                break;
            default:
                // For other types like USER/FOLLOW, stay or go to profile
                break;
        }
    };

    const handleToggleFollowNotification = async (notif) => {
        try {
            if (notif.isFollowed) {
                await userService.unfollowUser(notif.userId || notif.userIdFrom);
            } else {
                await userService.followUser(notif.userId || notif.userIdFrom);
            }
            // Ideally notify parent or refresh
        } catch (error) {
            console.error("Error toggling follow status:", error);
        }
    };

    const getNotificationText = (notif) => {
        const { actionType, targetType } = notif;
        switch (actionType) {
            case 'LIKE': return `liked your ${targetType?.toLowerCase() || 'post'}`;
            case 'COMMENT': return `commented on your ${targetType?.toLowerCase() || 'post'}`;
            case 'FOLLOW': return `started following you`;
            case 'SHARE': return `shared your ${targetType?.toLowerCase() || 'post'}`;
            default: return `interacted with your ${targetType?.toLowerCase() || 'content'}`;
        }
    };

    const renderNotificationIcon = (type) => {
        const lowerType = type?.toLowerCase();
        switch (lowerType) {
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
                        <div
                            key={notif.id}
                            className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(notif)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="user-avatar-wrapper">
                                <img
                                    src={getUserAvatar(notif.actor?.imageUrl)}
                                    alt={notif.actor?.name}
                                    className="user-avatar"
                                />
                                <div className="type-icon-badge">
                                    {renderNotificationIcon(notif.actionType)}
                                </div>
                            </div>
                            <div className="notification-info">
                                <div>
                                    <span className="user-name">{notif.actor?.name || 'User'}</span>
                                    <span className="notification-text">{getNotificationText(notif)}</span>
                                </div>
                                <span className="notification-time">
                                    {(() => {
                                        if (!notif.createdAt) return 'recent';
                                        let date;
                                        if (Array.isArray(notif.createdAt)) {
                                            const [year, month, day, hour, minute] = notif.createdAt;
                                            date = new Date(year, month - 1, day, hour, minute);
                                        } else {
                                            date = new Date(notif.createdAt);
                                        }
                                        return isNaN(date.getTime()) ? 'recent' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    })()}
                                </span>
                            </div>
                            <div className="notification-action">
                                {notif.actionType === 'FOLLOW' ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleFollowNotification(notif);
                                        }}
                                        className={`btn-follow-action ${notif.isFollowed ? 'following' : ''}`}
                                    >
                                        {notif.isFollowed ? 'Following' : 'Follow'}
                                    </button>
                                ) : (
                                    !notif.isRead && <div className="unread-dot"></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    );

    const hasNotifications = notifications.length > 0;

    return (
        <>
            <div
                className={`notification-panel ${isOpen ? 'open' : ''}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="notification-panel-header flex justify-between items-center">
                    <h2 className="notification-panel-title">Notifications</h2>
                    <div className="flex items-center gap-3">
                        {hasNotifications && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-indigo-500 hover:text-indigo-400 flex items-center gap-1 font-semibold transition-colors"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Mark all as read
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors md:hidden"
                            aria-label="Close notifications"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="notification-panel-content">
                    {hasNotifications ? (
                        <>
                            {renderSection('New', groupedNotifications.new, 'new')}
                            {renderSection('This Week', groupedNotifications.thisWeek, 'thisWeek')}
                            {renderSection('Earlier', groupedNotifications.earlier, 'earlier')}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full border-2 border-slate-700 flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-8 h-8 text-slate-500" />
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
