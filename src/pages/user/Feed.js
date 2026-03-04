import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Music, Volume2, VolumeX, Heart, MessageCircle } from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import CreatePostModal from '../../components/modals/CreatePostModal';
import SharePostModal from '../../components/modals/SharePostModal';
import Sidebar from '../../components/layout/Sidebar';
import RightSidebar from '../../components/layout/RightSidebar';
import { useAuth } from '../../context/AuthContext';
import { useSuggestions } from '../../hooks/useSuggestions';
import { usePlayer } from '../../context/PlayerContext';
import postService from '../../services/postService';
import './css/Feed.css';
import { getUserAvatar } from '../../utils/userUtils';

import { MOCK_POSTS, MOCK_STORIES } from '../../mocks/mockData';

const DEFAULT_COVER_URL = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";

function NewFeed() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const { suggestions, handleFollow } = useSuggestions();
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const { user } = useAuth();

  // State lưu thông tin user hiện tại
  const [currentUser, setCurrentUser] = useState({
    name: '',
    username: '',
    avatar: null
  });

  useEffect(() => {
    if (user) {
      setCurrentUser({
        name: user.name || "Người dùng",
        username: user.email || "",
        avatar: getUserAvatar(user.imageUrl)
      });
    }
  }, [user]);


  // State Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [postToShare, setPostToShare] = useState(null);

  const audioRef = useRef(null);

  // --- 1. Fetch User Info (Đã chuyển sang dùng AuthContext) ---
  const fetchCurrentUser = useCallback(async () => {
    // Không cần gọi API nữa vì đã có user từ context
  }, []);

  // --- 2. Fetch Posts ---
  const fetchPosts = useCallback(async () => {
    try {
      const response = await postService.getAllPosts(0, 20);
      const data = response.data;

      // Standarizing response format (handling data.data or data directly)
      const content = data.data?.content || data.content || data.data || data || [];

      const mappedPosts = content.map(post => {
        // Use numeric ID for profile navigation
        const authorId = post.user?.idUser || post.user?.userId || post.user?.id || post.authorId;

        return {
          id: post.id,
          authorId: authorId,
          username: post.authorName || (post.user?.name) || 'Unknown',
          userAvatar: getUserAvatar(post.authorAvatar || post.user?.imageUrl),
          postImage: post.imageUrl ? (post.imageUrl.startsWith('http') ? post.imageUrl : `http://localhost:8080${post.imageUrl}`) : DEFAULT_COVER_URL,
          musicLink: post.musicLink ? (post.musicLink.startsWith('http') ? post.musicLink : `http://localhost:8080${post.musicLink}`) : null,
          likes: post.likes || 0,
          caption: post.content,
          comments: 0,
          timeAgo: 'Vừa xong',
          isLiked: false,
        };
      });

      // Strictly use mapped posts, no mock fallback
      setPosts(mappedPosts);
    } catch (error) {
      console.error("Lỗi khi tải bài viết từ API:", error);
      setPosts([]); // Clear posts on error
    }
  }, []);

  // --- 3. Fetch Suggestions (Moved to hook) ---

  // --- 4. Handle Follow (Moved to hook) ---

  useEffect(() => {
    fetchCurrentUser();
    fetchPosts();
  }, [fetchCurrentUser, fetchPosts]);

  // Helpers Audio/Like
  const handlePlayMusic = (post) => {
    playTrack({
      id: post.id,
      title: "Original Audio",
      artist: post.username,
      avatar: post.postImage,
      url: post.musicLink
    });
  };

  const toggleLike = (postId) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  };

  const stories = MOCK_STORIES;

  const handleProfileClick = (authorId) => {
    if (authorId) {
      navigate(`/user/userId=${authorId}`);
    }
  };

  return (
    <div className="flex min-h-screen feed-container">
      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onPostCreated={fetchPosts} />
      <SharePostModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={postToShare}
        onShareSuccess={() => {
          // Optionally, show a toast or refresh feed
          fetchPosts();
        }}
      />

      {/* Left Sidebar */}
      <Sidebar onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 ml-[120px] mr-[320px] transition-all duration-300">
        <div className="max-w-[630px] mx-auto px-4 py-8">
          {/* Stories */}
          <div className="stories-container">
            <div className="flex gap-4 overflow-x-auto stories pb-1">
              <style>{`.stories::-webkit-scrollbar { display: none; }`}</style>
              {stories.map(story => (
                <div key={story.id} className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 w-[72px] story-item group">
                  <div className={`p-[3px] rounded-full transition-all duration-300 group-hover:scale-105 ${story.isOwn ? 'bg-slate-200 dark:bg-slate-700' : 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500'}`}>
                    <div className="story-ring">
                      <img src={story.avatar} alt={story.username} className="story-avatar" />
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold truncate w-full text-center opacity-80 group-hover:opacity-100 transition-opacity">{story.isOwn ? 'Your Story' : story.username}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center text-gray-500 py-10">Không có bài viết nào.</div>
            ) : (
              posts.map(post => (
                <article key={post.id} className="post-article">
                  <div className="post-header">
                    <div className="flex items-center gap-3">
                      <div className="relative cursor-pointer" onClick={() => handleProfileClick(post.authorId)}>
                        <img
                          src={post.userAvatar}
                          alt={post.username}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
                          onError={(e) => { e.target.src = 'https://i.pravatar.cc/150' }}
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                      </div>
                      <div className="flex flex-col cursor-pointer" onClick={() => handleProfileClick(post.authorId)}>
                        <span className="username">{post.username}</span>
                        {post.musicLink && (
                          <div className="flex items-center music-info">
                            <Music className="w-3 h-3" />
                            <span>Original Audio</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-slate-500">
                      <MoreHorizontalIcon />
                    </button>
                  </div>

                  <div className="post-media-container group">
                    <img
                      src={post.postImage}
                      alt="Post"
                      className={`post-image ${(currentTrack?.id === post.id && isPlaying) ? 'opacity-90 transition-all' : ''}`}
                      onDoubleClick={() => toggleLike(post.id)}
                    />

                    {post.musicLink && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePlayMusic(post); }}
                        className={`absolute bottom-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-all border border-white/30 z-10 shadow-xl ${(currentTrack?.id === post.id && isPlaying) ? 'bg-indigo-500 scale-110' : 'opacity-100 scale-100'}`}
                      >
                        {(currentTrack?.id === post.id && isPlaying) ? (
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
                          className={`w-7 h-7 cursor-pointer hover:scale-125 transition-all duration-300 ${post.isLiked ? 'fill-red-500 text-red-500' : 'text-slate-500 hover:text-red-500'}`}
                          onClick={() => toggleLike(post.id)}
                        />
                        <MessageCircle className="w-7 h-7 cursor-pointer text-slate-500 hover:text-indigo-500 transition-colors" />
                        <svg
                          onClick={() => {
                            setPostToShare(post);
                            setIsShareModalOpen(true);
                          }}
                          className="w-7 h-7 cursor-pointer text-slate-500 hover:text-indigo-500 transition-colors"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </div>
                      <svg className="w-7 h-7 cursor-pointer text-slate-500 hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>

                    <div className="likes-count mb-2">{post.likes.toLocaleString()} likes</div>
                    <div className="caption">
                      <span className="username">{post.username}</span>
                      <span className="opacity-90">{post.caption}</span>
                    </div>

                    <div className="comment-input-container">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                        <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover" />
                      </div>
                      <input type="text" placeholder="Add a comment..." className="comment-input" />
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar
        currentUser={currentUser}
        suggestions={suggestions}
        onFollow={handleFollow}
      />
    </div>
  );
}

// Helpers
function MoreHorizontalIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
    </svg>
  );
}

export default NewFeed;