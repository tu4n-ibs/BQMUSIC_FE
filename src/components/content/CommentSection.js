import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Reply, Edit2, Trash2, ChevronDown, ChevronUp, MoreVertical, X } from 'lucide-react';
import commentService from '../../services/commentService';
import { getUserAvatar } from '../../utils/userUtils';
import { formatDate } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorUtils';
import ConfirmModal from '../common/ConfirmModal';
import { toast } from 'react-hot-toast';
import './CommentSection.css';

/**
 * CommentSection Component
 * Handles displaying, creating, editing, and deleting comments for a post.
 */
const CommentSection = ({ postId, onClose, totalComments, onCommentAdded }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [replyTo, setReplyTo] = useState(null); // { id, username }
    const [editingComment, setEditingComment] = useState(null); // { id, content }
    const [expandedReplies, setExpandedReplies] = useState({}); // { commentId: boolean }

    const fetchRootComments = useCallback(async () => {
        if (!postId) {
            console.warn("CommentSection: fetchRootComments called without postId");
            return;
        }
        setLoading(true);
        try {
            console.log("CommentSection: Fetching comments for PostID ->", postId);
            const response = await commentService.getPostComments(postId, 0, 50);
            console.log("CommentSection: API Response ->", response);

            const data = response.data?.data;
            const content = data?.content || [];

            if (Array.isArray(content)) {
                setComments(content);
            } else {
                console.warn("CommentSection: Received non-array content", content);
                setComments([]);
            }
        } catch (error) {
            console.error("CommentSection: Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        if (postId) {
            fetchRootComments();
        }
    }, [postId, fetchRootComments]);

    const handleSendComment = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        try {
            const commentData = {
                content: content.trim(),
                postId: postId,
                parentCommentId: replyTo ? replyTo.id : null
            };

            await commentService.createComment(commentData);
            setContent('');

            if (replyTo) {
                const parentId = replyTo.id;
                // Auto expand parent
                setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
                // Fetch replies for this parent immediately
                try {
                    const repliesResponse = await commentService.getReplies(parentId);
                    const repliesData = repliesResponse.data?.data;
                    const replies = repliesData?.content || [];
                    setComments(prev => updateRepliesInList(prev, parentId, replies));
                } catch (err) {
                    console.error("Error refreshing replies after post:", err);
                }
            } else {
                fetchRootComments(); // Refresh root list if not a reply
            }

            setReplyTo(null);
            if (onCommentAdded) onCommentAdded();
        } catch (error) {
            console.error("Error sending comment:", error);
            toast.error("Failed to send comment. Please try again.");
        }
    };

    const handleStartEdit = (comment) => {
        setEditingComment({ id: comment.id, content: comment.content });
        setContent(comment.content);
    };

    const handleUpdateComment = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        try {
            await commentService.updateComment(editingComment.id, { content: content.trim() });
            setEditingComment(null);
            setContent('');
            fetchRootComments();
        } catch (error) {
            console.error("Error updating comment:", error);
        }
    };

    const handleDeleteComment = (commentId) => {
        setCommentToDelete(commentId);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        const id = commentToDelete;
        if (!id) return;
        try {
            await commentService.deleteComment(id);
            fetchRootComments();
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    const toggleReplies = async (commentId) => {
        const isExpanded = expandedReplies[commentId];

        if (!isExpanded) {
            // Check if replies are already loaded
            const comment = findCommentById(comments, commentId);
            if (comment && (!comment.replies || comment.replies.length === 0) && comment.replyCount > 0) {
                try {
                    const response = await commentService.getReplies(commentId);
                    const data = response.data?.data;
                    const replies = data?.content || [];

                    setComments(prev => updateRepliesInList(prev, commentId, replies));
                } catch (error) {
                    console.error("Error fetching replies:", error);
                }
            }
            setExpandedReplies({ ...expandedReplies, [commentId]: true });
        } else {
            setExpandedReplies({ ...expandedReplies, [commentId]: false });
        }
    };

    const findCommentById = (list, id) => {
        for (const item of list) {
            if (item.id === id) return item;
            if (item.replies) {
                const found = findCommentById(item.replies, id);
                if (found) return found;
            }
        }
        return null;
    };

    const updateRepliesInList = (list, id, replies) => {
        return list.map(item => {
            if (item.id === id) {
                return { ...item, replies };
            }
            if (item.replies) {
                return { ...item, replies: updateRepliesInList(item.replies, id, replies) };
            }
            return item;
        });
    };

    const handleProfileClick = (userId) => {
        if (userId) {
            onClose && onClose();
            navigate(`/user/${userId}`);
        }
    };

    const CommentItem = ({ comment, depth = 1, parentDepth = 0 }) => (
        <div className={`comment-item h-auto ${(depth > 1 && depth > parentDepth) ? 'ml-6 border-l-2 border-slate-800 pl-4 mt-3' : 'mt-5'}`}>
            <div className="flex gap-2">
                <img
                    src={getUserAvatar(comment.userImageUrl)}
                    alt={comment.userName}
                    className="w-8 h-8 rounded-full object-cover shrink-0 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                    onClick={() => handleProfileClick(comment.userId)}
                />
                <div className="flex-1">
                    <div className="bg-slate-900/50 p-3 rounded-2xl relative border border-slate-800">
                        <div className="flex justify-between items-start">
                            <span
                                className="text-xs font-bold text-white cursor-pointer hover:text-indigo-400 transition-colors"
                                onClick={() => handleProfileClick(comment.userId)}
                            >
                                {comment.userName || 'Anonymous'}
                            </span>
                            {user?.id === comment.userId && (
                                <div className="group relative">
                                    <button className="p-1 hover:bg-black/5 rounded-full">
                                        <MoreVertical className="w-3 h-3 text-slate-400" />
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-slate-900 shadow-xl rounded-lg border border-slate-800 z-10 py-1 min-w-[100px]">
                                        <button
                                            onClick={() => handleStartEdit(comment)}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-center gap-2"
                                        >
                                            <Edit2 className="w-3 h-3" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-red-900/20 text-red-500 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-[13px] text-slate-300 mt-1 leading-relaxed">
                            {comment.content}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mt-1 ml-2 text-[11px] font-bold text-slate-500">
                        <span>{formatDate(comment.createdAt)}</span>
                        <button
                            onClick={() => {
                                setReplyTo({ id: comment.id, username: comment.userName });
                                setEditingComment(null);
                                setContent('');
                            }}
                            className="hover:text-indigo-500 flex items-center gap-1"
                        >
                            <Reply className="w-3 h-3" /> Reply
                        </button>
                        {comment.replyCount > 0 && (
                            <button
                                onClick={() => toggleReplies(comment.id)}
                                className="hover:text-indigo-500 flex items-center gap-1"
                            >
                                {expandedReplies[comment.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                            </button>
                        )}
                    </div>

                    {/* Replies - Recursive rendering with depth logic */}
                    {expandedReplies[comment.id] && Array.isArray(comment.replies) && comment.replies.map(reply => (
                        <CommentItem key={reply.id} comment={reply} depth={Math.min(depth + 1, 3)} parentDepth={depth} />
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="comment-section-container animate-fade-in">
            <div className="flex items-center justify-between mb-4 px-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Comments <span className="text-xs font-normal text-slate-500">({totalComments !== undefined ? totalComments : comments.length})</span>
                </h4>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                )}
            </div>

            <div className="comments-list max-h-[400px] overflow-y-auto mb-4 pr-2 custom-scrollbar">
                {loading && <div className="text-center py-4 text-xs text-slate-400">Loading comments...</div>}
                {!loading && comments.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400">No comments yet. Be the first to share!</div>
                )}
                {comments.map(comment => (
                    <CommentItem key={comment.id} comment={comment} />
                ))}
            </div>

            <form onSubmit={editingComment ? handleUpdateComment : handleSendComment} className="comment-form-v2">
                {replyTo && (
                    <div className="flex items-center justify-between bg-indigo-500/10 px-4 py-2 rounded-t-2xl border-b border-white/5">
                        <span className="text-[10px] text-indigo-400">
                            Replying to <span className="font-bold text-indigo-300">@{replyTo.username}</span>
                        </span>
                        <button onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-white transition-colors">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
                {editingComment && (
                    <div className="flex items-center justify-between bg-amber-500/10 px-4 py-2 rounded-t-2xl border-b border-white/5">
                        <span className="text-[10px] text-amber-400">
                            Editing your comment
                        </span>
                        <button onClick={() => { setEditingComment(null); setContent(''); }} className="text-slate-500 hover:text-white transition-colors">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
                <div className="comment-input-wrapper">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={replyTo ? "Share your thoughts..." : "Join the conversation..."}
                        className="comment-textarea"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                editingComment ? handleUpdateComment(e) : handleSendComment(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!content.trim()}
                        className={`comment-send-btn ${content.trim() ? 'active' : ''}`}
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CommentSection;
