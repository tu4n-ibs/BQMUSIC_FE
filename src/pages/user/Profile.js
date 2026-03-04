import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import { Grid, Bookmark, User as UserIcon, Camera, Link as LinkIcon, Lock, Edit2, Check, X, Heart } from 'lucide-react';
import userService from "../../services/userService";
import postService from "../../services/postService";
import AddToPlaylistModal from "../../components/modals/AddToPlaylistModal";
import PostDetailModal from '../../components/modals/PostDetailModal';
import "./css/Profile.css";
import { getUserAvatar } from "../../utils/userUtils";
import { useAuth } from "../../context/AuthContext";

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  // Change Password State
  const [pwdForm, setPwdForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [pwdErrors, setPwdErrors] = useState({});

  // Stats State
  const [stats, setStats] = useState({
    postCount: 0,
    followerCount: 0,
    followingCount: 0
  });

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

        fetchPosts(realId || targetId);

      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPosts = async (id) => {
      try {
        setPostsLoading(true);
        const response = await postService.getUserPosts(id || targetId, 0, 10, 'createdAt,desc');
        const rawList = response.data?.data?.content || response.data?.content || response.data || [];
        const mappedList = Array.isArray(rawList) ? rawList.map(p => {
          const author = p.user || {};
          const authorName = p.authorName || author.name || author.username || 'Unknown';
          const authorAvatar = getUserAvatar(p.authorAvatar || author.imageUrl || author.avatar);

          const musicUrl = p.musicLink || p.musicUrl;
          const imgUrl = p.imageUrl || p.postImage;

          return {
            id: p.id || p.postId || p.idPost,
            content: p.content || p.caption || "",
            imageUrl: imgUrl ? (imgUrl.startsWith('http') ? imgUrl : `http://localhost:8080${imgUrl}`) : null,
            musicLink: musicUrl ? (musicUrl.startsWith('http') ? musicUrl : `http://localhost:8080${musicUrl}`) : null,
            authorName: authorName,
            authorAvatar: authorAvatar,
            likeCount: p.likeCount ?? p.likes ?? 0,
            liked: p.liked ?? p.isLiked ?? false,
            createdAt: p.createdAt || new Date().toISOString(),
            user: author
          };
        }) : [];
        setUserPosts(mappedList);
      } catch (err) {
        console.error("Error fetching user posts:", err);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, navigate]);

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
      console.error("Lỗi cập nhật avatar:", err);
      alert(err?.response?.data?.message || "Cập nhật avatar thất bại");
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
      console.error("Lỗi cập nhật tên:", err);
      alert(err?.response?.data?.message || "Cập nhật tên thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    let errors = {};
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!pwdForm.oldPassword) errors.oldPassword = "Vui lòng nhập mật khẩu hiện tại";
    if (!passRegex.test(pwdForm.newPassword)) {
      errors.newPassword = "Mật khẩu phải ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số";
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (Object.keys(errors).length > 0) {
      setPwdErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await userService.changePassword({
        email: user.email,
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword,
        confirmPassword: pwdForm.confirmPassword
      });

      if (response && (response.success || response.status === 200)) {
        alert("Đổi mật khẩu thành công!");
        setIsChangePwdOpen(false);
        setPwdForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setPwdErrors({});
      } else {
        const msg = response?.message || "Đổi mật khẩu thất bại";
        if (msg.toLowerCase().includes("current") || msg.toLowerCase().includes("mật khẩu cũ")) {
          setPwdErrors({ oldPassword: "Mật khẩu hiện tại không chính xác" });
        } else {
          alert(msg);
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Lỗi hệ thống khi đổi mật khẩu";
      if (msg.toLowerCase().includes("current") || msg.toLowerCase().includes("mật khẩu cũ")) {
        setPwdErrors({ oldPassword: "Mật khẩu hiện tại không chính xác" });
      } else {
        alert(msg);
      }
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
      console.error("Lỗi khi thay đổi trạng thái follow:", err);
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
                        className="ig-name-input"
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
                    <button className="ig-btn flex items-center gap-2" onClick={() => setIsChangePwdOpen(true)}>
                      <Lock className="w-4 h-4" />
                      Change Password
                    </button>
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
                <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> @{user.email?.split('@')[0]}</span>
                {user.email && (
                  <span className="flex items-center gap-1"><LinkIcon className="w-3 h-3" /> {user.email}</span>
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

          <div className="ig-tabs">
            <div className={`ig-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
              <Grid className="w-4 h-4" /> POSTS
            </div>
            <div className={`ig-tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
              <Bookmark className="w-4 h-4" /> SAVED
            </div>
            <div className={`ig-tab ${activeTab === 'tagged' ? 'active' : ''}`} onClick={() => setActiveTab('tagged')}>
              <UserIcon className="w-4 h-4" /> TAGGED
            </div>
          </div>

          {activeTab === 'posts' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {postsLoading ? (
                <div className="text-center py-20 opacity-50">Loading posts...</div>
              ) : userPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userPosts.map(post => (
                    <div
                      key={post.id}
                      className="post-card bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all group overflow-hidden cursor-pointer"
                      onClick={() => { setSelectedPostIdDetail(post.id); setIsDetailModalOpen(true); }}
                    >
                      {post.imageUrl && (
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4">
                          <img
                            src={post.imageUrl}
                            alt="Post Media"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <p className="text-sm font-medium line-clamp-3 mb-2">{post.content}</p>
                      {post.originalPostId && (
                        <div className="text-xs text-indigo-500 flex items-center gap-1 mt-2 font-bold bg-indigo-50 dark:bg-indigo-900/30 w-max px-2 py-1 rounded-md">
                          <LinkIcon className="w-3 h-3" /> Shared Post
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 uppercase tracking-wider font-bold opacity-70">
                        <span>{new Date(post.createdAt || Date.now()).toLocaleDateString()} • {post.visibility || 'PUBLIC'}</span>
                        <div className="flex items-center gap-1 text-red-500/80">
                          <Heart className={`w-3 h-3 ${post.liked ? 'fill-red-500' : ''}`} />
                          <span>{post.likeCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ig-empty-state">
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Grid className="w-10 h-10 text-indigo-500" />
                  </div>
                  <div className="ig-empty-title">Share Your Thoughts</div>
                  <div className="text-slate-500 max-w-sm mx-auto mb-8">
                    Your posts will appear here once you start sharing with the community.
                  </div>
                  {isOwnProfile && (
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
          )}

          {activeTab !== 'posts' && (
            <div className="text-center py-20 text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <div className="mb-2">Coming Soon</div>
              <div className="text-xs opacity-60">This feature is under development</div>
            </div>
          )}
        </div>
      </main>

      {isChangePwdOpen && (
        <div className="ig-modal-overlay" onClick={() => setIsChangePwdOpen(false)}>
          <div className="edit-profile-card" onClick={e => e.stopPropagation()}>
            <h3 className="edit-profile-title">Change Password</h3>
            <form onSubmit={handleChangePassword} className="edit-form-container">
              <div className="edit-form-group">
                <label className="edit-label">Current Password</label>
                <input
                  type="password"
                  value={pwdForm.oldPassword}
                  onChange={(e) => {
                    setPwdForm({ ...pwdForm, oldPassword: e.target.value });
                    if (pwdErrors.oldPassword) setPwdErrors({ ...pwdErrors, oldPassword: null });
                  }}
                  className={`edit-input ${pwdErrors.oldPassword ? 'border-red-500' : ''}`}
                  placeholder="Enter current password"
                />
                {pwdErrors.oldPassword && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{pwdErrors.oldPassword}</p>}
              </div>
              <div className="edit-form-group">
                <label className="edit-label">New Password</label>
                <input
                  type="password"
                  value={pwdForm.newPassword}
                  onChange={(e) => {
                    setPwdForm({ ...pwdForm, newPassword: e.target.value });
                    if (pwdErrors.newPassword) setPwdErrors({ ...pwdErrors, newPassword: null });
                  }}
                  className={`edit-input ${pwdErrors.newPassword ? 'border-red-500' : ''}`}
                  placeholder="Enter new password"
                />
                {pwdErrors.newPassword && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{pwdErrors.newPassword}</p>}
              </div>
              <div className="edit-form-group">
                <label className="edit-label">Confirm New Password</label>
                <input
                  type="password"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => {
                    setPwdForm({ ...pwdForm, confirmPassword: e.target.value });
                    if (pwdErrors.confirmPassword) setPwdErrors({ ...pwdErrors, confirmPassword: null });
                  }}
                  className={`edit-input ${pwdErrors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Confirm new password"
                />
                {pwdErrors.confirmPassword && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{pwdErrors.confirmPassword}</p>}
              </div>
              <div className="edit-actions">
                <button type="button" onClick={() => setIsChangePwdOpen(false)} className="btn-cancel">Cancel</button>
                <button type="submit" disabled={loading} className="btn-save">{loading ? "Processing..." : "Update Password"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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