import React from 'react';
import { Play, Pause, Music, Heart, MessageCircle, Share2, Disc } from 'lucide-react';
import CommentSection from './CommentSection';
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
    onNavigateToGroup
}) => {
    // Normalize data between different API response structures
    const id = post.id || post.idPost;
    const username = post.username;
    const userAvatar = post.userAvatar || post.imageUrlUser || 'https://i.pravatar.cc/150';
    const authorId = post.authorId || post.idUser;
    const postImage = (post.postImage ? (post.postImage.startsWith('http') ? post.postImage : `${process.env.REACT_APP_API_BASE_URL}${post.postImage}`) : null) ||
        (post.imageUrlSong ? (post.imageUrlSong.startsWith('http') ? post.imageUrlSong : `${process.env.REACT_APP_API_BASE_URL}${post.imageUrlSong}`) :
            (post.imageUrlAlbum || post.albumImageUrl) ? (
                (post.imageUrlAlbum || post.albumImageUrl).startsWith('http') ? (post.imageUrlAlbum || post.albumImageUrl) : `${process.env.REACT_APP_API_BASE_URL}${(post.imageUrlAlbum || post.albumImageUrl)}`
            ) : DEFAULT_COVER_URL);

    const caption = post.caption || post.content || post.contentShare;
    const likeCount = post.likes !== undefined ? post.likes : (post.likeCount || 0);
    const commentCount = post.commentCount || 0;
    const isLiked = post.isLiked || post.liked || false;

    const idSong = post.idSong;
    const idAlbum = post.idAlbum;
    const playCount = post.playCount || 0;
    const isCurrentPlaying = currentTrack?.id === (idSong || id) && isPlaying;

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
                        </div>
                    </div>
                </div>

                {post.postType === 'SHARE' && (
                    <div
                        className="mt-2 ml-13 flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-400 cursor-pointer transition-colors border-t border-white/5 pt-2 px-5"
                        onClick={() => onPostClick(post.idPostShare || post.id)}
                    >
                        <Share2 className="w-3 h-3" />
                        <span>Shared from </span>
                        <span className="font-bold text-indigo-400">{post.userNameShare || 'User'}</span>
                        <span>'s post</span>
                    </div>
                )}
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
        </article>
    );
};

export default PostItem;
