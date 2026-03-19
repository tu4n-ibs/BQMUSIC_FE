import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Users, 
    Search, 
    MoreVertical, 
    Eye, 
    Edit2, 
    Trash2, 
    Plus,
    UserCheck,
    Star,
    Shield,
    Mail,
    UserX,
    Loader2
} from 'lucide-react';
import userService from "../../services/userService";
import { toast } from "react-hot-toast";
import "./css/AdminDashboard.css";

function AdminMenu() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    isActive: true,
    password: "",
  });
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      const userList = data.data?.content || data.content || data.data || data || [];
      setUsers(userList);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Users', value: users.length, icon: <Users size={20} />, color: 'blue' },
    { label: 'Active Now', value: users.filter(u => u.isActive).length, icon: <UserCheck size={20} />, color: 'green' },
    { label: 'Admin Team', value: users.filter(u => u.roles?.includes('ADMIN')).length, icon: <Shield size={20} />, color: 'purple' },
  ];

  const handleRead = async (id) => {
    try {
      const data = await userService.getUserById(id);
      setSelectedUser(data.data || data);
      setShowDetailModal(true);
    } catch (error) {
      toast.error("Could not fetch user details");
    }
  };

  const handleUpdate = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      password: "",
    });
    setImage(null);
    setSelectedUser(user);
    setShowUpdateModal(true);
  };

  const submitUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("isActive", formData.isActive);
      if (formData.password) form.append("password", formData.password);
      if (image) form.append("image", image);

      const targetId = selectedUser.userId || selectedUser.idUser || selectedUser.id;
      await userService.updateUser(targetId, form);
      
      toast.success("Profile updated successfully!");
      setShowUpdateModal(false);
      
      // Update local state without reload
      setUsers(prev => prev.map(u => 
        (u.userId || u.idUser || u.id) === targetId 
        ? { ...u, ...formData, imageUrl: image ? URL.createObjectURL(image) : u.imageUrl } 
        : u
      ));
      fetchUsers(); // Practical Refresh
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    const id = user.userId || user.idUser || user.id;
    if (!window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) return;
    try {
      await userService.deleteUser(id);
      toast.success("User deleted successfully");
      setUsers(prev => prev.filter(u => (u.userId || u.idUser || u.id) !== id));
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header-simple">
        <div className="header-text">
          <h1>User Management</h1>
          <p>Monitor and manage account permissions</p>
        </div>
        <button className="btn-primary-admin" onClick={() => navigate("/createUser")}>
          <Plus size={18} /> Add New User
        </button>
      </header>

      <section className="stats-container">
        {stats.map((stat, i) => (
          <div key={i} className={`stat-card-admin ${stat.color}`}>
            <div className="stat-icon-wrapper">{stat.icon}</div>
            <div className="stat-data">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </section>

      <div className="data-table-container">
        <div className="table-header-admin">
          <div className="search-box-admin">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive-admin">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Permissions</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan="4" className="text-center py-10"><Loader2 className="animate-spin inline mr-2" /> Loading records...</td></tr>
                ) : filteredUsers.length > 0 ? filteredUsers.map((user, i) => (
                <tr key={i}>
                  <td>
                    <div className="user-profile-cell">
                      {user.imageUrl ? (
                        <img 
                          src={user.imageUrl.startsWith('blob') ? user.imageUrl : `${process.env.REACT_APP_API_BASE_URL}${user.imageUrl}`} 
                          alt="" 
                          className="user-avatar-sm" 
                        />
                      ) : (
                        <div className="user-avatar-placeholder-sm">{user.name.charAt(0)}</div>
                      )}
                      <div className="user-meta">
                        <span className="user-name-cell">{user.name}</span>
                        <span className="user-email-cell">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="roles-list">
                      {user.roles?.map(role => (
                        <span key={role} className={`role-tag ${role.toLowerCase()}`}>
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`status-tag ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="action-buttons-group">
                      <button onClick={() => handleRead(user.userId || user.idUser || user.id)} className="btn-action-icon" title="View Details"><Eye size={16} /></button>
                      <button onClick={() => handleUpdate(user)} className="btn-action-icon" title="Edit Permissions"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(user)} className="btn-action-icon delete" title="Remove Account"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="text-center py-10 text-slate-500">No users found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Modals --- */}
      {showDetailModal && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-admin">
              <h3>Account Details</h3>
            </div>
            <div className="modal-body-admin center">
                <div className="profile-hero">
                    {selectedUser.imageUrl ? (
                        <img src={`${process.env.REACT_APP_API_BASE_URL}${selectedUser.imageUrl}`} className="hero-avatar" alt="" />
                    ) : (
                        <div className="hero-avatar-placeholder">{selectedUser.name.charAt(0)}</div>
                    )}
                    <h2>{selectedUser.name}</h2>
                    <p>{selectedUser.email}</p>
                </div>
                <div className="detail-info-grid">
                    <div className="info-item">
                        <label>Member Since</label>
                        <span>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <label>Roles</label>
                        <div className="roles-list center">
                            {selectedUser.roles?.map(r => <span key={r} className="role-tag">{r}</span>)}
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-footer-admin">
                <button className="btn-secondary-admin" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showUpdateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="admin-modal-content wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header-admin">
              <h3>Edit Account - {selectedUser.name}</h3>
            </div>
            <form onSubmit={submitUpdate}>
                <div className="modal-body-admin">
                    <div className="input-group-admin">
                        <label>Full Name</label>
                        <input 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div className="input-group-admin">
                        <label>Email Address</label>
                        <input 
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div className="input-group-admin">
                        <label>Password (Leave blank to keep current)</label>
                        <input 
                            type="password"
                            value={formData.password} 
                            onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                    <div className="input-group-admin">
                        <label>Status</label>
                        <select 
                            value={formData.isActive}
                            onChange={e => setFormData({...formData, isActive: e.target.value === "true"})}
                        >
                            <option value={true}>Active (Allowed Access)</option>
                            <option value={false}>Suspended (Banned)</option>
                        </select>
                    </div>
                </div>
                <div className="modal-footer-admin">
                    <button type="button" className="btn-secondary-admin" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                    <button type="submit" className="btn-primary-admin" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMenu;
