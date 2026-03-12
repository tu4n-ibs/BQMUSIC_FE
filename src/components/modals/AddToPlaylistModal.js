import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Loader2, ListMusic, Search } from 'lucide-react';
import playlistService from '../../services/playlistService';
import { toast } from 'react-hot-toast';
import './css/AddToPlaylistModal.css';

const AddToPlaylistModal = ({ isOpen, onClose, songId, songName }) => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPlaylists();
        }
    }, [isOpen]);

    const fetchPlaylists = async () => {
        try {
            setLoading(true);
            const response = await playlistService.getPlaylists();
            const data = response.data?.data || response.data || [];
            setPlaylists(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching playlists:", error);
            toast.error("Failed to load your playlists.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddToPlaylist = async (playlistId) => {
        try {
            setProcessingId(playlistId);
            await playlistService.addSongToPlaylist(songId, playlistId);
            toast.success(`Added "${songName}" to playlist! 🎵`);
            onClose();
        } catch (error) {
            console.error("Error adding song to playlist:", error);
            toast.error("Failed to add song to playlist.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleCreateAndAdd = async (e) => {
        e.preventDefault();
        if (!newPlaylist.name.trim()) return;

        try {
            setCreating(true);
            const response = await playlistService.createPlaylist(newPlaylist);
            const createdPlaylist = response.data?.data || response.data;
            const newId = createdPlaylist.playlistId || createdPlaylist.id;

            if (newId) {
                await playlistService.addSongToPlaylist(songId, newId);
                toast.success(`Playlist created and "${songName}" added! 🎵`);
                onClose();
            } else {
                fetchPlaylists();
                setShowCreateForm(false);
                setNewPlaylist({ name: '', description: '' });
                toast.success("Playlist created! Now select it to add your song.");
            }
        } catch (error) {
            console.error("Error creating/adding:", error);
            toast.error("Process failed. Please try again.");
        } finally {
            setCreating(false);
        }
    };

    if (!isOpen) return null;

    const filteredPlaylists = playlists.filter(pl =>
        pl.playlistName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 modal-overlay-blur" onClick={onClose}>
            <div className="add-to-playlist-premium animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Add to Playlist</h2>
                        <p className="text-[10px] opacity-40 uppercase tracking-widest mt-1 font-bold">Selecting for: <span className="text-indigo-400">{songName}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors border border-transparent hover:border-white/10">
                        <X className="w-5 h-5 opacity-40" />
                    </button>
                </div>

                {!showCreateForm ? (
                    <>
                        {/* Search Bar */}
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                            <input
                                type="text"
                                className="premium-search-input w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/5 focus:border-indigo-500/50 outline-none transition-all text-sm"
                                placeholder="Search your playlists..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Playlist List */}
                        <div className="playlist-selection-list-premium custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 opacity-30">
                                    <Loader2 className="w-8 h-8 animate-spin mb-3" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Waking up your playlists...</p>
                                </div>
                            ) : filteredPlaylists.length > 0 ? (
                                <div className="flex flex-col gap-1.5 px-0.5">
                                    {filteredPlaylists.map(playlist => (
                                        <button
                                            key={playlist.playlistId}
                                            className="playlist-item-premium group"
                                            onClick={() => handleAddToPlaylist(playlist.playlistId)}
                                            disabled={processingId !== null}
                                        >
                                            <div className="flex items-center gap-4 py-1">
                                                <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-all border border-white/5 group-hover:border-indigo-500/30 overflow-hidden relative">
                                                    <ListMusic className="w-5 h-5 opacity-20 group-hover:opacity-100 group-hover:text-indigo-400" />
                                                    {processingId === playlist.playlistId && (
                                                        <div className="absolute inset-0 bg-indigo-500/40 flex items-center justify-center">
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{playlist.playlistName}</p>
                                                    <p className="text-[10px] opacity-30 font-bold uppercase tracking-wider mt-0.5">
                                                        {playlist.songCount || 0} Tracks
                                                    </p>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                                    <Plus className="w-4 h-4 text-indigo-400" />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 px-6 bg-white/5 rounded-3xl border border-dashed border-white/5">
                                    <ListMusic className="w-10 h-10 mx-auto mb-3 opacity-10" />
                                    <p className="text-xs font-bold opacity-30 uppercase tracking-widest">
                                        {searchTerm ? `No matches for "${searchTerm}"` : "You have no playlists yet"}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer - Create Button */}
                        <div className="mt-6">
                            <button
                                className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                                onClick={() => setShowCreateForm(true)}
                            >
                                <Plus className="w-4 h-4" />
                                Create New Playlist
                            </button>
                        </div>
                    </>
                ) : (
                    /* Quick Create Form */
                    <form onSubmit={handleCreateAndAdd} className="animate-in slide-in-from-right-4 duration-300">
                        <div className="mb-6">
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block">Playlist Name</label>
                            <input
                                type="text"
                                className="premium-search-input w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/5 focus:border-indigo-500 outline-none transition-all font-bold"
                                placeholder="e.g. Midnight Vibes"
                                value={newPlaylist.name}
                                onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                                autoFocus
                                required
                            />
                        </div>
                        <div className="mb-8">
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block">Description (Optional)</label>
                            <textarea
                                className="premium-search-input w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/5 focus:border-indigo-500 outline-none transition-all text-sm resize-none h-24"
                                placeholder="What's this collection about?"
                                value={newPlaylist.description}
                                onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold text-sm transition-all border border-white/5"
                                onClick={() => setShowCreateForm(false)}
                                disabled={creating}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className="flex-2 py-4 px-8 rounded-2xl bg-indigo-500 hover:bg-indigo-600 font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                                disabled={creating}
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Create & Add</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddToPlaylistModal;
