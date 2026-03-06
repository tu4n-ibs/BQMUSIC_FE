import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, MessageCircle, Music, Play, Pause, MoreHorizontal, Share2 } from 'lucide-react';
import postService from '../../services/postService';
import likeService from '../../services/likeService';
import CommentSection from '../content/CommentSection';
import { getUserAvatar } from '../../utils/userUtils';
import { formatDate } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';
import './PostDetailModal.css';

const PostDetailModal = ({ isOpen, onClose, postId, onUpdate }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { playTrack, currentTrack, isPlaying } = usePlayer();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && postId) {
            fetchPostDetails();
        }
    }, [isOpen, postId]);

    const fetchPostDetails = async () => {
        if (postId === null || postId === undefined) {
            console.warn("PostDetailModal: fetchPostDetails called without postId");
            return;
        }
        setLoading(true);
        try {
            console.log("PostDetailModal: Fetching ID ->", postId);
            const response = await postService.getPostById(postId);
            console.log("PostDetailModal: API Response ->", response);

            const rawData = response.data?.data || response.data;

            if (!rawData || (typeof rawData === 'object' && Object.keys(rawData).length === 0)) {
                console.error("PostDetailModal: No data found for post:", postId);
                setPost(null);
                return;
            }

            // Standardize fields and handle variations (support nested song/target)
            // Use the ID from rawData if available, otherwise fallback to the postId prop
            const realId = rawData.id || rawData.postId || rawData.idPost || postId;
            const content = rawData.content || rawData.caption || "";

            // Try to find music and image from various possible paths (nested or flat)
            const songObj = rawData.song || rawData.target || {};
            const rawMusic = rawData.musicLink || rawData.musicUrl || rawData.songUrl || songObj.musicLink || songObj.musicUrl || songObj.targetUrl;
            const rawImage = rawData.imageUrl || rawData.postImage || rawData.songImgUrl || songObj.imageUrl || songObj.postImage;
            const songName = rawData.songName || songObj.name || songObj.title || "Original Audio";

            const imageUrl = rawImage ? (rawImage.startsWith('http') ? rawImage : `http://localhost:8080${rawImage}`) : null;
            const musicLink = rawMusic ? (rawMusic.startsWith('http') ? rawMusic : `http://localhost:8080${rawMusic}`) : null;

            // Handle author/user object nested or flat
            const author = rawData.user || {};
            const authorName = rawData.authorName || author.name || author.username || 'Unknown';
            const authorAvatar = getUserAvatar(rawData.authorAvatar || author.imageUrl || author.avatar);

            const formattedPost = {
                id: realId,
                content: content,
                imageUrl: imageUrl,
                musicLink: musicLink,
                songName: songName,
                authorName: rawData.userName || 'Unknown',
                authorAvatar: getUserAvatar(rawData.userImage),
                likeCount: rawData.likeCount || 0,
                commentCount: rawData.commentCount || 0,
                liked: rawData.isLiked || false,
                createdAt: rawData.timeCreated || new Date().toISOString(),
                targetType: rawData.targetType,
                albumData: rawData.postResponse // This contains the songs list from backend
            };

            console.log("PostDetailModal: Formatted Post ->", formattedPost);
            setPost(formattedPost);
        } catch (error) {
            console.error("PostDetailModal: Error loading post details ->", error);
            setPost(null);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLike = async () => {
        if (!post) return;
        try {
            console.log("PostDetailModal: Toggling like for ID ->", post.id);
            const response = await likeService.toggleLike(post.id);
            console.log("PostDetailModal: Like Response ->", response);

            // Standarize response to isLiked/likeCount
            const resultData = response.data?.data || response.data || {};
            const isLikedResult = resultData.isLiked;
            const likeCountResult = resultData.likeCount || 0;

            setPost(prev => ({ ...prev, liked: isLikedResult, likeCount: likeCountResult }));

            // Pass the standardized state BACK to parent (Profile/Feed)
            if (onUpdate) onUpdate(post.id, {
                liked: isLikedResult,
                isLiked: isLikedResult,
                likeCount: likeCountResult,
                likes: likeCountResult
            });
        } catch (error) {
            console.error("PostDetailModal: Error toggling like ->", error);
            alert(`Error during interaction (Like). ID used: ${post.id}. Please check console.`);
        }
    };

    const handlePlayMusic = () => {
        if (!post || !post.musicLink) return;
        playTrack({
            id: post.id,
            title: post.songName,
            artist: post.authorName,
            avatar: post.imageUrl || post.authorAvatar,
            url: post.musicLink
        });
    };

    const handleProfileClick = (authorId) => {
        if (authorId) {
            onClose && onClose(); // Close modal before navigating
            navigate(`/user/${authorId}`);
        }
    };

    const handleCommentAdded = () => {
        setPost(prev => {
            const newCount = (prev?.commentCount || 0) + 1;
            // Sync back to Feed/Profile
            if (onUpdate) onUpdate(post.id, { commentCount: newCount });
            return { ...prev, commentCount: newCount };
        });
    };

    if (!isOpen) return null;

    return (
        <div className="post-detail-overlay" onClick={onClose}>
            <button className="close-btn-absolute" onClick={onClose}>
                <X className="w-8 h-8 text-white" />
            </button>

            <div className="post-detail-modal" onClick={e => e.stopPropagation()}>
                {loading ? (
                    <div className="flex items-center justify-center h-[600px] w-full bg-slate-900/50 backdrop-blur-xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                ) : post ? (
                    <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
                        {/* Left Side: Media */}
                        <div className="lg:w-[60%] bg-black flex items-center justify-center relative group overflow-hidden">
                            {post.imageUrl ? (
                                <img
                                    src={post.imageUrl.toString().startsWith('http') ? post.imageUrl : `http://localhost:8080${post.imageUrl}`}
                                    alt="Post Content"
                                    className="max-h-full max-w-full object-contain"
                                />
                            ) : (
                                <div className="audio-placeholder animate-pulse-slow">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                                        <Music className="w-24 h-24 audio-icon-glow relative z-10" />
                                    </div>
                                    <span className="font-bold uppercase tracking-[0.3em] text-[10px] text-indigo-400/80">Premium Audio Experience</span>
                                </div>
                            )}

                            {post.musicLink && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none group-hover:bg-black/20 transition-all">
                                    <button
                                        onClick={handlePlayMusic}
                                        className={`pointer-events-auto p-6 rounded-full backdrop-blur-xl border border-white/30 transition-all transform shadow-2xl ${currentTrack?.id === post.id && isPlaying ? 'bg-indigo-500 scale-110' : 'bg-white/10 hover:bg-white/20 hover:scale-110'}`}
                                    >
                                        {currentTrack?.id === post.id && isPlaying ? (
                                            <Pause className="w-10 h-10 fill-white text-white" />
                                        ) : (
                                            <Play className="w-10 h-10 fill-white text-white ml-1" />
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Details & Comments */}
                        <div className="lg:w-[40%] flex flex-col bg-slate-950 border-l border-slate-800">
                            {/* Header */}
                            <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                <div
                                    className="flex items-center gap-3 cursor-pointer group"
                                    onClick={() => handleProfileClick(post.userId)}
                                >
                                    <img
                                        src={post.authorAvatar}
                                        alt=""
                                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/20 group-hover:border-indigo-500 transition-all"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{post.authorName}</span>
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                                            {formatDate(post.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-slate-800 rounded-full">
                                    <MoreHorizontal className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            {/* Content & Comments */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                                <div className="mb-8">
                                    <p className="post-content-text whitespace-pre-wrap">
                                        <span className="font-bold text-white mr-1">{post.authorName}</span>
                                        - {post.content}
                                    </p>
                                </div>

                                {post.targetType === 'ALBUM' && post.albumData?.songs && (
                                    <div className="album-tracklist-section mt-6 mb-8">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
                                            <Music className="w-3 h-3" /> TRACKLIST
                                        </h3>
                                        <div className="flex flex-col gap-2">
                                            {post.albumData.songs.map((song, index) => (
                                                <div
                                                    key={song.songId}
                                                    className={`track-item group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${currentTrack?.url?.includes(song.songId) ? 'bg-indigo-500/10 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                                                    onClick={() => {
                                                        const mUrl = song.musicUrl;
                                                        const musicLink = mUrl ? (mUrl.startsWith('http') ? mUrl : `http://localhost:8080${mUrl}`) : null;
                                                        if (!musicLink) return;
                                                        playTrack({
                                                            id: song.songId,
                                                            title: song.name,
                                                            artist: post.authorName,
                                                            avatar: post.imageUrl || post.authorAvatar,
                                                            url: musicLink
                                                        });
                                                    }}
                                                >
                                                    <span className="text-[10px] font-bold opacity-30 w-4">{index + 1}</span>
                                                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center relative overflow-hidden shrink-0">
                                                        {currentTrack?.url?.includes(song.songId) && isPlaying ? (
                                                            <div className="flex items-end gap-0.5 h-3">
                                                                <div className="w-0.5 bg-indigo-500 animate-[music-bar_0.6s_ease-in-out_infinite] h-full"></div>
                                                                <div className="w-0.5 bg-indigo-500 animate-[music-bar_0.8s_ease-in-out_infinite] h-2/3"></div>
                                                                <div className="w-0.5 bg-indigo-500 animate-[music-bar_0.7s_ease-in-out_infinite] h-5/6"></div>
                                                            </div>
                                                        ) : (
                                                            <Play className="w-3 h-3 fill-white text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-bold truncate ${currentTrack?.url?.includes(song.songId) ? 'text-indigo-400' : 'text-slate-200'}`}>
                                                            {song.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8">
                                    <CommentSection
                                        postId={post.id}
                                        totalComments={post.commentCount}
                                        onCommentAdded={handleCommentAdded}
                                    />
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 border-t border-slate-900 bg-slate-950">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-4">
                                        <Heart
                                            onClick={handleToggleLike}
                                            className={`w-7 h-7 cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 ${post.liked ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'text-slate-500 hover:text-rose-500'}`}
                                        />
                                        <MessageCircle className="w-7 h-7 text-slate-500 cursor-pointer hover:text-indigo-500 transition-colors" />
                                        <Share2 className="w-7 h-7 text-slate-500 cursor-pointer hover:text-indigo-500 transition-colors" />
                                    </div>
                                </div>
                                <div className="text-sm font-bold text-white">
                                    {post.likeCount.toLocaleString()} likes
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[400px] w-full bg-white dark:bg-slate-900">
                        <p className="text-slate-400">Post not found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostDetailModal;
