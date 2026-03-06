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
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const audioRef = useRef(new Audio());

    useEffect(() => {
        const audio = audioRef.current;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
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
                audioRef.current.play().catch(err => console.error("Error playing audio:", err));
            }
        }
    }, [currentTrack]);

    useEffect(() => {
        if (isPlaying) {
            audioRef.current.play().catch(err => console.error("Error playing audio:", err));
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying]);

    useEffect(() => {
        audioRef.current.volume = volume;
    }, [volume]);

    const playTrack = (track) => {
        if (currentTrack?.id === track.id) {
            togglePlay();
        } else {
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
        isPlaying,
        currentTime,
        duration,
        volume,
        setVolume,
        playTrack,
        togglePlay,
        seek
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
};
