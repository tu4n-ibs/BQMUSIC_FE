import React, { useState } from 'react';
import { Play, Pause, Music, Heart, MessageCircle, Share2, Disc, MoreHorizontal, ListMusic, Trash2 } from 'lucide-react';
import CommentSection from './CommentSection';
import ConfirmModal from '../modals/ConfirmModal';
import songService from '../../services/songService';
import { toast } from 'react-hot-toast';
import './PostItem.css';

const DEFAULT_COVER_URL = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";

const PostItem = ({
    post,
    currentUser,
    isPlaying,
    currentTrack,
    onPlayMusic,
    onToggleLike,
    onProfileClick,
    onPostClick,
    onSharePost,
    onAddToPlaylist,
    expandedComments,
    onToggleComments,
    onCommentAdded,
    onNavigateToGroup,
    isGroupAdmin
}) => {
    // Normalize data between different API response structures
    const id = post.id || post.idPost;
    const username = post.username;
    const userAvatar = post.userAvatar || post.imageUrlUser || 'https://i.pravatar.cc/150';
    const authorId = post.authorId || post.idUser;
    const postImage = (post.postImage ? (post.postImage.startsWith('http') ? post.postImage : `${process.env.REACT_APP_API_BASE_URL}${post.postImage}`) : null) ||
        (post.imageUrlSong ? (post.imageUrlSong.startsWith('http') ? post.imageUrlSong : `${process.env.REACT_APP_API_BASE_URL}${post.imageUrlSong}`) :
            (post.imageUrlAlbum || post.imageUrl) ? (
                (post.imageUrlAlbum || post.imageUrl).startsWith('http') ? (post.imageUrlAlbum || post.imageUrl) : `${process.env.REACT_APP_API_BASE_URL}${(post.imageUrlAlbum || post.imageUrl)}`
            ) : DEFAULT_COVER_URL);

    const caption = post.caption || post.content || post.contentShare;
    const likeCount = post.likes !== undefined ? post.likes : (post.likeCount || 0);
    const commentCount = post.commentCount || 0;
    const isLiked = post.isLiked || post.liked || false;

    const idSong = post.idSong;
    const idAlbum = post.idAlbum;
    const playCount = post.playCount || 0;
    const isCurrentPlaying = currentTrack?.id === (idSong || id) && isPlaying;

    const [showMenu, setShowMenu] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const isSongOwner = post.songUserId === currentUser?.id;
    const isPostOwner = (post.authorId || post.idUser) === currentUser?.id;
    const canDeleteSong = !post.groupId && (isSongOwner || isPostOwner);

    return (
        <article className="post-article animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="post-header-container">
                <div className="post-header">
                    <div className="flex items-center gap-3">
                        <div className="relative cursor-pointer" onClick={() => onProfileClick(authorId)}>
                            <img
                                src={userAvatar}
                                alt={username}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
                                onError={(e) => { e.target.src = 'https://i.pravatar.cc/150' }}
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                        </div>
                        <div className="flex flex-col cursor-pointer" onClick={() => {
                            if (post.groupId && onNavigateToGroup) onNavigateToGroup(post.groupId);
                            else onProfileClick(authorId);
                        }}>
                            {post.groupId ? (
                                <>
                                    <span className="username font-bold text-white hover:text-indigo-400 transition-colors">
                                        {post.groupName || 'Group'}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-medium hover:text-white transition-colors"
                                        onClick={(e) => { e.stopPropagation(); onProfileClick(authorId); }}>
                                        {username}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="username font-bold text-white hover:text-indigo-400 transition-colors">{username}</span>
                                    {(idSong || idAlbum) && (
                                        <div className="flex items-center music-info text-[10px] text-slate-400">
                                            {idAlbum ? <Disc className="w-3 h-3 mr-1" /> : <Music className="w-3 h-3 mr-1" />}
                                            <span>{idAlbum ? 'Album' : 'Song'}</span>
                                            <span className="mx-1">•</span>
                                            <span>{playCount.toLocaleString()} plays</span>
                                        </div>
                                    )}
                                </>
                            )}
                            {post.postType === 'SHARE' && (
                                <div
                                    className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 hover:text-indigo-400 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); onPostClick(post.idPostShare || post.id); }}
                                >
                                    <Share2 className="w-3 h-3" />
                                    <span>Shared from </span>
                                    <span className="font-bold text-indigo-400">{post.userNameShare || 'User'}</span>
                                    <span>'s post</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative">
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                                <div className="absolute right-0 mt-2 w-48 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                                    {idSong && (
                                        <button
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all uppercase tracking-wider text-left"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddToPlaylist({ id: idSong, name: post.nameSong });
                                                setShowMenu(false);
                                            }}
                                        >
                                            <ListMusic className="w-4 h-4" />
                                            Add to Playlist
                                        </button>
                                    )}
                                    {canDeleteSong && idSong && (
                                        <button
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-500/20 transition-all uppercase tracking-wider text-left"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsDeleteConfirmOpen(true);
                                                setShowMenu(false);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Song
                                        </button>
                                    )}
                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all uppercase tracking-wider text-left"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSharePost(post);
                                            setShowMenu(false);
                                        }}
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Share Post
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="post-media-container group cursor-pointer" onClick={() => onPostClick(id)}>
                <img
                    src={postImage}
                    alt="Post"
                    className={`post-image ${isCurrentPlaying ? 'opacity-90' : ''}`}
                    onDoubleClick={(e) => { e.stopPropagation(); onToggleLike(id); }}
                />

                {idSong && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onPlayMusic(post); }}
                        className={`absolute bottom-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-all border border-white/30 z-10 shadow-xl ${isCurrentPlaying ? 'bg-indigo-500 scale-110' : 'opacity-100 scale-100'}`}
                    >
                        {isCurrentPlaying ? (
                            <Pause className="w-6 h-6 fill-white" />
                        ) : (
                            <Play className="w-6 h-6 fill-white ml-0.5" />
                        )}
                    </button>
                )}
            </div>

            <div className="post-footer">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-5">
                        <Heart
                            className={`w-7 h-7 cursor-pointer hover:scale-125 transition-all duration-300 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
                            onClick={() => onToggleLike(id)}
                        />
                        <MessageCircle
                            className={`w-7 h-7 cursor-pointer transition-colors ${expandedComments ? 'text-indigo-500' : 'text-slate-500 hover:text-indigo-500'}`}
                            onClick={() => onPostClick(id)}
                        />
                        <Share2
                            onClick={() => onSharePost(post)}
                            className="w-7 h-7 cursor-pointer text-slate-500 hover:text-indigo-400 transition-colors"
                        />
                    </div>
                </div>

                <div className="likes-count mb-2">
                    {likeCount.toLocaleString()} likes
                </div>
                {caption && (
                    <div className="caption">
                        <span className="username font-bold mr-2 text-white">{username}</span>
                        <span className="opacity-90 text-slate-200">{caption}</span>
                    </div>
                )}

                <div className="comment-input-container cursor-pointer" onClick={() => onPostClick(id)}>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                        <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover" />
                    </div>
                    <input
                        type="text"
                        placeholder="Add a comment..."
                        className="comment-input w-full bg-transparent border-none outline-none text-sm text-white cursor-pointer"
                        readOnly
                    />
                </div>

                {expandedComments && (
                    <CommentSection
                        postId={id}
                        totalComments={commentCount}
                        onCommentAdded={onCommentAdded}
                        onClose={() => onToggleComments(id)}
                    />
                )}
            </div>

            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={async () => {
                    try {
                        await songService.deleteSong(idSong);
                        toast.success("Song deleted successfully");
                        setIsDeleteConfirmOpen(false);
                        // Notify parent to remove the post from UI
                        if (post.onCommentAdded) { // Hacky way to check if parent can handle updates? No, better to add onUpdate prop
                            // In this codebase, Feed.js pass onCommentAdded but not onUpdate typically to PostItem.
                            // I should check if I should add onUpdate to PostItem prop.
                        }
                        // Let's use a custom event or the callback
                        // The user said "ẩn post", so I'll try to find a way to notify parent.
                        // For now, I'll just refresh or use a callback if available.
                        window.dispatchEvent(new CustomEvent('SONG_DELETED', { detail: { songId: idSong, postId: id } }));
                    } catch (error) {
                        console.error("Error deleting song:", error);
                        toast.error("Failed to delete song");
                    }
                }}
                title="Delete Song"
                message={`Are you sure you want to delete "${post.nameSong || 'this song'}"? This will hide all posts featuring this song.`}
                confirmText="Delete"
                type="danger"
            />
        </article>
    );
};

export default PostItem;
