import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PlayerProvider, usePlayer } from "./context/PlayerContext";
import { ModalProvider, useModal } from "./context/ModalContext";
import PlayerBar from "./components/layout/PlayerBar";
import CreatePostModal from "./components/modals/CreatePostModal";
import toast, { Toaster } from 'react-hot-toast';

// Override global alert to use toast instead
window.alert = (message) => {
  toast(message, {
    style: {
      borderRadius: '12px',
      background: '#1e293b',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '600',
      padding: '12px 24px',
    },
    duration: 3500,
  });
};

const AppContent = () => {
  const { currentTrack } = usePlayer();
  const { createPostModal, closeCreatePostModal } = useModal();

  const handlePostCreated = () => {
    // Dispatch custom event for pages to refresh
    const event = new CustomEvent('POST_CREATED', {
      detail: { groupId: createPostModal.groupId }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className={currentTrack ? 'has-player' : ''}>
      <Toaster position="top-center" reverseOrder={false} />
      <AppRoutes />
      <PlayerBar />
      <CreatePostModal
        isOpen={createPostModal.isOpen}
        onClose={closeCreatePostModal}
        onPostCreated={handlePostCreated}
        groupId={createPostModal.groupId}
      />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ModalProvider>
          <PlayerProvider>
            <ThemeProvider>
              <AppContent />
            </ThemeProvider>
          </PlayerProvider>
        </ModalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}