import React, { useState, useEffect, useCallback } from 'react';
import {
    TrendingUp, Play, Pause, Heart, MessageCircle, Share2,
    MoreHorizontal, Music, Clock, Headphones, ListMusic,
    ChevronRight, Filter, Disc
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import songService from '../../services/songService';
import genreService from '../../services/genreService';
import likeService from '../../services/likeService';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import AddToPlaylistModal from '../../components/modals/AddToPlaylistModal';
import SharePostModal from '../../components/modals/SharePostModal';
import './css/TopSongs.css';

const TopSongs = () => {
    const [songs, setSongs] = useState([]);
    const [genres, setGenres] = useState([{ id: null, name: 'All Genres' }]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('ALL_TIME');
    const [selectedGenreId, setSelectedGenreId] = useState(null);

    // UI States
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [songToPlaylist, setSongToPlaylist] = useState({ id: null, name: '' });
    const [postToShare, setPostToShare] = useState(null);

    const { playTrack, currentTrack, isPlaying } = usePlayer();
    const { user } = useAuth();

    const fetchGenres = useCallback(async () => {
        try {
            const data = await genreService.getAllGenres();
            const genreList = data?.data || data || [];
            if (Array.isArray(genreList)) {
                setGenres([{ id: null, name: 'All Genres' }, ...genreList]);
            }
        } catch (error) {
            console.error("Failed to fetch genres:", error);
        }
    }, []);

    const fetchTopSongs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await songService.getTopSongs(period, selectedGenreId);
            const data = response.data?.data || response.data || [];

            // Normalize data if necessary
            const normalizedSongs = Array.isArray(data) ? data.map(song => ({
                ...song,
                id: song.idSong || song.id,
                name: song.nameSong || song.name,
                artistName: song.username || song.artist?.name || 'Unknown Artist',
                imageUrlSnippet: song.imageUrlSong || song.imageUrlAlbum || song.imageUrl
            })) : [];

            setSongs(normalizedSongs);
        } catch (error) {
            console.error("Failed to fetch top songs:", error);
            toast.error("Could not load trending charts.");
        } finally {
            setLoading(false);
        }
    }, [period, selectedGenreId]);

    useEffect(() => {
        fetchGenres();
    }, [fetchGenres]);

    useEffect(() => {
        fetchTopSongs();
    }, [fetchTopSongs]);

    const handlePlayTrack = (track) => {
        let musicLink = track.musicUrl || track.musicLink;
        if (!musicLink) return;

        musicLink = musicLink.startsWith('http') ? musicLink : `http://localhost:8080${musicLink}`;

        playTrack({
            id: track.id,
            title: track.name,
            artist: track.artistName,
            avatar: track.imageUrlSnippet ? (track.imageUrlSnippet.startsWith('http') ? track.imageUrlSnippet : `http://localhost:8080${track.imageUrlSnippet}`) : null,
            url: musicLink
        });

        // Record play if not already the current track or if playing again
        if (currentTrack?.id !== track.id) {
            songService.recordPlay(track.id).catch(console.error);
        }
    };

    const handleToggleLike = async (e, trackId) => {
        e.stopPropagation();
        try {
            const res = await likeService.toggleLike(trackId);
            const isLiked = res.data?.liked !== undefined ? res.data?.liked : res.data?.isLiked;

            setSongs(prev => prev.map(s =>
                s.id === trackId ? { ...s, isLiked: (isLiked !== undefined ? isLiked : !s.isLiked) } : s
            ));
        } catch (error) {
            console.error("Like failed:", error);
        }
    };

    const handleOpenPlaylist = (e, track) => {
        e.stopPropagation();
        setSongToPlaylist({ id: track.id, name: track.name });
        setIsPlaylistModalOpen(true);
    };

    const handleOpenShare = (e, track) => {
        e.stopPropagation();
        // Construct a post-like object for share modal
        setPostToShare({
            id: track.id,
            idPost: track.id,
            idSong: track.id,
            nameSong: track.name,
            username: track.artistName,
            imageUrlSong: track.imageUrlSnippet,
            content: `Check out this trending song: ${track.name}`
        });
        setIsShareModalOpen(true);
    };

    const periods = [
        { id: 'ALL_TIME', label: 'All Time' },
        { id: 'DAY_30', label: 'Last 30 Days' },
        { id: 'WEEK_7', label: 'This Week' }
    ];

    return (
        <div className="top-songs-container">
            <Sidebar />

            <main className="top-songs-main">
                <div className="top-songs-wrapper">
                    <header className="top-songs-header">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/30">
                                <TrendingUp className="w-8 h-8 text-white" />
                            </div>
                            <span className="text-indigo-400 font-bold uppercase tracking-widest text-sm">Official Charts</span>
                        </div>
                        <h1 className="top-songs-title">Trending Now</h1>
                        <p className="top-songs-subtitle">
                            The most played tracks on BQMusic, updated in real-time. Discover what the world is listening to.
                        </p>
                    </header>

                    <div className="top-songs-controls">
                        <div className="flex flex-wrap items-center justify-between gap-6">
                            <div className="period-tabs">
                                {periods.map(p => (
                                    <button
                                        key={p.id}
                                        className={`period-tab ${period === p.id ? 'active' : ''}`}
                                        onClick={() => setPeriod(p.id)}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="genre-filter">
                            {genres.map(genre => (
                                <button
                                    key={genre.id || 'all'}
                                    className={`genre-tag ${selectedGenreId === genre.id ? 'active' : ''}`}
                                    onClick={() => setSelectedGenreId(genre.id)}
                                >
                                    {genre.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="songs-list">
                        {songs.length > 0 ? (
                            songs.map((song, index) => (
                                <div
                                    key={song.id}
                                    className={`song-item ${currentTrack?.id === song.id ? 'active' : ''}`}
                                    onClick={() => handlePlayTrack(song)}
                                >
                                    <div className="song-rank">
                                        {(index + 1).toString().padStart(2, '0')}
                                    </div>

                                    <div className="song-image-wrapper">
                                        <img
                                            src={song.imageUrlSnippet ? (song.imageUrlSnippet.startsWith('http') ? song.imageUrlSnippet : `http://localhost:8080${song.imageUrlSnippet}`) : DEFAULT_COVER_URL}
                                            alt={song.name}
                                            className="song-image"
                                            onError={(e) => e.target.src = DEFAULT_COVER_URL}
                                        />
                                        <div className="song-play-overlay">
                                            {currentTrack?.id === song.id && isPlaying ? (
                                                <Pause className="w-6 h-6 fill-white text-white" />
                                            ) : (
                                                <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="song-info">
                                        <div className="song-name">{song.name}</div>
                                        <div className="song-artist">{song.artistName}</div>
                                    </div>

                                    <div className="song-stats">
                                        <div className="stat-item">
                                            <Headphones className="w-4 h-4 text-indigo-400/60" />
                                            <span>{(song.playCount || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="stat-item">
                                            <Heart className="w-4 h-4 text-rose-400/60" />
                                            <span>{(song.likeCount || 0).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="song-actions">
                                        <button
                                            className={`action-btn like ${song.isLiked ? 'active' : ''}`}
                                            onClick={(e) => handleToggleLike(e, song.id)}
                                        >
                                            <Heart className={`w-5 h-5 ${song.isLiked ? 'fill-current' : ''}`} />
                                        </button>
                                        <button
                                            className="action-btn"
                                            onClick={(e) => handleOpenPlaylist(e, song)}
                                        >
                                            <ListMusic className="w-5 h-5" />
                                        </button>
                                        <button
                                            className="action-btn"
                                            onClick={(e) => handleOpenShare(e, song)}
                                        >
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <ChevronRight className="w-5 h-5 ml-4 text-slate-700 opacity-0 group-hover:opacity-100" />
                                </div>
                            ))
                        ) : loading ? (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                                <p className="font-medium">Scaling the charts...</p>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 rounded-3xl border-2 border-dashed border-white/5">
                                <Disc className="w-16 h-16 mb-4 opacity-10" />
                                <p className="text-xl font-bold text-slate-400">No tracks found</p>
                                <p className="text-sm">Try changing filters or periods.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            <AddToPlaylistModal
                isOpen={isPlaylistModalOpen}
                onClose={() => setIsPlaylistModalOpen(false)}
                songId={songToPlaylist.id}
                songName={songToPlaylist.name}
            />

            <SharePostModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                post={postToShare}
                onShareSuccess={() => toast.success("Shared trending song!")}
            />
        </div>
    );
};

// Constant for fallback cover
const DEFAULT_COVER_URL = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop";

export default TopSongs;
