import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { ArrowLeft, Plus, X } from 'lucide-react';

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', tags: [] });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm({ ...form, tags: [...form.tags, t] });
    }
    setTagInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await projectsAPI.create(form);
      navigate(`/projects/${data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="page-header">
        <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-4 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to projects
        </button>
        <h1 className="page-title">Create Project</h1>
        <p className="page-subtitle">Set up a new ML project workspace</p>
      </div>

      <div className="card">
        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-lg px-4 py-3 mb-4 text-danger text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Project Name *</label>
            <input
              className="input"
              placeholder="e.g., Customer Churn Prediction"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input h-24 resize-none"
              placeholder="Brief description of the project goals..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                className="input flex-1"
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              />
              <button type="button" onClick={addTag} className="btn-secondary px-3">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((t) => (
                <span key={t} className="badge-blue flex items-center gap-1">
                  {t}
                  <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter((x) => x !== t) })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <><Plus className="w-4 h-4" /> Create Project</>
              )}
            </button>
            <button type="button" onClick={() => navigate('/projects')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectPage;
