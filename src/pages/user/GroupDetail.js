import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import {
    Users, Info, Shield, MessageSquare, Share2, Heart,
    MoreHorizontal, Music, Play, Globe, Calendar, MapPin
} from 'lucide-react';
import groupService from '../../services/groupService';
import { getUserAvatar } from '../../utils/userUtils';
import './css/Groups.css';

const GroupDetail = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('discussion');

    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                const groupData = await groupService.getGroupById(groupId);
                const postsData = await groupService.getGroupPosts(groupId);
                setGroup(groupData);
                setPosts(postsData);
            } catch (error) {
                console.error("Error fetching group data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGroupData();
    }, [groupId]);

    if (loading) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Loading community...</div>;
    if (!group) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Community not found</div>;

    return (
        <div className="groups-container">
            <Sidebar />

            <main className="group-detail-main ml-[120px]">
                {/* 1. Group Banner & Profile */}
                <div className="group-banner-container">
                    <img src={group.imageUrl} alt="Banner" className="group-banner-img" />
                    <div className="banner-overlay"></div>

                    <div className="group-header-overlay">
                        <div className="group-meta-card">
                            <div className="flex justify-between items-start mb-6">
                                <div className="group-badge">Verified Community</div>
                                <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                            <h1 className="text-5xl font-black mb-4 tracking-tighter">{group.name}</h1>
                            <div className="flex items-center gap-6 text-sm font-bold opacity-80">
                                <span className="flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" /> {group.members} Members</span>
                                <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-400" /> Public Group</span>
                            </div>
                            <div className="mt-8 flex gap-4">
                                <button className="join-group-btn-full">Join Community</button>
                                <button className="invite-btn">Invite Members</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="group-detail-content max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-8 py-10">

                    {/* 2. Left Column: Discussion & Feed (8/12) */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        {/* Tabs */}
                        <div className="detail-tabs">
                            <button
                                className={`detail-tab ${activeTab === 'discussion' ? 'active' : ''}`}
                                onClick={() => setActiveTab('discussion')}
                            >
                                <MessageSquare className="w-4 h-4" /> Discussion
                            </button>
                            <button
                                className={`detail-tab ${activeTab === 'media' ? 'active' : ''}`}
                                onClick={() => setActiveTab('media')}
                            >
                                <Music className="w-4 h-4" /> Media & Music
                            </button>
                            <button
                                className={`detail-tab ${activeTab === 'about' ? 'active' : ''}`}
                                onClick={() => setActiveTab('about')}
                            >
                                <Info className="w-4 h-4" /> About
                            </button>
                        </div>

                        {/* Create Post Area */}
                        <div className="group-create-post-card">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-slate-800">
                                    <Users className="w-full h-full p-2 text-slate-500" />
                                </div>
                                <div className="flex-1">
                                    <button className="create-post-placeholder">
                                        What's on your mind?
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Group Feed */}
                        <div className="group-feed flex flex-col gap-6">
                            {posts.map(post => (
                                <div key={post.id} className="group-post-card group">
                                    <div className="post-header">
                                        <div className="flex items-center gap-3">
                                            <img src={getUserAvatar(post.authorAvatar)} alt={post.authorName} className="post-author-img" />
                                            <div>
                                                <div className="post-author-name">{post.authorName}</div>
                                                <div className="post-time">{post.timestamp}</div>
                                            </div>
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="w-5 h-5 text-slate-400" />
                                        </button>
                                    </div>

                                    <div className="post-content">
                                        <p className="mb-6 leading-relaxed text-slate-300">{post.content}</p>

                                        {post.musicLink && (
                                            <div className="post-music-player">
                                                <div className="music-cover">
                                                    <Music className="w-6 h-6 text-white" />
                                                    <div className="play-overlay">
                                                        <Play className="w-5 h-5 fill-white" />
                                                    </div>
                                                </div>
                                                <div className="music-info">
                                                    <div className="song-title">Ambient Vibe Collection #04</div>
                                                    <div className="song-artist">{post.authorName} • Featured</div>
                                                </div>
                                                <div className="visualizer">
                                                    <div className="bar v-bar-1"></div>
                                                    <div className="bar v-bar-2"></div>
                                                    <div className="bar v-bar-3"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="post-footer">
                                        <div className="post-actions">
                                            <button className="post-action-btn flex items-center gap-2">
                                                <Heart className="w-5 h-5" /> <span>{post.likes}</span>
                                            </button>
                                            <button className="post-action-btn flex items-center gap-2">
                                                <MessageSquare className="w-5 h-5" /> <span>{post.comments}</span>
                                            </button>
                                        </div>
                                        <button className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
                                            <Share2 className="w-4 h-4" /> <span className="text-sm font-bold uppercase tracking-wider">Share</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Right Column: Group Info (4/12) */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        <div className="group-info-card">
                            <h3 className="flex items-center gap-2 text-lg font-bold mb-6">
                                <Info className="w-5 h-5 text-indigo-400" />
                                About this Community
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                {group.about}
                            </p>

                            <div className="flex flex-col gap-4 text-sm font-semibold">
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <Globe className="w-5 h-5 text-emerald-400" />
                                    <div>
                                        <div>Public Visibility</div>
                                        <div className="text-[10px] text-slate-500 uppercase">Anyone can see who's in the group</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <MapPin className="w-5 h-5 text-rose-400" />
                                    <div>
                                        <div>Location</div>
                                        <div className="text-[10px] text-slate-500 uppercase">{group.location}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <Calendar className="w-5 h-5 text-indigo-400" />
                                    <div>
                                        <div>Created On</div>
                                        <div className="text-[10px] text-slate-500 uppercase">Founded {group.founded}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group-info-card">
                            <h3 className="flex items-center gap-2 text-lg font-bold mb-6">
                                <Shield className="w-5 h-5 text-indigo-400" />
                                Community Rules
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div className="rule-item">
                                    <div className="rule-num">01</div>
                                    <div>
                                        <div className="rule-title">Be respectful</div>
                                        <p className="text-xs text-slate-500">Treat everyone with respect and kindness.</p>
                                    </div>
                                </div>
                                <div className="rule-item">
                                    <div className="rule-num">02</div>
                                    <div>
                                        <div className="rule-title">No spamming</div>
                                        <p className="text-xs text-slate-500">Keep discussions focused and relevant.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GroupDetail;
