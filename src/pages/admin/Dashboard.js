import React, { useEffect, useState } from "react";
import { 
    Users, 
    Search, 
    Eye, 
    UserCheck, 
    UserMinus, 
    Shield, 
    Loader2,
    RefreshCw
} from 'lucide-react';
import userService from "../../services/userService";
import { toast } from "react-hot-toast";
import "./css/AdminDashboard.css";

function AdminMenu() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(null); // Track which user is being toggled

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
    { label: 'Active Status', value: users.filter(u => (u.isActive ?? u.is_active)).length, icon: <UserCheck size={20} />, color: 'green' },
    { label: 'Banned users', value: users.filter(u => !(u.isActive ?? u.is_active)).length, icon: <UserMinus size={20} />, color: 'red' },
  ];


  const handleToggleStatus = async (user) => {
    const targetId = user.id || user.userId || user.idUser;
    const currentStatus = user.isActive ?? user.is_active;
    const newStatus = !currentStatus;
    
    setIsProcessing(targetId);
    try {
      // Create FormData as the service expects it
      const form = new FormData();
      form.append("isActive", newStatus);
      form.append("name", user.name); // Usually name is required by the API
      form.append("email", user.email);

      await userService.updateUser(targetId, form);
      
      toast.success(`User ${newStatus ? 'Unbanned' : 'Banned'} successfully!`);
      
      // Update local state
      setUsers(prev => prev.map(u => 
        (u.userId || u.idUser || u.id) === targetId 
        ? { ...u, isActive: newStatus, is_active: newStatus } 
        : u
      ));
    } catch (error) {
      toast.error(`Failed to ${newStatus ? 'unban' : 'ban'} user`);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header-simple">
        <div className="header-text">
          <h1>User Access Management</h1>
          <p>Control user status and monitor account activity</p>
        </div>
        <button className="btn-secondary-admin" onClick={fetchUsers}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh List
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
                <th>User Identity</th>
                <th>Access Status</th>
                <th className="text-right">Manage Access</th>
              </tr>
            </thead>
            <tbody>
                {loading && users.length === 0 ? (
                    <tr><td colSpan="3" className="text-center py-10"><Loader2 className="animate-spin inline mr-2" /> Loading accounts...</td></tr>
                ) : filteredUsers.length > 0 ? filteredUsers.map((user, i) => {
                  const targetId = user.id || user.userId || user.idUser;
                  const isActive = user.isActive ?? user.is_active;
                  return (
                    <tr key={targetId || i}>
                      <td>
                        <div className="user-profile-cell">
                          {user.imageUrl ? (
                            <img 
                              src={user.imageUrl.startsWith('http') ? user.imageUrl : `${process.env.REACT_APP_API_BASE_URL}${user.imageUrl.startsWith('/') ? '' : '/'}${user.imageUrl}`} 
                              alt="" 
                              className="user-avatar-sm" 
                            />
                          ) : (
                            <div className="user-avatar-placeholder-sm">{user.name?.charAt(0) || 'U'}</div>
                          )}
                          <div className="user-meta">
                            <span className="user-name-cell">{user.name}</span>
                            <span className="user-email-cell">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-tag ${isActive ? 'active' : 'inactive'}`}>
                          {isActive ? 'Active' : 'Banned'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="action-buttons-group">

                          
                          <button 
                            onClick={() => handleToggleStatus(user)} 
                            className={`btn-toggle-status ${isActive ? 'to-ban' : 'to-unban'}`}
                            disabled={isProcessing === targetId}
                          >
                            {isProcessing === targetId ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              isActive ? <><UserMinus size={16} /> Ban User</> : <><UserCheck size={16} /> Unban User</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                <tr><td colSpan="3" className="text-center py-10 text-slate-500">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
}

export default AdminMenu;
