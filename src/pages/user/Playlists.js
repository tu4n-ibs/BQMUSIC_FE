import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { Plus, Music, MoreVertical, Play, Trash2, Edit2, Search as SearchIcon } from 'lucide-react';
import playlistService from '../../services/playlistService';
import './css/Playlists.css';

const Playlists = () => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });
    const [searchTerm, setSearchTerm] = useState('');

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

    const handleCreatePlaylist = async (e) => {
        e.preventDefault();
        if (!newPlaylist.name.trim()) return;

        try {
            setLoading(true);
            await playlistService.createPlaylist(newPlaylist);
            setNewPlaylist({ name: '', description: '' });
            setShowCreateModal(false);
            fetchPlaylists();
            alert("Playlist created successfully! 🎵");
        } catch (error) {
            console.error("Error creating playlist:", error);
            alert("Failed to create playlist.");
        } finally {
            setLoading(false);
        }
    };

    const filteredPlaylists = playlists.filter(pl =>
        pl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pl.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="playlists-page-container">
            <Sidebar />

            <main className="playlists-main ml-[120px]">
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

                    <div className="playlists-search-bar">
                        <SearchIcon className="w-5 h-5 opacity-40" />
                        <input
                            type="text"
                            placeholder="Search your playlists..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="playlists-grid">
                    {loading && playlists.length === 0 ? (
                        <div className="col-span-full py-20 text-center opacity-50">Loading your music...</div>
                    ) : filteredPlaylists.length > 0 ? (
                        filteredPlaylists.map(playlist => (
                            <div key={playlist.id || playlist.idPlaylist} className="playlist-card group">
                                <div className="playlist-cover relative">
                                    <div className="playlist-cover-placeholder">
                                        <Music className="w-12 h-12 opacity-20" />
                                    </div>
                                    <div className="playlist-overlay opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <button className="play-btn-circle">
                                            <Play className="fill-white w-6 h-6 ml-1" />
                                        </button>
                                    </div>
                                </div>
                                <div className="playlist-info">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg truncate mb-1">{playlist.name}</h3>
                                            <p className="text-xs opacity-50 line-clamp-2 min-h-[32px]">
                                                {playlist.description || "No description provided."}
                                            </p>
                                        </div>
                                        <button className="p-1 hover:bg-white/10 rounded-full transition">
                                            <MoreVertical className="w-4 h-4 opacity-50" />
                                        </button>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-40">
                                        <span>{playlist.songs?.length || 0} SONGS</span>
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
