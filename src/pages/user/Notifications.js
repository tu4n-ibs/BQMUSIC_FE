import React, { useState } from 'react';
import { Heart, UserPlus, MessageSquare, AtSign, Music } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import RightSidebar from '../../components/layout/RightSidebar';
import CreatePostModal from '../../components/modals/CreatePostModal';
import './css/Notifications.css';

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

const MOCK_CURRENT_USER = {
    name: 'Demo User',
    username: 'demo@example.com',
    avatar: "https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg?w=360"
};

const MOCK_SUGGESTIONS = [
    { id: 'u20', username: 'producer_x', avatar: 'https://i.pravatar.cc/150?img=20', mutual: 'Gợi ý cho bạn', isFollowed: false },
    { id: 'u21', username: 'vocal_queen', avatar: 'https://i.pravatar.cc/150?img=21', mutual: 'Gợi ý cho bạn', isFollowed: false }
];

const Notifications = () => {
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS);

    const handleToggleFollowNotification = (section, id) => {
        setNotifications(prev => {
            const updatedSection = prev[section].map(n =>
                n.id === id ? { ...n, isFollowed: !n.isFollowed } : n
            );
            return { ...prev, [section]: updatedSection };
        });
    };

    const handleFollowSuggestion = (targetId) => {
        setSuggestions(prev => prev.map(u =>
            u.id === targetId ? { ...u, isFollowed: !u.isFollowed } : u
        ));
    };

    const renderIcon = (type) => {
        switch (type) {
            case 'like': return <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />;
            case 'follow': return <UserPlus className="w-4 h-4 text-indigo-500" />;
            case 'comment': return <MessageSquare className="w-4 h-4 text-indigo-400" />;
            case 'mention': return <AtSign className="w-4 h-4 text-purple-500" />;
            default: return <Music className="w-4 h-4 text-slate-400" />;
        }
    };

    const NotificationItem = ({ item, section }) => (
        <div className="notification-item animate-slide-in">
            <img src={item.avatar} alt={item.user} className="notification-avatar" />
            <div className="notification-content">
                <span className="notification-user">{item.user}</span>{' '}
                <span className="notification-text">{item.text}</span>
                <span className="notification-time">{item.time}</span>
            </div>

            {item.type === 'follow' ? (
                <div className="notification-actions">
                    <button
                        className={item.isFollowed ? 'following-btn' : 'follow-btn'}
                        onClick={() => handleToggleFollowNotification(section, item.id)}
                    >
                        {item.isFollowed ? 'Following' : 'Follow Base'}
                    </button>
                </div>
            ) : item.media ? (
                <img src={item.media} alt="Preview" className="notification-media" />
            ) : (
                <div className="p-2 opacity-50">{renderIcon(item.type)}</div>
            )}
        </div>
    );

    return (
        <div className="notifications-container">
            <Sidebar onOpenCreateModal={() => setIsCreateModalOpen(true)} />
            <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

            <main className="notifications-main">
                <div className="notifications-wrapper">
                    <header className="notifications-header">
                        <h1 className="notifications-title">Notifications</h1>
                        <p className="text-sm opacity-50">Updates from your activity and network</p>
                    </header>

                    <div className="notifications-list">
                        <section className="notification-section">
                            <h2 className="section-label">New</h2>
                            {notifications.new.map(n => <NotificationItem key={n.id} item={n} section="new" />)}
                        </section>

                        <section className="notification-section">
                            <h2 className="section-label">This Week</h2>
                            {notifications.thisWeek.map(n => <NotificationItem key={n.id} item={n} section="thisWeek" />)}
                        </section>

                        <section className="notification-section">
                            <h2 className="section-label">Earlier</h2>
                            {notifications.earlier.map(n => <NotificationItem key={n.id} item={n} section="earlier" />)}
                        </section>
                    </div>
                </div>
            </main>

            <RightSidebar
                currentUser={MOCK_CURRENT_USER}
                suggestions={suggestions}
                onFollow={handleFollowSuggestion}
            />
        </div>
    );
};

export default Notifications;
