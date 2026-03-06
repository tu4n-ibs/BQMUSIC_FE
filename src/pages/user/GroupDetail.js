import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import {
    Users, Info, Shield, MessageSquare, Share2, Heart,
    MoreHorizontal, Music, Play, Pause, Globe, Calendar, MapPin, Lock,
    Check, X, UserPlus, ShieldCheck
} from 'lucide-react';
import SharePostModal from '../../components/modals/SharePostModal';
import PostDetailModal from '../../components/modals/PostDetailModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { useModal } from '../../context/ModalContext';
import groupService from '../../services/groupService';
import postService from '../../services/postService';
import likeService from '../../services/likeService';
import { usePlayer } from '../../context/PlayerContext';
import { getUserAvatar } from '../../utils/userUtils';
import { formatDate } from '../../utils/dateUtils';
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
    const [postToShare, setPostToShare] = useState(null);

    const { playTrack, currentTrack, isPlaying } = usePlayer();
    const { openCreatePostModal } = useModal();

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
                setJoinMessage('Successfully joined the community!');
                setGroup(prev => ({ ...prev, isMember: true, memberCount: (prev.memberCount || 0) + 1 }));
                fetchGroupData(); // Refresh to get posts
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Failed to join community.";
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
            setLeaveMessage('Successfully left the community.');
            setGroup(prev => ({ ...prev, isMember: false, memberCount: Math.max(0, (prev.memberCount || 1) - 1) }));
            fetchGroupData(); // Refresh to hide private posts or update state
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Failed to leave community. You might be the only admin.";
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
            setPendingPosts(response.content || []);
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
            alert(`Post ${approve ? 'approved' : 'rejected'} successfully.`);
        } catch (error) {
            console.error("Error reviewing post:", error);
            alert("Failed to review post.");
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
            alert(errorMsg); // using alert for simplicity on list item failure, or could set a global error state
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
    }, [groupId, group?.role, fetchGroupData]);

    useEffect(() => {
        if (group?.role?.toUpperCase() === 'ADMIN' || activeTab === 'review_posts') {
            fetchPendingPosts();
        }
    }, [activeTab, group?.role, group?.id]);

    const toggleLike = async (postId) => {
        try {
            const response = await likeService.toggleLike(postId);
            const { isLiked, likeCount } = response?.data || response || {};
            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post.idPost === postId
                        ? { ...post, isLiked: (isLiked !== undefined ? isLiked : !post.isLiked), likeCount: (likeCount !== undefined ? likeCount : (post.isLiked ? Math.max(0, post.likeCount - 1) : (post.likeCount || 0) + 1)) }
                        : post
                )
            );
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    const handlePlayMusic = (post) => {
        playTrack({
            id: post.idPost,
            title: post.nameSong || post.nameAlbum || "Original Audio",
            artist: post.username,
            avatar: post.imageUrlSong || post.imageUrlAlbum || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop",
            url: post.musicLink ? (post.musicLink.startsWith('http') ? post.musicLink : `http://localhost:8080${post.musicLink}`) : null
        });
    };

    if (loading) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Loading community...</div>;
    if (!group) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Community not found</div>;

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
                    alert("Post shared successfully! If this group requires post approval, it may be pending admin review.");
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
            <ConfirmModal
                isOpen={isLeaveConfirmOpen}
                onClose={() => setIsLeaveConfirmOpen(false)}
                onConfirm={confirmLeaveGroup}
                title="Leave Community"
                message="Are you sure you want to leave this community? You will lose access to member-only content."
                confirmText="Leave Community"
                cancelText="Stay"
                type="danger"
            />
            <Sidebar />

            <main className="group-detail-main ml-[120px]">
                {/* 1. Group Banner & Profile */}
                <div className="group-banner-container">
                    <img src={group.imageUrl} alt="Banner" className="group-banner-img" />
                    <div className="banner-overlay"></div>

                    <div className="group-header-overlay">
                        <div className="group-meta-card">
                            <div className="flex justify-between items-start mb-6">
                                <div className="group-badge">Verified Community</div>
                                <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                                    <Share2 className="w-5 h-5" />
                                </button>
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
                                            {isJoining ? 'Processing...' : 'Join Community'}
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
                                            <button className="invite-btn">Invite Members</button>
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

                            <button
                                className={`detail-tab ${activeTab === 'about' ? 'active' : ''}`}
                                onClick={() => setActiveTab('about')}
                            >
                                <Info className="w-4 h-4" /> About
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
                                                        <img src={getUserAvatar(request.imageUrl)} alt={request.name || "User"} className="w-12 h-12 rounded-full" />
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
                                        <h2 className="text-3xl font-bold mb-4">This Community is Private</h2>
                                        <p className="text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                                            You must be a member of this community to view its posts and participate in discussions. Send a request to join us!
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
                                            <div className="group-create-post-card">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-slate-800">
                                                        <Users className="w-full h-full p-2 text-slate-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <button
                                                            className="create-post-placeholder w-full text-left"
                                                            onClick={() => openCreatePostModal({ groupId })}
                                                        >
                                                            What's on your mind?
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
                                                <p className="text-slate-500">Be the first to share something with this community!</p>
                                            </div>
                                        ) : (
                                            posts.map(post => (
                                                <div key={post.idPost} className="group-post-card group">
                                                    <div className="post-header cursor-pointer" onClick={() => { setSelectedPostIdDetail(post.idPost); setIsDetailModalOpen(true); }}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/user/${post.idUser}`); }}>
                                                                <img
                                                                    src={post.imageUrlUser || 'https://i.pravatar.cc/150'}
                                                                    alt={post.username}
                                                                    className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
                                                                    onError={(e) => { e.target.src = 'https://i.pravatar.cc/150' }}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/user/${post.idUser}`); }}>
                                                                <div className="post-author-name">{post.username}</div>
                                                                <div className="post-time">{new Date(post.postDate).toLocaleString()}</div>
                                                            </div>
                                                        </div>
                                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="w-5 h-5 text-slate-400" />
                                                        </button>
                                                    </div>

                                                    <div className="post-content cursor-pointer relative z-0" onClick={() => { setSelectedPostIdDetail(post.idPost); setIsDetailModalOpen(true); }}>
                                                        <p className="mb-6 leading-relaxed text-slate-300 pointer-events-none">{post.content || post.contentShare || 'Listening to this track'}</p>

                                                        {(post.idSong || post.idAlbum) && (
                                                            <div className="post-music-player">
                                                                <div className="music-cover cursor-pointer relative z-10" onClick={(e) => { e.stopPropagation(); handlePlayMusic(post); }}>
                                                                    <img
                                                                        src={post.imageUrlSong || post.imageUrlAlbum || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop"}
                                                                        alt="Cover"
                                                                        className={`w-full h-full object-cover ${(currentTrack?.id === post.idPost && isPlaying) ? 'opacity-90' : ''}`}
                                                                    />
                                                                    <div className={`play-overlay flex items-center justify-center ${(currentTrack?.id === post.idPost && isPlaying) ? 'bg-indigo-500/40' : 'bg-black/30'}`}>
                                                                        {(currentTrack?.id === post.idPost && isPlaying) ? (
                                                                            <Pause className="w-6 h-6 fill-white" />
                                                                        ) : (
                                                                            <Play className="w-5 h-5 fill-white" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="music-info">
                                                                    <div className="song-title">{post.nameSong || post.nameAlbum}</div>
                                                                    <div className="song-artist">{post.username}</div>
                                                                </div>
                                                                {(post.idSong) && (
                                                                    <div className="visualizer">
                                                                        <div className="bar v-bar-1"></div>
                                                                        <div className="bar v-bar-2"></div>
                                                                        <div className="bar v-bar-3"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="post-footer">
                                                        <div className="post-actions">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); toggleLike(post.idPost); }}
                                                                className="post-action-btn flex items-center gap-2 hover:scale-110 transition-transform"
                                                            >
                                                                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-500 hover:text-rose-500'}`} />
                                                                <span>{post.likeCount || 0}</span>
                                                            </button>
                                                            <button
                                                                className="post-action-btn flex items-center gap-2"
                                                                onClick={(e) => { e.stopPropagation(); setSelectedPostIdDetail(post.idPost); setIsDetailModalOpen(true); }}
                                                            >
                                                                <MessageSquare className="w-5 h-5" />
                                                                <span>{post.commentCount || 0}</span>
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Normalize post to have id so SharePostModal works correctly
                                                                setPostToShare({ ...post, id: post.idPost });
                                                                setIsShareModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors"
                                                        >
                                                            <Share2 className="w-4 h-4" />
                                                            <span className="text-sm font-bold uppercase tracking-wider">Share</span>
                                                        </button>
                                                    </div>
                                                </div>
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
                                About this Community
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

                        <div className="group-info-card">
                            <h3 className="flex items-center gap-2 text-lg font-bold mb-6">
                                <Shield className="w-5 h-5 text-indigo-400" />
                                Community Rules
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div className="rule-item">
                                    <div className="rule-num">01</div>
                                    <div>
                                        <div className="rule-title">Be respectful</div>
                                        <p className="text-xs text-slate-500">Treat everyone with respect and kindness.</p>
                                    </div>
                                </div>
                                <div className="rule-item">
                                    <div className="rule-num">02</div>
                                    <div>
                                        <div className="rule-title">No spamming</div>
                                        <p className="text-xs text-slate-500">Keep discussions focused and relevant.</p>
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
