import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import songService from '../services/songService';

const PlayerContext = createContext();

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};

export const PlayerProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [queue, setQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const audioRef = useRef(new Audio());

    // Refs to avoid stale closures in event listeners
    const queueRef = useRef([]);
    const currentIndexRef = useRef(-1);

    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);

    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    useEffect(() => {
        const audio = audioRef.current;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration);
        const handleEnded = () => {
            const q = queueRef.current;
            const idx = currentIndexRef.current;

            if (q.length > 0 && idx < q.length - 1) {
                const nextIndex = idx + 1;
                const nextTrack = q[nextIndex];
                setCurrentIndex(nextIndex);
                setCurrentTrack(nextTrack);
                setIsPlaying(true);
            } else {
                setIsPlaying(false);
                setCurrentTime(0);
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    useEffect(() => {
        if (currentTrack) {
            audioRef.current.src = currentTrack.url;
            if (isPlaying) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(err => console.error("Play error:", err));
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTrack]);

    useEffect(() => {
        if (isPlaying) {
            if (currentTrack) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(err => console.error("Play error:", err));
                }
            }
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, currentTrack]);

    useEffect(() => {
        audioRef.current.volume = volume;
    }, [volume]);

    const playTrack = (track, newQueue = [], index = -1) => {
        if (currentTrack?.id === track.id) {
            togglePlay();
        } else {
            if (newQueue.length > 0) {
                setQueue(newQueue);
                setCurrentIndex(index !== -1 ? index : newQueue.findIndex(t => t.id === track.id));
            } else {
                setQueue([track]);
                setCurrentIndex(0);
            }
            setCurrentTrack(track);
            setIsPlaying(true);

            // Record play history in backend
            if (track.id) {
                songService.recordPlay(track.id, 0).catch(err => {
                    console.error("Failed to record play history:", err);
                });
            }
        }
    };

    const playNextTrack = () => {
        if (queue.length > 0 && currentIndex < queue.length - 1) {
            const nextIndex = currentIndex + 1;
            const nextTrack = queue[nextIndex];
            setCurrentIndex(nextIndex);
            setCurrentTrack(nextTrack);
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
            setCurrentTime(0);
        }
    };

    const playPrevTrack = () => {
        if (currentTime > 3) {
            seek(0);
            return;
        }

        if (queue.length > 0 && currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            const prevTrack = queue[prevIndex];
            setCurrentIndex(prevIndex);
            setCurrentTrack(prevTrack);
            setIsPlaying(true);
        } else {
            seek(0);
        }
    };

    const togglePlay = () => {
        if (currentTrack) {
            setIsPlaying(!isPlaying);
        }
    };

    const seek = (time) => {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const value = {
        currentTrack,
        queue,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        setVolume,
        playTrack,
        togglePlay,
        seek,
        playNextTrack,
        playPrevTrack
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
};
