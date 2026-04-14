import React, { useEffect, useState, useCallback } from "react";
import { 
    Music, 
    Search, 
    Plus, 
    Edit2, 
    Trash2, 
    Loader2, 
    Info,
    CheckCircle,
    AlertCircle,
    X
} from 'lucide-react';
import genreService from "../../services/genreService";
import { getErrorMessage } from "../../utils/errorUtils";
import ConfirmModal from "../../components/common/ConfirmModal";
import "./css/AdminDashboard.css"; // Reuse dashboard layout/table styles
import "./css/AdminGenre.css";

function GenreManagement() {
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentGenre, setCurrentGenre] = useState({ id: "", name: "", description: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Confirm Delete state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [genreToDelete, setGenreToDelete] = useState(null);

    const fetchGenres = useCallback(async (name = "") => {
        setLoading(true);
        setError("");
        try {
            const response = await genreService.getAllGenres(name);
            if (response && response.success) {
                setGenres(response.data || []);
            } else {
                setError(response.message || "Failed to fetch genres.");
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchGenres(searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, fetchGenres]);

    const handleOpenModal = (genre = null) => {
        if (genre) {
            setIsEditing(true);
            setCurrentGenre({ id: genre.id, name: genre.name, description: genre.description });
        } else {
            setIsEditing(false);
            setCurrentGenre({ id: "", name: "", description: "" });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setError("");
    };

    const handleDeleteGenre = async (genre) => {
        setGenreToDelete(genre);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        const genre = genreToDelete;
        if (!genre) return;

        setLoading(true);
        setError("");
        try {
            const response = await genreService.deleteGenre(genre.id);
            if (response && (response.success || response.status === 200)) {
                setSuccessMessage(`Genre "${genre.name}" deleted successfully!`);
                setGenres(prev => prev.filter(g => g.id !== genre.id));
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setError(response?.message || "Failed to delete genre.");
            }
        } catch (err) {
            const msg = getErrorMessage(err);
            if (msg.toLowerCase().includes("in use") || msg.toLowerCase().includes("song")) {
                setError(`Warning: Genre "${genre.name}" is currently linked to songs. Please reassign them first.`);
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");
        try {
            let response;
            const now = new Date().toISOString();
            const userId = localStorage.getItem("userId") || "";

            if (isEditing) {
                response = await genreService.updateGenre(currentGenre.id, {
                    name: currentGenre.name,
                    description: currentGenre.description,
                    isActive: true,
                    updatedAt: now,
                    updatedBy: userId
                });
            } else {
                response = await genreService.createGenre({
                    name: currentGenre.name,
                    description: currentGenre.description,
                    isActive: true,
                    createdAt: now,
                    createdBy: userId,
                    version: 0
                });
            }

            if (response && (response.success || response.id || response.idGenre)) {
                setSuccessMessage(`Genre ${isEditing ? "updated" : "created"} successfully!`);
                handleCloseModal();
                fetchGenres(searchTerm);
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setError(response?.message || "Operation failed.");
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header-simple">
                <div className="header-text">
                    <h1>Genre Management</h1>
                    <p>Categorize your library content efficiently</p>
                </div>
                <button className="btn-primary-admin" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> New Genre
                </button>
            </header>

            {successMessage && (
                <div className="admin-alert success animate__animated animate__fadeIn">
                    <CheckCircle size={18} /> {successMessage}
                </div>
            )}

            {error && !showModal && (
                <div className="admin-alert danger animate__animated animate__fadeIn">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            <div className="data-table-container">
                <div className="table-header-admin">
                    <div className="search-box-admin">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Filter by genre name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive-admin">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>ID</th>
                                <th>Genre Name</th>
                                <th>Description</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && genres.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-10">
                                        <Loader2 className="animate-spin inline mr-2" /> Loading genres...
                                    </td>
                                </tr>
                            ) : genres.length > 0 ? (
                                genres.map((genre, index) => (
                                    <tr key={genre.id}>
                                        <td className="text-slate-500 text-xs">{(index + 1).toString().padStart(2, '0')}</td>
                                        <td>
                                            <div className="genre-name-cell-modern">
                                                <div className="genre-avatar-mini"><Music size={14} /></div>
                                                <span className="font-semibold">{genre.name}</span>
                                            </div>
                                        </td>
                                        <td className="text-slate-400 text-sm max-w-md truncate">
                                            {genre.description || "No description provided."}
                                        </td>
                                        <td className="text-right">
                                            <div className="action-buttons-group">
                                                <button
                                                    className="btn-action-icon"
                                                    onClick={() => handleOpenModal(genre)}
                                                    title="Edit Genre"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="btn-action-icon delete"
                                                    onClick={() => handleDeleteGenre(genre)}
                                                    title="Delete Genre"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-10 text-slate-500">
                                        {searchTerm ? `No genres found matching "${searchTerm}"` : "No genres available."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="table-footer-admin">
                    <span>Total Genres: <strong>{genres.length}</strong></span>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="admin-modal-overlay" onClick={handleCloseModal}>
                    <div className="admin-modal-content wide" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-admin">
                            <h3>{isEditing ? "Edit Genre" : "Create New Genre"}</h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body-admin">
                                {error && (
                                    <div className="admin-alert danger mb-6">
                                        <AlertCircle size={18} /> {error}
                                    </div>
                                )}
                                <div className="input-group-admin">
                                    <label>Genre Name</label>
                                    <input
                                        placeholder="e.g., Hip-hop, Lo-fi, Electronic"
                                        value={currentGenre.name}
                                        onChange={(e) => setCurrentGenre({ ...currentGenre, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group-admin">
                                    <label>Description</label>
                                    <textarea
                                        rows="4"
                                        placeholder="Describe the characteristics of this genre..."
                                        value={currentGenre.description}
                                        onChange={(e) => setCurrentGenre({ ...currentGenre, description: e.target.value })}
                                        required
                                        className="admin-textarea"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer-admin">
                                <button type="button" className="btn-secondary-admin" onClick={handleCloseModal}>Cancel</button>
                                <button type="submit" className="btn-primary-admin" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (isEditing ? "Save Changes" : "Create Genre")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setGenreToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Genre"
                message={`Are you sure you want to delete the genre "${genreToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
}

export default GenreManagement;
