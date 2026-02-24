import { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Music, Loader2, UploadCloud, ChevronRight, ChevronLeft, Trash2, History, Plus, Disc, Mic2, Radio, Headphones, Guitar } from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import genreService from '../../services/genreService';
import albumService from '../../services/albumService';
import { useAuth } from '../../context/AuthContext';
import './css/CreatePostModal.css';

const DRAFTS_KEY = 'bq_music_song_drafts';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Upload Music, 2: Post Details
  const [isLoading, setIsLoading] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [drafts, setDrafts] = useState([]);

  // Step 1 State: Song Data
  const [songName, setSongName] = useState('');
  const [genreId, setGenreId] = useState('');
  const [genres, setGenres] = useState([]);
  const [isCreatingGenre, setIsCreatingGenre] = useState(false);
  const [newGenre, setNewGenre] = useState({ name: '', description: '' });

  // Album State
  const [albumId, setAlbumId] = useState('');
  const [albums, setAlbums] = useState([]);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbum, setNewAlbum] = useState({ name: '', description: '' });

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

  // Load drafts, genres, and albums
  useEffect(() => {
    if (isOpen) {
      const savedDrafts = localStorage.getItem(DRAFTS_KEY);
      if (savedDrafts) {
        setDrafts(JSON.parse(savedDrafts));
      }
      fetchGenres();
      fetchAlbums();
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

  const fetchAlbums = async () => {
    if (!user?.idUser) return;
    try {
      const response = await albumService.getUserAlbums(user.idUser);
      if (response && response.success) {
        setAlbums(response.data || []);
      }
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
    if (!selectedMusic || !songName) {
      alert("Vui lòng chọn file nhạc và nhập tên bài hát!");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('musicUrl', selectedMusic);
      formData.append('name', songName);
      formData.append('genreId', genreId || "UNKNOWN"); // Use selected genreId


      // Giả sử API /api/v1/song trả về metadata của song bao gồm ID
      const response = await axiosClient.post('/song', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const songData = response.data.data || response.data;
      setUploadedSong(songData);

      // If album is selected, add song to album
      if (albumId) {
        try {
          await albumService.addSongToAlbum(albumId, songData.id || songData.idSong);
        } catch (albumErr) {
          console.error("Lỗi khi thêm vào Album:", albumErr);
          // Don't block the whole process if album mapping fails
        }
      }

      // Save to drafts automatically after successful upload if not posted yet
      saveDraft(songData);

      setStep(2);

    } catch (error) {
      console.error("Lỗi upload nhạc:", error);
      alert("Upload nhạc thất bại. Vui lòng thử lại.");
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
      const formData = new FormData();
      const postDto = {
        userId: user.idUser,
        content: content,
        visibility: visibility,
        targetType: 'SONG',
        targetId: uploadedSong.id || uploadedSong.idSong // ID từ Step 1
      };

      formData.append('post', new Blob([JSON.stringify(postDto)], { type: "application/json" }));
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      await axiosClient.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Xóa draft này nếu đã post thành công (nếu draft có cùng song ID)
      const updatedDrafts = drafts.filter(d => (d.idSong || d.id) !== (uploadedSong.idSong || uploadedSong.id));
      setDrafts(updatedDrafts);
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));

      handleClose();
      onPostCreated();
      alert("Đăng bài thành công! 🎵");
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
    setIsCreatingGenre(false);
    setNewGenre({ name: '', description: '' });

    setAlbumId('');
    setIsCreatingAlbum(false);
    setNewAlbum({ name: '', description: '' });


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
                  ${selectedMusic ? 'active border-blue-500' : ''}`}
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

              <div className="flex flex-col gap-4">
                <div className="input-group">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1.5 block">Tên bài hát</label>
                  <input
                    type="text"
                    value={songName}
                    onChange={(e) => setSongName(e.target.value)}
                    placeholder="Nhập tên bài hát..."
                    className="w-full p-3 bg-black/5 rounded-lg border border-transparent focus:border-blue-500 transition outline-none modal-input"
                  />
                </div>
                <div className="input-group">
                  <div className="selection-container">
                    <label className="selection-label">Album (Tùy chọn)</label>
                    <div className="selection-wrapper">
                      {/* Add New Album Card */}
                      <div
                        className="selection-card btn-add-card"
                        onClick={() => setIsCreatingAlbum(true)}
                      >
                        <Plus className="w-6 h-6" />
                        <span className="btn-add-label">Tạo Album</span>
                      </div>

                      <div className="selection-row">
                        {/* No Album Card */}
                        <div
                          className={`selection-card card-theme-default ${!albumId ? 'active' : ''}`}
                          onClick={() => setAlbumId('')}
                        >
                          <div className="card-icon-wrapper">
                            <Music className="w-5 h-5" />
                          </div>
                          <span className="card-label">Bản đơn</span>
                        </div>

                        {/* Album Cards */}
                        {albums.map((album, idx) => (
                          <div
                            key={album.id}
                            className={`selection-card card-theme-${(idx % 6) + 1} ${albumId === album.id ? 'active' : ''}`}
                            onClick={() => setAlbumId(album.id)}
                          >
                            <div className="card-icon-wrapper">
                              <Disc className="w-5 h-5" />
                            </div>
                            <span className="card-label">{album.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {isCreatingAlbum && (
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mt-3 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col gap-3">
                          <input
                            type="text"
                            placeholder="Tên album mới..."
                            value={newAlbum.name}
                            onChange={(e) => setNewAlbum({ ...newAlbum, name: e.target.value })}
                            className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl outline-none text-sm text-white focus:border-purple-500 transition"
                          />
                          <textarea
                            placeholder="Mô tả album..."
                            value={newAlbum.description}
                            onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                            className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl outline-none text-sm text-white focus:border-purple-500 transition min-h-[60px] resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!newAlbum.name || !user?.idUser) return;
                                try {
                                  const now = new Date().toISOString();
                                  const payload = {
                                    ...newAlbum,
                                    userId: user.idUser,
                                    isActive: true,
                                    is_active: true,
                                    active: true,
                                    enabled: true,
                                    status: true,

                                    updatedAt: now,
                                    updated_at: now,
                                    updatedBy: user.idUser,
                                    updated_by: user.idUser,
                                    version: 0
                                  };

                                  const res = await albumService.createAlbum({
                                    ...payload,
                                    createdAt: now,
                                    created_at: now,
                                    createdBy: user.idUser,
                                    created_by: user.idUser,
                                  });
                                  if (res.success || res.id || res.idAlbum) {
                                    await fetchAlbums();
                                    setAlbumId(res.data?.id || res.id || res.idAlbum);
                                    setIsCreatingAlbum(false);
                                    setNewAlbum({ name: '', description: '' });
                                  } else {
                                    alert("Tạo album thất bại: " + (res.message || "Vui lòng kiểm tra lại."));
                                  }
                                } catch (err) {
                                  console.error("Album creation error:", err);
                                  alert("Lỗi kết nối khi tạo album.");
                                }
                              }}
                              className="bg-purple-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                            >
                              XÁC NHẬN
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsCreatingAlbum(false)}
                              className="bg-white/10 text-white text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-white/20 transition"
                            >
                              HỦY
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="input-group mt-4">
                  <div className="selection-container">
                    <label className="selection-label">Thể loại (Genre)</label>
                    <div className="selection-wrapper">
                      {/* Add New Genre Card */}
                      <div
                        className="selection-card btn-add-card"
                        onClick={() => setIsCreatingGenre(true)}
                      >
                        <Plus className="w-6 h-6" />
                        <span className="btn-add-label">Thêm mới</span>
                      </div>

                      <div className="selection-row">
                        {/* Genre Cards */}
                        {genres.map((genre, idx) => {
                          const icons = [Mic2, Headphones, Radio, Guitar, Music];
                          const IconComp = icons[idx % icons.length];
                          return (
                            <div
                              key={genre.id}
                              className={`selection-card card-theme-${(idx % 6) + 1} ${genreId === genre.id ? 'active' : ''}`}
                              onClick={() => setGenreId(genre.id)}
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

                    {isCreatingGenre && (
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mt-3 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col gap-3">
                          <input
                            type="text"
                            placeholder="Tên thể loại (Pop, Rock...)"
                            value={newGenre.name}
                            onChange={(e) => setNewGenre({ ...newGenre, name: e.target.value })}
                            className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl outline-none text-sm text-white focus:border-blue-500 transition"
                          />
                          <textarea
                            placeholder="Mô tả thể loại..."
                            value={newGenre.description}
                            onChange={(e) => setNewGenre({ ...newGenre, description: e.target.value })}
                            className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl outline-none text-sm text-white focus:border-blue-500 transition min-h-[60px] resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!newGenre.name) return;
                                try {
                                  const now = new Date().toISOString();
                                  const payload = {
                                    ...newGenre,
                                    isActive: true,
                                    is_active: true,
                                    active: true,
                                    enabled: true,
                                    status: true,

                                    updatedAt: now,
                                    updated_at: now,
                                    updatedBy: user?.idUser,
                                    updated_by: user?.idUser,
                                    version: 0
                                  };

                                  const res = await genreService.createGenre({
                                    ...payload,
                                    createdAt: now,
                                    created_at: now,
                                    createdBy: user?.idUser,
                                    created_by: user?.idUser,
                                  });
                                  // Kiểm tra success hoặc nếu res trả về object có ID (trường hợp backend không bọc success)
                                  if (res.success || res.id || res.idGenre) {
                                    await fetchGenres();
                                    setGenreId(res.data?.id || res.id || res.idGenre);
                                    setIsCreatingGenre(false);
                                    setNewGenre({ name: '', description: '' });
                                  } else {
                                    alert("Tạo thể loại thất bại: " + (res.message || "Vui lòng kiểm tra lại."));
                                  }
                                } catch (err) {
                                  console.error("Genre creation error:", err);
                                  alert("Lỗi kết nối khi tạo thể loại.");
                                }
                              }}
                              className="bg-blue-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                              XÁC NHẬN
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsCreatingGenre(false)}
                              className="bg-white/10 text-white text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-white/20 transition"
                            >
                              HỦY
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
                    {albumId && (
                      <p className="text-[10px] text-purple-600 uppercase font-bold px-1.5 py-0.5 bg-purple-100 rounded">
                        Album: {albums.find(a => a.id === albumId)?.name}
                      </p>
                    )}
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
              disabled={isLoading || !selectedMusic || !songName}
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