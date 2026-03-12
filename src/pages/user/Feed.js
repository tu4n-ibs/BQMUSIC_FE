import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SharePostModal from '../../components/modals/SharePostModal';
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
import albumService from '../../services/albumService';
import { toast } from 'react-hot-toast';
import groupService from '../../services/groupService';
import './css/Feed.css';
import { getUserAvatar } from '../../utils/userUtils';

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
  const [userGroups, setUserGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
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
        imageToUse = imageToUse ? (imageToUse.startsWith('http') ? imageToUse : `${process.env.REACT_APP_API_BASE_URL}${imageToUse}`) : fallbackAvatar;

        return {
          id: post.idPost || post.id,
          authorId: authorId,
          username: post.username || post.authorName || (post.user?.name) || 'Unknown',
          userAvatar: fallbackAvatar,
          postImage: imageToUse,
          musicLink: post.musicLink ? (post.musicLink.startsWith('http') ? post.musicLink : `${process.env.REACT_APP_API_BASE_URL}${post.musicLink}`) : null,
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
          groupImage: post.groupImage ? (post.groupImage.startsWith('http') ? post.groupImage : `${process.env.REACT_APP_API_BASE_URL}${post.groupImage}`) : null,
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

  // --- 2.5 Fetch User Groups ---
  const fetchUserGroups = useCallback(async () => {
    if (!user) return;
    try {
      setGroupsLoading(true);
      const userId = user.userId || user.idUser || user.id;
      if (userId) {
        const groups = await groupService.getUserGroups(userId);
        setUserGroups(groups);
      }
    } catch (error) {
      console.error("Error loading user groups:", error);
    } finally {
      setGroupsLoading(false);
    }
  }, [user]);

  // --- 3. Fetch Suggestions (Moved to hook) ---

  // --- 4. Handle Follow (Moved to hook) ---

  useEffect(() => {
    fetchCurrentUser();
    fetchPosts();
    fetchUserGroups();
  }, [fetchCurrentUser, fetchPosts, fetchUserGroups]);

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
    // 1. Handle Album Post
    if (post.idAlbum) {
      try {
        const response = await albumService.getSongsByAlbumId(post.idAlbum);
        const albumDetail = response.data || response;

        if (albumDetail.songs && albumDetail.songs.length > 0) {
          const albumQueue = albumDetail.songs.map(song => ({
            id: song.songId,
            title: song.songName,
            artist: albumDetail.nameUser || albumDetail.username || post.username,
            avatar: song.songImageUrl || albumDetail.imageUrl || post.postImage,
            url: song.musicUrl ? (song.musicUrl.startsWith('http') ? song.musicUrl : `${process.env.REACT_APP_API_BASE_URL}${song.musicUrl}`) : null
          }));

          // Fetch first song URL if missing (some responses might only have partial data)
          const firstSong = albumQueue[0];
          if (!firstSong.url) {
            const res = await songService.getSongById(firstSong.id);
            const fullSong = res.data?.data || res.data;
            firstSong.url = fullSong?.musicUrl ? (fullSong.musicUrl.startsWith('http') ? fullSong.musicUrl : `${process.env.REACT_APP_API_BASE_URL}${fullSong.musicUrl}`) : null;
          }

          if (firstSong.url) {
            playTrack(firstSong, albumQueue, 0);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch album tracks:", err);
        toast.error("Could not load album tracks");
      }
    }

    // 2. Handle Single Song Post
    let songId = post.idSong || post.id;
    let musicLink = post.musicLink;
    let songMetadata = null;

    if (songId) {
      try {
        const res = await songService.getSongById(songId);
        songMetadata = res.data?.data || res.data;
        musicLink = songMetadata?.musicUrl || musicLink;
      } catch (err) {
        console.error("Failed to fetch song details for playback:", err);
      }
    }
    
    musicLink = musicLink ? (musicLink.startsWith('http') ? musicLink : `${process.env.REACT_APP_API_BASE_URL}${musicLink}`) : null;
    if (!musicLink) return;

    const avatarToUse = songMetadata?.imageUrl || post.imageUrlSong || post.postImage || getUserAvatar(post.imageUrlUser);
    const fullAvatar = avatarToUse ? (avatarToUse.startsWith('http') ? avatarToUse : `${process.env.REACT_APP_API_BASE_URL}${avatarToUse}`) : getUserAvatar(user.imageUrl);

    playTrack({
      id: songId,
      title: songMetadata?.name || post.nameSong || "Original Audio",
      artist: songMetadata?.artistName || post.username,
      avatar: fullAvatar,
      url: musicLink
    }, posts.filter(p => p.musicLink || p.idSong).map(p => ({
      id: p.idSong || p.id,
      title: p.nameSong || "Original Audio",
      artist: p.username,
      avatar: p.imageUrlSong || p.postImage || getUserAvatar(p.imageUrlUser),
      url: p.musicLink
    })));
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
      <main className="flex-1 lg:ml-[240px] md:ml-[80px] xl:mr-[320px] ml-0 mr-0 transition-all duration-300">
        <div className="max-w-[630px] mx-auto px-4 py-8">
          {/* Groups Section (Replaces Stories) */}
          <div className="stories-container mb-8">
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Your Groups</h3>
              <button 
                onClick={() => navigate('/groups')} 
                className="text-[11px] font-extrabold text-indigo-500 hover:text-indigo-400 transition-colors uppercase tracking-wider"
              >
                Explore Groups
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto stories pb-2">
              <style>{`
                .stories::-webkit-scrollbar { height: 4px; }
                .stories::-webkit-scrollbar-track { background: transparent; }
                .stories::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .stories::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
              `}</style>

              {groupsLoading ? (
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                      <div className="w-[66px] h-[66px] rounded-full bg-slate-800"></div>
                      <div className="w-12 h-2 bg-slate-800 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : userGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4 w-full">
                  <p className="text-xs text-slate-500 mb-2">You haven't joined any groups yet.</p>
                </div>
              ) : (
                userGroups.map(group => (
                  <div
                    key={group.id}
                    className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 w-[72px] story-item group"
                    onClick={() => navigate(`/groups/${group.id}`)}
                  >
                    <div className="p-[3px] rounded-full transition-all duration-300 group-hover:scale-105 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/20">
                      <div className="story-ring bg-slate-900">
                        <img
                          src={group.imageUrl ? (group.imageUrl.startsWith('http') ? group.imageUrl : `${process.env.REACT_APP_API_BASE_URL}${group.imageUrl}`) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop'}
                          alt={group.name}
                          className="story-avatar w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold truncate w-full text-center opacity-80 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden text-ellipsis">
                      {group.name}
                    </span>
                  </div>
                ))
              )}
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

export default NewFeed;