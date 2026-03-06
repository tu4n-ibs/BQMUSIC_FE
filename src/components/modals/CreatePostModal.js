import { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Music, Loader2, UploadCloud, ChevronRight, ChevronLeft, Trash2, History, Plus, Disc, Mic2, Radio, Headphones, Guitar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import genreService from '../../services/genreService';
import albumService from '../../services/albumService';
import songService from '../../services/songService';
import postService from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import './css/CreatePostModal.css';

const DRAFTS_KEY = 'bq_music_song_drafts';

const CreatePostModal = ({ isOpen, onClose, onPostCreated, groupId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Upload Music, 2: Post Details
  const [isLoading, setIsLoading] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [drafts, setDrafts] = useState([]);

  // Step 1 State: Song Data
  const [songName, setSongName] = useState('');
  const [genreId, setGenreId] = useState('');
  const [genres, setGenres] = useState([]);
  const [errors, setErrors] = useState({}); // To track validation errors

  const [selectedMusic, setSelectedMusic] = useState(null);
  const [uploadedSong, setUploadedSong] = useState(null); // Result from Step 1 (Song)
  const [selectedAlbum, setSelectedAlbum] = useState(null); // Result from Step 1 (Album)
  const [userAlbums, setUserAlbums] = useState([]);
  const [postTargetType, setPostTargetType] = useState('SONG'); // SONG or ALBUM

  // Step 2 State
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [visibility, setVisibility] = useState('PUBLIC');

  // Refs
  const imageInputRef = useRef(null);
  const musicInputRef = useRef(null);

  const DEFAULT_IMAGE_PREVIEW = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";

  // Load drafts, genres and albums
  useEffect(() => {
    if (isOpen) {
      const savedDrafts = localStorage.getItem(DRAFTS_KEY);
      if (savedDrafts) {
        setDrafts(JSON.parse(savedDrafts));
      }
      fetchGenres();
      fetchUserAlbums();
    }
  }, [isOpen]);

  const fetchGenres = async () => {
    try {
      const response = await genreService.getAllGenres();
      if (response && response.success) {
        setGenres(response.data || []);
      }
    } catch (error) {
      console.error("Failed to load genres:", error);
    }
  };

  const fetchUserAlbums = async () => {
    try {
      const data = await albumService.getAllAlbums();
      // Handle both {success: true, data: [...]} and direct array format
      const albums = data.data || data || [];
      setUserAlbums(Array.isArray(albums) ? albums : []);
    } catch (error) {
      console.error("Failed to load albums:", error);
    }
  };

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleMusicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedMusic(file);
      // Auto-set song name from filename if empty
      if (!songName) {
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
        setSongName(nameWithoutExt);
      }
    }
  };

  // Step 1: Upload Song
  const handleUploadSong = async () => {
    let newErrors = {};
    if (!selectedMusic) newErrors.music = true;
    if (!songName.trim()) newErrors.name = true;
    if (!genreId) newErrors.genre = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      const response = await songService.uploadSong(songName, genreId || "UNKNOWN", selectedMusic);
      const songData = response.data.data || response.data;
      setUploadedSong(songData);
      saveDraft(songData);
      setStep(2);
    } catch (error) {
      console.error("Music upload error:", error);
      const msg = error?.response?.data?.message || "";
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("exists")) {
        alert("Warning: This song might already exist in the system.");
      } else {
        alert("Music upload failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAlbum = (album) => {
    setSelectedAlbum(album);
    setStep(2);
  };

  // Draft logic
  const saveDraft = (songInfo) => {
    const newDraft = {
      ...songInfo,
      id: Date.now(), // Local ID for UI management
      savedAt: new Date().toISOString()
    };
    const updatedDrafts = [newDraft, ...drafts];
    setDrafts(updatedDrafts);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
  };

  const removeDraft = (e, draftId) => {
    e.stopPropagation();
    const updatedDrafts = drafts.filter(d => d.id !== draftId);
    setDrafts(updatedDrafts);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
  };

  const selectDraft = (draft) => {
    setUploadedSong(draft);
    setSongName(draft.name);
    const gId = draft.genreId || draft.idGenre || (draft.genre && draft.genre.id);
    if (gId) setGenreId(gId);
    setPostTargetType('SONG');
    setStep(2);
    setShowDrafts(false);
  };

  // Step 2: Create Post
  const handleSubmitPost = async () => {
    if (postTargetType === 'SONG' && !uploadedSong) return;
    if (postTargetType === 'ALBUM' && (!selectedAlbum || !uploadedSong)) {
      alert("Please select an album and ensure your song is uploaded.");
      return;
    }

    setIsLoading(true);
    try {
      const songId = uploadedSong.id || uploadedSong.idSong;

      // If adding to album, call the album service first
      if (postTargetType === 'ALBUM') {
        await albumService.addSongToAlbum(selectedAlbum.id, songId);
      }

      const postData = {
        content: content,
        visibility: visibility,
        targetType: postTargetType,
        targetId: postTargetType === 'SONG' ? songId : selectedAlbum.id
      };

      if (groupId) {
        await postService.createGroupPost(groupId, postData, selectedImage);
      } else {
        await postService.createPost(postData, selectedImage);
      }

      // Cleanup drafts
      const updatedDrafts = drafts.filter(d => (d.idSong || d.id) !== songId);
      setDrafts(updatedDrafts);
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));

      handleClose();
      onPostCreated();
      alert(`Successfully posted ${groupId ? 'to group' : ''}! 🎵`);
    } catch (error) {
      console.error("Post error:", error);
      const errorMsg = error?.response?.data?.message || "Failed to post.";
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset states
    setStep(1);
    setSongName('');
    setGenreId('');
    setErrors({});
    setSelectedMusic(null);
    setUploadedSong(null);
    setSelectedAlbum(null);
    setPostTargetType('SONG');
    setContent('');
    setSelectedImage(null);
    setPreviewUrl(null);
    setShowDrafts(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4 animate-in fade-in duration-200">
      <div className="rounded-xl w-full max-w-lg flex flex-col max-h-[85vh] modal-content relative">

        {/* Header */}
        <div className="flex items-center justify-between modal-header shrink-0">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="p-1 hover:bg-black/10 rounded-full transition">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-base font-bold">
              {step === 1 ? 'Upload Music' : 'Post Details'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {step === 1 && drafts.length > 0 && (
              <button
                onClick={() => setShowDrafts(!showDrafts)}
                className={`p-1.5 rounded-full transition ${showDrafts ? 'bg-blue-500 text-white' : 'hover:bg-black/10'}`}
                title="Drafts"
              >
                <History className="w-5 h-5" />
              </button>
            )}
            <button onClick={handleClose} className="p-1 hover:bg-black/10 rounded-full transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body overflow-y-auto flex-1">
          {showDrafts && step === 1 ? (
            <div className="drafts-container animate-in slide-in-from-top-2 duration-200">
              <h3 className="text-sm font-bold mb-3 px-1">Uploaded songs not yet posted:</h3>
              <div className="flex flex-col gap-2">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    onClick={() => selectDraft(draft)}
                    className="flex items-center justify-between p-3 rounded-lg bg-black/5 hover:bg-black/10 cursor-pointer transition border border-transparent hover:border-blue-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white">
                        <Music className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{draft.name}</p>
                        <p className="text-[10px] opacity-50">{new Date(draft.savedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => removeDraft(e, draft.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1: UPLOAD MUSIC OR SELECT ALBUM */
            <div className="step-1-content animate-in slide-in-from-right-4 duration-300">

              {/* STEP 1: UPLOAD MUSIC ONLY */}
              <div className="step-1-content animate-in slide-in-from-right-4 duration-300">
                <div
                  onClick={() => musicInputRef.current.click()}
                  className={`upload-area rounded-xl p-6 mb-4 transition cursor-pointer flex flex-col items-center justify-center gap-3 group
                  ${selectedMusic ? 'active border-blue-500' : ''}
                  ${errors.music ? 'border-red-500 bg-red-50' : ''}`}
                >
                  {selectedMusic ? (
                    <>
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <Music className="w-6 h-6 text-white animate-pulse" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-blue-700 break-all">{selectedMusic.name}</p>
                        <p className="text-xs text-blue-500">{(selectedMusic.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs bg-white px-3 py-1.5 rounded-full border border-blue-200 text-blue-600 font-medium">Change</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMusic(null);
                            setSongName('');
                          }}
                          className="text-xs bg-red-50 px-3 py-1.5 rounded-full border border-red-200 text-red-600 font-medium hover:bg-red-100 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center group-hover:scale-110 transition duration-300">
                        <UploadCloud className="w-7 h-7 opacity-50" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">Choose your music file</p>
                        <p className="text-xs opacity-50 mt-1">Supports MP3, WAV, M4A...</p>
                      </div>
                    </>
                  )}
                </div>
                {errors.music && <p className="text-[10px] text-red-500 font-bold mb-4 text-center">Please select a music file</p>}

                <div className="flex flex-col gap-4">
                  <div className="input-group">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1.5 block">Song Title</label>
                    <input
                      type="text"
                      value={songName}
                      onChange={(e) => {
                        setSongName(e.target.value);
                        if (errors.name) setErrors({ ...errors, name: false });
                      }}
                      placeholder="Enter song title..."
                      className={`w-full p-3 bg-black/5 rounded-lg border transition outline-none modal-input
                      ${errors.name ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-blue-500'}`}
                    />
                    {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">Song title cannot be empty</p>}
                  </div>

                  <div className="input-group mt-4">
                    <div className="selection-container">
                      <label className={`selection-label ${errors.genre ? 'text-red-500' : ''}`}>
                        Genre {errors.genre && <span className="text-[10px] font-bold"> - Please select</span>}
                      </label>
                      <div className="selection-wrapper">
                        <div className="selection-row">
                          {/* Genre Cards */}
                          {genres.map((genre, idx) => {
                            const icons = [Mic2, Headphones, Radio, Guitar, Music];
                            const IconComp = icons[idx % icons.length];
                            return (
                              <div
                                key={genre.id}
                                className={`selection-card card-theme-${(idx % 6) + 1} ${genreId === genre.id ? 'active' : ''} ${errors.genre ? 'border-red-300' : ''}`}
                                onClick={() => {
                                  setGenreId(genre.id);
                                  if (errors.genre) setErrors({ ...errors, genre: false });
                                }}
                              >
                                <div className="card-icon-wrapper">
                                  <IconComp className="w-5 h-5" />
                                </div>
                                <span className="card-label">{genre.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: POST DETAILS */
            <div className="step-2-content animate-in slide-in-from-right-4 duration-300">
              {/* Target Type Toggle */}
              <div className="flex gap-2 mb-6 p-1 bg-black/5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPostTargetType('SONG')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2
                    ${postTargetType === 'SONG' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:bg-black/5'}`}
                >
                  <Music className="w-3.5 h-3.5" />
                  Post as Single
                </button>
                <button
                  type="button"
                  onClick={() => setPostTargetType('ALBUM')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2
                    ${postTargetType === 'ALBUM' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:bg-black/5'}`}
                >
                  <Disc className="w-3.5 h-3.5" />
                  Add to Album
                </button>
              </div>

              {postTargetType === 'ALBUM' && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2 block">Choose Album</label>
                  <div className="album-selection-grid grid grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                    {userAlbums.length > 0 ? (
                      userAlbums.map((album) => (
                        <div
                          key={album.id}
                          onClick={() => setSelectedAlbum(album)}
                          className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all
                            ${selectedAlbum?.id === album.id ? 'border-blue-500 shadow-md ring-2 ring-blue-500/10' : 'border-transparent hover:border-blue-200'}`}
                        >
                          <img
                            src={album.imageUrl ? `http://localhost:8080${album.imageUrl}` : DEFAULT_IMAGE_PREVIEW}
                            alt={album.name}
                            className="w-full h-full object-cover"
                          />
                          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${selectedAlbum?.id === album.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <p className="text-[10px] text-white font-bold text-center px-1 truncate w-full">{album.name}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 py-6 text-center bg-black/5 rounded-lg border border-dashed border-black/10">
                        <p className="text-[10px] opacity-50">No albums found.</p>
                        <button onClick={() => navigate('/my-albums')} className="text-[10px] text-blue-500 font-bold hover:underline">Create One</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4 mb-4">
                <div className="shrink-0">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1.5 block">Cover Image</label>
                  <div
                    className="relative w-28 h-28 rounded-lg overflow-hidden cursor-pointer group shadow-md border border-black/10"
                    onClick={() => imageInputRef.current.click()}
                  >
                    <img
                      src={previewUrl || DEFAULT_IMAGE_PREVIEW}
                      alt="Cover"
                      className={`w-full h-full object-cover transition duration-300 ${!previewUrl ? 'opacity-80 grayscale' : ''}`}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 block">Caption</label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="text-[10px] font-bold py-1 px-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full outline-none hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <option value="PUBLIC">PUBLIC</option>
                      <option value="PRIVATE">PRIVATE</option>
                    </select>
                  </div>
                  <textarea
                    className="caption-textarea flex-1 min-h-[80px] p-3 text-sm bg-black/5 rounded-lg border-transparent focus:border-blue-500 outline-none transition"
                    placeholder="Describe your song..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white shrink-0">
                  <Music className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-blue-900 truncate">
                    {songName}
                  </p>
                  <div className="flex gap-2 items-center">
                    <p className="text-[10px] text-blue-600 font-medium">
                      Selected: {postTargetType === 'SONG' ? 'Single Track' : (selectedAlbum?.name || 'No Album Chosen')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hidden Inputs */}
          <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageChange} className="hidden" />
          <input type="file" accept="audio/*" ref={musicInputRef} onChange={handleMusicChange} className="hidden" />
        </div>

        {/* Footer */}
        <div className="modal-footer shrink-0 rounded-b-xl flex justify-end">
          {step === 1 && !showDrafts && (
            <button
              onClick={handleUploadSong}
              disabled={isLoading}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              {isLoading ? 'Uploading...' : 'Continue'}
            </button>
          )}

          {step === 2 && (
            <button
              onClick={handleSubmitPost}
              disabled={isLoading}
              className="btn-primary flex items-center gap-2 px-8"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              {isLoading ? 'Posting...' : 'Post'}
            </button>
          )}

          {showDrafts && (
            <button
              onClick={() => setShowDrafts(false)}
              className="text-xs font-bold text-blue-500 hover:underline"
            >
              Back to upload new music
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;