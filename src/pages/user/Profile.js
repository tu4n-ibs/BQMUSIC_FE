import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import { useModal } from "../../context/ModalContext";
import { Grid, Bookmark, User as UserIcon, Camera, Link as LinkIcon, Lock, Edit2, Check, X, Heart, Share2, Disc, MoreHorizontal, ListMusic, Play } from 'lucide-react';
import userService from "../../services/userService";
import postService from "../../services/postService";
import AddToPlaylistModal from "../../components/modals/AddToPlaylistModal";
import PostDetailModal from '../../components/modals/PostDetailModal';
import SharePostModal from '../../components/modals/SharePostModal';
import "./css/Profile.css";
import { getUserAvatar } from "../../utils/userUtils";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

function Profile() {
  const params = useParams();
  const { user: currentUserData, updateUser } = useAuth();
  const navigate = useNavigate();

  // Handle userId from URL
  let userIdFromUrl = params.userId;
  if (userIdFromUrl && userIdFromUrl.startsWith("userId=")) {
    userIdFromUrl = userIdFromUrl.replace("userId=", "");
  }

  const storedIdUser = localStorage.getItem("idUser");
  const targetId = userIdFromUrl || storedIdUser;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [isChangePwdOpen, setIsChangePwdOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Modals for posts
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [postToShare, setPostToShare] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPostIdDetail, setSelectedPostIdDetail] = useState(null);

  // Playlist Modal State
  const [playlistModal, setPlaylistModal] = useState({
    isOpen: false,
    songId: null,
    songName: ''
  });

  // Stats State
  const [stats, setStats] = useState({
    followingCount: 0
  });

  const [activeMenuId, setActiveMenuId] = useState(null);

  // Edit Form State
  const [form, setForm] = useState({
    name: "",
    email: "",
    isActive: true,
    imageFile: null,
    imagePreview: null,
  });

  // Fetch User
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !targetId) {
      navigate("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await userService.getUserById(targetId);
        const userData = response.data || response;
        setUser(userData);

        const realId = userData.userId || userData.idUser || userData.id;
        const isOwn = String(realId) === String(storedIdUser) ||
          String(targetId) === String(storedIdUser) ||
          userData.email === localStorage.getItem("email");

        setIsOwnProfile(isOwn);

        if (realId && isOwn) {
          updateUser({
            idUser: realId,
            name: userData.name,
            imageUrl: userData.imageUrl
          });
          localStorage.setItem("idUser", realId);
          if (userData.name) localStorage.setItem("name", userData.name);
          if (userData.imageUrl) localStorage.setItem("imageUrl", userData.imageUrl);
        }

        setForm({
          name: userData.name || "",
          email: userData.email || "",
          isActive: userData.isActive ?? true,
          imagePreview: getUserAvatar(userData.imageUrl),
        });
        setIsFollowing(userData.isFollowed || false);

        // Fetch user stats
        try {
          const statsResponse = await userService.getUserStats(realId || targetId);
          const rawStats = statsResponse.data || statsResponse;
          setStats({
            postCount: rawStats.postCount || 0,
            followerCount: rawStats.followerCount || 0,
            followingCount: rawStats.followingCount || 0
          });

          if (rawStats.hasOwnProperty('isFollowing') && !isOwn) {
            setIsFollowing(rawStats.isFollowing);
          }
        } catch (statsErr) {
          console.error("Error fetching user stats:", statsErr);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [targetId, navigate, storedIdUser, updateUser]);

  useEffect(() => {
    if (targetId) {
      if (activeTab === 'posts') {
        fetchPosts(targetId, 'OWNER');
      } else if (activeTab === 'shares') {
        fetchPosts(targetId, 'SHARE');
      } else if (activeTab === 'albums') {
        // For UI/UX first: we use existing OWNER posts but will filter for ALBUM targetType in render
        fetchPosts(targetId, 'OWNER');
      }
    }
  }, [activeTab, targetId]);

  // Handle global post creation refresh
  useEffect(() => {
    const handleGlobalPostCreated = () => {
      if (targetId) {
        if (activeTab === 'posts') fetchPosts(targetId, 'OWNER');
        else if (activeTab === 'shares') fetchPosts(targetId, 'SHARE');
        else if (activeTab === 'albums') fetchPosts(targetId, 'OWNER');
      }
    };
    window.addEventListener('POST_CREATED', handleGlobalPostCreated);
    return () => window.removeEventListener('POST_CREATED', handleGlobalPostCreated);
  }, [targetId, activeTab]);

  const fetchPosts = async (id, postType = null) => {
    try {
      setPostsLoading(true);
      const response = await postService.getUserPosts(id || targetId, 0, 15, 'createdAt,desc', postType);
      const rawList = response.data?.data?.content || response.data?.content || response.data || [];
      const mappedList = Array.isArray(rawList) ? rawList.map(p => {
        const author = p.user || {};
        const authorName = p.authorName || author.name || author.username || 'Unknown';
        const authorAvatar = getUserAvatar(p.authorAvatar || author.imageUrl || author.avatar);

        const musicUrl = p.musicLink || p.musicUrl;
        const imgUrl = p.imageUrlSong || p.imageUrlAlbum || p.imageUrl || p.postImage;
        let finalImageUrl = imgUrl ? (imgUrl.startsWith('http') ? imgUrl : `http://localhost:8080${imgUrl}`) : authorAvatar;

        return {
          id: p.idPost || p.id || p.postId,
          content: p.content || p.caption || "",
          imageUrl: finalImageUrl,
          musicLink: musicUrl ? (musicUrl.startsWith('http') ? musicUrl : `http://localhost:8080${musicUrl}`) : null,
          authorName: authorName,
          authorAvatar: authorAvatar,
          likeCount: p.likeCount || 0,
          commentCount: p.commentCount || 0,
          liked: p.liked || p.isLiked || false,
          isLiked: p.liked || p.isLiked || false,
          createdAt: p.postDate || p.createdAt,
          user: author,
          // Share details
          postType: p.postType,
          targetType: p.targetType,
          targetId: p.targetId,
          idPostShare: p.idPostShare,
          userNameShare: p.userNameShare,
          userImageShare: p.userImageShare,
          contentShare: p.contentShare,
          songName: p.songName || p.title || p.name,
          idSong: p.idSong || (p.targetType === 'SONG' ? p.targetId : null),
          idAlbum: p.idAlbum || (p.targetType === 'ALBUM' ? p.targetId : null),
          playCount: p.playCount || 0,
        };
      }) : [];
      setUserPosts(mappedList);
    } catch (err) {
      console.error("Error fetching user posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleAvatarUpdate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      await userService.updateImage(file);
      const realId = user.userId || user.idUser || user.id || targetId;
      const updatedResponse = await userService.getUserById(realId);
      const updatedUser = updatedResponse.data || updatedResponse;

      setUser(updatedUser);
      updateUser({
        name: updatedUser.name,
        imageUrl: updatedUser.imageUrl,
        idUser: updatedUser.userId || updatedUser.idUser || updatedUser.id
      });

      setForm(prev => ({
        ...prev,
        imagePreview: getUserAvatar(updatedUser.imageUrl)
      }));
    } catch (err) {
      console.error("Avatar update error:", err);
      toast.error(err?.response?.data?.message || "Avatar update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleNameUpdate = async () => {
    if (!tempName || tempName.trim() === "" || tempName === user.name) {
      setIsEditingName(false);
      return;
    }

    try {
      setLoading(true);
      await userService.updateName(tempName.trim());
      const realId = user.userId || user.idUser || user.id || targetId;
      const updatedResponse = await userService.getUserById(realId);
      const updatedUser = updatedResponse.data || updatedResponse;

      setUser(updatedUser);
      updateUser({
        name: updatedUser.name,
        imageUrl: updatedUser.imageUrl,
        idUser: updatedUser.userId || updatedUser.idUser || updatedUser.id
      });

      setForm(prev => ({
        ...prev,
        name: updatedUser.name
      }));
      setIsEditingName(false);
    } catch (err) {
      console.error("Name update error:", err);
      toast.error(err?.response?.data?.message || "Name update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !targetId) return;
    const originalFollowState = isFollowing;
    setIsFollowing(!originalFollowState);
    try {
      if (originalFollowState) {
        await userService.unfollowUser(targetId);
      } else {
        await userService.followUser(targetId);
      }
    } catch (err) {
      console.error("Error changing follow status:", err);
      setIsFollowing(originalFollowState);
    }
  };

  if (loading) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <div className="bg-black min-h-screen text-white flex items-center justify-center">User not found</div>;

  return (
    <div className="ig-profile-container">
      <Sidebar />
      <main className="ig-profile-main ml-[120px] transition-all duration-300">
        <div className="profile-cover-container">
          <img
            src="https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop"
            alt="Cover"
            className="cover-image"
          />
          <div className="cover-overlay"></div>
        </div>

        <div className="ig-profile-wrapper">
          <div className="profile-header-meta">
            <div className={`ig-avatar-wrapper ${isOwnProfile ? 'editable' : ''}`} onClick={() => isOwnProfile && document.getElementById('avatar-upload-input').click()}>
              <img
                src={getUserAvatar(user.imageUrl)}
                alt={user.name}
                className="ig-avatar-img"
              />
              {isOwnProfile && (
                <div className="avatar-edit-overlay">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              )}
              <input
                type="file"
                id="avatar-upload-input"
                hidden
                accept="image/*"
                onChange={handleAvatarUpdate}
              />
            </div>

            <div className="ig-info-column flex-1">
              <div className="ig-user-row">
                <div className="ig-name-edit-wrapper">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNameUpdate()}
                        className="ig-name-input w-48 max-w-full bg-slate-800 text-white px-3 py-1 rounded-md outline-none border border-slate-600 focus:border-indigo-500 transition-colors"
                        autoFocus
                      />
                      <button onClick={handleNameUpdate} className="p-1 hover:text-green-500 transition-colors">
                        <Check className="w-5 h-5" />
                      </button>
                      <button onClick={() => setIsEditingName(false)} className="p-1 hover:text-red-500 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <h2 className="ig-username">{user.name}</h2>
                      {isOwnProfile && (
                        <button
                          className="ig-edit-name-btn"
                          onClick={() => {
                            setTempName(user.name);
                            setIsEditingName(true);
                          }}
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="ig-action-btns">
                  {isOwnProfile ? (
                    null
                  ) : (
                    <button
                      className={`ig-btn px-6 font-bold transition-all ${isFollowing ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border-transparent' : 'bg-indigo-500 text-white border-transparent hover:bg-indigo-600'}`}
                      onClick={handleFollowToggle}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm opacity-70 font-medium">
                {user.email && (
                  <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {user.email}</span>
                )}
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="ig-stat-item">
              <span className="ig-stat-count">{stats.postCount}</span>
              <span className="ig-stat-label">Posts</span>
            </div>
            <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 self-center"></div>
            <div className="ig-stat-item">
              <span className="ig-stat-count">{stats.followerCount}</span>
              <span className="ig-stat-label">Followers</span>
            </div>
            <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 self-center"></div>
            <div className="ig-stat-item">
              <span className="ig-stat-count">{stats.followingCount}</span>
              <span className="ig-stat-label">Following</span>
            </div>
          </div>

          <div className="flex border-t border-slate-200 dark:border-slate-800 ig-tabs mt-10">
            <div className={`ig-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
              <Grid className="w-4 h-4" /> POSTS
            </div>
            <div className={`ig-tab ${activeTab === 'shares' ? 'active' : ''}`} onClick={() => setActiveTab('shares')}>
              <Share2 className="w-4 h-4" /> SHARES
            </div>
            <div className={`ig-tab ${activeTab === 'albums' ? 'active' : ''}`} onClick={() => setActiveTab('albums')}>
              <Disc className="w-4 h-4" /> ALBUMS
            </div>
          </div>

          {(activeTab === 'posts' || activeTab === 'shares' || activeTab === 'albums') && (() => {
            const displayedPosts = activeTab === 'albums'
              ? userPosts.filter(p => p.targetType === 'ALBUM')
              : activeTab === 'posts'
                ? userPosts.filter(p => p.targetType !== 'ALBUM')
                : userPosts;

            return (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {postsLoading ? (
                  <div className="text-center py-20 opacity-50">Loading posts...</div>
                ) : displayedPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedPosts.map(post => (
                      <div
                        key={post.id}
                        className="post-card bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all group overflow-hidden cursor-pointer flex flex-col"
                        onClick={() => { setSelectedPostIdDetail(post.id); setIsDetailModalOpen(true); }}
                      >
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                          <img
                            src={
                              post.imageUrl ? (post.imageUrl.startsWith('http') ? post.imageUrl : `http://localhost:8080${post.imageUrl}`) :
                                post.imageUrlSong ? (post.imageUrlSong.startsWith('http') ? post.imageUrlSong : `http://localhost:8080${post.imageUrlSong}`) :
                                  post.imageUrlAlbum ? (post.imageUrlAlbum.startsWith('http') ? post.imageUrlAlbum : `http://localhost:8080${post.imageUrlAlbum}`) :
                                    getUserAvatar(user?.imageUrl)
                            }
                            alt="Post Media"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <p className="text-sm font-medium line-clamp-3 mb-2 flex-1 leading-relaxed opacity-90">{post.content}</p>
                        {post.postType === 'SHARE' && (
                          <div
                            className="text-[10px] text-indigo-500 flex items-center gap-1.5 mt-2 font-bold bg-indigo-500/10 w-max px-2.5 py-1 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPostIdDetail(post.idPostShare);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Shared from {post.userNameShare}</span>
                          </div>
                        )}
                        <div className="flex flex-col mt-4 pt-4 border-t border-slate-200/5 dark:border-slate-800/50">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-bold opacity-70">
                              <span>{new Date(post.createdAt || Date.now()).toLocaleDateString()} • {post.visibility || 'PUBLIC'}</span>
                              <div className="flex items-center gap-3">
                                {(post.idSong || post.idAlbum) && (
                                  <div className="flex items-center gap-1">
                                    <Play className="w-3 h-3 fill-current opacity-70" />
                                    <span>{(post.playCount || 0).toLocaleString()}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Heart className={`w-3 h-3 ${(post.liked || post.isLiked) ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {(post.likeCount !== undefined ? post.likeCount : post.likes) || 0}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPostToShare(post);
                                  setIsShareModalOpen(true);
                                }}
                                className="flex items-center gap-2 text-slate-500 hover:text-indigo-400 transition-colors bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 px-3 py-1.5 rounded-lg"
                              >
                                <Share2 className="w-4 h-4" />
                                <span className="text-[11px] font-bold uppercase tracking-wider">Share</span>
                              </button>

                              {(post.targetType === 'SONG' || post.targetType === 'ALBUM' || post.idSong || post.idAlbum) && (
                                <div className="relative">
                                  <button
                                    className={`flex items-center gap-1.5 transition-colors p-1.5 rounded-md ${activeMenuId === post.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10'}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(activeMenuId === post.id ? null : post.id);
                                    }}
                                  >
                                    <MoreHorizontal className="w-5 h-5" />
                                  </button>

                                  {activeMenuId === post.id && (
                                    <>
                                      <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}></div>
                                      <div
                                        className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl py-2 z-[110] animate-in fade-in slide-in-from-bottom-2 duration-200"
                                        onClick={e => e.stopPropagation()}
                                      >
                                        <button
                                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-indigo-500/20 transition-all uppercase tracking-wider text-left"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPlaylistModal({
                                              isOpen: true,
                                              songId: post.idSong || post.idAlbum || post.targetId,
                                              songName: post.songName || post.content || "Track"
                                            });
                                            setActiveMenuId(null);
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ig-empty-state">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      {activeTab === 'posts' ? <Grid className="w-10 h-10 text-indigo-500" /> : <Share2 className="w-10 h-10 text-indigo-500" />}
                    </div>
                    <div className="ig-empty-title">
                      {activeTab === 'posts' ? 'Share Your Thoughts' : activeTab === 'albums' ? 'No Albums Yet' : 'No Shared Posts'}
                    </div>
                    <div className="text-slate-500 max-w-sm mx-auto mb-8">
                      {activeTab === 'posts'
                        ? 'Your posts will appear here once you start sharing with the community.'
                        : activeTab === 'albums'
                          ? 'Album posts will appear here when you post an album.'
                          : 'Shared posts will appear here when you share content from others.'}
                    </div>
                    {isOwnProfile && activeTab === 'posts' && (
                      <button
                        className="btn-primary px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-transform"
                        onClick={() => navigate('/')}
                      >
                        Create First Post
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}


        </div>
      </main>

      <SharePostModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={postToShare}
        onShareSuccess={() => {
          if (activeTab === 'posts') fetchPosts(targetId, 'OWNER');
          else if (activeTab === 'shares') fetchPosts(targetId, 'SHARE');
          else if (activeTab === 'albums') fetchPosts(targetId, 'OWNER');
        }}
      />

      <AddToPlaylistModal
        isOpen={playlistModal.isOpen}
        onClose={() => setPlaylistModal({ ...playlistModal, isOpen: false })}
        songId={playlistModal.songId}
        songName={playlistModal.songName}
      />

      <PostDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        postId={selectedPostIdDetail}
        onUpdate={(postId, updates) => {
          setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
        }}
      />
    </div>
  );
}

export default Profile;