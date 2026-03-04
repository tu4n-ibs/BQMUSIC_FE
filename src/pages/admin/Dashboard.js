import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../admin/css/Block.css";
import userService from "../../services/userService";

function AdminMenu() {
  const [users, setUsers] = useState([]);
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

  const navigate = useNavigate();

  // Load user list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userService.getAllUsers();
        // API can return { data: { content: [...] } } or { content: [...] } or direct array
        const userList = data.data?.content || data.content || data.data || data || [];
        setUsers(userList);
      } catch (error) {
        console.error("Error loading users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Filter users
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  // Mock "New Today"
  const newUsersToday = Math.floor(Math.random() * 5);

  // --- Handlers (Read, Update, Delete) ---
  const handleRead = async (id) => {
    try {
      const data = await userService.getUserById(id);
      setSelectedUser(data.data || data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error viewing details:", error);
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

  const submitUpdate = async () => {
    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("isActive", formData.isActive);
      if (formData.password) form.append("password", formData.password);
      if (image) form.append("image", image);

      const targetId = selectedUser.userId || selectedUser.idUser || selectedUser.id;
      await userService.updateUser(targetId, form);

      alert("Update successful!");
      setShowUpdateModal(false);
      window.location.reload();
    } catch (error) {
      console.error("Update error:", error);
      alert("Update failed!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await userService.deleteUser(id);
      alert("Delete successful!");
      setUsers(users.filter((u) => (u.userId || u.idUser || u.id) !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Delete failed!");
    }
  };

  return (
    <div className="dashboard-container">

      <div className="container mt-4">
        {/* Module Header */}
        <div className="dashboard-header rounded-3 px-4">
          <div className="header-content">
            <div>
              <h2 className="page-title">User Management</h2>
              <p className="text-muted mb-0" style={{ fontSize: '14px' }}>Manage your team and permissions here.</p>
            </div>
            <div className="header-actions">
              <button
                className="btn-history text-nowrap"
                onClick={() => navigate("/admin/albums")}
              >
                <i className="bi bi-journal-album"></i> Album Management
              </button>
              <button
                className="btn-history"
                onClick={() => navigate("/admin/genres")}
              >
                <i className="bi bi-music-note-list"></i> Genre Management
              </button>
              <button
                className="btn-history"
                onClick={() => navigate("/history")}
              >
                <i className="bi bi-clock-history"></i> Log History
              </button>
              <button
                className="btn-create"
                onClick={() => navigate("/createUser")}
              >
                <i className="bi bi-plus-lg"></i> Create User
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon users">
              <i className="bi bi-people-fill"></i>
            </div>
            <div className="stat-info">
              <h3>Total Users</h3>
              <p>{totalUsers}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon active">
              <i className="bi bi-person-check-fill"></i>
            </div>
            <div className="stat-info">
              <h3>Active Now</h3>
              <p>{activeUsers}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon new">
              <i className="bi bi-stars"></i>
            </div>
            <div className="stat-info">
              <h3>New Today</h3>
              <p>{newUsersToday}</p>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="main-card">
          <div className="card-header">
            <h5 className="mb-0 fw-bold">All Users</h5>
            <div className="search-wrapper">
              <i className="bi bi-search search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '32px' }}>User</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th className="text-end" style={{ paddingRight: '32px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? filteredUsers.map((user, index) => (
                  <tr key={index}>
                    <td style={{ paddingLeft: '32px' }}>
                      <div className="user-cell">
                        {user.imageUrl ? (
                          <img
                            src={`http://localhost:8080${user.imageUrl}`}
                            alt={user.email}
                            className="user-avatar"
                          />
                        ) : (
                          <div className="user-avatar-placeholder">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="user-info">
                          <span className="user-name">{user.name}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {user.roles && user.roles.map(role => (
                        <span key={role} className={`role-badge ${role === 'ADMIN' ? 'admin' : ''} me-1`}>
                          {role}
                        </span>
                      ))}
                    </td>
                    <td className="text-muted">{user.email}</td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        <span className="status-dot"></span>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-end" style={{ paddingRight: '32px' }}>
                      <button
                        className="action-btn btn-view"
                        onClick={() => handleRead(user.userId || user.idUser || user.id)}
                        title="View Details"
                      >
                        <i className="bi bi-eye-fill"></i>
                      </button>
                      <button
                        className="action-btn btn-edit"
                        onClick={() => handleUpdate(user)}
                        title="Edit User"
                      >
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                      <button
                        className="action-btn btn-delete"
                        onClick={() => handleDelete(user.userId || user.idUser || user.id)}
                        title="Delete User"
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      No users found matching "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Placeholder */}
          <div className="p-3 border-top d-flex justify-content-between align-items-center">
            <span className="text-muted small">Showing {filteredUsers.length} of {users.length} entries</span>
            {/* Pagination logic will be added later */}
          </div>
        </div>
      </div>

      {/* --- MODALS (Bootstrap Style) --- */}
      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold">User Details</h5>
                <button className="btn-close" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body text-center pt-4">
                {selectedUser.imageUrl ? (
                  <img src={`http://localhost:8080${selectedUser.imageUrl}`} className="rounded-circle mb-3 shadow-sm" width="100" height="100" style={{ objectFit: 'cover' }} alt="User" />
                ) : (
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm" style={{ width: 100, height: 100, fontSize: 32 }}>
                    {selectedUser.name.charAt(0)}
                  </div>
                )}
                <h4 className="fw-bold">{selectedUser.name}</h4>
                <p className="text-muted">{selectedUser.email}</p>

                <div className="row mt-4 text-start bg-light p-3 rounded-3 mx-2">
                  <div className="col-12 mb-2"><strong>Email:</strong> {selectedUser.email}</div>
                  <div className="col-12 mb-2">
                    <strong>Roles:</strong> {selectedUser.roles?.join(", ") || "None"}
                  </div>
                  <div className="col-12">
                    <strong>Status:</strong> {selectedUser.isActive ? <span className="text-success fw-bold">Active</span> : <span className="text-danger fw-bold">Inactive</span>}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top-0 justify-content-center pb-4">
                <button className="btn btn-outline-secondary px-4 rounded-3" onClick={() => setShowDetailModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Edit User</h5>
                <button className="btn-close" onClick={() => setShowUpdateModal(false)}></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold text-uppercase">Full Name</label>
                    <input
                      className="form-control form-control-lg fs-6"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold text-uppercase">Email Address</label>
                    <input
                      className="form-control form-control-lg fs-6"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold text-uppercase">New Password</label>
                    <input
                      type="password"
                      className="form-control form-control-lg fs-6"
                      placeholder="Leave blank to keep current"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold text-uppercase">Avatar Update</label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => setImage(e.target.files[0])}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold text-uppercase">Status</label>
                    <select
                      className="form-select form-select-lg fs-6"
                      value={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
                    >
                      <option value={true}>Active</option>
                      <option value={false}>Inactive</option>
                    </select>
                  </div>
                </form>
              </div>
              <div className="modal-footer border-top-0">
                <button className="btn btn-light text-muted fw-bold" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                <button className="btn btn-primary fw-bold px-4" onClick={submitUpdate}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* <Footer /> */}
    </div>
  );
}

export default AdminMenu;
