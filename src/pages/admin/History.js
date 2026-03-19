import React, { useEffect, useState } from "react";
import axiosClient from "../../services/axiosClient";
import { 
    History as HistoryIcon, 
    Search, 
    Eye, 
    ArrowLeft, 
    Clock, 
    User, 
    Database,
    Loader2,
    Code,
    ChevronRight
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import "./css/AdminDashboard.css";
import "./css/AdminHistory.css";

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
      CREATE: "active",
      UPDATE: "warning",
      DELETE: "inactive",
      LOGIN: "primary",
    };
    return map[action?.toUpperCase()] || "default";
  };

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

  const filteredLogs = logs.filter(log =>
    log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Activities', value: logs.length, icon: <HistoryIcon size={20} />, color: 'blue' },
    { label: 'Data Updates', value: logs.filter(l => l.action === 'UPDATE').length, icon: <Database size={20} />, color: 'purple' },
    { label: 'Data Deletions', value: logs.filter(l => l.action === 'DELETE').length, icon: <Trash2 size={20} />, color: 'red' },
  ];

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header-simple">
        <div className="header-text">
          <h1>System Activity Logs</h1>
          <p>Track all administrative actions and security events</p>
        </div>
        <button className="btn-secondary-admin" onClick={() => navigate("/admin")}>
          <ArrowLeft size={18} /> Back to Dashboard
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
              placeholder="Filter by user or action..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive-admin">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Action</th>
                <th>Target ID</th>
                <th className="text-right">Data</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-10"><Loader2 className="animate-spin inline mr-2" /> Loading audit logs...</td></tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-slate-400 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-500" />
                        {formatTime(log.time)}
                      </div>
                    </td>
                    <td>
                      <div className="user-profile-cell">
                        <div className="user-avatar-placeholder-sm" style={{ width: 32, height: 32 }}>
                          {log.userName?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <span className="user-name-cell">{log.userName}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-tag ${getActionClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td><code className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">{log.userId}</code></td>
                    <td className="text-right">
                      <button
                        className="btn-action-icon"
                        onClick={() => handleViewDetails(log)}
                        title="View Detailed Payload"
                      >
                        <Code size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-500">No activity logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer-admin">
            <span>Showing {filteredLogs.length} activity records</span>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedLog && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal-content wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header-admin">
              <h3>Operation Snapshot</h3>
            </div>
            <div className="modal-body-admin">
              <div className="audit-meta-grid">
                <div className="audit-meta-item">
                    <label>Operator</label>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="user-avatar-placeholder-sm" style={{ width: 24, height: 24 }}>{selectedLog.userName?.charAt(0)}</div>
                        <span className="font-semibold">{selectedLog.userName}</span>
                        <span className="text-xs text-slate-500">(ID: {selectedLog.userId})</span>
                    </div>
                </div>
                <div className="audit-meta-item text-right">
                    <label>Logged At</label>
                    <div className="flex items-center justify-end gap-2 mt-1 font-medium">
                        <Clock size={14} /> {formatTime(selectedLog.time)}
                    </div>
                </div>
              </div>

              <div className="payload-comparison mt-6">
                <div className="payload-box">
                    <div className="payload-header old"><X size={14} /> OLD STATE</div>
                    <div className="payload-content">
                        {selectedLog.oldData ? (
                        <pre className="json-pre">
                            {parseJson(selectedLog.oldData)}
                        </pre>
                        ) : (
                        <div className="payload-empty italic">No prior data recorded</div>
                        )}
                    </div>
                </div>
                <div className="payload-box">
                    <div className="payload-header new"><ChevronRight size={14} /> NEW STATE</div>
                    <div className="payload-content">
                        {selectedLog.newData ? (
                        <pre className="json-pre">
                            {parseJson(selectedLog.newData)}
                        </pre>
                        ) : (
                        <div className="payload-empty italic">No resulting data recorded</div>
                        )}
                    </div>
                </div>
              </div>
            </div>
            <div className="modal-footer-admin">
              <button className="btn-secondary-admin" onClick={() => setShowModal(false)}>Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;
