import React, { useEffect, useState } from "react";
import axiosClient from "../../services/axiosClient";

import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./css/Block.css";

function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get("/auth");
        setLogs(res.data.content || []);
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatTime = (timeArr) => {
    if (!timeArr) return "-";
    const [year, month, day, hour, minute, second] = timeArr;
    const date = new Date(year, month - 1, day, hour, minute, second);
    return date.toLocaleString();
  };

  const getActionClass = (action) => {
    const map = {
      CREATE: "success",
      UPDATE: "warning",
      DELETE: "danger",
      LOGIN: "primary",
    };
    return map[action?.toUpperCase()] || "secondary";
  };

  // Safe parse JSON
  const parseJson = (data) => {
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch (e) {
      return data;
    }
  }

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  // Filtering
  const filteredLogs = logs.filter(log =>
    log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const totalLogs = logs.length;
  const updateActions = logs.filter(l => l.action === 'UPDATE').length;
  const deleteActions = logs.filter(l => l.action === 'DELETE').length;

  return (
    <div className="dashboard-container">

      <div className="container mt-4">
        {/* Module Header */}
        <div className="dashboard-header rounded-3 px-4">
          <div className="header-content">
            <div>
              <h2 className="page-title">Activity Logs</h2>
              <p className="text-muted mb-0" style={{ fontSize: '14px' }}>Monitor all system activities and changes.</p>
            </div>
            <div className="header-actions">
              <button
                className="btn-history"
                onClick={() => navigate("/admin")}
              >
                <i className="bi bi-arrow-left"></i> Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon users">
              <i className="bi bi-journal-text"></i>
            </div>
            <div className="stat-info">
              <h3>Total Logs</h3>
              <p>{totalLogs}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon active">
              <i className="bi bi-pencil-square"></i>
            </div>
            <div className="stat-info">
              <h3>Updates</h3>
              <p>{updateActions}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon new">
              <i className="bi bi-trash"></i>
            </div>
            <div className="stat-info">
              <h3>Deletes</h3>
              <p>{deleteActions}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-card">
          <div className="card-header">
            <h5 className="mb-0 fw-bold">Recent Activities</h5>
            <div className="search-wrapper">
              <i className="bi bi-search search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '32px' }}>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>User ID</th>
                  <th className="text-end" style={{ paddingRight: '32px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-5">Loading logs...</td></tr>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ paddingLeft: '32px', fontWeight: '500', color: '#4b5563' }}>
                        {formatTime(log.time)}
                      </td>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-placeholder" style={{ width: 32, height: 32, fontSize: 13 }}>
                            {log.userName?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <span className="user-name">{log.userName}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${getActionClass(log.action)}`}>
                          <span className="status-dot"></span>
                          {log.action}
                        </span>
                      </td>
                      <td><span className="text-muted small font-monospace">{log.userId}</span></td>
                      <td className="text-end" style={{ paddingRight: '32px' }}>
                        <button
                          className="action-btn btn-view"
                          onClick={() => handleViewDetails(log)}
                          title="View Changes"
                          style={{ width: 'auto', padding: '0 12px' }}
                        >
                          <i className="bi bi-code-square me-2"></i> View Data
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">No logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      {showModal && selectedLog && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold"> <i className="bi bi-clock-history me-2 text-primary"></i>Log Details</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body pt-4">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <p className="mb-1 text-muted small fw-bold">PERFORMED BY</p>
                    <div className="d-flex align-items-center">
                      <div className="user-avatar-placeholder me-2" style={{ width: 32, height: 32, fontSize: 13 }}>
                        {selectedLog.userName?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <span className="fw-bold">{selectedLog.userName}</span>
                      <span className="text-muted ms-2 small">(ID: {selectedLog.userId})</span>
                    </div>
                  </div>
                  <div className="col-md-6 text-end">
                    <p className="mb-1 text-muted small fw-bold">TIMESTAMP</p>
                    <span className="fw-bold">{formatTime(selectedLog.time)}</span>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-bold text-danger mb-3"><i className="bi bi-dash-circle me-2"></i>Old Data</h6>
                    {selectedLog.oldData ? (
                      <pre className="json-display">
                        {parseJson(selectedLog.oldData)}
                      </pre>
                    ) : (
                      <div className="json-null">No previous data available</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold text-success mb-3"><i className="bi bi-plus-circle me-2"></i>New Data</h6>
                    {selectedLog.newData ? (
                      <pre className="json-display" style={{ borderColor: '#10b981' }}>
                        {parseJson(selectedLog.newData)}
                      </pre>
                    ) : (
                      <div className="json-null">No new data available</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top-0">
                <button className="btn btn-primary px-4 rounded-3" onClick={() => setShowModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* <Footer /> */}
    </div>
  );
}

export default History;
