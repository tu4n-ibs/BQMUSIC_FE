import React, { useEffect, useState, useCallback } from "react";
import { 
    Music, 
    Search, 
    Trash2, 
    Loader2, 
    AlertCircle,
    CheckCircle,
    Play,
    Calendar,
    Disc,
    User
} from 'lucide-react';
import SectionLoader from '../../components/common/SectionLoader';
import songService from "../../services/songService";
import { getErrorMessage } from "../../utils/errorUtils";
import ConfirmModal from "../../components/common/ConfirmModal";
import "./css/AdminDashboard.css";

const SongManagement = () => {
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    
    // Pagination state
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    // Confirm Delete state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [songToDelete, setSongToDelete] = useState(null);

    const fetchSongs = useCallback(async (pageNum = 0) => {
        setLoading(true);
        setError("");
        try {
            const res = await songService.getAdminSongs(pageNum, pageSize);
            const apiResponse = res.data || res;
            
            if (apiResponse && (apiResponse.success || apiResponse.code === 200 || res.status === 200)) {
                const data = apiResponse.data || {};
                setSongs(data.content || []);
                setTotalPages(data.totalPages || 0);
                setTotalElements(data.totalElements || 0);
                setPage(data.number || 0);
            } else {
                setError(apiResponse.message || "Failed to fetch songs.");
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSongs(0);
    }, [fetchSongs]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        // In a real implementation with backend search, we would debounced fetch here
    };

    const filteredSongs = songs.filter(song => 
        song.nameSong?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.userResponse?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteClick = (song) => {
        setSongToDelete(song);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!songToDelete) return;

        setLoading(true);
        setError("");
        try {
            const res = await songService.deleteSong(songToDelete.id);
            const apiResponse = res.data || res;
            if (apiResponse && (apiResponse.success || apiResponse.code === 200 || res.status === 200)) {
                setSuccessMessage(`Song "${songToDelete.nameSong}" deleted successfully!`);
                setSongs(prev => prev.filter(s => s.id !== songToDelete.id));
                setTotalElements(prev => prev - 1);
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setError(apiResponse?.message || "Failed to delete song.");
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
            setSongToDelete(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header-simple">
                <div className="header-text">
                    <h1>Song Management</h1>
                    <p>Monitor and moderate all active published songs across the platform</p>
                </div>
                <div className="header-stats-mini">
                    <div className="stat-pill">
                        <Music size={14} />
                        <span>{totalElements} Total Songs</span>
                    </div>
                </div>
            </header>

            {successMessage && (
                <div className="admin-alert success animate__animated animate__fadeIn">
                    <CheckCircle size={18} /> {successMessage}
                </div>
            )}

            {error && (
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
                            placeholder="Filter by song name or artist..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                <div className="table-responsive-admin">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Song Details</th>
                                <th>Artist</th>
                                <th>Category</th>
                                <th>Stats</th>
                                <th>Release Date</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && songs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10">
                                        <SectionLoader message="Loading library..." />
                                    </td>
                                </tr>
                            ) : filteredSongs.length > 0 ? (
                                filteredSongs.map((song) => (
                                    <tr key={song.id}>
                                        <td>
                                            <div className="flex items-center gap-4">
                                                <div className="relative group">
                                                    <img 
                                                        src={song.imageUrl.startsWith('http') ? song.imageUrl : `${process.env.REACT_APP_API_BASE_URL}${song.imageUrl}`} 
                                                        alt="" 
                                                        className="w-12 h-12 rounded-lg object-cover shadow-lg border border-white/10"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                        <Play size={16} className="text-white fill-white" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white leading-none mb-1">{song.nameSong}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                        <Disc size={10} /> {song.nameAlbum || "Single"}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                                                    <User size={12} className="text-slate-400" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-300">{song.userResponse?.name || "Unknown"}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
                                                {song.genreName}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-200">{song.playCount?.toLocaleString() || 0}</span>
                                                <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Total Plays</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-xs text-slate-400 flex items-center gap-2">
                                                <Calendar size={12} />
                                                {formatDate(song.timeCreated)}
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <div className="action-buttons-group">
                                                <button
                                                    className="btn-action-icon delete"
                                                    onClick={() => handleDeleteClick(song)}
                                                    title="Delete Song"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-20 text-slate-500 bg-white/5 rounded-2xl">
                                        <Music size={40} className="mx-auto mb-4 opacity-20" />
                                        <p>{searchTerm ? `No songs found matching "${searchTerm}"` : "The platform library is currently empty."}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="table-footer-admin flex items-center justify-between px-6 py-4 border-t border-white/5">
                        <div className="text-xs text-slate-500">
                            Showing <span className="text-white font-bold">{page * pageSize + 1}</span> to <span className="text-white font-bold">{Math.min((page + 1) * pageSize, totalElements)}</span> of <span className="text-white font-bold">{totalElements}</span> items
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                className="btn-pagination" 
                                disabled={page === 0}
                                onClick={() => fetchSongs(page - 1)}
                            >
                                Previous
                            </button>
                            <div className="flex gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button 
                                        key={i} 
                                        className={`btn-page-number ${page === i ? 'active' : ''}`}
                                        onClick={() => fetchSongs(i)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button 
                                className="btn-pagination" 
                                disabled={page === totalPages - 1}
                                onClick={() => fetchSongs(page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal 
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setSongToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Administrative Deletion"
                message={`Are you sure you want to perform an administrative deletion of "${songToDelete?.nameSong}"? This will hide the song and all its associated posts from Feed, Profiles, and Groups platform-wide.`}
                confirmText="Delete Song"
                type="danger"
            />
        </div>
    );
};

export default SongManagement;
