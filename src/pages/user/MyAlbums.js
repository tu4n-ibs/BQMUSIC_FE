import React, { useState, useEffect } from 'react';
import albumService from '../../services/albumService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorUtils';
import {
    Plus, Disc, Music, Camera,
    Loader2
} from 'lucide-react';
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
            let albumCover = null;
            if (albumRawImage) {
                albumCover = albumRawImage.startsWith('http') 
                    ? albumRawImage 
                    : `${process.env.REACT_APP_API_BASE_URL}${albumRawImage.startsWith('/') ? '' : '/'}${albumRawImage}`;
            }
            setForm({
                name: album.albumName || album.name,
                description: album.albumDescription || album.description || '',
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
            const formData = new FormData();
            formData.append('albumName', form.name.trim());
            formData.append('albumDescription', form.description.trim());

            if (form.imageFile) {
                formData.append('file', form.imageFile);
            }

            let albumId = editingAlbum?.id;

            if (editingAlbum) {
                await albumService.updateAlbum(albumId, formData);
            } else {
                const result = await albumService.createAlbum(formData);
                // Extra robust ID extraction
                albumId = result?.data?.id || (typeof result?.data === 'number' || typeof result?.data === 'string' ? result.data : result?.id);
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




    return (
        <div className="my-albums-container feed-container flex min-h-screen bg-slate-950 text-white">
            <Sidebar />

            <main className="flex-1 lg:ml-[240px] md:ml-[80px] ml-0 transition-all duration-300 min-h-screen flex flex-col">
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

            </main>
        </div>
    );
};

export default MyAlbums;
