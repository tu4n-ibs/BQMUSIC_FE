import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import {
    Users, Info, Shield, MessageSquare, Share2, Heart,
    MoreHorizontal, Music, Play, Globe, Calendar, MapPin, Lock,
    Check, X, UserPlus
} from 'lucide-react';
import SharePostModal from '../../components/modals/SharePostModal';
import CreatePostModal from '../../components/modals/CreatePostModal';
import groupService from '../../services/groupService';
import { getUserAvatar } from '../../utils/userUtils';
import './css/Groups.css';

const GroupDetail = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('discussion');
    const [isJoining, setIsJoining] = useState(false);
    const [joinMessage, setJoinMessage] = useState('');
    const [joinError, setJoinError] = useState('');
    const [isTogglingPrivacy, setIsTogglingPrivacy] = useState(false);
    const [privacyMessage, setPrivacyMessage] = useState('');
    const [privacyError, setPrivacyError] = useState('');
    const [isTogglingApproval, setIsTogglingApproval] = useState(false);
    const [approvalMessage, setApprovalMessage] = useState('');
    const [approvalError, setApprovalError] = useState('');
    const [joinRequests, setJoinRequests] = useState([]);
    const [isReviewing, setIsReviewing] = useState(false);
    const [reviewMessage, setReviewMessage] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [postToShare, setPostToShare] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleJoinGroup = async () => {
        setIsJoining(true);
        setJoinMessage('');
        setJoinError('');
        try {
            await groupService.joinGroup(groupId);
            setJoinMessage('Successfully sent join request or joined the community!');
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Failed to join community.";
            setJoinError(errorMsg);
        } finally {
            setIsJoining(false);
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
        setReviewMessage('');
        try {
            await groupService.reviewJoinRequest(groupId, requestId, approve);
            // Remove the reviewed request from the list
            setJoinRequests(prev => prev.filter(req => req.id !== requestId));
            setReviewMessage(`Request successfully ${approve ? 'approved' : 'rejected'}.`);
            // Clear message after 3 seconds
            setTimeout(() => setReviewMessage(''), 3000);
        } catch (error) {
            console.error("Error reviewing request:", error);
            // Optionally set an error state here if needed
        } finally {
            setIsReviewing(false);
        }
    };

    useEffect(() => {
        const fetchGroupData = async () => {
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
        };
        fetchGroupData();
    }, [groupId]);

    if (loading) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Loading community...</div>;
    if (!group) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Community not found</div>;

    return (
        <div className="groups-container">
            <SharePostModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                post={postToShare}
            />
            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onPostCreated={fetchGroupData}
                groupId={groupId}
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
                                <span className="flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" /> {group.members} Members</span>
                                <span className="flex items-center gap-2">
                                    {group.isPrivate ? <Lock className="w-4 h-4 text-rose-400" /> : <Globe className="w-4 h-4 text-emerald-400" />}
                                    {group.isPrivate ? 'Private Group' : 'Public Group'}
                                </span>
                            </div>
                            <div className="mt-8 flex flex-col gap-2">
                                <div className="flex gap-4">
                                    <button
                                        className="join-group-btn-full disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleJoinGroup}
                                        disabled={isJoining}
                                    >
                                        {isJoining ? 'Processing...' : 'Join Community'}
                                    </button>
                                    <button className="invite-btn">Invite Members</button>
                                </div>
                                {joinError && <div className="text-red-400 text-sm font-medium">{joinError}</div>}
                                {joinMessage && <div className="text-emerald-400 text-sm font-medium">{joinMessage}</div>}
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
                                className={`detail-tab ${activeTab === 'media' ? 'active' : ''}`}
                                onClick={() => setActiveTab('media')}
                            >
                                <Music className="w-4 h-4" /> Media & Music
                            </button>
                            <button
                                className={`detail-tab ${activeTab === 'about' ? 'active' : ''}`}
                                onClick={() => setActiveTab('about')}
                            >
                                <Info className="w-4 h-4" /> About
                            </button>
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
                        </div>

                        {activeTab === 'requests' && (
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
                                                        <img src={getUserAvatar(request.user?.avatar)} alt={request.user?.name || "User"} className="w-12 h-12 rounded-full" />
                                                        <div>
                                                            <div className="font-bold">{request.user?.name || `User ID: ${request.userId}`}</div>
                                                            <div className="text-xs text-slate-500">Requested {request.requestedAt || "recently"}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
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
                                {/* Create Post Area */}
                                <div className="group-create-post-card">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-slate-800">
                                            <Users className="w-full h-full p-2 text-slate-500" />
                                        </div>
                                        <div className="flex-1">
                                            <button
                                                className="create-post-placeholder w-full text-left"
                                                onClick={() => setIsCreateModalOpen(true)}
                                            >
                                                What's on your mind?
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Group Feed */}
                                <div className="group-feed flex flex-col gap-6">
                                    {posts.map(post => (
                                        <div key={post.id} className="group-post-card group">
                                            <div className="post-header">
                                                <div className="flex items-center gap-3">
                                                    <img src={getUserAvatar(post.authorAvatar)} alt={post.authorName} className="post-author-img" />
                                                    <div>
                                                        <div className="post-author-name">{post.authorName}</div>
                                                        <div className="post-time">{post.timestamp}</div>
                                                    </div>
                                                </div>
                                                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="w-5 h-5 text-slate-400" />
                                                </button>
                                            </div>

                                            <div className="post-content">
                                                <p className="mb-6 leading-relaxed text-slate-300">{post.content}</p>

                                                {post.musicLink && (
                                                    <div className="post-music-player">
                                                        <div className="music-cover">
                                                            <Music className="w-6 h-6 text-white" />
                                                            <div className="play-overlay">
                                                                <Play className="w-5 h-5 fill-white" />
                                                            </div>
                                                        </div>
                                                        <div className="music-info">
                                                            <div className="song-title">Ambient Vibe Collection #04</div>
                                                            <div className="song-artist">{post.authorName} • Featured</div>
                                                        </div>
                                                        <div className="visualizer">
                                                            <div className="bar v-bar-1"></div>
                                                            <div className="bar v-bar-2"></div>
                                                            <div className="bar v-bar-3"></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="post-footer">
                                                <div className="post-actions">
                                                    <button className="post-action-btn flex items-center gap-2">
                                                        <Heart className="w-5 h-5" /> <span>{post.likes}</span>
                                                    </button>
                                                    <button className="post-action-btn flex items-center gap-2">
                                                        <MessageSquare className="w-5 h-5" /> <span>{post.comments}</span>
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setPostToShare(post);
                                                        setIsShareModalOpen(true);
                                                    }}
                                                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors"
                                                >
                                                    <Share2 className="w-4 h-4" /> <span className="text-sm font-bold uppercase tracking-wider">Share</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                                {group.about}
                            </p>

                            <div className="flex flex-col gap-4 text-sm font-semibold">
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
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <MapPin className="w-5 h-5 text-rose-400" />
                                    <div>
                                        <div>Location</div>
                                        <div className="text-[10px] text-slate-500 uppercase">{group.location}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <Calendar className="w-5 h-5 text-indigo-400" />
                                    <div>
                                        <div>Created On</div>
                                        <div className="text-[10px] text-slate-500 uppercase">Founded {group.founded}</div>
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
