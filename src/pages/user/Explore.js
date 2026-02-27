import React, { useState } from 'react';
import { Compass, Music, Film, Image as ImageIcon, TrendingUp, Heart, Play } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import RightSidebar from '../../components/layout/RightSidebar';
import CreatePostModal from '../../components/modals/CreatePostModal';
import './css/Explore.css';

const MOCK_EXPLORE_DATA = [
    { id: 'e1', type: 'image', title: 'Urban Rhythm', meta: '24k likes', image: 'https://images.unsplash.com/photo-1514525253361-bee8a487409e?q=80&w=800', height: '400px' },
    { id: 'e2', type: 'music', title: 'Midnight Chill', meta: 'Trending • 12k plays', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800', height: '300px', badge: 'Trending' },
    { id: 'e3', type: 'image', title: 'Sunset Beats', meta: '8k likes', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800', height: '500px' },
    { id: 'e4', type: 'video', title: 'Live Performance', meta: 'Live now', image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=800', height: '350px', badge: 'Live' },
    { id: 'e5', type: 'image', title: 'Neon Nights', meta: '15k likes', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800', height: '450px' },
    { id: 'e6', type: 'music', title: 'Acoustic Soul', meta: 'New Release', image: 'https://images.unsplash.com/photo-1459749411177-0421800673d6?q=80&w=800', height: '320px', badge: 'New' },
    { id: 'e7', type: 'image', title: 'Mountain Echoes', meta: '10k likes', image: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?q=80&w=800', height: '480px' },
    { id: 'e8', type: 'video', title: 'Studio Session', meta: 'Behind the scenes', image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800', height: '380px' },
    { id: 'e9', type: 'image', title: 'Vintage Vibes', meta: '18k likes', image: 'https://images.unsplash.com/photo-1485579149621-0da62f02607e?q=80&w=800', height: '420px' }
];

const MOCK_CURRENT_USER = {
    name: 'Demo User',
    username: 'demo@example.com',
    avatar: "https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg?w=360"
};

const MOCK_SUGGESTIONS = [
    { id: 'u10', username: 'midnight_vibes', avatar: 'https://i.pravatar.cc/150?img=10', mutual: 'Gợi ý cho bạn', isFollowed: false },
    { id: 'u11', username: 'traveler_beats', avatar: 'https://i.pravatar.cc/150?img=11', mutual: 'Gợi ý cho bạn', isFollowed: true },
    { id: 'u12', username: 'urban_rhythm', avatar: 'https://i.pravatar.cc/150?img=12', mutual: 'Gợi ý cho bạn', isFollowed: false }
];

const Explore = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS);

    const handleFollow = (targetId) => {
        setSuggestions(prev => prev.map(u =>
            u.id === targetId ? { ...u, isFollowed: !u.isFollowed } : u
        ));
    };

    const renderItemIcon = (type) => {
        switch (type) {
            case 'music': return <Music className="w-4 h-4" />;
            case 'video': return <Film className="w-4 h-4" />;
            default: return <ImageIcon className="w-4 h-4" />;
        }
    };

    return (
        <div className="explore-container">
            <Sidebar onOpenCreateModal={() => setIsCreateModalOpen(true)} />
            <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

            <main className="explore-main">
                <div className="explore-wrapper">
                    <header className="explore-header">
                        <h1 className="explore-title">Explore</h1>
                        <div className="explore-tabs">
                            {['all', 'trending', 'music', 'videos', 'for you'].map((tab) => (
                                <div
                                    key={tab}
                                    className={`explore-tab ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </div>
                            ))}
                        </div>
                    </header>

                    <div className="explore-content animate-slide-up">
                        <div className="explore-grid">
                            {MOCK_EXPLORE_DATA.map((item) => (
                                <div key={item.id} className="explore-item">
                                    {item.badge && <div className="explore-badge">{item.badge}</div>}
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="explore-image"
                                        style={{ height: item.height }}
                                    />
                                    <div className="explore-overlay">
                                        <div className="explore-item-title">{item.title}</div>
                                        <div className="explore-item-meta">
                                            {renderItemIcon(item.type)}
                                            {item.meta}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <RightSidebar
                currentUser={MOCK_CURRENT_USER}
                suggestions={suggestions}
                onFollow={handleFollow}
            />
        </div>
    );
};

export default Explore;
