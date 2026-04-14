import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import {
    Users, Info, Shield, MessageSquare, Globe, Calendar, Lock,
    Check, X, UserPlus, ShieldCheck
} from 'lucide-react';
import SharePostModal from '../../components/modals/SharePostModal';
import PostDetailModal from '../../components/modals/PostDetailModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import PostItem from '../../components/content/PostItem';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import groupService from '../../services/groupService';
import postService from '../../services/postService';
import songService from '../../services/songService';
import { toast } from 'react-hot-toast';
import likeService from '../../services/likeService';
import AddToPlaylistModal from '../../components/modals/AddToPlaylistModal';
import { usePlayer } from '../../context/PlayerContext';
import { getUserAvatar } from '../../utils/userUtils';
import { formatDate } from '../../utils/dateUtils';
import PageLoader from '../../components/common/PageLoader';
import './css/Groups.css';

const GroupDetail = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [posts, setPosts] = useState([]);
    const [pendingPosts, setPendingPosts] = useState([]);
    const [isLoadingPending, setIsLoadingPending] = useState(false);
    const [isReviewingPost, setIsReviewingPost] = useState(false);
    const [reviewingPostId, setReviewingPostId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('discussion');
    const [isJoining, setIsJoining] = useState(false);
    const [joinMessage, setJoinMessage] = useState('');
    const [joinError, setJoinError] = useState('');
    const [isLeaving, setIsLeaving] = useState(false);
    const [leaveMessage, setLeaveMessage] = useState('');
    const [leaveError, setLeaveError] = useState('');
    const [isTogglingPrivacy, setIsTogglingPrivacy] = useState(false);
    const [privacyMessage, setPrivacyMessage] = useState('');
    const [privacyError, setPrivacyError] = useState('');
    const [isTogglingApproval, setIsTogglingApproval] = useState(false);
    const [approvalMessage, setApprovalMessage] = useState('');
    const [approvalError, setApprovalError] = useState('');
    const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
    const [joinRequests, setJoinRequests] = useState([]);
    const [isReviewing, setIsReviewing] = useState(false);
    const [reviewMessage, setReviewMessage] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedPostIdDetail, setSelectedPostIdDetail] = useState(null);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [songToPlaylist, setSongToPlaylist] = useState({ id: null, name: '' });
    const [postToShare, setPostToShare] = useState(null);

    const { playTrack, currentTrack, isPlaying } = usePlayer();
    const { openCreatePostModal } = useModal();
    const { user } = useAuth();

    // State to store current user info
    const [currentUser, setCurrentUser] = useState({
        name: '',
        username: '',
        avatar: null
    });

    useEffect(() => {
        if (user) {
            setCurrentUser({
                name: user.name || "User",
                username: user.email || "",
                avatar: getUserAvatar(user.imageUrl)
            });
        }
    }, [user]);

    // Track expanded comments for each post
    const [expandedComments, setExpandedComments] = useState({});

    // Ban User states
    const [isBanning, setIsBanning] = useState(false);
    const [banningUserId, setBanningUserId] = useState(null);
    const [banMessage, setBanMessage] = useState('');

    const handleJoinGroup = async () => {
        setIsJoining(true);
        setJoinMessage('');
        setJoinError('');
        setLeaveMessage('');
        setLeaveError('');
        try {
            await groupService.joinGroup(groupId);
            if (group.isPrivate) {
                setJoinMessage('Join request sent successfully.');
                setGroup(prev => ({ ...prev, hasPendingRequest: true }));
            } else {
                setJoinMessage('Successfully joined the group!');
                setGroup(prev => ({ ...prev, isMember: true, memberCount: (prev.memberCount || 0) + 1 }));
                fetchGroupData(); // Refresh to get posts
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Failed to join group.";
            setJoinError(errorMsg);
        } finally {
            setIsJoining(false);
        }
    };

    const handleLeaveGroup = () => {
        setIsLeaveConfirmOpen(true);
    };

    const confirmLeaveGroup = async () => {
        setIsLeaveConfirmOpen(false);
        setIsLeaving(true);
        setLeaveMessage('');
        setLeaveError('');
        setJoinMessage('');
        setJoinError('');
        try {
            await groupService.leaveGroup(groupId);
            setLeaveMessage('Successfully left the group.');
            setGroup(prev => ({ ...prev, isMember: false, memberCount: Math.max(0, (prev.memberCount || 1) - 1) }));
            fetchGroupData(); // Refresh to hide private posts or update state
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Failed to leave group. You might be the only admin.";
            setLeaveError(errorMsg);
        } finally {
            setIsLeaving(false);
        }
    };


    const handleTogglePrivacy = async () => {
        setIsTogglingPrivacy(true);
        setPrivacyMessage('');
        setPrivacyError('');
        try {
            await groupService.togglePrivateGroup(groupId);
            setGroup(prev => ({ ...prev, isPrivate: !prev.isPrivate }));
            setPrivacyMessage(`Group is now ${!group.isPrivate ? 'private' : 'public'}.`);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Failed to change privacy settings.";
            setPrivacyError(errorMsg);
        } finally {
            setIsTogglingPrivacy(false);
        }
    };

    const handleToggleApproval = async () => {
        setIsTogglingApproval(true);
        setApprovalMessage('');
        setApprovalError('');
        try {
            await groupService.togglePostApproval(groupId);
            setGroup(prev => ({ ...prev, requirePostApproval: !prev.requirePostApproval }));
            setApprovalMessage(`Post approval is now ${!group.requirePostApproval ? 'required' : 'disabled'}.`);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Failed to change post approval settings.";
            setApprovalError(errorMsg);
        } finally {
            setIsTogglingApproval(false);
        }
    };

    const handleReviewRequest = async (requestId, approve) => {
        setIsReviewing(true);
        try {
            await groupService.reviewJoinRequest(groupId, requestId, approve);
            setJoinRequests(prev => prev.filter(req => (req.groupJoinRequestId || req.id) !== requestId));
            setReviewMessage(`Request successfully ${approve ? 'approved' : 'rejected'}.`);
            setTimeout(() => setReviewMessage(''), 3000);
        } catch (error) {
            console.error("Error reviewing request:", error);
        } finally {
            setIsReviewing(false);
        }
    };

    const fetchPendingPosts = async () => {
        if (group?.role?.toUpperCase() !== 'ADMIN') return;
        setIsLoadingPending(true);
        try {
            const response = await postService.getPendingPostsByGroup(groupId);
            setPendingPosts(response || []);
        } catch (error) {
            console.error("Error fetching pending posts:", error);
        } finally {
            setIsLoadingPending(false);
        }
    };

    const handleReviewPost = async (postId, approve) => {
        setIsReviewingPost(true);
        setReviewingPostId(postId);
        try {
            await postService.reviewPost(postId, approve);
            setPendingPosts(prev => prev.filter(p => p.idPost !== postId));
            if (approve) {
                // If approved, refresh the main feed
                fetchGroupData();
            }
            toast.success(`Post ${approve ? 'approved' : 'rejected'} successfully.`);
        } catch (error) {
            console.error("Error reviewing post:", error);
            toast.error("Failed to review post.");
        } finally {
            setIsReviewingPost(false);
            setReviewingPostId(null);
        }
    };

    const fetchGroupData = useCallback(async () => {
        try {
            const groupData = await groupService.getGroupById(groupId);
            const postsData = await groupService.getGroupPosts(groupId);
            // Also fetch join requests (might fail if not admin, catch silently)
            let requestsData = [];
            try {
                requestsData = await groupService.getJoinRequests(groupId);
            } catch (reqErr) {
                // Ignore 403 Forbidden or 404 Not Found here since it just means the user isn't an admin or doesn't have pending requests access
                console.warn("User is likely not an admin, skipping join requests fetch.");
            }

            setGroup(groupData);
            setPosts(postsData);
            setJoinRequests(requestsData);
        } catch (error) {
            console.error("Error fetching group data:", error);
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    const handleBanUser = async (targetUserId) => {
        setIsBanning(true);
        setBanningUserId(targetUserId);
        setBanMessage('');
        try {
            await groupService.banUser(groupId, targetUserId);
            setBanMessage(`Successfully banned user ${targetUserId}`);
            // Remove them from join requests if they were pending
            setJoinRequests(prev => prev.filter(req => req.userId !== targetUserId));
            // Trigger a re-fetch in case we need to update member lists, UI etc.
            fetchGroupData();
            setTimeout(() => setBanMessage(''), 3000);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Failed to ban user.";
            toast.error(errorMsg);
        } finally {
            setIsBanning(false);
            setBanningUserId(null);
        }
    };

    useEffect(() => {
        fetchGroupData();
    }, [fetchGroupData]);

    // Handle global post creation refresh
    useEffect(() => {
        const handleGlobalPostCreated = (e) => {
            // Only refresh if it's a general post OR a post for this specific group
            if (!e.detail?.groupId || e.detail.groupId === groupId) {
                fetchGroupData();
                if (group?.role?.toUpperCase() === 'ADMIN') {
                    fetchPendingPosts();
                }
            }
        };
        window.addEventListener('POST_CREATED', handleGlobalPostCreated);
        return () => window.removeEventListener('POST_CREATED', handleGlobalPostCreated);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId, group?.role, fetchGroupData]);

    useEffect(() => {
        if (group?.role?.toUpperCase() === 'ADMIN' || activeTab === 'review_posts') {
            fetchPendingPosts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, group?.role, group?.id]);

    const toggleLike = async (postId) => {
        // Optimistic update
        let oldPostData = null;
        setPosts(prevPosts =>
            prevPosts.map(post => {
                if (post.idPost === postId) {
                    oldPostData = { ...post };
                    const isLikedNow = !(post.isLiked || post.liked);
                    const count = (post.likeCount || post.likes || 0) + (isLikedNow ? 1 : -1);
                    return { ...post, isLiked: isLikedNow, liked: isLikedNow, likeCount: count, likes: count };
                }
                return post;
            })
        );

        try {
            const response = await likeService.toggleLike(postId);
            const apiData = response.data || response;
            const resultData = apiData.data || apiData;

            const isLikedResult = resultData.liked !== undefined ? resultData.liked : resultData.isLiked;
            const likeCountResult = resultData.likeCount !== undefined ? resultData.likeCount : (resultData.likes || 0);

            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post.idPost === postId
                        ? { ...post, isLiked: isLikedResult, liked: isLikedResult, likeCount: likeCountResult, likes: likeCountResult }
                        : post
                )
            );
        } catch (error) {
            console.error("Error toggling like:", error);
            // Revert on error
            if (oldPostData) {
                setPosts(prevPosts => prevPosts.map(p => p.idPost === postId ? oldPostData : p));
            }
            toast.error("Failed to update like status");
        }
    };

    const handlePlayMusic = async (post) => {
        let musicLink = post.musicLink;
        let songId = post.idSong || post.idPost;
        let songMetadata = null;

        if (songId) {
            try {
                const res = await songService.getSongById(songId);
                songMetadata = res.data?.data || res.data;
                musicLink = songMetadata?.musicUrl || musicLink;
            } catch (err) {
                console.error("Failed to fetch song details:", err);
            }
        }

        musicLink = musicLink ? (musicLink.startsWith('http') ? musicLink : `${process.env.REACT_APP_API_BASE_URL}${musicLink}`) : null;
        if (!musicLink) return;

        const avatarToUse = songMetadata?.imageUrl || post.imageUrlSong || post.imageUrlAlbum;
        const fullAvatar = avatarToUse ? (avatarToUse.startsWith('http') ? avatarToUse : `${process.env.REACT_APP_API_BASE_URL}${avatarToUse}`) : "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop";

        playTrack({
            id: songId,
            title: songMetadata?.name || post.nameSong || post.nameAlbum || "Original Audio",
            artist: songMetadata?.artistName || post.username,
            avatar: fullAvatar,
            url: musicLink
        });
    };

    if (loading) return <PageLoader message="Loading group..." />;
    if (!group) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Group not found</div>;

    return (
        <div className="groups-container">
            <SharePostModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                post={postToShare}
                onShareSuccess={() => {
                    fetchGroupData();
                    if (group?.role?.toUpperCase() === 'ADMIN') {
                        fetchPendingPosts();
                    }
                    toast.success("Post shared successfully! If this group requires post approval, it may be pending admin review.");
                }}
            />
            <PostDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                postId={selectedPostIdDetail}
                onUpdate={(postId, updates) => {
                    setPosts(prev => prev.map(p => p.idPost === postId ? { ...p, ...updates } : p));
                }}
            />

            <AddToPlaylistModal
                isOpen={isPlaylistModalOpen}
                onClose={() => setIsPlaylistModalOpen(false)}
                songId={songToPlaylist.id}
                songName={songToPlaylist.name}
            />
            <ConfirmModal
                isOpen={isLeaveConfirmOpen}
                onClose={() => setIsLeaveConfirmOpen(false)}
                onConfirm={confirmLeaveGroup}
                title="Leave Group"
                message="Are you sure you want to leave this group? You will lose access to member-only content."
                confirmText="Leave Group"
                cancelText="Stay"
                type="danger"
            />
            <Sidebar />

            <main className="group-detail-main ml-0 md:ml-[80px] lg:ml-[240px] transition-all duration-300">
                {/* 1. Group Banner & Profile */}
                <div className="group-banner-container">
                    <img src={group.imageUrl} alt="Banner" className="group-banner-img" />
                    <div className="banner-overlay"></div>

                    <div className="group-header-overlay">
                        <div className="group-meta-card">
                            <div className="flex justify-between items-start mb-6">
                                <div className="group-badge">Verified Group</div>
                            </div>
                            <h1 className="text-5xl font-black mb-4 tracking-tighter">{group.name}</h1>
                            <div className="flex items-center gap-6 text-sm font-bold opacity-80">
                                <span className="flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" /> {group.memberCount || 0} Members</span>
                                <span className="flex items-center gap-2">
                                    {group.isPrivate ? <Lock className="w-4 h-4 text-rose-400" /> : <Globe className="w-4 h-4 text-emerald-400" />}
                                    {group.isPrivate ? 'Private Group' : 'Public Group'}
                                </span>
                            </div>
                            <div className="mt-8 flex flex-col gap-2">
                                <div className="flex gap-4">
                                    {!group.isMember && !group.hasPendingRequest && (
                                        <button
                                            className="join-group-btn-full disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={handleJoinGroup}
                                            disabled={isJoining}
                                        >
                                            {isJoining ? 'Processing...' : 'Join Group'}
                                        </button>
                                    )}
                                    {group.hasPendingRequest && (
                                        <button
                                            className="join-group-btn-full opacity-70 cursor-not-allowed bg-slate-600 border-none"
                                            disabled
                                        >
                                            Request Pending
                                        </button>
                                    )}
                                    {group.isMember && (
                                        <>
                                            <button
                                                className="px-6 py-3 border border-rose-500/50 text-rose-400 font-bold rounded-xl hover:bg-rose-500/10 transition-all disabled:opacity-50"
                                                onClick={handleLeaveGroup}
                                                disabled={isLeaving}
                                            >
                                                {isLeaving ? 'Leaving...' : 'Leave'}
                                            </button>
                                        </>
                                    )}
                                </div>
                                {(joinError || leaveError) && <div className="text-red-400 text-sm font-medium">{joinError || leaveError}</div>}
                                {(joinMessage || leaveMessage) && <div className="text-emerald-400 text-sm font-medium">{joinMessage || leaveMessage}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="group-detail-content max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-8 py-10">

                    {/* 2. Left Column: Discussion & Feed (8/12) */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        {/* Tabs */}
                        <div className="detail-tabs">
                            <button
                                className={`detail-tab ${activeTab === 'discussion' ? 'active' : ''}`}
                                onClick={() => setActiveTab('discussion')}
                            >
                                <MessageSquare className="w-4 h-4" /> Discussion
                            </button>
                            {group.role?.toUpperCase() === 'ADMIN' && (
                                <button
                                    className={`detail-tab ${activeTab === 'requests' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('requests')}
                                >
                                    <UserPlus className="w-4 h-4" /> Requests
                                    {joinRequests.length > 0 && (
                                        <span className="ml-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {joinRequests.length}
                                        </span>
                                    )}
                                </button>
                            )}
                            {group.role?.toUpperCase() === 'ADMIN' && (
                                <button
                                    className={`detail-tab ${activeTab === 'review_posts' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('review_posts')}
                                >
                                    <ShieldCheck className="w-4 h-4" /> Review Posts
                                    {pendingPosts.length > 0 && (
                                        <span className="ml-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {pendingPosts.length}
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>

                        {group.role?.toUpperCase() === 'ADMIN' && activeTab === 'review_posts' && (
                            <div className="group-requests-section">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                                    Pending Posts Review
                                </h3>

                                {isLoadingPending ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                                        <p className="text-slate-500 mt-4">Loading pending posts...</p>
                                    </div>
                                ) : pendingPosts.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                            <ShieldCheck className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p>No posts pending approval.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        {pendingPosts.map(post => (
                                            <div key={post.idPost} className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={post.imageUrlUser || 'https://i.pravatar.cc/150'}
                                                            alt={post.username}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                        <div>
                                                            <div className="font-bold">{post.username}</div>
                                                            <div className="text-xs text-slate-500">{new Date(post.postDate).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleReviewPost(post.idPost, false)}
                                                            disabled={isReviewingPost}
                                                            className="p-2 border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Reject"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReviewPost(post.idPost, true)}
                                                            disabled={isReviewingPost}
                                                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            {isReviewingPost && reviewingPostId === post.idPost ? '...' : <><Check className="w-4 h-4" /> Approve</>}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="text-slate-300 text-sm leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                                                    {post.postType === 'SHARE' ? (
                                                        <div className="mb-2 italic text-indigo-400 text-xs">Shared a post:</div>
                                                    ) : null}
                                                    {post.content || post.contentShare || "No content"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {group.role?.toUpperCase() === 'ADMIN' && activeTab === 'requests' && (
                            <div className="group-requests-section">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-indigo-400" />
                                    Pending Join Requests
                                </h3>

                                {reviewMessage && (
                                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium">
                                        {reviewMessage}
                                    </div>
                                )}

                                {joinRequests.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                            <Check className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p>No pending join requests.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {joinRequests.map(request => {
                                            const reqId = request.groupJoinRequestId || request.id;
                                            return (
                                                <div key={reqId} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <img src={getUserAvatar(request.imageUrl)} alt={request.name || "User"} className="w-12 h-12 rounded-full object-cover" />
                                                        <div>
                                                            <div className="font-bold">{request.name || `User ID: ${request.userId}`}</div>
                                                            <div className="text-xs text-slate-500">Requested {formatDate(request.joinDate)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {banMessage && banningUserId === request.userId && (
                                                            <div className="absolute top-0 right-0 -mt-8 mr-4 bg-emerald-500 text-white text-xs px-2 py-1 rounded">
                                                                {banMessage}
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => handleBanUser(request.userId)}
                                                            disabled={isBanning}
                                                            className="p-2 border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50 text-xs font-bold uppercase tracking-wider mr-2"
                                                            title="Ban User"
                                                        >
                                                            {isBanning && banningUserId === request.userId ? '...' : 'Ban'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleReviewRequest(reqId, false)}
                                                            disabled={isReviewing}
                                                            className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Reject Request"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReviewRequest(reqId, true)}
                                                            disabled={isReviewing}
                                                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            <Check className="w-4 h-4" /> Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'discussion' && (
                            <>
                                {group.isPrivate && !group.isMember ? (
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-16 text-center flex flex-col items-center justify-center min-h-[450px] backdrop-blur-xl mb-12">
                                        <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
                                            <Lock className="w-12 h-12 text-rose-400" />
                                        </div>
                                        <h2 className="text-3xl font-bold mb-4">This Group is Private</h2>
                                        <p className="text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                                            You must be a member of this group to view its posts and participate in discussions. Send a request to join us!
                                        </p>
                                        {!group.hasPendingRequest ? (
                                            <button
                                                onClick={handleJoinGroup}
                                                disabled={isJoining}
                                                className="px-10 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20"
                                            >
                                                {isJoining ? 'Requesting...' : 'Request to Join'}
                                            </button>
                                        ) : (
                                            <div className="px-10 py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl cursor-not-allowed border border-white/5">
                                                Join Request Pending
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {/* Create Post Area - Only for members */}
                                        {group.isMember && (
                                            <div className="group-create-post-card mb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/10">
                                                        <img
                                                            src={currentUser.avatar}
                                                            alt="Me"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.src = 'https://i.pravatar.cc/150' }}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <button
                                                            className="create-post-placeholder w-full bg-white/5 hover:bg-white/10 border border-white/5 py-3 px-5 rounded-2xl text-left text-slate-400 font-medium transition-all"
                                                            onClick={() => openCreatePostModal({ groupId })}
                                                        >
                                                            What's on your mind, {currentUser.name}?
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Group Feed */}
                                        {posts.length === 0 ? (
                                            <div className="bg-white/5 border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px] mb-12">
                                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                    <MessageSquare className="w-8 h-8 text-slate-500" />
                                                </div>
                                                <h3 className="text-xl font-bold mb-2">No posts yet</h3>
                                                <p className="text-slate-500">Be the first to share something with this group!</p>
                                            </div>
                                        ) : (
                                            posts.map(post => (
                                                <PostItem
                                                    key={post.idPost}
                                                    post={post}
                                                    currentUser={currentUser}
                                                    isPlaying={isPlaying}
                                                    currentTrack={currentTrack}
                                                    onPlayMusic={handlePlayMusic}
                                                    onToggleLike={toggleLike}
                                                    onProfileClick={(id) => navigate(`/user/${id}`)}
                                                    onPostClick={(id) => { setSelectedPostIdDetail(id); setIsDetailModalOpen(true); }}
                                                    onSharePost={(p) => {
                                                        setPostToShare({ ...p, id: p.idPost });
                                                        setIsShareModalOpen(true);
                                                    }}
                                                    onAddToPlaylist={(track) => {
                                                        setSongToPlaylist(track);
                                                        setIsPlaylistModalOpen(true);
                                                    }}
                                                    expandedComments={expandedComments[post.idPost]}
                                                    onToggleComments={(id) => setExpandedComments(prev => ({ ...prev, [id]: !prev[id] }))}
                                                    onCommentAdded={() => {
                                                        setPosts(prev => prev.map(p =>
                                                            p.idPost === post.idPost ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
                                                        ));
                                                    }}
                                                    onNavigateToGroup={(id) => {
                                                        if (id !== groupId) navigate(`/groups/${id}`);
                                                    }}
                                                />
                                            ))
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* 3. Right Column: Group Info (4/12) */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        <div className="group-info-card">
                            <h3 className="flex items-center gap-2 text-lg font-bold mb-6">
                                <Info className="w-5 h-5 text-indigo-400" />
                                About this Group
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                {group.description || group.about}
                            </p>

                            <div className="flex flex-col gap-4 text-sm font-semibold">
                                {group?.role?.toUpperCase() === 'ADMIN' && (
                                    <>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    {group.isPrivate ? <Lock className="w-5 h-5 text-rose-400" /> : <Globe className="w-5 h-5 text-emerald-400" />}
                                                    <div>
                                                        <div>{group.isPrivate ? 'Private Visibility' : 'Public Visibility'}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase">
                                                            {group.isPrivate ? 'Only members can see who\'s in the group' : 'Anyone can see who\'s in the group'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleTogglePrivacy}
                                                    disabled={isTogglingPrivacy}
                                                    className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors disabled:opacity-50"
                                                >
                                                    {isTogglingPrivacy ? 'Switching...' : 'Change'}
                                                </button>
                                            </div>
                                            {privacyError && <div className="text-red-400 text-xs px-2">{privacyError}</div>}
                                            {privacyMessage && <div className="text-emerald-400 text-xs px-2">{privacyMessage}</div>}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <Shield className="w-5 h-5 text-indigo-400" />
                                                    <div>
                                                        <div>Post Approval</div>
                                                        <div className="text-[10px] text-slate-500 uppercase">
                                                            {group.requirePostApproval ? 'Posts must be approved by admins' : 'Members can post directly'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleToggleApproval}
                                                    disabled={isTogglingApproval}
                                                    className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors disabled:opacity-50"
                                                >
                                                    {isTogglingApproval ? 'Switching...' : 'Change'}
                                                </button>
                                            </div>
                                            {approvalError && <div className="text-red-400 text-xs px-2">{approvalError}</div>}
                                            {approvalMessage && <div className="text-emerald-400 text-xs px-2">{approvalMessage}</div>}
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <Calendar className="w-5 h-5 text-indigo-400" />
                                    <div>
                                        <div>Created On</div>
                                        <div className="text-[10px] text-slate-500 uppercase">Founded {formatDate(group.createdAt)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GroupDetail;
