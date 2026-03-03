import React, { useState } from 'react';
import { Heart, UserPlus, MessageSquare, AtSign, Music } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import RightSidebar from '../../components/layout/RightSidebar';
import CreatePostModal from '../../components/modals/CreatePostModal';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useSuggestions } from '../../hooks/useSuggestions';
import './css/Notifications.css';
import { getUserAvatar } from '../../utils/userUtils';

const MOCK_NOTIFICATIONS = {
    new: [
        {
            id: 'n1',
            type: 'follow',
            user: 'midnight_vibes',
            avatar: 'https://i.pravatar.cc/150?img=10',
            text: 'started following you',
            time: '2m',
            isFollowed: false
        },
        {
            id: 'n2',
            type: 'like',
            user: 'urban_rhythm',
            avatar: 'https://i.pravatar.cc/150?img=12',
            text: 'liked your song "Neon Nights"',
            time: '15m',
            media: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=100'
        }
    ],
    thisWeek: [
        {
            id: 'n3',
            type: 'comment',
            user: 'traveler_beats',
            avatar: 'https://i.pravatar.cc/150?img=11',
            text: 'commented: "This drop is insane! 🔥"',
            time: '2d',
            media: 'https://images.unsplash.com/photo-1514525253361-bee8a487409e?q=80&w=100'
        },
        {
            id: 'n4',
            type: 'mention',
            user: 'billie_fan',
            avatar: 'https://i.pravatar.cc/150?img=5',
            text: 'mentioned you in a post',
            time: '3d'
        }
    ],
    earlier: [
        {
            id: 'n5',
            type: 'follow',
            user: 'soul_acoustic',
            avatar: 'https://i.pravatar.cc/150?img=8',
            text: 'started following you',
            time: '1w',
            isFollowed: true
        }
    ]
};

const Notifications = () => {
    const { user } = useAuth();
    const { suggestions, handleFollow: handleFollowSuggestion } = useSuggestions();

    const currentUser = {
        name: user?.name || "Người dùng",
        username: user?.email || "",
        avatar: getUserAvatar(user?.imageUrl)
    };

    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
            console.error("Lỗi khi thay đổi trạng thái theo dõi:", error);
        }
    };

    const renderNotificationIcon = (type) => {
        switch (type) {
            case 'follow': return <UserPlus className="w-4 h-4 text-indigo-500" />;
            case 'like': return <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />;
            case 'comment': return <MessageSquare className="w-4 h-4 text-blue-500" />;
            case 'mention': return <AtSign className="w-4 h-4 text-purple-500" />;
            default: return <Music className="w-4 h-4 text-slate-500" />;
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
                                <span className="user-name">{notif.user}</span>
                                <span className="notification-text line-clamp-2">{notif.text}</span>
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

    return (
        <div className="notifications-container">
            <Sidebar onOpenCreateModal={() => setIsCreateModalOpen(true)} />
            <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

            <main className="notifications-main ml-[120px]">
                <div className="notifications-wrapper animate-slide-up">
                    <header className="notifications-header">
                        <h1 className="notifications-title">Notifications</h1>
                    </header>

                    <div className="notifications-content">
                        {renderSection('New', notifications.new, 'new')}
                        {renderSection('This Week', notifications.thisWeek, 'thisWeek')}
                        {renderSection('Earlier', notifications.earlier, 'earlier')}
                    </div>
                </div>
            </main>

            <RightSidebar
                currentUser={currentUser}
                suggestions={suggestions}
                onFollow={handleFollowSuggestion}
            />
        </div>
    );
};

export default Notifications;
