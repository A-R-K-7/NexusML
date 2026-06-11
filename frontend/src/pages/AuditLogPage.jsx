import { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { ScrollText, Filter, Clock, User } from 'lucide-react';

const ACTION_CONFIG = {
  PROJECT_CREATED: { icon: '📁', color: 'border-primary bg-primary/5' },
  PROJECT_DELETED: { icon: '🗑️', color: 'border-danger bg-danger/5' },
  DATASET_UPLOADED: { icon: '📊', color: 'border-blue-500 bg-blue-500/5' },
  TRAINING_STARTED: { icon: '🚀', color: 'border-purple-500 bg-purple-500/5' },
  TRAINING_COMPLETED: { icon: '✅', color: 'border-accent bg-accent/5' },
  TRAINING_FAILED: { icon: '❌', color: 'border-danger bg-danger/5' },
  MODEL_REGISTERED: { icon: '📦', color: 'border-orange-500 bg-orange-500/5' },
  MODEL_DEPLOYED: { icon: '🌐', color: 'border-accent bg-accent/5' },
  MODEL_STOPPED: { icon: '⏹️', color: 'border-warning bg-warning/5' },
  RISK_UPDATED: { icon: '🛡️', color: 'border-warning bg-warning/5' },
  CHECKLIST_UPDATED: { icon: '☑️', color: 'border-primary bg-primary/5' },
  USER_REGISTERED: { icon: '👤', color: 'border-blue-500 bg-blue-500/5' },
  USER_LOGIN: { icon: '🔑', color: 'border-primary bg-primary/5' },
};

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (actionFilter) params.action = actionFilter;
      const { data } = await auditAPI.list(params);
      setLogs(data.data);
      setTotal(data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, actionFilter]);

  const totalPages = Math.ceil(total / LIMIT);

  const formatAction = (action) => action.replace(/_/g, ' ');

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Audit Log</h1>
        <p className="page-subtitle">Immutable record of all platform activity for compliance</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div>
          <label className="label text-xs">Filter by Action</label>
          <select className="input w-52" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
            <option value="">All Actions</option>
            {Object.keys(ACTION_CONFIG).map((a) => (
              <option key={a} value={a}>{formatAction(a)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-icon bg-primary/10 text-primary"><ScrollText className="w-5 h-5" /></div>
          <div>
            <p className="text-text-muted text-sm">Total Events</p>
            <p className="text-2xl font-bold text-text-primary">{total.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-accent/10 text-accent"><Filter className="w-5 h-5" /></div>
          <div>
            <p className="text-text-muted text-sm">Showing</p>
            <p className="text-2xl font-bold text-text-primary">{logs.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-500/10 text-blue-400"><Clock className="w-5 h-5" /></div>
          <div>
            <p className="text-text-muted text-sm">Latest</p>
            <p className="text-sm font-bold text-text-primary">
              {logs[0] ? new Date(logs[0].createdAt).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20">
          <ScrollText className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
          <p className="text-text-muted">No audit events found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const config = ACTION_CONFIG[log.action] || { icon: '📋', color: 'border-border bg-card-hover' };
            return (
              <div key={log._id} className={`flex items-start gap-4 p-4 rounded-xl border-l-4 ${config.color} transition-all hover:opacity-90`}>
                <span className="text-xl flex-shrink-0">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text-primary font-medium text-sm">{formatAction(log.action)}</span>
                    {log.entityType && (
                      <span className="badge-blue text-xs">{log.entityType}</span>
                    )}
                    {log.projectId && (
                      <span className="text-text-muted text-xs">in {log.projectId?.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-text-muted text-xs">
                      <User className="w-3 h-3" />
                      {log.userId?.name || 'System'}
                    </div>
                    <div className="flex items-center gap-1 text-text-muted text-xs">
                      <Clock className="w-3 h-3" />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-2 text-xs text-text-muted">
                      {Object.entries(log.details).map(([k, v]) => (
                        <span key={k} className="mr-3">
                          <span className="text-text-muted">{k}:</span>{' '}
                          <span className="text-text-secondary">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">
            Previous
          </button>
          <span className="text-text-muted text-sm">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
