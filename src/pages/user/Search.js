import React, { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, X, Clock, User, Music, Disc, TrendingUp, ChevronRight } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import RightSidebar from '../../components/layout/RightSidebar';
import CreatePostModal from '../../components/modals/CreatePostModal';
import './css/Search.css';

const MOCK_RESULTS = {
    all: [
        { id: 'u1', name: 'John Doe', meta: 'Artist • 248k followers', type: 'user', image: 'https://i.pravatar.cc/150?img=1' },
        { id: 's1', name: 'Midnight City', meta: 'M83 • Hurry Up, We\'re Dreaming', type: 'song', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=150' },
        { id: 'a1', name: 'After Hours', meta: 'The Weeknd • Album', type: 'album', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=150' }
    ],
    users: [
        { id: 'u1', name: 'John Doe', meta: 'Artist • 248k followers', type: 'user', image: 'https://i.pravatar.cc/150?img=1' },
        { id: 'u2', name: 'Jane Smith', meta: 'DJ • 120k followers', type: 'user', image: 'https://i.pravatar.cc/150?img=2' }
    ],
    songs: [
        { id: 's1', name: 'Midnight City', meta: 'M83 • Hurry Up, We\'re Dreaming', type: 'song', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=100' },
        { id: 's2', name: 'Starboy', meta: 'The Weeknd • Starboy', type: 'song', image: 'https://images.unsplash.com/photo-1514525253361-bee8a487409e?q=80&w=100' }
    ],
    albums: [
        { id: 'a1', name: 'After Hours', meta: 'The Weeknd • 14 tracks', type: 'album', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=100' },
        { id: 'a2', name: 'Random Access Memories', meta: 'Daft Punk • 13 tracks', type: 'album', image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=100' }
    ]
};

const SUGGESTED = [
    { id: 't1', name: 'Pop Hits 2024', meta: 'Trending Collection', type: 'trending', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 't2', name: 'Lo-fi Beats', meta: 'Perfect for studying', type: 'trending', icon: <Music className="w-5 h-5" /> },
];

const DEFAULT_AVATAR_URL = "https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg?w=360";

const MOCK_SUGGESTIONS = [
    { id: 'u10', username: 'midnight_vibes', avatar: 'https://i.pravatar.cc/150?img=10', mutual: 'Gợi ý cho bạn', isFollowed: false },
    { id: 'u11', username: 'traveler_beats', avatar: 'https://i.pravatar.cc/150?img=11', mutual: 'Gợi ý cho bạn', isFollowed: true },
    { id: 'u12', username: 'urban_rhythm', avatar: 'https://i.pravatar.cc/150?img=12', mutual: 'Gợi ý cho bạn', isFollowed: false }
];

const MOCK_CURRENT_USER = {
    name: 'Demo User',
    username: 'demo@example.com',
    avatar: DEFAULT_AVATAR_URL
};

const Search = () => {
    const [currentUser] = useState(MOCK_CURRENT_USER);
    const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [recentSearches, setRecentSearches] = useState([
        { id: 'r1', name: 'The Weeknd', type: 'history' },
        { id: 'r2', name: 'Taylor Swift', type: 'history' }
    ]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleFollow = (targetId) => {
        setSuggestions(prev => prev.map(u =>
            u.id === targetId ? { ...u, isFollowed: !u.isFollowed } : u
        ));
    };

    // Debounce search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(() => {
            // Filter mock results based on active tab and query
            const baseResults = MOCK_RESULTS[activeTab] || [];
            const filtered = baseResults.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setResults(filtered);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, activeTab]);

    const handleClearSearch = () => {
        setSearchQuery('');
        setResults([]);
    };

    const handleClearHistory = () => {
        setRecentSearches([]);
    };

    const renderResultIcon = (type) => {
        switch (type) {
            case 'user': return <User className="w-4 h-4" />;
            case 'song': return <Music className="w-4 h-4" />;
            case 'album': return <Disc className="w-4 h-4" />;
            default: return <ChevronRight className="w-4 h-4" />;
        }
    };

    return (
        <div className="search-container">
            <Sidebar onOpenCreateModal={() => setIsCreateModalOpen(true)} />
            <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

            <main className="search-main">
                <div className="search-wrapper">
                    <header className="search-header">
                        <h1 className="search-title">Search</h1>
                        <div className="search-bar-container">
                            <SearchIcon className="search-icon w-5 h-5" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search for songs, artists, albums..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            {searchQuery && (
                                <button className="search-clear-btn" onClick={handleClearSearch}>
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="search-tabs">
                            {['all', 'users', 'songs', 'albums'].map((tab) => (
                                <div
                                    key={tab}
                                    className={`search-tab ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </div>
                            ))}
                        </div>
                    </header>

                    <div className="search-content">
                        {!searchQuery ? (
                            <div className="animate-slide-up">
                                {recentSearches.length > 0 && (
                                    <section className="mb-10">
                                        <div className="section-title">
                                            <span>Recent Searches</span>
                                            <button className="clear-history-btn" onClick={handleClearHistory}>Clear All</button>
                                        </div>
                                        <div className="results-grid">
                                            {recentSearches.map(item => (
                                                <div key={item.id} className="result-card" onClick={() => setSearchQuery(item.name)}>
                                                    <div className="result-image-wrapper">
                                                        <div className="result-image bg-slate-800 flex items-center justify-center">
                                                            <Clock className="w-6 h-6 text-slate-500" />
                                                        </div>
                                                    </div>
                                                    <div className="result-info">
                                                        <div className="result-name">{item.name}</div>
                                                        <div className="result-meta">Recently searched</div>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-slate-600" />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                <section>
                                    <div className="section-title">Suggested for you</div>
                                    <div className="results-grid">
                                        {SUGGESTED.map(item => (
                                            <div key={item.id} className="result-card">
                                                <div className="result-image-wrapper">
                                                    <div className="result-image bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                                        {item.icon}
                                                    </div>
                                                </div>
                                                <div className="result-info">
                                                    <div className="result-name">{item.name}</div>
                                                    <div className="result-meta">{item.meta}</div>
                                                </div>
                                                <button className="result-action">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        ) : (
                            <div className="animate-slide-up">
                                {results.length > 0 ? (
                                    <div className="results-grid">
                                        {results.map(item => (
                                            <div key={item.id} className={`result-card type-${item.type}`}>
                                                <div className="result-image-wrapper">
                                                    <img src={item.image} alt={item.name} className="result-image" />
                                                </div>
                                                <div className="result-info">
                                                    <div className="result-name">{item.name}</div>
                                                    <div className="result-meta flex items-center gap-2">
                                                        <span className="opacity-60">{renderResultIcon(item.type)}</span>
                                                        {item.meta}
                                                    </div>
                                                </div>
                                                <button className="result-action">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="search-empty">
                                        <div className="empty-icon-wrapper">
                                            <SearchIcon className="w-8 h-8 text-indigo-500" />
                                        </div>
                                        <h3 className="empty-title">No results found for "{searchQuery}"</h3>
                                        <p className="empty-desc">
                                            Please check your spelling or try searching for something else.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <RightSidebar
                currentUser={currentUser}
                suggestions={suggestions}
                onFollow={handleFollow}
            />
        </div>
    );
};

export default Search;
