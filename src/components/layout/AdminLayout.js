import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Users, 
    Music, 
    History, 
    LayoutDashboard, 
    ArrowLeft, 
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './css/AdminLayout.css';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const menuItems = [
        { id: 'dashboard', label: 'User Management', icon: <Users size={20} />, path: '/admin' },
        { id: 'genres', label: 'Genre Management', icon: <Music size={20} />, path: '/admin/genres' },
        { id: 'history', label: 'System History', icon: <History size={20} />, path: '/admin/history' },
    ];

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to log out?')) {
            await logout();
            navigate('/login');
        }
    };

    return (
        <div className="admin-layout">
            {/* Mobile Toggle */}
            <button 
                className="admin-mobile-toggle"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="admin-sidebar-header">
                    <div className="admin-logo" onClick={() => navigate('/newF')}>
                        <span className="logo-text">BQ</span>
                        <span className="logo-subtext">ADMIN</span>
                    </div>
                </div>

                <nav className="admin-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Main Menu</span>
                        {menuItems.map((item) => (
                            <div 
                                key={item.id}
                                className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                                onClick={() => navigate(item.path)}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="nav-section bottom">
                        <span className="nav-section-title">Actions</span>
                        <div className="admin-nav-item secondary" onClick={() => navigate('/newF')}>
                            <span className="nav-icon"><ArrowLeft size={20} /></span>
                            <span className="nav-label">Back to Site</span>
                        </div>
                        <div className="admin-nav-item logout" onClick={handleLogout}>
                            <span className="nav-icon"><LogOut size={20} /></span>
                            <span className="nav-label">Logout</span>
                        </div>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className={`admin-main ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
                <div className="admin-content-inner">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
