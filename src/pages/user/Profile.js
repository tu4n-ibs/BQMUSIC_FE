import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import { Settings, Grid, Bookmark, User as UserIcon, Camera, Link as LinkIcon, Music, Lock, ListMusic, Edit2, Check, X } from 'lucide-react';
import userService from "../../services/userService";
import songService from "../../services/songService";
import AddToPlaylistModal from "../../components/modals/AddToPlaylistModal";
import "./css/Profile.css";
import { getUserAvatar } from "../../utils/userUtils";
import { useAuth } from "../../context/AuthContext";

function UserMenu() {
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
  const [userSongs, setUserSongs] = useState([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

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
        // We now consistently use numeric IDs for all profile fetches
        const response = await userService.getUserById(targetId);

        const userData = response.data || response;
        setUser(userData);

        // Lấy ID thật sự từ response để gọi các API khác
        const realId = userData.userId || userData.idUser || userData.id;

        // Nếu store đang lưu email mà ta đã có ID thật, cập nhật lại store qua AuthContext
        // Hoặc đơn giản là sync name/imageUrl nếu đang xem profile của chính mình
        const isOwnProfile = String(realId) === String(storedIdUser) ||
          String(targetId) === String(storedIdUser) ||
          userData.email === localStorage.getItem("email");

        if (realId && isOwnProfile) {
          updateUser({
            idUser: realId,
            name: userData.name,
            imageUrl: userData.imageUrl
          });
          // Cập nhật lại localStorage
          localStorage.setItem("idUser", realId);
          if (userData.name) localStorage.setItem("name", userData.name);
          if (userData.imageUrl) localStorage.setItem("imageUrl", userData.imageUrl);
        }

        // Init form
        setForm({
          name: userData.name || "",
          email: userData.email || "",
          isActive: userData.isActive ?? true,
          imagePreview: getUserAvatar(userData.imageUrl),
        });
        setIsFollowing(userData.isFollowed || false);

        // Fetch Songs with realId or fallback to targetId
        fetchSongs(realId || targetId);

      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSongs = async (id) => {
      try {
        setSongsLoading(true);
        const response = await songService.getUserSongs(id || targetId);
        const songList = response.data?.data?.content || response.data?.content || response.data || [];
        setUserSongs(Array.isArray(songList) ? songList : []);
      } catch (err) {
        console.error("Error fetching user songs:", err);
      } finally {
        setSongsLoading(false);
      }
    };

    fetchUser();
  }, [targetId, navigate, storedIdUser, currentUserData?.email]);



  // Edit Handlers
  const handleAvatarUpdate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      await userService.updateImage(file);

      // Refresh user data
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

      // Refresh user data
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

  const handleFileChange = (e) => {
    handleAvatarUpdate(e);
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

  const handleSongImageChange = async (songId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSongsLoading(true);
      await songService.updateSongImage(songId, file);

      // Refresh songs after update
      const response = await songService.getUserSongs(targetId);
      const songList = response.data?.data?.content || response.data?.content || response.data || [];
      setUserSongs(Array.isArray(songList) ? songList : []);

      alert("Cập nhật ảnh bài hát thành công!");
    } catch (err) {
      console.error("Lỗi cập nhật ảnh bài hát:", err);
      alert("Cập nhật ảnh bài hát thất bại.");
    } finally {
      setSongsLoading(false);
    }
  };

  if (loading) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <div className="bg-black min-h-screen text-white flex items-center justify-center">User not found</div>;

  return (
    <div className="ig-profile-container">
      {/* 1. Sidebar */}
      <Sidebar />

      {/* 2. Main Content */}
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
          {/* Header Section */}
          <div className="profile-header-meta">
            <div className={`ig-avatar-wrapper ${targetId === storedIdUser ? 'editable' : ''}`} onClick={() => targetId === storedIdUser && document.getElementById('avatar-upload-input').click()}>
              <img
                src={getUserAvatar(user.imageUrl)}
                alt={user.name}
                className="ig-avatar-img"
              />
              {targetId === storedIdUser && (
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
                      {targetId === storedIdUser && (
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
                  {targetId === storedIdUser ? (
                    <>
                      <button className="ig-btn flex items-center gap-2" onClick={() => setIsChangePwdOpen(true)}>
                        <Lock className="w-4 h-4" />
                        Change Password
                      </button>
                    </>
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

          {/* Stats Card */}
          <div className="stats-card">
            <div className="ig-stat-item">
              <span className="ig-stat-count">0</span>
              <span className="ig-stat-label">Posts</span>
            </div>
            <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 self-center"></div>
            <div className="ig-stat-item">
              <span className="ig-stat-count">248</span>
              <span className="ig-stat-label">Followers</span>
            </div>
            <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 self-center"></div>
            <div className="ig-stat-item">
              <span className="ig-stat-count">152</span>
              <span className="ig-stat-label">Following</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="ig-tabs">
            <div
              className={`ig-tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <Grid className="w-4 h-4" /> POSTS
            </div>
            <div
              className={`ig-tab ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              <Bookmark className="w-4 h-4" /> SAVED
            </div>
            <div
              className={`ig-tab ${activeTab === 'tagged' ? 'active' : ''}`}
              onClick={() => setActiveTab('tagged')}
            >
              <UserIcon className="w-4 h-4" /> TAGGED
            </div>
          </div>

          {/* Grid Content / Empty State */}
          {activeTab === 'posts' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {songsLoading ? (
                <div className="text-center py-20 opacity-50">Loading songs...</div>
              ) : userSongs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userSongs.map(song => (
                    <div key={song.id || song.idSong} className="song-card bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all group">
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
                        <img
                          src={getUserAvatar(song.imageUrl)}
                          alt={song.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Music className="w-8 h-8 text-white" />
                          {targetId === storedIdUser && (
                            <button
                              className="absolute top-2 right-2 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                document.getElementById(`song-img-input-${song.id || song.idSong}`).click();
                              }}
                              title="Update Song Image"
                            >
                              <Camera className="w-4 h-4 text-white" />
                            </button>
                          )}
                          <button
                            className="absolute top-2 left-2 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlaylistModal({
                                isOpen: true,
                                songId: song.id || song.idSong,
                                songName: song.name
                              });
                            }}
                            title="Add to Playlist"
                          >
                            <ListMusic className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        {targetId === storedIdUser && (
                          <input
                            type="file"
                            id={`song-img-input-${song.id || song.idSong}`}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleSongImageChange(song.id || song.idSong, e)}
                          />
                        )}
                      </div>
                      <h4 className="font-bold truncate">{song.name}</h4>
                      <p className="text-xs text-slate-500 truncate">{song.genre?.name || "Music"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ig-empty-state">
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Music className="w-10 h-10 text-indigo-500" />
                  </div>
                  <div className="ig-empty-title">Share Your Music</div>
                  <div className="text-slate-500 max-w-sm mx-auto mb-8">
                    Your posts and music will appear here once you start sharing with the community.
                  </div>
                  <button
                    className="btn-primary px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-transform"
                    onClick={() => navigate('/')}
                  >
                    Create First Post
                  </button>
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



      {/* Change Password Modal */}
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
                <button
                  type="button"
                  onClick={() => setIsChangePwdOpen(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-save"
                >
                  {loading ? "Processing..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={playlistModal.isOpen}
        onClose={() => setPlaylistModal({ ...playlistModal, isOpen: false })}
        songId={playlistModal.songId}
        songName={playlistModal.songName}
      />
    </div>
  );
}

export default UserMenu;