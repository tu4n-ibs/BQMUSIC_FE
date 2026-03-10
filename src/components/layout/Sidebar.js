import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Home, Search, Compass, MessageCircle, Bell, PlusSquare, Menu,
    Settings, Activity, Bookmark, Moon, Sun, CircleAlert as AlertCircle, Instagram, List, Users, Disc, History, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { useNotification } from '../../context/NotificationContext';
import '../layout/css/Sidebar.css';
import { getUserAvatar } from '../../utils/userUtils';
import NotificationPanel from './NotificationPanel';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { openCreatePostModal } = useModal();
    const { unreadCount } = useNotification();
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const notifTimeoutRef = useRef(null);

    const handleNotifMouseEnter = () => {
        if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
        setIsNotificationsOpen(true);
    };

    const handleNotifMouseLeave = () => {
        notifTimeoutRef.current = setTimeout(() => {
            setIsNotificationsOpen(false);
        }, 300);
    };

    const isActive = (path) => location.pathname === path;

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed:", error);
            // Even if API fails, we should clear local state and redirect
            navigate('/login');
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsMoreMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            {/* Mobile Header (Top) */}
            <div className="ig-mobile-header">
                <div className="ig-mobile-logo" onClick={() => navigate('/newF')}>
                    BQMUSIC
                </div>
                <div className="flex items-center gap-4">
                    <div
                        className="relative cursor-pointer"
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    >
                        <Bell className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="notif-badge">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <aside className={`ig-sidebar ${isNotificationsOpen ? 'force-expanded' : ''}`}>
                {/* Logo */}
                <div className="ig-logo-container" onClick={() => navigate('/newF')}>
                    <div className="ig-logo-icon">
                    </div>
                    <div className="ig-logo-text" style={{ fontFamily: 'cursive' }}>
                        BQMUSIC
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="ig-nav">
                    <NavItem
                        icon={<Home className="w-6 h-6" />}
                        label="Home"
                        active={isActive('/newF')}
                        onClick={() => handleNavigation('/newF')}
                    />
                    <NavItem
                        icon={<Search className="w-6 h-6" />}
                        label="Search"
                        active={isActive('/search')}
                        onClick={() => handleNavigation('/search')}
                    />
                    <NavItem
                        icon={<Users className="w-6 h-6" />}
                        label="Groups"
                        active={isActive('/groups')}
                        onClick={() => handleNavigation('/groups')}
                    />
                    <div
                        onMouseEnter={handleNotifMouseEnter}
                        onMouseLeave={handleNotifMouseLeave}
                        className="relative"
                    >
                        <NavItem
                            icon={
                                <div className="relative">
                                    <Bell className="w-6 h-6" />
                                    {unreadCount > 0 && (
                                        <span className="notif-badge">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </div>
                            }
                            label="Notifications"
                            active={isNotificationsOpen}
                        />
                    </div>
                    <NavItem
                        icon={<List className="w-6 h-6" />}
                        label="Playlists"
                        active={isActive('/playlists')}
                        onClick={() => handleNavigation('/playlists')}
                    />
                    <NavItem
                        icon={<History className="w-6 h-6" />}
                        label="History"
                        active={isActive('/history')}
                        onClick={() => handleNavigation('/history')}
                    />
                    <NavItem
                        icon={<TrendingUp className="w-6 h-6" />}
                        label="Top Songs"
                        active={isActive('/top-songs')}
                        onClick={() => handleNavigation('/top-songs')}
                    />
                    <NavItem
                        icon={<Disc className="w-6 h-6" />}
                        label="My Albums"
                        active={isActive('/my-albums')}
                        onClick={() => handleNavigation('/my-albums')}
                    />
                    <NavItem
                        icon={<PlusSquare className="w-6 h-6" />}
                        label="Create"
                        onClick={() => openCreatePostModal()}
                    />
                    <div
                        className={`ig-nav-item ${isActive(`/user/userId=${user?.idUser}`) ? 'active' : ''}`}
                        onClick={() => handleNavigation(`/user/userId=${user?.idUser || ""}`)}
                    >
                        <div className="ig-icon-wrapper">
                            <img
                                src={getUserAvatar(user?.imageUrl)}
                                alt="Profile"
                                className="ig-profile-avatar"
                                onError={(e) => e.target.src = "https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg?w=360"}
                            />
                        </div>
                        <span className="ig-nav-label">Profile</span>
                    </div>
                </nav>

                {/* Bottom Actions */}
                <div className="ig-bottom-actions">
                    <div
                        className="ig-nav-item"
                        ref={buttonRef}
                        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    >
                        <div className="ig-icon-wrapper">
                            <Menu className="w-6 h-6" />
                        </div>
                        <span className="ig-nav-label">More</span>
                    </div>
                </div>

                {/* More Menu Popup */}
                {isMoreMenuOpen && (
                    <div ref={menuRef} className="ig-more-menu">
                        <MenuItem icon={<Bookmark className="w-5 h-5" />} label="Saved" />
                        <MenuItem
                            icon={theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            label="Switch appearance"
                            onClick={toggleTheme}
                        />
                        <MenuItem icon={<AlertCircle className="w-5 h-5" />} label="Report a problem" />

                        <div className="h-0.5 bg-gray-700 my-1"></div>

                        <div className="ig-menu-item" onClick={handleLogout}>
                            Log out
                        </div>
                    </div>
                )}
            </aside>
            <NotificationPanel
                isOpen={isNotificationsOpen}
                onMouseEnter={handleNotifMouseEnter}
                onMouseLeave={handleNotifMouseLeave}
            />
        </>
    );
};

const NavItem = ({ icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        className={`ig-nav-item ${active ? 'active' : ''}`}
    >
        <div className="ig-icon-wrapper">
            {icon}
        </div>
        <span className="ig-nav-label">{label}</span>
    </div>
);

const MenuItem = ({ icon, label, onClick }) => (
    <div onClick={onClick} className="ig-menu-item">
        <div className="text-white">
            {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
    </div>
);

export default Sidebar;
