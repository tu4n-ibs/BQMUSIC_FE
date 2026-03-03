import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import { Search, Plus, Users, ArrowRight, TrendingUp, Star } from 'lucide-react';
import groupService from '../../services/groupService';
import './css/Groups.css';

const Groups = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const data = await groupService.getGroups();
                setGroups(data);
            } catch (error) {
                console.error("Error loading groups:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGroups();
    }, []);

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="groups-container">
            <Sidebar />

            <main className="groups-main ml-[120px]">
                <div className="groups-content">
                    {/* Header Section */}
                    <header className="groups-header">
                        <div className="header-text">
                            <h1 className="text-4xl font-black tracking-tight mb-2">Communities</h1>
                            <p className="text-slate-400 font-medium">Find your tribe, share your sound.</p>
                        </div>
                        <button className="create-group-btn">
                            <Plus className="w-5 h-5" />
                            <span>Create Group</span>
                        </button>
                    </header>

                    {/* Search & Stats Bar */}
                    <div className="groups-tools-bar">
                        <div className="search-box">
                            <Search className="w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search communities..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="quick-stats">
                            <div className="stat-pill">
                                <TrendingUp className="w-4 h-4 text-indigo-400" />
                                <span>12 Trending Today</span>
                            </div>
                            <div className="stat-pill">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span>Top Rated Communities</span>
                            </div>
                        </div>
                    </div>

                    {/* Groups Grid */}
                    <section className="groups-section">
                        <div className="section-header">
                            <h2 className="flex items-center gap-2 text-xl font-bold">
                                <Users className="w-6 h-6 text-indigo-500" />
                                Suggested for you
                            </h2>
                            <button className="text-indigo-400 text-sm font-bold hover:underlineTransition">See All</button>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center opacity-50">Discoverying communities...</div>
                        ) : (
                            <div className="groups-grid">
                                {filteredGroups.map(group => (
                                    <div
                                        key={group.id}
                                        className="group-card group"
                                        onClick={() => navigate(`/groups/${group.id}`)}
                                    >
                                        <div className="card-image">
                                            <img src={group.imageUrl} alt={group.name} />
                                            <div className="card-overlay">
                                                <button className="join-btn-overlay">Join Community</button>
                                            </div>
                                        </div>
                                        <div className="card-info">
                                            <div className="member-count">{group.members} members</div>
                                            <h3 className="group-name">{group.name}</h3>
                                            <p className="group-desc">{group.description}</p>
                                            <div className="group-card-footer">
                                                <div className="member-avatars">
                                                    <img src="https://i.pravatar.cc/100?u=1" alt="m1" />
                                                    <img src="https://i.pravatar.cc/100?u=2" alt="m2" />
                                                    <img src="https://i.pravatar.cc/100?u=3" alt="m3" />
                                                    <div className="more-members">+12</div>
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
        </div>
    );
};

export default Groups;
