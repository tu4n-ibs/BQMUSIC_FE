import { useState, useEffect, useCallback } from 'react';
import { Send, Reply, Edit2, Trash2, ChevronDown, ChevronUp, MoreVertical, X } from 'lucide-react';
import commentService from '../../services/commentService';
import { getUserAvatar } from '../../utils/userUtils';
import { useAuth } from '../../context/AuthContext';
import './CommentSection.css';

/**
 * CommentSection Component
 * Handles displaying, creating, editing, and deleting comments for a post.
 */
const CommentSection = ({ postId, onClose }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState('');
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

            const data = response.data?.data || response.data;
            const content = data.content || data || [];

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
            setReplyTo(null);
            fetchRootComments(); // Refresh list
        } catch (error) {
            console.error("Error sending comment:", error);
            alert("Failed to send comment. Please try again.");
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

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await commentService.deleteComment(commentId);
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
                    const replies = response.data?.content || response.data || [];

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

    const CommentItem = ({ comment, depth = 1, parentDepth = 0 }) => (
        <div className={`comment-item h-auto ${(depth > 1 && depth > parentDepth) ? 'ml-6 border-l-2 border-slate-200 dark:border-slate-700 pl-4 mt-3' : 'mt-5'}`}>
            <div className="flex gap-2">
                <img
                    src={getUserAvatar(comment.userImageUrl)}
                    alt={comment.userName}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div className="flex-1">
                    <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-2xl relative">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {comment.userName || 'Anonymous'}
                            </span>
                            {user?.id === comment.userId && (
                                <div className="group relative">
                                    <button className="p-1 hover:bg-black/5 rounded-full">
                                        <MoreVertical className="w-3 h-3 text-slate-400" />
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-slate-100 dark:border-slate-700 z-10 py-1 min-w-[100px]">
                                        <button
                                            onClick={() => handleStartEdit(comment)}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                        >
                                            <Edit2 className="w-3 h-3" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-[13px] text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                            {comment.content}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mt-1 ml-2 text-[11px] font-bold text-slate-500">
                        <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
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
                    {expandedReplies[comment.id] && comment.replies && comment.replies.map(reply => (
                        <CommentItem key={reply.id} comment={reply} depth={Math.min(depth + 1, 3)} parentDepth={depth} />
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="comment-section-container animate-fade-in">
            <div className="flex items-center justify-between mb-4 px-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Comments <span className="text-xs font-normal text-slate-400">({comments.length})</span>
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

            <form onSubmit={editingComment ? handleUpdateComment : handleSendComment} className="comment-form">
                {replyTo && (
                    <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-t-xl border-b border-indigo-100 dark:border-indigo-900/30">
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                            Replying to <strong>@{replyTo.username}</strong>
                        </span>
                        <button onClick={() => setReplyTo(null)} className="text-indigo-400 hover:text-indigo-600">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
                {editingComment && (
                    <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-t-xl border-b border-amber-100 dark:border-amber-900/30">
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">
                            Editing comment
                        </span>
                        <button onClick={() => { setEditingComment(null); setContent(''); }} className="text-amber-400 hover:text-amber-600">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
                <div className="flex items-end gap-2 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-1 resize-none max-h-32 min-h-[40px]"
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
                        className={`p-2 rounded-xl transition-all ${content.trim() ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:scale-105' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CommentSection;
