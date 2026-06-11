import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { deploymentsAPI, modelsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { Rocket, Plus, Play, Square, ExternalLink, Activity } from 'lucide-react';

const DeploymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [deployments, setDeployments] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    modelId: searchParams.get('modelId') || '',
    name: '',
    environment: 'staging',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [d, m] = await Promise.all([deploymentsAPI.list(), modelsAPI.list()]);
      setDeployments(d.data.data);
      setModels(m.data.data.filter((x) => x.status !== 'archived'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    if (searchParams.get('modelId')) setShowForm(true);
  }, []);

  const handleDeploy = async () => {
    const model = models.find((m) => m._id === form.modelId);
    const name = form.name || `${model?.name} — ${form.environment}`;
    setDeploying(true);
    try {
      await deploymentsAPI.deploy({ ...form, name, projectId: model?.projectId });
      setShowForm(false);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  const handleStop = async (id) => {
    if (!window.confirm('Stop this deployment?')) return;
    await deploymentsAPI.stop(id);
    load();
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Deployments</h1>
          <p className="page-subtitle">Deploy and manage prediction API endpoints</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="w-4 h-4" /> Deploy Model
        </button>
      </div>

      {/* Deploy form */}
      {showForm && (
        <div className="card mb-6 border border-primary/20">
          <h2 className="section-title">New Deployment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Model</label>
              <select className="input" value={form.modelId} onChange={(e) => setForm({ ...form, modelId: e.target.value })}>
                <option value="">Select model...</option>
                {models.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.version})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Deployment Name</label>
              <input className="input" placeholder="Auto-generated if empty" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Environment</label>
              <select className="input" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleDeploy} className="btn-primary" disabled={!form.modelId || deploying}>
              {deploying ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deploying...
                </span>
              ) : <><Rocket className="w-4 h-4" /> Deploy</>}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : deployments.length === 0 ? (
        <div className="text-center py-20">
          <Rocket className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
          <h3 className="text-text-primary font-medium mb-2">No deployments yet</h3>
          <p className="text-text-muted text-sm">Deploy a registered model to create a prediction endpoint</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {deployments.map((d) => (
            <div key={d._id} className="card-hover">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-text-primary font-semibold">{d.name}</h3>
                  <p className="text-text-muted text-xs">{d.modelId?.name} {d.modelId?.version}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-gray capitalize">{d.environment}</span>
                  <StatusBadge status={d.status} />
                </div>
              </div>

              {d.endpointUrl && (
                <div className="flex items-center gap-2 bg-card-hover rounded-lg px-3 py-2 mb-4">
                  <ExternalLink className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                  <code className="text-accent text-xs truncate">{d.endpointUrl}</code>
                </div>
              )}

              <div className="divider" />

              <div className="flex items-center justify-between">
                <span className="text-text-muted text-xs">{new Date(d.createdAt).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  {d.status === 'Running' && (
                    <>
                      <button onClick={() => navigate(`/deployments/${d._id}/playground`)} className="btn-secondary px-3 py-1.5 text-xs">
                        <Play className="w-3.5 h-3.5" /> Test
                      </button>
                      <button onClick={() => navigate(`/monitoring?deploymentId=${d._id}`)} className="btn-secondary px-3 py-1.5 text-xs">
                        <Activity className="w-3.5 h-3.5" /> Monitor
                      </button>
                      <button onClick={() => handleStop(d._id)} className="btn-danger px-3 py-1.5 text-xs">
                        <Square className="w-3.5 h-3.5" /> Stop
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeploymentPage;
