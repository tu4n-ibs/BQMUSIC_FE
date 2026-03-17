import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, MessageCircle, Music, Play, Pause, MoreHorizontal, Share2, ListMusic } from 'lucide-react';
import AddToPlaylistModal from './AddToPlaylistModal';
import SharePostModal from './SharePostModal';
import postService from '../../services/postService';
import likeService from '../../services/likeService';
import songService from '../../services/songService';
import CommentSection from '../content/CommentSection';
import { getUserAvatar } from '../../utils/userUtils';
import { formatDate } from '../../utils/dateUtils';
import { usePlayer } from '../../context/PlayerContext';
import { toast } from 'react-hot-toast';
import './PostDetailModal.css';

const PostDetailModal = ({ isOpen, onClose, postId, onUpdate }) => {
    const navigate = useNavigate();
    const { playTrack, currentTrack, isPlaying, isPaused } = usePlayer();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showTrackMenu, setShowTrackMenu] = useState(null);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [songToPlaylist, setSongToPlaylist] = useState({ id: null, name: '' });
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [postToShare, setPostToShare] = useState(null);

    useEffect(() => {
        if (isOpen && postId) {
            fetchPostDetails();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            const rawImage = rawData.imageUrl || rawData.postImage || rawData.songImgUrl || rawData.imageUrlAlbum || rawData.postResponse?.imageUrl || songObj.imageUrl || songObj.postImage;
            const songName = rawData.songName || songObj.name || songObj.title || "Original Audio";

            const targetId = rawData.targetId || rawData.idSong || rawData.idAlbum || songObj.id;

            const imageUrl = rawImage ? (rawImage.startsWith('http') ? rawImage : `${process.env.REACT_APP_API_BASE_URL}${rawImage}`) : null;
            const musicLink = rawMusic ? (rawMusic.startsWith('http') ? rawMusic : `${process.env.REACT_APP_API_BASE_URL}${rawMusic}`) : null;

            // Handle author/user object nested or flat

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
                createdAt: rawData.timeCreated || new Date().toISOString(),
                targetType: rawData.targetType,
                targetId: targetId,
                idSong: rawData.idSong || (rawData.targetType === 'SONG' ? targetId : null),
                idAlbum: rawData.idAlbum || (rawData.targetType === 'ALBUM' ? targetId : null),
                liked: rawData.isLiked !== undefined ? rawData.isLiked : rawData.liked,
                playCount: rawData.playCount || 0,
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

        // Optimistic UI update
        const oldState = { ...post };
        const newIsLiked = !(post.liked || post.isLiked);
        const newLikeCount = (post.likeCount || 0) + (newIsLiked ? 1 : -1);

        setPost(prev => ({
            ...prev,
            liked: newIsLiked,
            isLiked: newIsLiked,
            likeCount: newLikeCount
        }));

        try {
            const response = await likeService.toggleLike(post.id);

            // Standardize response extraction
            const apiData = response.data || response;
            const resultData = apiData.data || apiData;

            const isLikedResult = resultData.liked !== undefined ? resultData.liked : resultData.isLiked;
            const likeCountResult = resultData.likeCount !== undefined ? resultData.likeCount : (resultData.likes || 0);

            // Update with real server data
            setPost(prev => ({ ...prev, liked: isLikedResult, isLiked: isLikedResult, likeCount: likeCountResult }));

            // Sync with parent
            if (onUpdate) onUpdate(post.id, {
                liked: isLikedResult,
                isLiked: isLikedResult,
                likeCount: likeCountResult,
                likes: likeCountResult
            });
        } catch (error) {
            console.error("PostDetailModal: Error toggling like ->", error);
            // Revert on error
            setPost(oldState);
            toast.error("Failed to update like status");
        }
    };

    const handlePlayMusic = async () => {
        if (!post) return;

        // 1. Handle Album Context
        if (post.targetType === 'ALBUM' && post.albumData?.songs) {
            const albumQueue = post.albumData.songs.map(song => ({
                id: song.songId,
                title: song.name,
                artist: post.authorName,
                avatar: song.imageUrl || post.imageUrl || post.authorAvatar,
                url: null // We'll fetch on play
            }));

            if (albumQueue.length > 0) {
                const firstSong = albumQueue[0];
                try {
                    const res = await songService.getSongById(firstSong.id);
                    const fullSong = res.data?.data || res.data;
                    const musicLink = fullSong?.musicUrl ? (fullSong.musicUrl.startsWith('http') ? fullSong.musicUrl : `${process.env.REACT_APP_API_BASE_URL}${fullSong.musicUrl}`) : null;
                    
                    if (musicLink) {
                        firstSong.url = musicLink;
                        playTrack(firstSong, albumQueue, 0);
                        return;
                    }
                } catch (err) {
                    console.error("Failed to fetch first song for album queue:", err);
                    toast.error("Could not load music stream");
                }
            }
        }

        // 2. Handle Single Song Context
        let songId = post.idSong || post.id;
        let musicLink = post.musicLink;
        let songMetadata = null;

        try {
            const res = await songService.getSongById(songId);
            songMetadata = res.data?.data || res.data;
            musicLink = songMetadata?.musicUrl || musicLink;
        } catch (err) {
            console.error("Failed to fetch song details for playback:", err);
        }

        musicLink = musicLink ? (musicLink.startsWith('http') ? musicLink : `${process.env.REACT_APP_API_BASE_URL}${musicLink}`) : null;
        if (!musicLink) {
            toast.error("Music source not available");
            return;
        }

        playTrack({
            id: songId,
            title: songMetadata?.name || post.songName,
            artist: songMetadata?.artistName || post.authorName,
            avatar: songMetadata?.imageUrl || post.imageUrl || post.authorAvatar,
            url: musicLink
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
                                    src={post.imageUrl.toString().startsWith('http') ? post.imageUrl : `${process.env.REACT_APP_API_BASE_URL}${post.imageUrl}`}
                                    alt="Post Content"
                                    className="max-h-full max-w-full object-contain"
                                />
                            ) : (
                                <img
                                    src={post.authorAvatar}
                                    alt="Post Author"
                                    className="max-h-full max-w-full object-contain opacity-50 blur-[2px]"
                                />
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
                            </div>

                            {/* Content & Comments */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                                {post.content && (
                                    <div className="mb-8">
                                        <p className="post-content-text whitespace-pre-wrap">
                                            <span className="font-bold text-white mr-1">{post.authorName}</span>
                                            - {post.content}
                                        </p>
                                    </div>
                                )}

                                {post.targetType === 'ALBUM' && post.albumData?.songs && (
                                    <div className="album-tracklist-section mt-6 mb-8">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
                                            <Music className="w-3 h-3" /> TRACKLIST
                                        </h3>
                                        <div className="flex flex-col gap-2">
                                            {post.albumData.songs.map((song, index) => {
                                                const isActive = currentTrack?.id === song.songId;
                                                const trackImage = song.imageUrl ? (song.imageUrl.startsWith('http') ? song.imageUrl : `${process.env.REACT_APP_API_BASE_URL}${song.imageUrl}`) : (post.imageUrl || post.authorAvatar);

                                                return (
                                                    <div
                                                        key={song.songId}
                                                        className={`track-item group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer relative ${isActive ? 'bg-indigo-500/10 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                                                        onClick={async () => {
                                                            let musicLink = song.musicUrl;
                                                            if (!musicLink) {
                                                                try {
                                                                    const res = await songService.getSongById(song.songId);
                                                                    const fullSong = res.data?.data || res.data;
                                                                    musicLink = fullSong?.musicUrl;
                                                                } catch (error) {
                                                                    console.error("Failed to fetch song details:", error);
                                                                    return;
                                                                }
                                                            }
                                                            musicLink = musicLink ? (musicLink.startsWith('http') ? musicLink : `${process.env.REACT_APP_API_BASE_URL}${musicLink}`) : null;
                                                            if (!musicLink) return;

                                                            playTrack({
                                                                id: song.songId,
                                                                title: song.name,
                                                                artist: post.authorName,
                                                                avatar: trackImage,
                                                                url: musicLink
                                                            });
                                                        }}
                                                    >
                                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                                            <img src={trackImage} alt="" className="w-full h-full object-cover" />
                                                            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-indigo-500/40 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'}`}>
                                                                {isActive && !isPaused ? (
                                                                    <div className="flex gap-0.5 items-end h-3">
                                                                        <div className="w-0.5 bg-white animate-[pulse_0.6s_ease-in-out_infinite]" style={{ height: '60%' }}></div>
                                                                        <div className="w-0.5 bg-white animate-[pulse_0.8s_ease-in-out_infinite]" style={{ height: '100%' }}></div>
                                                                        <div className="w-0.5 bg-white animate-[pulse_0.7s_ease-in-out_infinite]" style={{ height: '80%' }}></div>
                                                                    </div>
                                                                ) : (
                                                                    <Play className="w-4 h-4 fill-white text-white" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-sm font-bold truncate transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-200 group-hover:text-white'}`}>
                                                                {song.name}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Track {index + 1}</span>
                                                                <span className="flex items-center gap-1 text-[9px] text-indigo-400/70 font-bold">
                                                                    <Play className="w-2 h-2 fill-current" />
                                                                    {(song.playCount || 0).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Action Menu Button */}
                                                        <div className="relative">
                                                            <button
                                                                className={`p-2 rounded-full transition-all ${showTrackMenu === song.songId ? 'bg-indigo-500/20 text-indigo-400' : 'opacity-0 group-hover:opacity-100 text-slate-500 hover:bg-white/10 hover:text-white'}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowTrackMenu(showTrackMenu === song.songId ? null : song.songId);
                                                                }}
                                                            >
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </button>

                                                            {/* Dropdown Menu */}
                                                            {showTrackMenu === song.songId && (
                                                                <>
                                                                    <div className="fixed inset-0 z-[110]" onClick={() => setShowTrackMenu(null)}></div>
                                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 z-[120] animate-in fade-in zoom-in-95 duration-200">
                                                                        <button
                                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-indigo-500/20 transition-all uppercase tracking-wider"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSongToPlaylist({ id: song.songId, name: song.name });
                                                                                setIsPlaylistModalOpen(true);
                                                                                setShowTrackMenu(null);
                                                                            }}
                                                                        >
                                                                            <ListMusic className="w-4 h-4" />
                                                                            Add to Playlist
                                                                        </button>
                                                                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all uppercase tracking-wider">
                                                                            <Share2 className="w-4 h-4" />
                                                                            Share Track
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
                                <div className="flex items-center justify-between mb-3 relative">
                                    <div className="flex items-center gap-4">
                                        <Heart
                                            onClick={handleToggleLike}
                                            className={`w-7 h-7 cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 ${post.liked ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'text-slate-500 hover:text-rose-500'}`}
                                        />
                                        <MessageCircle className="w-7 h-7 text-slate-500 cursor-pointer hover:text-indigo-500 transition-colors" />
                                        <Share2
                                            onClick={() => {
                                                setPostToShare(post);
                                                setIsShareModalOpen(true);
                                            }}
                                            className="w-7 h-7 text-slate-500 cursor-pointer hover:text-indigo-500 transition-colors"
                                        />
                                    </div>

                                    {(post.targetType === 'SONG' || post.targetType === 'ALBUM' || post.targetType === 'SHARE' || post.songName) && (
                                        <div className="relative">
                                            <button
                                                className={`p-2 rounded-full transition-colors ${showTrackMenu === post.id ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowTrackMenu(showTrackMenu === post.id ? null : post.id);
                                                }}
                                            >
                                                <MoreHorizontal className="w-6 h-6" />
                                            </button>

                                            {showTrackMenu === post.id && (
                                                <>
                                                    <div className="fixed inset-0 z-[110]" onClick={(e) => { e.stopPropagation(); setShowTrackMenu(null); }}></div>
                                                    <div
                                                        className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl py-2 z-[120] animate-in fade-in slide-in-from-bottom-2 duration-200"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <button
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-indigo-500/20 transition-all uppercase tracking-wider text-left"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Use the actual song ID (targetId or idSong) instead of the post ID
                                                                const songIdToAdd = post.targetType === 'SONG' ? (post.idSong || post.targetId) : post.idSong;

                                                                if (!songIdToAdd && post.targetType !== 'ALBUM') {
                                                                    toast.error("Could not find song ID for this post.");
                                                                    return;
                                                                }

                                                                setSongToPlaylist({
                                                                    id: songIdToAdd,
                                                                    name: post.songName || "Track"
                                                                });
                                                                setIsPlaylistModalOpen(true);
                                                                setShowTrackMenu(null);
                                                            }}
                                                        >
                                                            <ListMusic className="w-4 h-4" />
                                                            Add to Playlist
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-sm font-bold text-white">
                                    <span>{post.likeCount.toLocaleString()} likes</span>
                                    {post.targetType === 'SONG' && (
                                        <span className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                                            <Play className="w-3 h-3 fill-current" />
                                            {(post.playCount || 0).toLocaleString()} plays
                                        </span>
                                    )}
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
            {/* Playlist Modal Integration */}
            <AddToPlaylistModal
                isOpen={isPlaylistModalOpen}
                onClose={() => setIsPlaylistModalOpen(false)}
                songId={songToPlaylist.id}
                songName={songToPlaylist.name}
            />
            {/* Share Modal Integration */}
            <SharePostModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                post={postToShare}
                onShareSuccess={() => {
                    // Update external state if necessary
                }}
            />
        </div>
    );
};

export default PostDetailModal;
