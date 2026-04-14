import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { Plus, Music, MoreVertical, Play, X } from 'lucide-react';
import playlistService from '../../services/playlistService';
import songService from '../../services/songService';
import { toast } from 'react-hot-toast';
import { usePlayer } from '../../context/PlayerContext';
import PageLoader from '../../components/common/PageLoader';
import SectionLoader from '../../components/common/SectionLoader';
import './css/Playlists.css';

const Playlists = () => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });
    const [searchTerm] = useState('');
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [songs, setSongs] = useState([]);
    const [songsLoading, setSongsLoading] = useState(false);

    const { playTrack } = usePlayer();

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const fetchPlaylists = async () => {
        try {
            setLoading(true);
            const response = await playlistService.getPlaylists();
            const data = response.data?.data || response.data || [];
            setPlaylists(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching playlists:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlaylistSongs = async (playlistId) => {
        try {
            setSongsLoading(true);
            const response = await playlistService.getPlaylistSongs(playlistId);
            const data = response.data?.data || response.data || [];
            setSongs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching playlist songs:", error);
            setSongs([]);
        } finally {
            setSongsLoading(false);
        }
    };

    const handleViewPlaylist = (playlist) => {
        setSelectedPlaylist(playlist);
        fetchPlaylistSongs(playlist.playlistId);
    };

    const handleCreatePlaylist = async (e) => {
        e.preventDefault();
        if (!newPlaylist.name.trim()) return;

        try {
            setLoading(true);
            await playlistService.createPlaylist(newPlaylist);
            setNewPlaylist({ name: '', description: '' });
            setShowCreateModal(false);
            fetchPlaylists();
            toast.success("Playlist created successfully! 🎵");
        } catch (error) {
            console.error("Error creating playlist:", error);
            toast.error("Failed to create playlist.");
        } finally {
            setLoading(false);
        }
    };



    const handlePlaySong = async (song, index) => {
        try {
            // Fetch the latest song details to get the music URL on-demand
            const response = await songService.getSongById(song.songId);
            const songData = response.data?.data || response.data;

            if (!songData || !songData.musicUrl) {
                toast.error("No audio file found for this song.");
                return;
            }

            const musicLink = songData.musicUrl.startsWith('http')
                ? songData.musicUrl
                : `${process.env.REACT_APP_API_BASE_URL}${songData.musicUrl}`;

            // Prepare the queue from current songs list
            const queue = (songs || []).map(s => {
                const sUrl = s.musicUrl || s.musicLink;
                const sImage = s.imageUrl || s.songImage || s.image;
                return {
                    id: s.songId || s.id || s.idSong,
                    title: s.songName || s.name || s.title,
                    artist: s.songArtistName || s.artistName || s.artist || "Unknown Artist",
                    avatar: sImage ? (sImage.startsWith('http') ? sImage : `${process.env.REACT_APP_API_BASE_URL}${sImage}`) : "",
                    url: sUrl ? (sUrl.startsWith('http') ? sUrl : `${process.env.REACT_APP_API_BASE_URL}${sUrl}`) : null
                };
            }).filter(s => s.url); // Only include songs with a URL

            playTrack({
                id: songData.id || song.songId,
                title: songData.name || song.songName,
                artist: songData.artistName || song.songArtistName || "Unknown Artist",
                avatar: songData.imageUrl || song.songImage || "",
                url: musicLink
            }, queue, index);
        } catch (error) {
            console.error("Error playing song:", error);
            toast.error("Failed to load song audio.");
        }
    };

    const filteredPlaylists = playlists.filter(pl =>
        pl.playlistName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pl.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="playlists-page-container">
            <Sidebar />

            <main className="playlists-main lg:ml-[240px] md:ml-[80px] ml-0 transition-all duration-300">
                <div className="playlists-header-section">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Your Playlists</h1>
                            <p className="opacity-60 text-sm">Curate your perfect music collection</p>
                        </div>
                        <button
                            className="create-playlist-btn flex items-center gap-2"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <Plus className="w-5 h-5" />
                            Create New Playlist
                        </button>
                    </div>
                </div>

                <div className="playlists-grid">
                    {loading && playlists.length === 0 ? (
                        <div className="col-span-full py-10">
                            <SectionLoader message="Loading your music..." />
                        </div>
                    ) : filteredPlaylists.length > 0 ? (
                        filteredPlaylists.map(playlist => (
                            <div
                                key={playlist.playlistId}
                                className="playlist-card group cursor-pointer"
                                onClick={() => handleViewPlaylist(playlist)}
                            >
                                <div className="playlist-cover relative">
                                    <div className="playlist-cover-placeholder">
                                        <Music className="w-12 h-12 opacity-20" />
                                    </div>
                                    <div className="playlist-overlay opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <button className="play-btn-circle" onClick={(e) => e.stopPropagation()}>
                                            <Play className="fill-white w-6 h-6 ml-1" />
                                        </button>
                                    </div>
                                </div>
                                <div className="playlist-info">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h3 className="font-bold text-lg truncate mb-1">{playlist.playlistName}</h3>
                                            <p className="text-xs opacity-50 line-clamp-2 min-h-[32px]">
                                                {playlist.description || "No description provided."}
                                            </p>
                                        </div>
                                        <button className="p-1 hover:bg-white/10 rounded-full transition" onClick={(e) => e.stopPropagation()}>
                                            <MoreVertical className="w-4 h-4 opacity-50" />
                                        </button>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-40">
                                        <span>{playlist.songCount || 0} SONGS</span>
                                        <span>CURATED BY YOU</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 text-center">
                            <Music className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <h3 className="text-xl font-bold mb-2">No Playlists Found</h3>
                            <p className="opacity-50 text-sm max-w-xs mx-auto mb-8">
                                {searchTerm ? `We couldn't find any playlists matching "${searchTerm}"` : "Start your musical journey by creating your first playlist!"}
                            </p>
                            {!searchTerm && (
                                <button
                                    className="btn-primary px-8 py-3 rounded-2xl font-bold"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    Create Playlist
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Playlist Detail Modal */}
            {selectedPlaylist && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay" onClick={() => setSelectedPlaylist(null)}>
                    <div className="playlist-detail-modal animate-in fade-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex gap-6 items-center">
                                <div className="detail-cover-placeholder">
                                    <Music className="w-10 h-10 opacity-30" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold mb-2">{selectedPlaylist.playlistName}</h2>
                                    <p className="text-sm opacity-60 max-w-md">{selectedPlaylist.description || "No description provided."}</p>
                                    <div className="flex gap-4 mt-4 text-xs font-bold uppercase tracking-widest opacity-40">
                                        <span>{songs.length} Tracks</span>
                                        <span>•</span>
                                        <span>Curated by you</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPlaylist(null)} className="p-2 hover:bg-white/10 rounded-full transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="songs-list-container custom-scrollbar">
                            {songsLoading ? (
                                <div className="text-center py-20 opacity-40">Fetching songs...</div>
                            ) : songs.length > 0 ? (
                                <div className="songs-table">
                                    <div className="songs-body py-2">
                                        {songs.map((song, index) => (
                                            <div key={song.id || index} className="playlist-song-row px-4 py-3 hover:bg-white/5 rounded-xl transition group">
                                                <div className="flex items-center justify-center text-sm opacity-40">
                                                    <span className="group-hover:hidden">{index + 1}</span>
                                                    <Play
                                                        className="w-3 h-3 fill-indigo-500 text-indigo-500 cursor-pointer hidden group-hover:block"
                                                        onClick={(e) => { e.stopPropagation(); handlePlaySong(song, index); }}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                                                        {(song.imageUrl || song.songImage) ? (
                                                            <img 
                                                                src={(song.imageUrl || song.songImage).startsWith('http') ? (song.imageUrl || song.songImage) : `${process.env.REACT_APP_API_BASE_URL}${song.imageUrl || song.songImage}`} 
                                                                alt="" 
                                                                className="w-full h-full object-cover rounded-lg" 
                                                            />
                                                        ) : (
                                                            <Music className="w-4 h-4 opacity-20" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold truncate text-sm">{song.name || song.songName}</span>
                                                        <span className="text-[10px] opacity-40 md:hidden truncate">{song.artistName || song.songArtistName || "Unknown Artist"}</span>
                                                    </div>
                                                </div>
                                                <div className="hidden md:flex items-center text-sm opacity-60 truncate pr-2">
                                                    {song.artistName || song.songArtistName || "Unknown Artist"}
                                                </div>
                                                <div className="hidden md:flex items-center text-sm opacity-40 truncate pr-2 italic">
                                                    {song.group?.name || song.albumName || "Singles"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                    <Music className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                    <h3 className="text-lg font-bold opacity-40">This playlist is empty</h3>
                                    <p className="text-sm opacity-30 mt-1">Start adding songs from the home feed or search!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Playlist Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay">
                    <div className="create-playlist-modal animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">New Playlist</h2>
                            <button onClick={() => setShowCreateModal(false)} className="opacity-50 hover:opacity-100">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePlaylist} className="flex flex-col gap-6">
                            <div className="form-group">
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block">Name</label>
                                <input
                                    type="text"
                                    className="playlist-input"
                                    placeholder="Give your playlist a title..."
                                    value={newPlaylist.name}
                                    onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block">Description (Optional)</label>
                                <textarea
                                    className="playlist-textarea"
                                    placeholder="What's the vibe of this collection?"
                                    value={newPlaylist.description}
                                    onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 mt-2">
                                <button
                                    type="button"
                                    className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 font-bold transition shadow-lg shadow-indigo-500/20"
                                    disabled={loading}
                                >
                                    {loading ? "Creating..." : "Create Playlist"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Playlists;
