import React, { useState } from 'react';
import { X, Image as ImageIcon, Users, Lock, Globe, Shield } from 'lucide-react';
import groupService from '../../services/groupService';
import './css/CreateGroupModal.css';

const MOCK_IMAGES = [
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop"
];

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageUrl: MOCK_IMAGES[0],
        isPrivate: false,
        requirePostApproval: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageSelect = (url) => {
        setFormData(prev => ({ ...prev, imageUrl: url }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError("Group name is required");
            return;
        }
        if (formData.name.length > 255) {
            setError("Group name must be less than 255 characters");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await groupService.createGroup(formData);
            onGroupCreated();
            handleClose();
        } catch (err) {
            console.error(err);
            setError("Failed to create group. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            description: '',
            imageUrl: MOCK_IMAGES[0],
            isPrivate: false,
            requirePostApproval: false
        });
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-400" />
                        Create New Group
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form id="create-group-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Banner Selection (Mocked for now) */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> Cover Image
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                                {MOCK_IMAGES.map((url, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleImageSelect(url)}
                                        className={`h-20 rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${formData.imageUrl === url ? 'border-indigo-500 scale-105 shadow-lg shadow-indigo-500/20' : 'border-transparent hover:scale-105 opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={url} alt={`Cover ${idx}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-semibold text-slate-300 mb-2">
                                    Group Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="E.g., Indie Producers Hub"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                                    maxLength={255}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-semibold text-slate-300 mb-2">
                                    About Group
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="What is this group about?"
                                    rows={3}
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm resize-none custom-scrollbar"
                                />
                            </div>
                        </div>

                        {/* Settings */}
                        <div className="space-y-4 pt-4 border-t border-slate-800/50">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Initial Settings</h3>

                            {/* Privacy Toggle */}
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/30 border border-slate-800/50 hover:border-slate-700 transition-colors cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}>
                                <div className={`mt-1 p-2 rounded-lg ${formData.isPrivate ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                    {formData.isPrivate ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-white">Private Group</span>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" name="isPrivate" id="isPrivate" checked={formData.isPrivate} onChange={handleChange} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-600 checked:bg-indigo-500 checked:border-indigo-500 checked:right-0 right-5 transition-all outline-none z-10" />
                                            <label htmlFor="isPrivate" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-800 cursor-pointer"></label>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        {formData.isPrivate
                                            ? "Only members can see who's in the group and what they post."
                                            : "Anyone can find the group, see members, and view posts."}
                                    </p>
                                </div>
                            </div>

                            {/* Post Approval Toggle */}
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/30 border border-slate-800/50 hover:border-slate-700 transition-colors cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, requirePostApproval: !prev.requirePostApproval }))}>
                                <div className={`mt-1 p-2 rounded-lg ${formData.requirePostApproval ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-white">Require Post Approval</span>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" name="requirePostApproval" id="requirePostApproval" checked={formData.requirePostApproval} onChange={handleChange} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-600 checked:bg-indigo-500 checked:border-indigo-500 checked:right-0 right-5 transition-all outline-none z-10" />
                                            <label htmlFor="requirePostApproval" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-800 cursor-pointer"></label>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Members' posts must be approved by an Admin or Moderator before they become visible to the group.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-800 bg-slate-900 flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="create-group-form"
                        disabled={loading || !formData.name.trim()}
                        className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            'Create Group'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
