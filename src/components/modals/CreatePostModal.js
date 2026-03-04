import { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Music, Loader2, UploadCloud, ChevronRight, ChevronLeft, Trash2, History, Plus, Disc, Mic2, Radio, Headphones, Guitar } from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import genreService from '../../services/genreService';
import albumService from '../../services/albumService';
import songService from '../../services/songService';
import postService from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import './css/CreatePostModal.css';

const DRAFTS_KEY = 'bq_music_song_drafts';

const CreatePostModal = ({ isOpen, onClose, onPostCreated, groupId }) => {
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
  const [uploadedSong, setUploadedSong] = useState(null); // Result from Step 1


  // Step 2 State: Post Data
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [visibility, setVisibility] = useState('PUBLIC');


  // Refs
  const imageInputRef = useRef(null);
  const musicInputRef = useRef(null);

  const DEFAULT_IMAGE_PREVIEW = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";

  // Load drafts and genres
  useEffect(() => {
    if (isOpen) {
      const savedDrafts = localStorage.getItem(DRAFTS_KEY);
      if (savedDrafts) {
        setDrafts(JSON.parse(savedDrafts));
      }
      fetchGenres();
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


      // Sử dụng songService.uploadSong với query parameters như yêu cầu
      const response = await songService.uploadSong(songName, genreId || "UNKNOWN", selectedMusic);

      const songData = response.data.data || response.data;
      setUploadedSong(songData);

      // Save to drafts automatically after successful upload if not posted yet
      saveDraft(songData);

      setStep(2);

    } catch (error) {
      console.error("Lỗi upload nhạc:", error);
      const msg = error?.response?.data?.message || "";
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("trùng") || msg.toLowerCase().includes("exists")) {
        alert("Cảnh báo: Bài hát này có thể đã tồn tại trong hệ thống (trùng tên và nghệ sĩ).");
      } else {
        alert("Upload nhạc thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Logic lưu nháp
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
    // Restore genreId from draft if available (idGenre, genreId, or genre.id)
    const gId = draft.genreId || draft.idGenre || (draft.genre && draft.genre.id);
    if (gId) setGenreId(gId);

    setStep(2);
    setShowDrafts(false);
  };

  // Step 2: Create Post
  const handleSubmitPost = async () => {
    if (!uploadedSong) return;

    setIsLoading(true);
    try {
      const postData = {
        content: content,
        visibility: visibility,
        targetType: 'SONG',
        targetId: uploadedSong.id || uploadedSong.idSong // ID từ Step 1
      };

      if (groupId) {
        await postService.createGroupPost(groupId, postData, selectedImage);
      } else {
        await postService.createPost(postData, selectedImage);
      }

      // Xóa draft này nếu đã post thành công (nếu draft có cùng song ID)
      const updatedDrafts = drafts.filter(d => (d.idSong || d.id) !== (uploadedSong.idSong || uploadedSong.id));
      setDrafts(updatedDrafts);
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));

      handleClose();
      onPostCreated();
      alert(`Đăng bài thành công ${groupId ? 'vào nhóm' : ''}! 🎵`);
    } catch (error) {
      console.error("Lỗi đăng bài:", error);
      alert("Đăng bài thất bại.");
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
              {step === 1 ? 'Tải nhạc lên' : 'Chi tiết bài viết'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {step === 1 && drafts.length > 0 && (
              <button
                onClick={() => setShowDrafts(!showDrafts)}
                className={`p-1.5 rounded-full transition ${showDrafts ? 'bg-blue-500 text-white' : 'hover:bg-black/10'}`}
                title="Bản nháp"
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
              <h3 className="text-sm font-bold mb-3 px-1">Nhạc đã tải lên chưa đăng:</h3>
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
            /* STEP 1: UPLOAD MUSIC */
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
                      <span className="text-xs bg-white px-3 py-1.5 rounded-full border border-blue-200 text-blue-600 font-medium">Thay đổi</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMusic(null);
                          setSongName('');
                        }}
                        className="text-xs bg-red-50 px-3 py-1.5 rounded-full border border-red-200 text-red-600 font-medium hover:bg-red-100 transition"
                      >
                        Gỡ bỏ
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center group-hover:scale-110 transition duration-300">
                      <UploadCloud className="w-7 h-7 opacity-50" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Chọn file âm nhạc của bạn</p>
                      <p className="text-xs opacity-50 mt-1">Hỗ trợ MP3, WAV, M4A...</p>
                    </div>
                  </>
                )}
              </div>
              {errors.music && <p className="text-[10px] text-red-500 font-bold mb-4 text-center">Vui lòng chọn file nhạc</p>}

              <div className="flex flex-col gap-4">
                <div className="input-group">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1.5 block">Tên bài hát</label>
                  <input
                    type="text"
                    value={songName}
                    onChange={(e) => {
                      setSongName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: false });
                    }}
                    placeholder="Nhập tên bài hát..."
                    className={`w-full p-3 bg-black/5 rounded-lg border transition outline-none modal-input
                      ${errors.name ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-blue-500'}`}
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">Tên bài hát không được để trống</p>}
                </div>

                <div className="input-group mt-4">
                  <div className="selection-container">
                    <label className={`selection-label ${errors.genre ? 'text-red-500' : ''}`}>
                      Thể loại (Genre) {errors.genre && <span className="text-[10px] font-bold"> - Vui lòng chọn</span>}
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
          ) : (
            /* STEP 2: POST DETAILS */
            <div className="step-2-content animate-in slide-in-from-right-4 duration-300">
              <div className="flex gap-4 mb-4">
                <div className="shrink-0">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1.5 block">Ảnh bìa</label>
                  <div
                    className="relative w-32 h-32 rounded-lg overflow-hidden cursor-pointer group shadow-md border border-black/10"
                    onClick={() => imageInputRef.current.click()}
                  >
                    <img
                      src={previewUrl || DEFAULT_IMAGE_PREVIEW}
                      alt="Cover"
                      className={`w-full h-full object-cover transition duration-300 ${!previewUrl ? 'opacity-80 grayscale' : ''}`}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                    {previewUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(null);
                          setPreviewUrl(null);
                        }}
                        className="absolute top-1 right-1 bg-red-500 p-1 rounded-full text-white shadow-lg transition hover:scale-110"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60 block">Cảm xúc của bạn</label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="visibility-select text-[10px] font-bold py-1"
                    >
                      <option value="PUBLIC">CÔNG KHAI</option>
                      <option value="FRIEND">BẠN BÈ</option>
                      <option value="PRIVATE">RIÊNG TƯ</option>
                    </select>
                  </div>
                  <textarea
                    className="caption-textarea flex-1 min-h-[100px]"
                    placeholder="Ghi điều gì đó về bài hát này..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center text-white shrink-0">
                  <Music className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-blue-800 truncate">{songName}</p>
                  <div className="flex gap-2 items-center">
                    <p className="text-[10px] text-blue-600 uppercase font-medium">
                      {genres.find(g => g.id === genreId)?.name || 'Default Genre'}
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
              {isLoading ? 'Đang upload...' : 'Tiếp tục'}
            </button>
          )}

          {step === 2 && (
            <button
              onClick={handleSubmitPost}
              disabled={isLoading}
              className="btn-primary flex items-center gap-2 px-8"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              {isLoading ? 'Đang đăng...' : 'Đăng bài'}
            </button>
          )}

          {showDrafts && (
            <button
              onClick={() => setShowDrafts(false)}
              className="text-xs font-bold text-blue-500 hover:underline"
            >
              Quay lại tải nhạc mới
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;