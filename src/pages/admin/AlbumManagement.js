import React, { useState, useEffect } from 'react';
import albumService from '../../services/albumService';
import songService from '../../services/songService';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../utils/errorUtils';
import {
    Plus, Trash2, Edit, Disc, Music, Camera, AlertTriangle,
    ChevronLeft, Loader2, Image as ImageIcon, CheckCircle2, XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import './css/GenreManagement.css';

const AlbumManagement = () => {
    const navigate = useNavigate();
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState(null);

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

    useEffect(() => {
        fetchAlbums();
    }, []);

    const fetchAlbums = async () => {
        try {
            setLoading(true);
            const data = await albumService.getAllAlbums();
            setAlbums(data.content || data || []);
        } catch (err) {
            console.error("Error fetching albums:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (album = null) => {
        if (album) {
            setEditingAlbum(album);
            setForm({
                name: album.name,
                description: album.description || '',
                imageFile: null,
                imagePreview: album.imageUrl ? `${process.env.REACT_APP_API_BASE_URL}${album.imageUrl}` : null
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
            const formData = new FormData();
            const albumDto = {
                name: form.name,
                description: form.description
            };

            formData.append('album', new Blob([JSON.stringify(albumDto)], { type: "application/json" }));
            if (form.imageFile) {
                formData.append('image', form.imageFile);
            }

            if (editingAlbum) {
                await albumService.updateAlbum(editingAlbum.id, formData);
            } else {
                await albumService.createAlbum(formData);
            }

            setIsModalOpen(false);
            fetchAlbums();
            toast.success("Operation successful!");
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
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

    return (
        <div className="dashboard-container">
            <div className="container mt-4">
                <div className="dashboard-header rounded-3 px-4">
                    <div className="header-content">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/admin')} className="p-2 hover:bg-black/5 rounded-full">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="page-title">Album Management</h2>
                                <p className="text-muted mb-0" style={{ fontSize: '14px' }}>Create and organize music collections.</p>
                            </div>
                        </div>
                        <div className="header-actions">
                            <button className="btn-create" onClick={() => handleOpenModal()}>
                                <Plus className="w-4 h-4 me-2" /> New Album
                            </button>
                        </div>
                    </div>
                </div>

                <div className="main-card mt-4">
                    <div className="table-responsive">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '32px' }}>Album</th>
                                    <th>Description</th>
                                    <th>Songs</th>
                                    <th className="text-end" style={{ paddingRight: '32px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" className="text-center py-5">Loading albums...</td></tr>
                                ) : albums.length > 0 ? albums.map((album) => (
                                    <tr key={album.id}>
                                        <td style={{ paddingLeft: '32px' }}>
                                            <div className="user-cell">
                                                <div className="user-avatar-placeholder" style={{ borderRadius: '8px' }}>
                                                    {album.imageUrl ? (
                                                        <img src={`${process.env.REACT_APP_API_BASE_URL}${album.imageUrl}`} alt="" className="w-full h-full object-cover rounded-[8px]" />
                                                    ) : <Disc className="w-5 h-5" />}
                                                </div>
                                                <span className="user-name">{album.name}</span>
                                            </div>
                                        </td>
                                        <td className="text-muted small">{album.description || "-"}</td>
                                        <td>
                                            <button onClick={() => handleOpenAddSong(album.id)} className="text-blue-500 hover:underline text-sm font-medium">
                                                Manage Songs
                                            </button>
                                        </td>
                                        <td className="text-end" style={{ paddingRight: '32px' }}>
                                            <button className="action-btn btn-edit me-2" onClick={() => handleOpenModal(album)}><Edit className="w-4 h-4" /></button>
                                            <button className="action-btn btn-delete" onClick={() => handleDelete(album.id)}><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="text-center py-5 text-muted">No albums found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-xl">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">{editingAlbum ? "Edit Album" : "New Album"}</h5>
                                <button className="btn-close" onClick={() => setIsModalOpen(false)}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body py-4">
                                    {/* Cover Image Upload with Validation */}
                                    <div className="mb-4 text-center">
                                        <div
                                            className={`relative w-32 h-32 mx-auto rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition
                                                ${formErrors.image ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-blue-400 bg-slate-50'}`}
                                            onClick={() => document.getElementById('album-cover').click()}
                                        >
                                            {form.imagePreview ? (
                                                <img src={form.imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <>
                                                    <Camera className={`w-8 h-8 ${formErrors.image ? 'text-red-400' : 'text-slate-400'}`} />
                                                    <span className="text-[10px] mt-1 font-bold text-slate-500">COVER</span>
                                                </>
                                            )}
                                        </div>
                                        <input type="file" id="album-cover" hidden onChange={handleFileChange} accept="image/*" />
                                        {formErrors.image && <p className="text-[11px] text-red-500 mt-2 font-medium px-4">{formErrors.image}</p>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label text-[10px] font-bold uppercase tracking-wider opacity-60">Album Name</label>
                                        <input
                                            className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-0">
                                        <label className="form-label text-[10px] font-bold uppercase tracking-wider opacity-60">Description</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer border-0 pt-0 pb-4 justify-center">
                                    <button type="submit" className="btn btn-primary px-5 rounded-pill fw-bold" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Album"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Song Modal */}
            {isAddSongModalOpen && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-xl overflow-hidden bg-slate-900 border border-slate-700">
                            <div className="modal-header border-slate-700 bg-slate-800/50">
                                <h5 className="modal-title font-bold text-white flex items-center gap-2">
                                    <Music className="w-5 h-5 text-blue-400" /> Manage Album Songs
                                </h5>
                                <button className="btn-close btn-close-white" onClick={() => setIsAddSongModalOpen(false)}></button>
                            </div>
                            <div className="modal-body p-0" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                <div className="p-4 border-b border-slate-700 bg-slate-800/30">
                                    <p className="text-slate-400 text-sm mb-0">Select songs to add to this album. Note: Each song can only belong to one album.</p>
                                </div>
                                <table className="table table-dark table-hover mb-0">
                                    <thead className="sticky-top bg-slate-900">
                                        <tr>
                                            <th className="border-slate-700 ps-4">Song Name</th>
                                            <th className="border-slate-700">Status</th>
                                            <th className="border-slate-700 text-end pe-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {availableSongs.map(song => (
                                            <tr key={song.id || song.idSong} className="align-middle">
                                                <td className="ps-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center">
                                                            <Music className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                        <span className="font-medium">{song.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {song.albumId ? (
                                                        <span className={`text-[11px] px-2 py-1 rounded gap-1 flex items-center w-fit
                                                            ${song.albumId === selectedAlbumId
                                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                            {song.albumId === selectedAlbumId ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                            {song.albumId === selectedAlbumId ? "In this album" : "In another album"}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] px-2 py-1 rounded bg-slate-700 text-slate-400 border border-slate-600">Available</span>
                                                    )}
                                                </td>
                                                <td className="text-end pe-4">
                                                    <button
                                                        onClick={() => addSongToAlbum(song)}
                                                        disabled={song.albumId === selectedAlbumId}
                                                        className={`btn btn-sm ${song.albumId === selectedAlbumId ? 'btn-outline-secondary' : 'btn-primary'}`}
                                                    >
                                                        {song.albumId === selectedAlbumId ? "Added" : "Add to Album"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="modal-footer border-slate-700 bg-slate-800/50">
                                <button className="btn btn-secondary" onClick={() => setIsAddSongModalOpen(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlbumManagement;
