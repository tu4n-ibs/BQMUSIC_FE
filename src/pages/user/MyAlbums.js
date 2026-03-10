import React, { useState, useEffect } from 'react';
import albumService from '../../services/albumService';
import songService from '../../services/songService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorUtils';
import {
    Plus, Trash2, Edit, Disc, Music, Camera, AlertTriangle,
    ChevronLeft, Loader2, Image as ImageIcon, CheckCircle2, XCircle, UploadCloud,
    MoreHorizontal, ListMusic, Search as SearchIcon
} from 'lucide-react';
import AddToPlaylistModal from '../../components/modals/AddToPlaylistModal';
import Sidebar from '../../components/layout/Sidebar';
import '../admin/css/GenreManagement.css';
import { toast } from 'react-hot-toast';
import './css/MyAlbums.css';

const MyAlbums = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState(null);
    const [updatingImageId, setUpdatingImageId] = useState(null);

    // Form State
    const [form, setForm] = useState({
        name: '',
        description: '',
        imageFile: null,
        imagePreview: null
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Song Selection State (for addSongToAlbum)
    const [availableSongs, setAvailableSongs] = useState([]);
    const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
    const [selectedAlbumId, setSelectedAlbumId] = useState(null);

    const [activeMenuId, setActiveMenuId] = useState(null);
    const [playlistModal, setPlaylistModal] = useState({
        isOpen: false,
        songId: null,
        songName: ''
    });

    useEffect(() => {
        if (user?.idUser) {
            fetchAlbums(user.idUser);
        }
    }, [user?.idUser]);

    const fetchAlbums = async (userId) => {
        try {
            setLoading(true);
            const response = await albumService.getAlbumsByUserId(userId);
            // Backend wraps all responses in ApiResponse<T>: { success, statusCode, data: [...] }
            const albums = response?.data || response || [];
            setAlbums(Array.isArray(albums) ? albums : []);
        } catch (err) {
            console.error("Error fetching albums:", err);
            toast.error('Failed to load albums.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (album = null) => {
        if (album) {
            setEditingAlbum(album);
            const albumRawImage = album.albumImageUrl || album.imageUrl || album.album_image_url;
            const albumCover = albumRawImage
                ? (albumRawImage.startsWith('http') ? albumRawImage : (albumRawImage.startsWith('/') ? `${process.env.REACT_APP_API_BASE_URL}${albumRawImage}` : `${process.env.REACT_APP_API_BASE_URL}/${albumRawImage}`))
                : null;
            setForm({
                name: album.name,
                description: album.description || '',
                imageFile: null,
                imagePreview: albumCover
            });
        } else {
            setEditingAlbum(null);
            setForm({ name: '', description: '', imageFile: null, imagePreview: null });
        }
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validation 2: Cover image upload error (format)
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                setFormErrors(prev => ({ ...prev, image: "Invalid image format! Please choose a valid image file (JPG, PNG, WEBP)." }));
                setForm(prev => ({ ...prev, imageFile: null, imagePreview: null }));
                return;
            }

            setFormErrors(prev => ({ ...prev, image: null }));
            setForm(prev => ({
                ...prev,
                imageFile: file,
                imagePreview: URL.createObjectURL(file)
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setFormErrors({ name: "Album name cannot be empty" });
            return;
        }

        setIsSubmitting(true);
        try {
            // Build JSON payload for create/update
            const albumPayload = {
                name: form.name.trim(),
                description: form.description.trim(),
                imageUrl: form.imagePreview || '' // keep existing preview URL as fallback
            };

            let albumId = editingAlbum?.id;

            if (editingAlbum) {
                await albumService.updateAlbum(albumId, albumPayload);
            } else {
                const result = await albumService.createAlbum(albumPayload);
                // Backend returns the new album – try common ID field names
                albumId = result?.data?.id || result?.id;
            }

            // If user picked a new image file, upload it separately
            if (form.imageFile && albumId) {
                await albumService.uploadAlbumImage(albumId, form.imageFile);
            }

            setIsModalOpen(false);
            fetchAlbums(user.idUser);
            toast.success(editingAlbum ? 'Album updated!' : 'Album created!');

            // Redirect to the new album detail page if it was a create operation
            if (!editingAlbum && albumId) {
                navigate(`/album/${albumId}`);
            }
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickUpdateImage = async (albumId, file) => {
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            toast.error("Invalid image format! Please choose JPG, PNG or WEBP.");
            return;
        }

        setUpdatingImageId(albumId);
        try {
            const result = await albumService.uploadAlbumImage(albumId, file);
            // result is ApiResponse<String> where data is the new image path
            const newImageUrl = result?.data || result;

            // Update local state
            setAlbums(prev => prev.map(album =>
                album.id === albumId
                    ? { ...album, imageUrl: newImageUrl }
                    : album
            ));

            toast.success('Album cover updated!');
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setUpdatingImageId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this album?")) return;
        try {
            await albumService.deleteAlbum(id);
            fetchAlbums();
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    // logic Adding Song to Album
    const handleOpenAddSong = (albumId) => {
        setSelectedAlbumId(albumId);
        fetchAvailableSongs();
        setIsAddSongModalOpen(true);
    };

    const fetchAvailableSongs = async () => {
        try {
            const res = await songService.getAllSongs();
            // Standardize: if res.data exists (axios), and has a .data property (backend structure)
            const songs = res.data?.data || res.data || [];
            setAvailableSongs(Array.isArray(songs) ? songs : []);
        } catch (err) {
            console.error("Error fetching songs:", err);
        }
    };

    const addSongToAlbum = async (song) => {
        // Validation 1: Song already belongs to another Album
        if (song.albumId && song.albumId !== selectedAlbumId) {
            toast.error(`Warning: Song "${song.name}" already belongs to another Album! (Each song can only belong to one album).`);
            return;
        }

        try {
            await albumService.addSongToAlbum(selectedAlbumId, song.id || song.idSong);
            toast.success("Song added to album!");
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const [songSearch, setSongSearch] = useState('');

    const filteredAvailableSongs = availableSongs.filter(song =>
        song.name.toLowerCase().includes(songSearch.toLowerCase())
    );

    return (
        <div className="my-albums-container feed-container flex min-h-screen bg-slate-950 text-white">
            <Sidebar />

            <main className="flex-1 lg:ml-[240px] ml-0 transition-all duration-300 min-h-screen flex flex-col">
                <div className="container-fluid p-4 lg:p-8">
                    <div className="dashboard-header rounded-3 px-4">
                        <div className="header-content">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h2 className="page-title text-white">My Albums</h2>
                                    <p className="text-slate-400 mb-0" style={{ fontSize: '14px' }}>Create and organize your music collections.</p>
                                </div>
                            </div>
                            <div className="header-actions">
                                <button className="btn-create" onClick={() => handleOpenModal()}>
                                    <Plus className="w-4 h-4 me-2" /> New Album
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Curating your collection...</p>
                            </div>
                        ) : albums.length > 0 ? (
                            <div className="album-grid">
                                {albums.map((album) => (
                                    <div key={album.id} className="album-card-premium group">
                                        <div
                                            className="album-card-cover-wrapper cursor-pointer"
                                            onClick={() => navigate(`/album/${album.id}`)}
                                        >
                                            {(() => {
                                                const imgPath = album.albumImageUrl || album.imageUrl || album.album_image_url;
                                                if (imgPath) {
                                                    const finalUrl = imgPath.startsWith('http')
                                                        ? imgPath
                                                        : (imgPath.startsWith('/') ? `${process.env.REACT_APP_API_BASE_URL}${imgPath}` : `${process.env.REACT_APP_API_BASE_URL}/${imgPath}`);

                                                    return <img src={finalUrl} alt="" className="album-card-cover" onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }} />;
                                                }
                                                return null;
                                            })()}
                                            <div className="w-full h-full bg-indigo-500/10 flex items-center justify-center placeholder-div" style={{ display: (album.albumImageUrl || album.imageUrl || album.album_image_url) ? 'none' : 'flex' }}>
                                                <Disc className="w-16 h-16 text-indigo-500/20" />
                                            </div>

                                            <div
                                                className="album-card-quick-update-overlay"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {updatingImageId === album.id ? (
                                                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                                                ) : (
                                                    <label className="cursor-pointer">
                                                        <Camera className="w-8 h-8 text-white transition-transform hover:scale-110" />
                                                        <input
                                                            type="file"
                                                            hidden
                                                            accept="image/*"
                                                            onChange={(e) => handleQuickUpdateImage(album.id, e.target.files[0])}
                                                        />
                                                    </label>
                                                )}
                                            </div>

                                            <div className="album-card-badges">
                                                <span className="album-badge">Album</span>
                                            </div>
                                        </div>

                                        <div className="album-card-content">
                                            <h3 className="album-card-title truncate">{album.name}</h3>
                                            <p className="album-card-description">{album.description || "No description provided."}</p>

                                            <div className="album-card-footer">
                                                <div className="album-card-stats">
                                                    <div className="album-card-stat">
                                                        <Music className="w-3 h-3" />
                                                        <span>{(album.songCount || 0)} songs</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="album-empty-state">
                                <Disc className="album-empty-icon" />
                                <h3 className="album-empty-title">No albums found</h3>
                                <p className="album-empty-text mb-6">Start your musical journey by creating your first collection.</p>
                                <button className="btn-create mx-auto" onClick={() => handleOpenModal()}>
                                    <Plus className="w-4 h-4 me-2" /> Create First Album
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Premium Create/Edit Modal */}
                {isModalOpen && (
                    <div className="modal show d-block album-premium-modal">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content album-modal-glass border-0">
                                <div className="modal-header album-modal-header">
                                    <h5 className="album-modal-title">{editingAlbum ? "Edit Album" : "New Album"}</h5>
                                    <button className="btn-close-album" onClick={() => setIsModalOpen(false)}>
                                        <Plus className="w-6 h-6 rotate-45" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body p-5 pt-2">
                                        <div className="album-cover-upload-wrapper">
                                            <div
                                                className={`album-cover-preview-container ${form.imagePreview ? 'has-image' : ''} ${formErrors.image ? 'border-red-500' : ''}`}
                                                onClick={() => document.getElementById('album-cover').click()}
                                            >
                                                {form.imagePreview ? (
                                                    <>
                                                        <img src={form.imagePreview} className="album-cover-img" alt="Preview" />
                                                        <div className="album-cover-overlay">
                                                            <Camera className="w-8 h-8 text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="album-upload-icon-pulse">
                                                            <Camera className={`w-10 h-10 ${formErrors.image ? 'text-red-400' : 'text-white/20'}`} />
                                                        </div>
                                                        <span className="text-[10px] mt-2 font-bold text-white/40 tracking-widest">COVER</span>
                                                    </>
                                                )}
                                            </div>
                                            <input type="file" id="album-cover" hidden onChange={handleFileChange} accept="image/*" />
                                            {formErrors.image && <p className="album-error-text text-center mt-2">{formErrors.image}</p>}
                                        </div>

                                        <div className="album-input-group">
                                            <label className="album-label-premium">Album Name</label>
                                            <input
                                                className={`album-field-premium ${formErrors.name ? 'album-field-error' : ''}`}
                                                placeholder="e.g. Midnight Melodies"
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                required
                                            />
                                            {formErrors.name && <p className="album-error-text">{formErrors.name}</p>}
                                        </div>

                                        <div className="album-input-group">
                                            <label className="album-label-premium">Description</label>
                                            <textarea
                                                className="album-field-premium"
                                                rows="3"
                                                placeholder="Tell the story behind this collection..."
                                                value={form.description}
                                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            />
                                        </div>

                                        <div className="flex justify-center mt-4">
                                            <button type="submit" className="btn-album-save-premium" disabled={isSubmitting}>
                                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                                    <>
                                                        <span>{editingAlbum ? "Update Collection" : "Save Album"}</span>
                                                        <Disc className="w-5 h-5" />
                                                    </>
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Song Modal */}
                {isAddSongModalOpen && (
                    <div className="modal show d-block album-premium-modal">
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content album-modal-glass border-0">
                                <div className="modal-header album-modal-header border-b border-white/5 pb-6">
                                    <h5 className="album-modal-title flex items-center gap-3">
                                        <Music className="w-6 h-6 text-indigo-500" /> Manage Album Songs
                                    </h5>
                                    <button className="btn-close-album" onClick={() => setIsAddSongModalOpen(false)}>
                                        <Plus className="w-6 h-6 rotate-45" />
                                    </button>
                                </div>
                                <div className="modal-body p-8 pt-6">
                                    <div className="manage-songs-search-wrapper">
                                        <SearchIcon className="manage-songs-search-icon w-5 h-5" />
                                        <input
                                            type="text"
                                            className="manage-songs-search-input"
                                            placeholder="Search your library for songs..."
                                            value={songSearch}
                                            onChange={(e) => setSongSearch(e.target.value)}
                                        />
                                    </div>

                                    <div className="custom-scrollbar" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                                        <div className="songs-table-premium">
                                            <div className="grid grid-cols-[1fr_120px_100px] gap-4 px-4 py-3 border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                                                <span>Song Details</span>
                                                <span>Status</span>
                                                <span className="text-end">Action</span>
                                            </div>

                                            <div className="mt-2 flex flex-col gap-1">
                                                {filteredAvailableSongs.length > 0 ? filteredAvailableSongs.map(song => (
                                                    <div key={song.id || song.idSong} className="song-item-glass grid grid-cols-[1fr_120px_100px] gap-4 items-center group">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/10 transition-colors">
                                                                <Music className="w-4 h-4 text-white/20 group-hover:text-indigo-500/50 transition-colors" />
                                                            </div>
                                                            <div className="truncate">
                                                                <div className="font-bold text-white text-sm truncate">{song.name}</div>
                                                                <div className="text-[10px] text-white/30 truncate">Target ID: {song.id || song.idSong}</div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            {song.albumId ? (
                                                                <div className={`text-[10px] font-bold px-2 py-1 rounded-lg w-fit flex items-center gap-1.5
                                                                ${song.albumId === selectedAlbumId
                                                                        ? 'bg-green-500/10 text-green-400'
                                                                        : 'bg-amber-500/10 text-amber-400'}`}>
                                                                    {song.albumId === selectedAlbumId ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                                    {song.albumId === selectedAlbumId ? "Added" : "Busy"}
                                                                </div>
                                                            ) : (
                                                                <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 text-white/20 w-fit">
                                                                    Available
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex justify-end items-center gap-2">
                                                            <button
                                                                onClick={() => addSongToAlbum(song)}
                                                                disabled={song.albumId === selectedAlbumId}
                                                                className={`text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all
                                                                ${song.albumId === selectedAlbumId
                                                                        ? 'bg-transparent text-white/20 border border-white/5'
                                                                        : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'}`}
                                                            >
                                                                {song.albumId === selectedAlbumId ? "In Album" : "Add"}
                                                            </button>
                                                            <div className="relative">
                                                                <button
                                                                    className={`p-2 rounded-lg transition-all ${activeMenuId === (song.id || song.idSong) ? 'bg-white/10 text-white' : 'text-white/20 hover:bg-white/5 hover:text-white'}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveMenuId(activeMenuId === (song.id || song.idSong) ? null : (song.id || song.idSong));
                                                                    }}
                                                                >
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </button>

                                                                {activeMenuId === (song.id || song.idSong) && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-[1100]" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}></div>
                                                                        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 z-[1200] animate-in fade-in zoom-in-95 duration-200">
                                                                            <button
                                                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all uppercase tracking-wider text-left"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setPlaylistModal({
                                                                                        isOpen: true,
                                                                                        songId: song.id || song.idSong,
                                                                                        songName: song.name
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
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="text-center py-12 opacity-20 italic text-sm">No songs match your search</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-t border-white/5 p-6">
                                    <button className="btn-album-save-premium px-8 py-3 text-sm" onClick={() => setIsAddSongModalOpen(false)}>Done</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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

export default MyAlbums;
