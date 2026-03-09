import React, { useState, useEffect } from 'react';
import { X, Globe, Users, Lock, Share2 } from 'lucide-react';
import postService from '../../services/postService';
import groupService from '../../services/groupService';

const SharePostModal = ({ isOpen, onClose, post, onShareSuccess }) => {
    const [content, setContent] = useState('');
    const [visibility, setVisibility] = useState('PUBLIC');
    const [contextType, setContextType] = useState('PROFILE');
    const [contextId, setContextId] = useState('');

    const [userGroups, setUserGroups] = useState([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);

    const [isSharing, setIsSharing] = useState(false);
    const [error, setError] = useState(null);

    // Fetch user groups if they select GROUP context
    useEffect(() => {
        if (contextType === 'GROUP' && userGroups.length === 0) {
            const fetchGroups = async () => {
                setIsLoadingGroups(true);
                try {
                    const userId = localStorage.getItem('idUser');
                    let groups = [];
                    if (userId) {
                        groups = await groupService.getUserGroups(userId);
                    }
                    setUserGroups(groups || []);
                    if (groups && groups.length > 0) {
                        setContextId(groups[0].id.toString() || groups[0].idGroup.toString());
                    }
                } catch (err) {
                    console.error("Failed to load groups:", err);
                } finally {
                    setIsLoadingGroups(false);
                }
            };
            fetchGroups();
        }
    }, [contextType, userGroups.length]);

    if (!isOpen || !post) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSharing(true);
        setError(null);

        try {
            const shareData = {
                originalPostId: post.id.toString(),
                content: content.trim(),
                visibility,
                contextType,
                contextId: contextType === 'GROUP' ? contextId : null
            };

            await postService.sharePost(shareData);

            setContent('');
            onShareSuccess && onShareSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to share post:", err);
            setError(err.response?.data?.message || err.message || "Something went wrong while sharing.");
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-indigo-400" /> Share Post
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
                    {/* Original Post Preview */}
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">{post.username}</div>
                            <div className="text-xs text-slate-400 truncate">{post.caption}</div>
                        </div>
                    </div>

                    <textarea
                        placeholder="Say something about this..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 resize-none text-content placeholder-slate-500 h-24 p-2 text-sm"
                    />

                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Share To</label>
                                <select
                                    value={contextType}
                                    onChange={(e) => setContextType(e.target.value)}
                                    className="bg-slate-800 border border-slate-700 text-sm rounded-lg p-2.5 focus:border-indigo-500 outline-none"
                                >
                                    <option value="PROFILE">My Profile</option>
                                    <option value="GROUP">A Group</option>
                                </select>
                            </div>

                            {contextType === 'PROFILE' ? (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Visibility</label>
                                    <select
                                        value={visibility}
                                        onChange={(e) => setVisibility(e.target.value)}
                                        className="bg-slate-800 border border-slate-700 text-sm rounded-lg p-2.5 focus:border-indigo-500 outline-none"
                                    >
                                        <option value="PUBLIC">Public</option>
                                        <option value="PRIVATE">Only Me</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Select Group</label>
                                    <select
                                        value={contextId}
                                        onChange={(e) => setContextId(e.target.value)}
                                        disabled={isLoadingGroups || userGroups.length === 0}
                                        className="bg-slate-800 border border-slate-700 text-sm rounded-lg p-2.5 focus:border-indigo-500 outline-none disabled:opacity-50"
                                    >
                                        {userGroups.length === 0 ? (
                                            <option value="">{isLoadingGroups ? 'Loading...' : 'No Groups Found'}</option>
                                        ) : (
                                            userGroups.map(g => <option key={g.id || g.idGroup} value={g.id || g.idGroup}>{g.name || g.groupName}</option>)
                                        )}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-xs mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="pt-4 border-t border-white/5 mt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 hover:bg-white/5 rounded-lg text-sm font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSharing || (contextType === 'GROUP' && !contextId)}
                            className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSharing ? 'Sharing...' : 'Share Now'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SharePostModal;
