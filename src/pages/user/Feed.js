import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Pause, Music, Heart, MessageCircle, Share2, MoreHorizontal, ListMusic, X, Disc } from 'lucide-react';
import SharePostModal from '../../components/modals/SharePostModal';
import CommentSection from '../../components/content/CommentSection';
import PostItem from '../../components/content/PostItem';
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
                <PostItem
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  isPlaying={isPlaying}
                  currentTrack={currentTrack}
                  onPlayMusic={handlePlayMusic}
                  onToggleLike={toggleLike}
                  onProfileClick={handleProfileClick}
                  onPostClick={(id) => { setSelectedPostIdDetail(id); setIsDetailModalOpen(true); }}
                  onSharePost={(p) => { setPostToShare(p); setIsShareModalOpen(true); }}
                  onAddToPlaylist={(track) => { setSongToPlaylist(track); setIsPlaylistModalOpen(true); }}
                  expandedComments={expandedComments[post.id]}
                  onToggleComments={(id) => setExpandedComments(prev => ({ ...prev, [id]: !prev[id] }))}
                  onCommentAdded={() => {
                    setPosts(prev => prev.map(p =>
                      p.id === post.id ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
                    ));
                  }}
                  onNavigateToGroup={(groupId) => navigate(`/groups/${groupId}`)}
                />
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