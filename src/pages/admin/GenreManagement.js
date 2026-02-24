import React, { useEffect, useState, useCallback } from "react";
import genreService from "../../services/genreService";
import { getErrorMessage } from "../../utils/errorUtils";
import "./css/GenreManagement.css";
import "./css/Block.css"; // Reuse general admin styles
import "bootstrap/dist/css/bootstrap.min.css";

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            let response;
            const now = new Date().toISOString();
            const userId = localStorage.getItem("userId") || ""; // Lấy userId từ localStorage

            if (isEditing) {
                response = await genreService.updateGenre(currentGenre.id, {
                    name: currentGenre.name,
                    description: currentGenre.description,
                    isActive: true,
                    is_active: true,
                    updatedAt: now,
                    updated_at: now,
                    updatedBy: userId,
                    updated_by: userId
                });
            } else {
                response = await genreService.createGenre({
                    name: currentGenre.name,
                    description: currentGenre.description,
                    isActive: true,
                    is_active: true,
                    createdAt: now,
                    created_at: now,
                    updatedAt: now,
                    updated_at: now,
                    createdBy: userId,
                    created_by: userId,
                    updatedBy: userId,
                    updated_by: userId,
                    version: 0
                });
            }

            // Kiểm tra success hoặc nếu res trả về object có ID (trường hợp backend không bọc success)
            if (response && (response.success || response.id || response.idGenre)) {
                setSuccessMessage(response.message || `Thể loại đã được ${isEditing ? "cập nhật" : "tạo"} thành công!`);
                handleCloseModal();
                fetchGenres(searchTerm);
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setError(response?.message || "Thao tác thất bại. Vui lòng kiểm tra lại.");
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="genre-management-container container py-5">

                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="genre-title">Genre Management</h2>
                        <p className="text-secondary small mb-0">Organize and manage music categories with precision.</p>
                    </div>
                    <button className="btn-genre-primary" onClick={() => handleOpenModal()}>
                        <i className="bi bi-plus-lg me-2"></i> New Genre
                    </button>
                </div>

                {successMessage && (
                    <div className="alert-message alert-success mb-4 animate__animated animate__fadeIn">
                        {successMessage}
                    </div>
                )}

                {/* Main Content Card */}
                <div className="genre-card">
                    <div className="genre-header">
                        <h5 className="mb-0 fw-bold gold-text">Library Genres</h5>
                        <div className="search-genre-wrapper">
                            <i className="bi bi-search search-genre-icon"></i>
                            <input
                                type="text"
                                className="search-genre-input"
                                placeholder="Filter by genre name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="genre-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Genre Name</th>
                                    <th>Description</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && genres.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-5">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : genres.length > 0 ? (
                                    genres.map((genre, index) => (
                                        <tr key={genre.id} className="genre-row">
                                            <td className="text-secondary small">{(index + 1).toString().padStart(2, '0')}</td>
                                            <td className="genre-name-cell">{genre.name}</td>
                                            <td className="genre-desc-cell">{genre.description || "No description provided."}</td>
                                            <td className="text-end">
                                                <div className="genre-actions">
                                                    <button
                                                        className="btn-genre-action btn-genre-edit"
                                                        onClick={() => handleOpenModal(genre)}
                                                        title="Edit Genre"
                                                    >
                                                        <i className="bi bi-pencil-fill"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-5 text-secondary">
                                            {searchTerm ? `No genres found matching "${searchTerm}"` : "No genres available in the library."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-3 bg-secondary-subtle d-flex justify-content-between align-items-center">
                        <span className="text-secondary small">Total Genres: <strong>{genres.length}</strong></span>
                    </div>
                </div>
            </div>

            {/* Modal for Create/Update */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content genre-modal-content overflow-hidden border-0">
                            <div className="modal-header border-0 bg-light p-4">
                                <h5 className="modal-title fw-bold">
                                    {isEditing ? "Update Genre" : "Create New Genre"}
                                </h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    {error && (
                                        <div className="alert alert-danger border-0 rounded-3 small mb-3">
                                            {error}
                                        </div>
                                    )}
                                    <div className="mb-4">
                                        <label className="genre-form-label">Genre Name</label>
                                        <input
                                            type="text"
                                            className="form-control genre-form-input"
                                            placeholder="e.g., Hip-hop, Jazz, Classical"
                                            value={currentGenre.name}
                                            onChange={(e) => setCurrentGenre({ ...currentGenre, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <label className="genre-form-label">Description</label>
                                        <textarea
                                            className="form-control genre-form-input"
                                            rows="4"
                                            placeholder="Share some details about this genre..."
                                            value={currentGenre.description}
                                            onChange={(e) => setCurrentGenre({ ...currentGenre, description: e.target.value })}
                                            required
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light rounded-3 px-4 fw-bold" onClick={handleCloseModal}>Cancel</button>
                                    <button type="submit" className="btn-genre-primary px-4" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Saving...
                                            </>
                                        ) : isEditing ? "Update Genre" : "Create Genre"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GenreManagement;
