import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { runsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { FlaskConical, Plus, Filter, ChevronUp, ChevronDown, Eye, RefreshCw } from 'lucide-react';

const RunsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchParams.get('projectId')) params.projectId = searchParams.get('projectId');
      if (statusFilter) params.status = statusFilter;
      const { data } = await runsAPI.list(params);
      setRuns(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter, searchParams]);

  const sorted = [...runs].sort((a, b) => {
    let va = a[sortBy], vb = b[sortBy];
    if (sortBy === 'accuracy') { va = a.metrics?.accuracy; vb = b.metrics?.accuracy; }
    if (va == null) return 1;
    if (vb == null) return -1;
    return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => sortBy === col
    ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
    : <ChevronDown className="w-3 h-3 opacity-30" />;

  const fmt = (v, pct = false) => v != null ? (pct ? `${(v * 100).toFixed(1)}%` : v.toFixed(3)) : '—';

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Experiments</h1>
          <p className="page-subtitle">Track and compare your ML training runs</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => navigate('/automl')} className="btn-primary">
            <Plus className="w-4 h-4" /> New Run
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        {['', 'pending', 'running', 'completed', 'failed'].map((s) => (
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
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading experiments..." /></div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <FlaskConical className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
          <h3 className="text-text-primary font-medium mb-2">No experiments yet</h3>
          <p className="text-text-muted text-sm mb-6">Use the AutoML wizard to start your first training run</p>
          <button onClick={() => navigate('/automl')} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" /> Start AutoML
          </button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                <th className="table-header cursor-pointer" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">Name <SortIcon col="name" /></div>
                </th>
                <th className="table-header">Status</th>
                <th className="table-header">Target</th>
                <th className="table-header cursor-pointer" onClick={() => toggleSort('accuracy')}>
                  <div className="flex items-center gap-1">Accuracy <SortIcon col="accuracy" /></div>
                </th>
                <th className="table-header">F1</th>
                <th className="table-header">Precision</th>
                <th className="table-header">Recall</th>
                <th className="table-header">Preset</th>
                <th className="table-header cursor-pointer" onClick={() => toggleSort('createdAt')}>
                  <div className="flex items-center gap-1">Date <SortIcon col="createdAt" /></div>
                </th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r._id} className="table-row cursor-pointer hover:bg-primary/5 group" onClick={() => navigate(`/runs/${r._id}`)}>
                  <td className="table-cell">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-text-muted">{r.datasetId?.name}</div>
                  </td>
                  <td className="table-cell"><StatusBadge status={r.status} /></td>
                  <td className="table-cell text-text-secondary text-xs">{r.parameters?.targetColumn || '—'}</td>
                  <td className="table-cell font-medium">{fmt(r.metrics?.accuracy, true)}</td>
                  <td className="table-cell">{fmt(r.metrics?.f1, true)}</td>
                  <td className="table-cell">{fmt(r.metrics?.precision, true)}</td>
                  <td className="table-cell">{fmt(r.metrics?.recall, true)}</td>
                  <td className="table-cell">
                    <span className="badge-gray capitalize">{r.parameters?.preset || '—'}</span>
                  </td>
                  <td className="table-cell text-text-muted text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="table-cell">
                    <Eye className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RunsPage;
