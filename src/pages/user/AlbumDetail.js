import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Play, Pause, Music, Clock,
    Share2,
    Disc, Loader2, Calendar, User,
    Plus, Camera
} from 'lucide-react';
import albumService from '../../services/albumService';
import songService from '../../services/songService';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';
import Sidebar from '../../components/layout/Sidebar';
import { toast } from 'react-hot-toast';
import CreatePostModal from '../../components/modals/CreatePostModal';
import { getUserAvatar } from '../../utils/userUtils';
import { formatDate } from '../../utils/dateUtils';
import './css/AlbumDetail.css';

const AlbumDetail = () => {
    const { albumId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { playTrack, currentTrack, isPlaying } = usePlayer();

    const [album, setAlbum] = useState(null);
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modals state
    const [createPostModal, setCreatePostModal] = useState({
        isOpen: false,
        targetType: 'SONG',
        targetId: null,
        startStep: 1,
        onlyUpload: false
    });

    const [isUpdatingImage, setIsUpdatingImage] = useState(false);

    // Refs
    const albumImageInputRef = React.useRef(null);

    useEffect(() => {
        if (albumId) {
            fetchAlbumData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [albumId]);

    const fetchAlbumData = async () => {
        try {
            setLoading(true);
            const response = await albumService.getSongsByAlbumId(albumId);
            // The response from albumService.getSongsByAlbumId is the ApiResponse object
            // ApiResponse.data is the AlbumResponseDetail
            const payload = response.data?.data || response.data || response;

            setAlbum({
                name: payload.name,
                description: payload.description,
                imageUrl: payload.albumImageUrl || payload.imageUrl,
                username: payload.username || payload.nameUser,
                nameUser: payload.nameUser || payload.username,
                userId: payload.userId || payload.userIdUser, // handle potential variations
                createdAt: payload.createdAt
            });

            const songsList = payload.songs || [];
            setSongs(Array.isArray(songsList) ? songsList : []);
        } catch (err) {
            console.error("Error fetching album details:", err);
            setError("Failed to load album details.");
            toast.error("Error loading album data.");
        } finally {
            setLoading(false);
        }
    };

    const handlePlaySong = async (song, index) => {
        let musicUrl = song.musicUrl;

        // If musicUrl is not provided (on-demand fetching)
        if (!musicUrl) {
            try {
                const toastId = toast.loading("Loading stream...");
                const response = await songService.getSongById(song.songId || song.id);
                const songData = response.data?.data || response.data;
                musicUrl = songData?.musicUrl;
                toast.dismiss(toastId);
            } catch (error) {
                console.error("Failed to fetch song URL:", error);
                toast.error("Could not load music stream");
                return;
            }
        }

        if (!musicUrl) {
            toast.error("Music source not available");
            return;
        }

        // Construct normalized queue for the player
        const queue = songs.map(s => ({
            id: s.songId || s.id || s.idSong,
            title: s.songName || s.name,
            artist: album.nameUser || album.username || "Artist",
            avatar: s.songImageUrl || s.imageUrl || album.imageUrl || getUserAvatar(null),
            url: s.musicUrl ? (s.musicUrl.startsWith('http') ? s.musicUrl : `${process.env.REACT_APP_API_BASE_URL}${s.musicUrl}`) : null
        }));

        playTrack({
            id: song.songId || song.id || song.idSong,
            title: song.songName || song.name,
            artist: album.nameUser || album.username || "Artist",
            avatar: song.songImageUrl || song.imageUrl || album.imageUrl || getUserAvatar(null),
            url: musicUrl.startsWith('http') ? musicUrl : `${process.env.REACT_APP_API_BASE_URL}${musicUrl}`
        }, queue, index);
    };

    const handlePostAlbum = () => {
        setCreatePostModal({
            isOpen: true,
            targetType: 'ALBUM',
            targetId: albumId,
            startStep: 2, // We'll add this prop to CreatePostModal to override logic if needed
            onlyUpload: false
        });
    };

    const handleOpenAddSong = () => {
        setCreatePostModal({
            isOpen: true,
            targetType: 'SONG',
            targetId: albumId,
            startStep: 1,
            onlyUpload: true
        });
    };

    const handleImageClick = () => {
        if (isOwner && albumImageInputRef.current) {
            albumImageInputRef.current.click();
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsUpdatingImage(true);
            await albumService.uploadAlbumImage(albumId, file);
            toast.success("Album cover updated! 🎨");

            // Re-fetch to get the new URL
            fetchAlbumData();
        } catch (err) {
            console.error("Error updating album image:", err);
            toast.error("Failed to update album cover.");
        } finally {
            setIsUpdatingImage(false);
        }
    };

    const isOwner = user?.idUser === album?.userId;

    if (loading) {
        return (
            <div className="flex min-h-screen bg-slate-950 text-white">
                <Sidebar />
                <div className="flex-1 lg:ml-[240px] md:ml-[80px] ml-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Opening the vault...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !album) {
        return (
            <div className="flex min-h-screen bg-slate-950 text-white">
                <Sidebar />
                <div className="flex-1 lg:ml-[240px] md:ml-[80px] ml-0 flex flex-col items-center justify-center p-8 text-center">
                    <Disc className="w-20 h-20 text-slate-800 mb-6" />
                    <h2 className="text-2xl font-bold mb-2">Album not found</h2>
                    <p className="text-slate-500 mb-8 max-w-md">The record you're looking for might have been moved or removed from our collection.</p>
                    <button onClick={() => navigate('/my-albums')} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold transition-all">
                        <ChevronLeft className="w-5 h-5" /> Back to Library
                    </button>
                </div>
            </div>
        );
    }

    const albumRawImage = album.albumImageUrl || album.imageUrl;
    const albumCover = albumRawImage
        ? (albumRawImage.startsWith('http') ? albumRawImage : `${process.env.REACT_APP_API_BASE_URL}${albumRawImage.startsWith('/') ? '' : '/'}${albumRawImage}`)
        : null;

    return (
        <div className="album-detail-container flex min-h-screen bg-slate-950 text-white">
            <Sidebar />

            <main className="flex-1 lg:ml-[240px] md:ml-[80px] ml-0 transition-all duration-300 relative overflow-hidden">
                {/* Dynamic Background Blur */}
                <div
                    className="album-detail-bg-blur"
                    style={{ backgroundImage: `url(${albumCover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop'})` }}
                ></div>

                <div className="relative z-10">
                    {/* Header Navigation */}
                    <div className="flex items-center justify-between p-8">
                        <button
                            onClick={() => navigate('/my-albums')}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group"
                        >
                            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="flex gap-4">
                            {isOwner && (
                                <>
                                    <button
                                        onClick={handlePostAlbum}
                                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Share Album
                                    </button>
                                    <button
                                        onClick={handleOpenAddSong}
                                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all border border-white/5"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Upload Songs
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Album Info Section */}
                    <div className="flex flex-col md:flex-row items-end gap-8 px-8 pb-12">
                        <div
                            className={`album-detail-cover-wrapper shadow-2xl shadow-black/50 relative group ${isOwner ? 'cursor-pointer' : ''}`}
                            onClick={handleImageClick}
                        >
                            {albumCover ? (
                                <img
                                    src={albumCover}
                                    alt={album.name}
                                    className={`album-detail-cover shadow-2xl transition-all duration-500 ${isUpdatingImage ? 'opacity-40 blur-sm' : 'group-hover:scale-105'}`}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop';
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                    <Disc className="w-32 h-32 text-indigo-500/20" />
                                </div>
                            )}

                            {isOwner && (
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-[32px]">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-2 border border-white/30">
                                        {isUpdatingImage ? (
                                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                                        ) : (
                                            <Camera className="w-6 h-6 text-white" />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{isUpdatingImage ? 'Updating...' : 'Change Cover'}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-2 block">Collection</span>
                            <h1 className="album-detail-title text-5xl md:text-7xl font-black mb-4 tracking-tight">{album.name}</h1>

                            <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-white/60">
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                    <User className="w-4 h-4 text-indigo-400" />
                                    <span>{album.nameUser || album.username || "Unknown Artist"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Music className="w-4 h-4" />
                                    <span>{songs.length} songs</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>Created on {formatDate(album.createdAt)}</span>
                                </div>
                            </div>

                            {album.description && (
                                <p className="mt-6 text-white/40 max-w-2xl leading-relaxed text-sm italic">
                                    "{album.description}"
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-6 px-8 py-8 border-t border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-20">
                        <button
                            className="w-16 h-16 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/20 group"
                            onClick={() => songs.length > 0 && handlePlaySong(songs[0], 0)}
                        >
                            <Play className="w-8 h-8 fill-white ml-1 group-hover:scale-110 transition-transform" />
                        </button>
                        <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
                    </div>

                    {/* Song List Section */}
                    <div className="px-8 py-4 pb-32">
                        <div className="songs-list-grid text-[11px] font-black uppercase tracking-widest text-white/20 px-6 py-4 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <span className="w-8">#</span>
                                <span>Title</span>
                            </div>
                            <div className="hidden md:block">Duration</div>
                        </div>

                        <div className="flex flex-col mt-2">
                            {songs.length > 0 ? songs.map((song, index) => {
                                const isCurrent = currentTrack?.id === (song.songId || song.id || song.idSong);
                                const isCurrentlyPlaying = isCurrent && isPlaying;

                                return (
                                    <div
                                        key={song.songId || song.id || song.idSong}
                                        className={`song-row group cursor-pointer ${isCurrent ? 'bg-indigo-500/10' : ''}`}
                                        onClick={() => handlePlaySong(song, index)}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-8 flex items-center justify-center relative">
                                                {isCurrent ? (
                                                    <div className="music-bars group-hover:opacity-0 transition-opacity">
                                                        <span className={isPlaying ? 'playing' : ''}></span>
                                                        <span className={isPlaying ? 'playing' : ''}></span>
                                                        <span className={isPlaying ? 'playing' : ''}></span>
                                                    </div>
                                                ) : (
                                                    <span className="text-white/20 font-black group-hover:opacity-0 transition-opacity">{index + 1}</span>
                                                )}
                                                <button
                                                    onClick={() => handlePlaySong(song, index)}
                                                    className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isCurrent ? 'text-indigo-400' : 'text-white'}`}
                                                >
                                                    {isCurrentlyPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden shrink-0">
                                                    <img
                                                        src={song.songImageUrl ? (song.songImageUrl.startsWith('http') ? song.songImageUrl : `${process.env.REACT_APP_API_BASE_URL}${song.songImageUrl}`) : (albumCover || getUserAvatar(null))}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className={`text-sm font-bold truncate ${isCurrent ? 'text-indigo-400' : 'text-white'}`}>
                                                        {song.songName || song.name}
                                                    </span>
                                                    <span className="text-[11px] text-white/30 truncate">
                                                        {album.nameUser || album.username || "Unknown"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="hidden md:flex items-center text-xs text-white/30 font-bold">
                                            <Clock className="w-3 h-3 mr-2" />
                                            {song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                                        </div>

                                    </div>
                                );
                            }) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 mt-8">
                                    <Disc className="w-12 h-12 text-white/10 mb-4 animate-pulse" />
                                    <p className="text-white/50 font-bold text-lg">This album is currently empty</p>
                                    <p className="text-white/20 text-sm mt-1">Add some tracks to start your collection.</p>
                                    {isOwner && (
                                        <button
                                            onClick={handleOpenAddSong}
                                            className="mt-6 flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold transition-all"
                                        >
                                            <Plus className="w-4 h-4" /> Add Songs Now
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hidden Inputs */}
                <input
                    type="file"
                    ref={albumImageInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                />

                <CreatePostModal
                    isOpen={createPostModal.isOpen}
                    onClose={() => setCreatePostModal({ ...createPostModal, isOpen: false })}
                    initialTargetType={createPostModal.targetType}
                    initialTargetId={createPostModal.targetId}
                    startStep={createPostModal.startStep}
                    onlyUpload={createPostModal.onlyUpload}
                    onPostCreated={() => fetchAlbumData()}
                />

            </main>
        </div>
    );
};

export default AlbumDetail;
