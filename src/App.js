import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PlayerProvider, usePlayer } from "./context/PlayerContext";
import PlayerBar from "./components/layout/PlayerBar";
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

  return (
    <div className={currentTrack ? 'has-player' : ''}>
      <Toaster position="top-center" reverseOrder={false} />
      <AppRoutes />
      <PlayerBar />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}