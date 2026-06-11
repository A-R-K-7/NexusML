import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { Plus, Search, FolderOpen, Users, Calendar, Tag, Trash2, Edit } from 'lucide-react';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await projectsAPI.list({ search });
      setProjects(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await projectsAPI.delete(id);
      setProjects((p) => p.filter((x) => x._id !== id));
    } catch (e) { alert('Delete failed'); }
    finally { setDeleting(null); }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Organize your ML work into projects</p>
        </div>
        <button onClick={() => navigate('/projects/new')} className="btn-primary">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          className="input pl-10 max-w-md"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading projects..." /></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
          <h3 className="text-text-primary font-medium mb-2">No projects yet</h3>
          <p className="text-text-muted text-sm mb-6">Create your first project to get started</p>
          <button onClick={() => navigate('/projects/new')} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p._id}
              className="card-hover cursor-pointer group"
              onClick={() => navigate(`/projects/${p._id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/projects/${p._id}/edit`); }}
                    className="p-1.5 rounded-lg hover:bg-card-hover text-text-muted hover:text-text-primary"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }}
                    className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger"
                    disabled={deleting === p._id}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-text-primary font-semibold mb-1 group-hover:text-primary transition-colors">
                {p.name}
              </h3>
              <p className="text-text-muted text-sm mb-4 line-clamp-2">
                {p.description || 'No description'}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {p.tags?.slice(0, 3).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/5 border border-primary/10 rounded-full text-xs text-text-muted">
                    <Tag className="w-2.5 h-2.5" />{t}
                  </span>
                ))}
              </div>

              <div className="divider" />

              <div className="flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {p.members?.length || 1} member{p.members?.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
