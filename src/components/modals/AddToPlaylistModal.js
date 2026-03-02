import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Loader2, ListMusic } from 'lucide-react';
import playlistService from '../../services/playlistService';
import './css/AddToPlaylistModal.css';

const AddToPlaylistModal = ({ isOpen, onClose, songId, songName }) => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [error, setError] = useState(null);

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
            setError("Failed to load your playlists.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddToPlaylist = async (playlistId) => {
        try {
            setProcessingId(playlistId);
            await playlistService.addSongToPlaylist(songId, playlistId);
            alert(`Added "${songName}" to playlist! 🎵`);
            onClose();
        } catch (error) {
            console.error("Error adding song to playlist:", error);
            alert("Failed to add song to playlist.");
        } finally {
            setProcessingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200">
            <div className="add-to-playlist-card animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold">Add to Playlist</h2>
                        <p className="text-xs opacity-50 mt-1">Select a playlist for "{songName}"</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="playlist-selection-list custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 opacity-40">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <p className="text-sm">Loading playlists...</p>
                        </div>
                    ) : playlists.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {playlists.map(playlist => (
                                <button
                                    key={playlist.id || playlist.idPlaylist}
                                    className="playlist-selection-item group"
                                    onClick={() => handleAddToPlaylist(playlist.id || playlist.idPlaylist)}
                                    disabled={processingId !== null}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                            <ListMusic className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:text-indigo-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-sm truncate">{playlist.name}</p>
                                            <p className="text-[10px] opacity-40 uppercase tracking-wider">
                                                {playlist.songs?.length || 0} Songs
                                            </p>
                                        </div>
                                    </div>
                                    <div className="ml-auto">
                                        {processingId === (playlist.id || playlist.idPlaylist) ? (
                                            <Loader2 className="w-4 h-4 animate-spin opacity-40" />
                                        ) : (
                                            <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 px-6">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ListMusic className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="text-sm opacity-50 mb-6">You haven't created any playlists yet.</p>
                            <button
                                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
                                onClick={onClose}
                            >
                                Go back and create one!
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-6 border-t border-white/5">
                    <button
                        className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-sm transition"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddToPlaylistModal;
