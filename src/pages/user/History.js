import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Play, Pause, Music } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import playHistoryService from '../../services/playHistoryService';
import songService from '../../services/songService';
import { usePlayer } from '../../context/PlayerContext';
import { formatDate } from '../../utils/dateUtils';
import { toast } from 'react-hot-toast';
import PageLoader from '../../components/common/PageLoader';
import SectionLoader from '../../components/common/SectionLoader';
import './css/History.css';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const { playTrack, currentTrack, isPlaying } = usePlayer();

    const fetchHistory = useCallback(async (pageNum) => {
        try {
            setLoading(true);
            const response = await playHistoryService.getHistory(pageNum, 20);
            const data = response.data;
            const content = data.data?.content || data.content || [];

            if (content.length === 0) {
                setHasMore(false);
            } else {
                setHistory(prev => pageNum === 0 ? content : [...prev, ...content]);
                setHasMore(!data.data?.last && !data.last);
            }
        } catch (error) {
            console.error("Failed to fetch play history:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory(0);
    }, [fetchHistory]);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchHistory(nextPage);
        }
    };

    const handlePlayTrack = async (track, index) => {
        try {
            const response = await songService.getSongById(track.id);
            const songData = response.data?.data || response.data;
            const musicLink = songData?.musicUrl ? (songData.musicUrl.startsWith('http') ? songData.musicUrl : `${process.env.REACT_APP_API_BASE_URL}${songData.musicUrl}`) : null;

            if (!musicLink) {
                toast.error("Music source not available");
                return;
            }

            // Prepare the queue from current history list
            const queue = (history || []).map(h => {
                const hUrl = h.musicUrl || h.musicLink || h.url;
                const hImage = h.imageUrl || h.songImage || h.image;
                return {
                    id: h.id || h.songId,
                    title: h.name || h.title,
                    artist: h.artist?.name || h.artistName || 'Unknown Artist',
                    avatar: hImage ? (hImage.startsWith('http') ? hImage : `${process.env.REACT_APP_API_BASE_URL}${hImage}`) : null,
                    url: hUrl ? (hUrl.startsWith('http') ? hUrl : `${process.env.REACT_APP_API_BASE_URL}${hUrl}`) : null
                };
            }).filter(h => h.url); // Only include items with valid URL if possible (fallback to null if needed)

            playTrack({
                id: songData.id || track.id,
                title: songData.name || track.name,
                artist: songData.artistName || track.artist?.name || 'Unknown Artist',
                avatar: songData.imageUrl ? (songData.imageUrl.startsWith('http') ? songData.imageUrl : `${process.env.REACT_APP_API_BASE_URL}${songData.imageUrl}`) : (track.imageUrl?.startsWith('http') ? track.imageUrl : track.imageUrl ? `${process.env.REACT_APP_API_BASE_URL}${track.imageUrl}` : null),
                url: musicLink
            }, queue, index);
        } catch (error) {
            console.error("Failed to play track from history:", error);
            toast.error("Could not load music stream");
        }
    };

    const formatDatePlayed = (dateString) => {
        return formatDate(dateString, true);
    };

    return (
        <div className="history-container bg-slate-950 min-h-screen">
            <Sidebar />

            <main className="history-main lg:ml-[240px] md:ml-[80px] ml-0 transition-all duration-300">
                <div className="history-wrapper">
                    <header className="history-header">
                        <h1 className="history-title">Listening History</h1>
                        {loading && history.length === 0 ? <PageLoader message="Loading history..." /> : <p className="history-subtitle">Keep track of everything you've listened to.</p>}
                    </header>

                    <div className="history-content">
                        {history.length > 0 ? (
                            <div className="history-list">
                                {history.map((item, index) => (
                                    <div
                                        key={`${item.id}-${index}`}
                                        className={`history-item ${currentTrack?.id === item.id ? 'active' : ''}`}
                                        onClick={() => handlePlayTrack(item, index)}
                                    >
                                        <div className="history-index">{(index + 1).toString().padStart(2, '0')}</div>
                                        <div className="history-image-wrapper">
                                            <img
                                                src={item.imageUrl ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${process.env.REACT_APP_API_BASE_URL}${item.imageUrl}`) : 'https://via.placeholder.com/150'}
                                                alt={item.name}
                                                className="history-image"
                                                onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                                            />
                                            <div className="history-play-overlay">
                                                {currentTrack?.id === item.id && isPlaying ? (
                                                    <Pause className="w-5 h-5 fill-white text-white" />
                                                ) : (
                                                    <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="history-track-info">
                                            <div className="history-track-name">{item.name}</div>
                                            <div className="history-track-artist">
                                                <span>{item.artist?.name || 'Unknown Artist'}</span>
                                                {item.genre && <span className="history-genre-badge">{item.genre.name}</span>}
                                            </div>
                                        </div>
                                        <div className="history-time">
                                            {formatDatePlayed(item.lastPlayedAt)}
                                        </div>
                                    </div>
                                ))}

                                {hasMore && (
                                    <button
                                        className="load-more-btn"
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                    >
                                        {loading ? 'Loading...' : 'Load More History'}
                                    </button>
                                )}
                            </div>
                        ) : loading ? (
                            <div className="history-loading">
                                <SectionLoader message="Loading your history..." />
                            </div>
                        ) : (
                            <div className="history-empty">
                                <Music className="empty-icon" />
                                <h3>No history yet</h3>
                                <p>Songs you listen to will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default History;
