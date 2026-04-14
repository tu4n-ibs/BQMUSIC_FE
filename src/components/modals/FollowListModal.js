import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, Search, User as UserIcon, Loader2 } from 'lucide-react';
import userService from '../../services/userService';
import { getUserAvatar } from '../../utils/userUtils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './css/FollowListModal.css';

const FollowListModal = ({ isOpen, onClose, userId, type, title }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const navigate = useNavigate();
    const observer = useRef();

    const fetchUsers = useCallback(async (reset = false) => {
        if (!userId || !isOpen) return;

        try {
            if (reset) {
                setLoading(true);
                setPage(0);
            }

            const currentPage = reset ? 0 : page;
            const response = type === 'followers'
                ? await userService.getFollowers(userId, searchQuery, currentPage, 15)
                : await userService.getFollowing(userId, searchQuery, currentPage, 15);

            const data = response.data || response;
            const newUsers = data.content || [];

            if (reset) {
                setUsers(newUsers);
            } else {
                setUsers(prev => [...prev, ...newUsers]);
            }

            setHasMore(!data.last);
            setLoading(false);
            setIsSearching(false);
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
            toast.error(`Failed to load ${type}`);
            setLoading(false);
            setIsSearching(false);
        }
    }, [userId, type, searchQuery, page, isOpen]);

    useEffect(() => {
        if (isOpen) {
            fetchUsers(true);
        } else {
            setUsers([]);
            setSearchQuery('');
            setPage(0);
        }
    }, [isOpen, userId, type]);

    // Handle search with debounce
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            if (isOpen) {
                setIsSearching(true);
                fetchUsers(true);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const lastUserElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => {
        if (page > 0) {
            fetchUsers(false);
        }
    }, [page]);

    const handleUserClick = (targetUserId) => {
        navigate(`/user/userId=${targetUserId}`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="follow-modal-overlay" onClick={onClose}>
            <div className="follow-modal-content" onClick={e => e.stopPropagation()}>
                <div className="follow-modal-header">
                    <h3 className="follow-modal-title">{title}</h3>
                    <button className="follow-modal-close" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="follow-modal-search">
                    <div className="search-input-wrapper">
                        <Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search names..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {isSearching && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                    </div>
                </div>

                <div className="follow-modal-body">
                    {users.length > 0 ? (
                        <div className="user-list">
                            {users.map((user, index) => (
                                <div
                                    key={user.userId || user.id || index}
                                    className="user-item"
                                    ref={index === users.length - 1 ? lastUserElementRef : null}
                                    onClick={() => handleUserClick(user.userId || user.id)}
                                >
                                    <img
                                        src={getUserAvatar(user.imageUrl)}
                                        alt={user.name}
                                        className="user-avatar"
                                    />
                                    <div className="user-info">
                                        <div className="user-name">{user.name}</div>
                                        <div className="user-email">{user.email}</div>
                                    </div>
                                    <div className="user-action">
                                        <UserIcon className="w-4 h-4 text-slate-500" />
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="loading-more">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                </div>
                            )}
                        </div>
                    ) : (
                        !loading && (
                            <div className="empty-state">
                                <div className="empty-icon-wrapper">
                                    <UserIcon className="w-8 h-8 text-slate-500" />
                                </div>
                                <p>No users found</p>
                            </div>
                        )
                    )}
                    {loading && users.length === 0 && (
                        <div className="initial-loading">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowListModal;
