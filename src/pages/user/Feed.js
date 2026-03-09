import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Pause, Music, Heart, MessageCircle, Share2, MoreHorizontal, ListMusic, X, Disc } from 'lucide-react';
import SharePostModal from '../../components/modals/SharePostModal';
import CommentSection from '../../components/content/CommentSection';
import PostDetailModal from '../../components/modals/PostDetailModal';
import AddToPlaylistModal from '../../components/modals/AddToPlaylistModal';
import Sidebar from '../../components/layout/Sidebar';
import RightSidebar from '../../components/layout/RightSidebar';
import { useAuth } from '../../context/AuthContext';
import { useSuggestions } from '../../hooks/useSuggestions';
import { usePlayer } from '../../context/PlayerContext';
import postService from '../../services/postService';
import likeService from '../../services/likeService';
import songService from '../../services/songService';
import { toast } from 'react-hot-toast';
import './css/Feed.css';
import { getUserAvatar } from '../../utils/userUtils';

import { MOCK_STORIES } from '../../mocks/mockData';

const DEFAULT_COVER_URL = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";

function NewFeed() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [posts, setPosts] = useState([]);
  const { suggestions, handleFollow } = useSuggestions();
  const { playTrack, currentTrack, isPlaying } = usePlayer();

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


  // State Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [postToShare, setPostToShare] = useState(null);
  const [expandedComments, setExpandedComments] = useState({}); // { postId: boolean }
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPostIdDetail, setSelectedPostIdDetail] = useState(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [songToPlaylist, setSongToPlaylist] = useState({ id: null, name: '' });
  const [activeMenuId, setActiveMenuId] = useState(null);

  const audioRef = useRef(null);

  // --- 1. Fetch User Info (Migrated to AuthContext) ---
  const fetchCurrentUser = useCallback(async () => {
    // No need to call API as user is available from context
  }, []);

  // --- 2. Fetch Posts ---
  const fetchPosts = useCallback(async () => {
    try {
      const response = await postService.getNewFeedPosts(0, 20);
      const data = response.data;

      // Standarizing response format (handling data.data or data directly)
      const content = data.data?.content || data.content || data.data || data || [];

      const mappedPosts = content.map(post => {
        // Use numeric ID for profile navigation
        const authorId = post.idUser || post.user?.userId || post.user?.id || post.authorId;
        const fallbackAvatar = getUserAvatar(post.imageUrlUser || post.authorAvatar || post.user?.imageUrl);

        let imageToUse = post.imageUrlSong || post.imageUrlAlbum;
        imageToUse = imageToUse ? (imageToUse.startsWith('http') ? imageToUse : `http://localhost:8080${imageToUse}`) : fallbackAvatar;

        return {
          id: post.idPost || post.id,
          authorId: authorId,
          username: post.username || post.authorName || (post.user?.name) || 'Unknown',
          userAvatar: fallbackAvatar,
          postImage: imageToUse,
          musicLink: post.musicLink ? (post.musicLink.startsWith('http') ? post.musicLink : `http://localhost:8080${post.musicLink}`) : null,
          caption: post.content,
          content: post.content,
          commentCount: post.commentCount || 0,
          likes: post.likeCount || post.likes || 0,
          likeCount: post.likeCount || post.likes || 0,
          timeAgo: 'Just now',
          isLiked: post.liked || post.isLiked || false,
          liked: post.liked || post.isLiked || false,
          idSong: post.idSong,
          idAlbum: post.idAlbum,
          nameSong: post.nameSong,
          nameAlbum: post.nameAlbum,
          imageUrlSong: post.imageUrlSong,
          imageUrlAlbum: post.imageUrlAlbum,
          playCount: post.playCount || 0,
          // Group info
          groupId: post.groupId,
          groupName: post.groupName,
          groupImage: post.groupImage ? (post.groupImage.startsWith('http') ? post.groupImage : `http://localhost:8080${post.groupImage}`) : null,
          // Share details
          postType: post.postType,
          idPostShare: post.idPostShare,
          userNameShare: post.userNameShare,
          userImageShare: post.userImageShare,
          contentShare: post.contentShare,
        };
      });

      // Strictly use mapped posts, no mock fallback
      setPosts(mappedPosts);
    } catch (error) {
      console.error("Error loading posts from API:", error);
      setPosts([]); // Clear posts on error
    }
  }, []);

  // --- 3. Fetch Suggestions (Moved to hook) ---

  // --- 4. Handle Follow (Moved to hook) ---

  useEffect(() => {
    fetchCurrentUser();
    fetchPosts();
  }, [fetchCurrentUser, fetchPosts]);

  // Handle global post creation
  useEffect(() => {
    const handleGlobalPostCreated = () => {
      fetchPosts();
    };
    window.addEventListener('POST_CREATED', handleGlobalPostCreated);
    return () => window.removeEventListener('POST_CREATED', handleGlobalPostCreated);
  }, [fetchPosts]);

  // Handle notification redirect to post detail
  useEffect(() => {
    if (postId) {
      setSelectedPostIdDetail(postId);
      setIsDetailModalOpen(true);
    }
  }, [postId]);

  const handlePlayMusic = async (post) => {
    let musicLink = post.musicLink;
    if (!musicLink && post.idSong) {
      try {
        const res = await songService.getSongById(post.idSong);
        const fullSong = res.data?.data || res.data;
        musicLink = fullSong?.musicUrl;
      } catch (err) {
        console.error("Failed to fetch song details:", err);
        return;
      }
    }
    musicLink = musicLink ? (musicLink.startsWith('http') ? musicLink : `http://localhost:8080${musicLink}`) : null;
    if (!musicLink) return;

    playTrack({
      id: post.idSong || post.id,
      title: post.nameSong || "Original Audio",
      artist: post.username,
      avatar: post.imageUrlSong || post.postImage || getUserAvatar(post.imageUrlUser),
      url: musicLink
    });
  };

  const toggleLike = async (postId) => {
    // Optimistic update
    let oldPostData = null;
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          oldPostData = { ...post };
          const isLiked = !(post.isLiked || post.liked);
          const count = (post.likeCount || post.likes || 0) + (isLiked ? 1 : -1);
          return { ...post, isLiked: isLiked, liked: isLiked, likes: count, likeCount: count };
        }
        return post;
      })
    );

    try {
      const response = await likeService.toggleLike(postId);

      // Standardize response extraction
      const apiData = response.data || response;
      const resultData = apiData.data || apiData;

      const isLikedResult = resultData.liked !== undefined ? resultData.liked : resultData.isLiked;
      const likeCountResult = resultData.likeCount !== undefined ? resultData.likeCount : (resultData.likes || 0);

      // Sync with real data from server
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, isLiked: isLikedResult, liked: isLikedResult, likes: likeCountResult, likeCount: likeCountResult }
            : post
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert on error
      if (oldPostData) {
        setPosts(prevPosts => prevPosts.map(p => p.id === postId ? oldPostData : p));
      }
      toast.error("Failed to update like status");
    }
  };

  const stories = MOCK_STORIES;

  const handleProfileClick = (authorId) => {
    if (authorId) {
      navigate(`/user/${authorId}`);
    }
  };

  return (
    <div className="flex min-h-screen feed-container">
      <SharePostModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={postToShare}
        onShareSuccess={() => {
          // Optionally, show a toast or refresh feed
          fetchPosts();
        }}
      />

      <PostDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        postId={selectedPostIdDetail}
        onUpdate={(postId, updates) => {
          // Sync updates to the feed list if needed
          setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
        }}
      />

      <AddToPlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        songId={songToPlaylist.id}
        songName={songToPlaylist.name}
      />

      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-[240px] xl:mr-[320px] ml-0 mr-0 transition-all duration-300">
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
              <div className="text-center text-gray-500 py-10">No posts available.</div>
            ) : (
              posts.map(post => (
                <article key={post.id} className="post-article">
                  <div className="post-header">
                    <div className="flex flex-col w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {post.groupId ? (
                            <div className="relative cursor-pointer group-avatar-container" onClick={(e) => { e.stopPropagation(); navigate(`/groups/${post.groupId}`); }}>
                              <img
                                src={post.groupImage || 'https://via.placeholder.com/40?text=G'}
                                alt={post.groupName}
                                className="w-10 h-10 rounded-xl object-cover border-2 border-white/10"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=G' }}
                              />
                            </div>
                          ) : (
                            <div className="relative cursor-pointer" onClick={(e) => { e.stopPropagation(); handleProfileClick(post.authorId); }}>
                              <img
                                src={post.userAvatar}
                                alt={post.username}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
                                onError={(e) => { e.target.src = 'https://i.pravatar.cc/150' }}
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                            </div>
                          )}
                          <div className="flex flex-col cursor-pointer" onClick={(e) => {
                            e.stopPropagation();
                            if (post.groupId) navigate(`/groups/${post.groupId}`);
                            else handleProfileClick(post.authorId);
                          }}>
                            {post.groupId ? (
                              <>
                                <span className="username font-bold text-white hover:text-indigo-400 transition-colors">{post.groupName}</span>
                                <span className="text-[11px] text-slate-400 font-medium hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); handleProfileClick(post.authorId); }}>
                                  {post.username}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="username font-bold text-white hover:text-indigo-400 transition-colors">{post.username}</span>
                                {(post.idSong || post.idAlbum) && (
                                  <div className="flex items-center music-info text-[10px] text-slate-400">
                                    {post.idAlbum ? <Disc className="w-3 h-3 mr-1" /> : <Music className="w-3 h-3 mr-1" />}
                                    <span>{post.idAlbum ? 'Album' : 'Song'}</span>
                                    {(post.idSong || post.idAlbum) && (
                                      <>
                                        <span className="mx-1">•</span>
                                        <span>{(post.playCount || 0).toLocaleString()} plays</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {post.postType === 'SHARE' && (
                        <div
                          className="mt-2 ml-13 flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-400 cursor-pointer transition-colors border-t border-white/5 pt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPostIdDetail(post.idPostShare);
                            setIsDetailModalOpen(true);
                          }}
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Shared from </span>
                          <span className="font-bold text-indigo-400">{post.userNameShare}</span>
                          <span>'s post</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="post-media-container group cursor-pointer" onClick={() => { setSelectedPostIdDetail(post.id); setIsDetailModalOpen(true); }}>
                    <img
                      src={post.postImage}
                      alt="Post"
                      className={`post-image ${(currentTrack?.id === (post.idSong || post.id) && isPlaying) ? 'opacity-90 transition-all' : ''}`}
                      onDoubleClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                    />

                    {post.idSong && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePlayMusic(post); }}
                        className={`absolute bottom-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-all border border-white/30 z-10 shadow-xl ${(currentTrack?.id === (post.idSong || post.id) && isPlaying) ? 'bg-indigo-500 scale-110' : 'opacity-100 scale-100'}`}
                      >
                        {(currentTrack?.id === (post.idSong || post.id) && isPlaying) ? (
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
                          className={`w-7 h-7 cursor-pointer hover:scale-125 transition-all duration-300 ${post.isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
                          onClick={() => toggleLike(post.id)}
                        />
                        <MessageCircle
                          className={`w-7 h-7 cursor-pointer transition-colors ${expandedComments[post.id] ? 'text-indigo-500' : 'text-slate-500 hover:text-indigo-500'}`}
                          onClick={() => navigate(`/posts/${post.id}`)}
                        />
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
                    </div>

                    <div className="likes-count mb-2">
                      {(post.likes !== undefined ? post.likes : post.likeCount).toLocaleString()} likes
                    </div>
                    <div className="caption">
                      <span className="username">{post.username}</span>
                      <span className="opacity-90">{post.caption}</span>
                    </div>

                    <div className="comment-input-container">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                        <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover" />
                      </div>
                      <input type="text" placeholder="Add a comment..." className="comment-input" onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: true }))} readOnly />
                    </div>

                    {expandedComments[post.id] && (
                      <CommentSection
                        postId={post.id}
                        totalComments={post.commentCount}
                        onCommentAdded={() => {
                          setPosts(prev => prev.map(p =>
                            p.id === post.id ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
                          ));
                        }}
                        onClose={() => setExpandedComments(prev => ({ ...prev, [post.id]: false }))}
                      />
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <div className="hidden xl:block">
        <RightSidebar
          currentUser={currentUser}
          suggestions={suggestions}
          onFollow={handleFollow}
        />
      </div>
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