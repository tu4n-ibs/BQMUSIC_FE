import React, { useState, useEffect, useCallback } from 'react';
import {
    TrendingUp, Play, Pause, Heart,
    Headphones,
    ChevronRight, Disc
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import PageLoader from '../../components/common/PageLoader';
import songService from '../../services/songService';
import genreService from '../../services/genreService';
import { usePlayer } from '../../context/PlayerContext';
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
    const [songToPlaylist] = useState({ id: null, name: '' });
    const [postToShare] = useState(null);

    const { playTrack, currentTrack, isPlaying } = usePlayer();

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
            // Handle ApiResponse -> Slice -> content
            const rawData = response.data?.data;
            const songList = rawData?.content || (Array.isArray(rawData) ? rawData : []);

            // Normalize data if necessary
            const normalizedSongs = songList.map(song => ({
                ...song,
                id: song.songId,
                name: song.songName,
                artistName: song.artistName,
                imageUrlSnippet: song.imageUrl
            }));

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

    const handlePlayTrack = async (track, index) => {
        try {
            const toastId = toast.loading("Loading stream...");
            const response = await songService.getSongById(track.id);
            const songData = response.data?.data || response.data;
            let musicLink = songData?.musicUrl || songData?.musicLink;
            toast.dismiss(toastId);

            if (!musicLink) {
                toast.error("Music source not available");
                return;
            }

            musicLink = musicLink.startsWith('http') ? musicLink : `${process.env.REACT_APP_API_BASE_URL}${musicLink}`;

            // Prepare the queue from current songs list
            const queue = (songs || []).map(s => {
                const sUrl = s.musicUrl || s.musicLink || s.url;
                const sImage = s.imageUrlSnippet || s.imageUrl || s.songImage || s.image;
                return {
                    id: s.id || s.songId,
                    title: s.name || s.songName || s.title,
                    artist: s.artistName || s.artist?.name || 'Unknown Artist',
                    avatar: sImage ? (sImage.startsWith('http') ? sImage : `${process.env.REACT_APP_API_BASE_URL}${sImage}`) : null,
                    url: sUrl ? (sUrl.startsWith('http') ? sUrl : `${process.env.REACT_APP_API_BASE_URL}${sUrl}`) : null
                };
            }).filter(s => s.url);

            playTrack({
                id: songData.id || track.id,
                title: songData.name || track.name,
                artist: songData.artistName || track.artistName,
                avatar: songData.imageUrl ? (songData.imageUrl.startsWith('http') ? songData.imageUrl : `${process.env.REACT_APP_API_BASE_URL}${songData.imageUrl}`) : (track.imageUrlSnippet?.startsWith('http') ? track.imageUrlSnippet : track.imageUrlSnippet ? `${process.env.REACT_APP_API_BASE_URL}${track.imageUrlSnippet}` : null),
                url: musicLink
            }, queue, index);
        } catch (error) {
            console.error("Failed to play track:", error);
            toast.error("Could not load music stream");
        }
    };

    const periods = [
        { id: 'ALL_TIME', label: 'All Time' },
        { id: 'DAY_30', label: 'Last 30 Days' },
        { id: 'WEEK_7', label: 'This Week' }
    ];

    if (loading) return <PageLoader message="Loading chart..." />;

    return (
        <div className="top-songs-container bg-slate-950 min-h-screen">
            <Sidebar />

            <main className="top-songs-main lg:ml-[240px] md:ml-[80px] ml-0 transition-all duration-300">
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
                                    style={{ "--i": index }}
                                    onClick={() => handlePlayTrack(song, index)}
                                >
                                    <div className="song-rank">
                                        {(index + 1).toString().padStart(2, '0')}
                                    </div>

                                    <div className="song-image-wrapper">
                                        <img
                                            src={song.imageUrlSnippet ? (song.imageUrlSnippet.startsWith('http') ? song.imageUrlSnippet : `${process.env.REACT_APP_API_BASE_URL}${song.imageUrlSnippet}`) : DEFAULT_COVER_URL}
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
                                    <ChevronRight className="w-5 h-5 ml-4 text-slate-700 opacity-0 group-hover:opacity-100" />
                                </div>
                            ))
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
