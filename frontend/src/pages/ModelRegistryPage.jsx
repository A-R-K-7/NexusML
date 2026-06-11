import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { modelsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { Package, Rocket, Network, Eye, TrendingUp } from 'lucide-react';

const ModelRegistryPage = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const { data } = await modelsAPI.list(params);
      setModels(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const fmt = (val) => {
    if (val == null || val === 0) return '—';
    return `${(val * 100).toFixed(1)}%`;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Model Registry</h1>
          <p className="page-subtitle">Manage and version your trained ML models</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-3 mb-6">
        {['', 'draft', 'staging', 'production', 'archived'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-primary text-white' : 'bg-card-hover text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : models.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
          <h3 className="text-text-primary font-medium mb-2">No models registered</h3>
          <p className="text-text-muted text-sm">Complete an experiment run, then register the model here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {models.map((m) => (
            <div key={m._id} className="card-hover group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-text-primary font-semibold">{m.name}</h3>
                    <p className="text-text-muted text-xs">{m.version} · {m.framework}</p>
                  </div>
                </div>
                <StatusBadge status={m.status} />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {((m.taskType === 'regression' || m.tags?.includes('regression') || m.runId?.parameters?.taskType === 'regression') ? [
                  { label: 'R² Score', value: fmt(m.metrics?.r2) },
                  { label: 'RMSE', value: m.metrics?.rmse != null ? Number(m.metrics.rmse).toFixed(1) : '—' },
                  { label: 'MAE', value: m.metrics?.mae != null ? Number(m.metrics.mae).toFixed(1) : '—' },
                  { label: 'Time (s)', value: m.metrics?.trainingTime || '—' },
                ] : [
                  { label: 'Accuracy', value: fmt(m.metrics?.accuracy) },
                  { label: 'F1', value: fmt(m.metrics?.f1) },
                  { label: 'Precision', value: fmt(m.metrics?.precision) },
                  { label: 'Recall', value: fmt(m.metrics?.recall) },
                ]).map((metric) => (
                  <div key={metric.label} className="bg-card-hover rounded-lg p-2 text-center">
                    <p className="text-text-muted text-xs">{metric.label}</p>
                    <p className="text-text-primary text-sm font-bold">{metric.value}</p>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {m.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {m.tags.map((t) => <span key={t} className="badge-gray">{t}</span>)}
                </div>
              )}

              <div className="divider" />

              <div className="flex items-center justify-between">
                <p className="text-text-muted text-xs">{new Date(m.createdAt).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/models/${m._id}/lineage`)} className="btn-secondary px-3 py-1.5 text-xs">
                    <Network className="w-3.5 h-3.5" /> Lineage
                  </button>
                  <button onClick={() => navigate(`/deployments?modelId=${m._id}`)} className="btn-primary px-3 py-1.5 text-xs"
                    disabled={m.status === 'archived'}>
                    <Rocket className="w-3.5 h-3.5" /> Deploy
                  </button>
                  <button onClick={() => navigate(`/models/${m._id}`)} className="btn-secondary px-3 py-1.5 text-xs">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelRegistryPage;
