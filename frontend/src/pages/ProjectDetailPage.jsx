import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, datasetsAPI, runsAPI, modelsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Database, FlaskConical, Package, Users, Tag, Calendar } from 'lucide-react';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [runs, setRuns] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, d, r, m] = await Promise.all([
          projectsAPI.get(id),
          datasetsAPI.list({ projectId: id }),
          runsAPI.list({ projectId: id }),
          modelsAPI.list({ projectId: id }),
        ]);
        setProject(p.data.data);
        setDatasets(d.data.data);
        setRuns(r.data.data);
        setModels(m.data.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!project) return <div className="text-danger">Project not found</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-4 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to projects
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">{project.name}</h1>
            <p className="page-subtitle">{project.description || 'No description'}</p>
          </div>
        </div>
      </div>

      {/* Tags */}
      {project.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {project.tags.map((t) => (
            <span key={t} className="badge-blue flex items-center gap-1 text-xs">
              <Tag className="w-2.5 h-2.5" />{t}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Datasets', value: datasets.length, icon: Database, color: 'text-blue-400 bg-blue-500/10', action: () => navigate('/datasets') },
          { label: 'Experiments', value: runs.length, icon: FlaskConical, color: 'text-purple-400 bg-purple-500/10', action: () => navigate('/runs') },
          { label: 'Models', value: models.length, icon: Package, color: 'text-orange-400 bg-orange-500/10', action: () => navigate('/models') },
        ].map((s) => (
          <div key={s.label} className="card-hover cursor-pointer" onClick={s.action}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-text-muted text-sm">{s.label}</p>
                <p className="text-2xl font-bold text-text-primary">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Members */}
      <div className="card mb-6">
        <h2 className="section-title flex items-center gap-2">
          <Users className="w-4 h-4" /> Members ({project.members?.length})
        </h2>
        <div className="space-y-3">
          {project.members?.map((m) => (
            <div key={m.user?._id || m._id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-primary text-xs font-bold">
                    {m.user?.name?.[0] || '?'}
                  </span>
                </div>
                <div>
                  <p className="text-text-primary text-sm font-medium">{m.user?.name || 'Unknown'}</p>
                  <p className="text-text-muted text-xs">{m.user?.email}</p>
                </div>
              </div>
              <StatusBadge status={m.role} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Runs */}
      {runs.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Recent Experiments</h2>
            <button onClick={() => navigate(`/runs?projectId=${id}`)} className="text-primary text-sm hover:underline">
              View all
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Status</th>
                <th className="table-header">Accuracy</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, 5).map((r) => (
                <tr key={r._id} className="table-row cursor-pointer" onClick={() => navigate(`/runs/${r._id}`)}>
                  <td className="table-cell font-medium">{r.name}</td>
                  <td className="table-cell"><StatusBadge status={r.status} /></td>
                  <td className="table-cell">
                    {r.metrics?.accuracy ? `${(r.metrics.accuracy * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="table-cell text-text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
