import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Clock, User, Music, Disc, TrendingUp, ChevronRight } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { usePlayer } from '../../context/PlayerContext';
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

const Search = () => {
    const { playTrack } = usePlayer();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [recentSearches, setRecentSearches] = useState([
        { id: 'r1', name: 'The Weeknd', type: 'history' },
        { id: 'r2', name: 'Taylor Swift', type: 'history' }
    ]);

    // Debounce search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(() => {
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

    const handleResultClick = (item) => {
        if (item.type === 'song') {
            playTrack({
                id: item.id,
                title: item.name,
                artist: item.meta.split('•')[0].trim(),
                avatar: item.image,
                url: "http://localhost:8080/api/v1/stream/demo.mp3" // Placeholder for demo
            });
        }
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
            <Sidebar />

            <main className="search-main ml-[120px]">
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
                                            <div
                                                key={item.id}
                                                className={`result-card type-${item.type} cursor-pointer`}
                                                onClick={() => handleResultClick(item)}
                                            >
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
        </div>
    );
};

export default Search;
