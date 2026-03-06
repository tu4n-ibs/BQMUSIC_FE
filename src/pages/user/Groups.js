import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import { Search, Plus, Users, ArrowRight, TrendingUp, Star } from 'lucide-react';
import groupService from '../../services/groupService';
import CreateGroupModal from '../../components/modals/CreateGroupModal';
import { useAuth } from '../../context/AuthContext';
import { getUserAvatar } from '../../utils/userUtils';
import './css/Groups.css';

const Groups = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [myGroups, setMyGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'my-groups'

    const fetchAllGroups = async () => {
        try {
            const data = await groupService.getGroups();
            setGroups(data);
        } catch (error) {
            console.error("Error loading groups:", error);
        }
    };

    const fetchMyGroups = async () => {
        if (!user?.idUser) return;
        try {
            const data = await groupService.getUserGroups(user.idUser);
            let groupList = [];
            if (Array.isArray(data)) {
                groupList = data;
            } else if (data && typeof data === 'object') {
                const potentialArray = data.result || data.data || data.content || data.items;
                if (Array.isArray(potentialArray)) {
                    groupList = potentialArray;
                }
            }
            setMyGroups(groupList);
        } catch (error) {
            console.error("Error fetching my groups:", error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchAllGroups(), fetchMyGroups()]);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [user?.idUser]);

    const displayedGroups = activeTab === 'explore'
        ? groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : myGroups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="groups-container">
            <Sidebar />

            <main className="groups-main ml-[120px]">
                <div className="groups-content">
                    {/* Header Section */}
                    <header className="groups-header">
                        <div className="header-text">
                            <h1 className="text-4xl font-black tracking-tight mb-2">Groups</h1>
                            <p className="text-slate-400 font-medium">Find your tribe, share your sound.</p>
                        </div>
                        <button className="create-group-btn" onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="w-5 h-5" />
                            <span>Create Group</span>
                        </button>
                    </header>

                    {/* Tab Switcher */}
                    <div className="group-tabs-navigation">
                        <button
                            className={`group-nav-tab ${activeTab === 'explore' ? 'active' : ''}`}
                            onClick={() => setActiveTab('explore')}
                        >
                            <Users className="w-4 h-4" />
                            Explore
                        </button>
                        <button
                            className={`group-nav-tab ${activeTab === 'my-groups' ? 'active' : ''}`}
                            onClick={() => setActiveTab('my-groups')}
                        >
                            <Star className="w-4 h-4" />
                            My Groups
                        </button>
                    </div>

                    {/* Search & Stats Bar */}
                    <div className="groups-tools-bar">
                        <div className="search-box">
                            <Search className="w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab === 'explore' ? 'all' : 'your'} groups...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Groups Grid */}
                    <section className="groups-section">
                        {loading ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4 opacity-50">
                                <TrendingUp className="w-8 h-8 animate-spin text-indigo-500" />
                                <p className="font-bold">Syncing groups...</p>
                            </div>
                        ) : displayedGroups.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center justify-center border border-white/5 rounded-3xl bg-white/[0.02] backdrop-blur-xl">
                                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                                    <Users className="w-10 h-10 text-indigo-400/50" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">
                                    {activeTab === 'explore' ? 'No Groups Found' : 'No Groups Joined'}
                                </h3>
                                <p className="text-slate-500 max-w-sm mx-auto">
                                    {activeTab === 'explore'
                                        ? "We couldn't find any groups matching your search."
                                        : "You haven't joined any groups yet. Start exploring to find your group!"}
                                </p>
                                {activeTab === 'my-groups' && (
                                    <button
                                        className="mt-6 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-bold transition-all"
                                        onClick={() => setActiveTab('explore')}
                                    >
                                        Explore Now
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="groups-grid">
                                {displayedGroups.map(group => (
                                    <div
                                        key={group.id}
                                        className="group-card group"
                                        onClick={() => navigate(`/groups/${group.id}`)}
                                    >
                                        <div className="card-image">
                                            <img src={group.imageUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop"} alt={group.name} />
                                            <div className="card-overlay">
                                                <button className="join-btn-overlay">
                                                    {activeTab === 'my-groups' ? 'View Group' : 'Join Group'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="card-info">
                                            <div className="member-count">
                                                {activeTab === 'my-groups' && <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded mr-2">JOINED</span>}
                                                {group.members || 0} {group.members === 1 ? 'member' : 'members'}
                                            </div>
                                            <h3 className="group-name">{group.name}</h3>
                                            <p className="group-desc">{group.description || group.about}</p>
                                            <div className="group-card-footer">
                                                <div className="member-avatars">
                                                    {(group.memberAvatars || []).slice(0, 3).map((avatar, idx) => (
                                                        <img key={idx} src={getUserAvatar(avatar)} alt={`m${idx}`} />
                                                    ))}
                                                    {group.members > 3 && (
                                                        <div className="more-members">+{group.members - 3}</div>
                                                    )}
                                                </div>
                                                <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Modals */}
            <CreateGroupModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onGroupCreated={() => {
                    loadData();
                }}
            />
        </div>
    );
};

export default Groups;
