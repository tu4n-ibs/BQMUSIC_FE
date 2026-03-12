import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, Clock, User, Music, Disc, ChevronRight, MoreHorizontal, ListMusic, Loader2 } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import AddToPlaylistModal from '../../components/modals/AddToPlaylistModal';
import postService from '../../services/postService';
import { usePlayer } from '../../context/PlayerContext';
import './css/Search.css';

const Search = () => {
    const { playTrack } = usePlayer();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('songs');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [playlistModal, setPlaylistModal] = useState({
        isOpen: false,
        songId: null,
        songName: ''
    });

    const navigate = useNavigate();

    // Map tab to API type
    const tabToType = {
        all: 'SONG',
        songs: 'SONG',
        users: 'USER',
        albums: 'ALBUM',
        groups: 'GROUP'
    };

    // Debounce search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                const type = tabToType[activeTab] || 'SONG';
                const response = await postService.search(searchQuery, type);

                // Response is Slice<DTO> -> data.data.content or data.content
                const content = response.data?.data?.content || response.data?.content || response.data?.data || [];

                const mapped = content.map(item => {
                    let typeLabel = 'song';
                    let meta = '';
                    let image = item.imageUrl;

                    if (type === 'USER') {
                        typeLabel = 'user';
                        meta = item.email || 'User';
                    } else if (type === 'ALBUM') {
                        typeLabel = 'album';
                        meta = item.description || 'Album';
                    } else if (type === 'GROUP') {
                        typeLabel = 'group';
                        meta = item.description || 'Group';
                    } else {
                        // SONG
                        typeLabel = 'song';
                        meta = item.groupName || 'Track';
                    }

                    // Format image URL
                    if (image && !image.startsWith('http')) {
                        image = `${process.env.REACT_APP_API_BASE_URL}${image}`;
                    } else if (!image) {
                        image = 'https://via.placeholder.com/150?text=' + typeLabel;
                    }

                    return {
                        id: item.id,
                        name: item.name,
                        meta: meta,
                        type: typeLabel,
                        image: image,
                        rawData: item // Keep for playback/navigation
                    };
                });

                setResults(mapped);
            } catch (error) {
                console.error("Search failed:", error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, activeTab]);

    const handleClearSearch = () => {
        setSearchQuery('');
        setResults([]);
    };

    const handleClearHistory = () => {
        setRecentSearches([]);
    };

    const handleResultClick = async (item) => {
        if (item.type === 'song') {
            const mUrl = item.rawData?.musicUrl;
            if (!mUrl) return;
            const musicLink = mUrl.startsWith('http') ? mUrl : `${process.env.REACT_APP_API_BASE_URL}${mUrl}`;

            playTrack({
                id: item.id,
                title: item.name,
                artist: item.meta,
                avatar: item.image,
                url: musicLink
            });
        } else if (item.type === 'user') {
            navigate(`/user/${item.id}`);
        } else if (item.type === 'album') {
            navigate(`/album/${item.id}`);
        } else if (item.type === 'group') {
            navigate(`/groups/${item.id}`);
        }
    };

    const renderResultIcon = (type) => {
        switch (type) {
            case 'user': return <User className="w-4 h-4" />;
            case 'song': return <Music className="w-4 h-4" />;
            case 'album': return <Disc className="w-4 h-4" />;
            case 'group': return <ListMusic className="w-4 h-4" />;
            default: return <ChevronRight className="w-4 h-4" />;
        }
    };

    return (
        <div className="search-container">
            <Sidebar />

            <main className="search-main lg:ml-[240px] md:ml-[80px] ml-0 transition-all duration-300">
                <div className="search-wrapper">
                    <header className="search-header">
                        <h1 className="search-title">Search</h1>
                        <div className="search-bar-container">
                            <SearchIcon className={`search-icon w-5 h-5 ${loading ? 'animate-pulse text-indigo-500' : ''}`} />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search for songs, artists, albums, groups..."
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
                            {['songs', 'albums', 'users', 'groups'].map((tab) => (
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
                            </div>
                        ) : (
                            <div className="animate-slide-up">
                                {loading && results.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
                                        <p className="text-sm font-bold uppercase tracking-widest">Searching the universe...</p>
                                    </div>
                                ) : results.length > 0 ? (
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
                                                <div className="flex items-center gap-2">
                                                    {(item.type === 'song' || item.type === 'album') && (
                                                        <div className="relative">
                                                            <button
                                                                className={`p-2 rounded-full transition-all ${activeMenuId === item.id ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:bg-white/10 hover:text-white'}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveMenuId(activeMenuId === item.id ? null : item.id);
                                                                }}
                                                            >
                                                                <MoreHorizontal className="w-5 h-5" />
                                                            </button>

                                                            {activeMenuId === item.id && (
                                                                <>
                                                                    <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}></div>
                                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 z-[110] animate-in fade-in zoom-in-95 duration-200">
                                                                        <button
                                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-indigo-500/20 transition-all uppercase tracking-wider text-left"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setPlaylistModal({
                                                                                    isOpen: true,
                                                                                    songId: item.id,
                                                                                    songName: item.name
                                                                                });
                                                                                setActiveMenuId(null);
                                                                            }}
                                                                        >
                                                                            <ListMusic className="w-4 h-4" />
                                                                            Add to Playlist
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                    <button className="result-action">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </div>
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

            <AddToPlaylistModal
                isOpen={playlistModal.isOpen}
                onClose={() => setPlaylistModal({ ...playlistModal, isOpen: false })}
                songId={playlistModal.songId}
                songName={playlistModal.songName}
            />
        </div>
    );
};

export default Search;
