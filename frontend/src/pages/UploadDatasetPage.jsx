import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { datasetsAPI, projectsAPI } from '../services/api';
import { useEffect } from 'react';
import { ArrowLeft, Upload, FileText, X, CheckCircle } from 'lucide-react';

const UploadDatasetPage = () => {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ projectId: '', name: '', description: '' });
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    projectsAPI.list().then(({ data }) => setProjects(data.data));
  }, []);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith('.csv')) { setError('Only CSV files supported'); return; }
    setFile(f);
    setError('');
    if (!form.name) setForm((prev) => ({ ...prev, name: f.name.replace('.csv', '') }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a CSV file'); return; }
    if (!form.projectId) { setError('Please select a project'); return; }

    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('projectId', form.projectId);
      fd.append('name', form.name);
      fd.append('description', form.description);

      await datasetsAPI.upload(fd, setProgress);
      setDone(true);
      setTimeout(() => navigate('/datasets'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-96 animate-fade-in">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
          <h2 className="text-text-primary text-xl font-semibold mb-2">Dataset Uploaded!</h2>
          <p className="text-text-muted">Redirecting to datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="page-header">
        <button onClick={() => navigate('/datasets')} className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="page-title">Upload Dataset</h1>
        <p className="page-subtitle">Upload a CSV file to use in training experiments</p>
      </div>

      <div className="card">
        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-lg px-4 py-3 mb-4 text-danger text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
              ${file ? 'border-accent/40 bg-accent/5' : 'border-border hover:border-primary/40 hover:bg-primary/5'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-accent" />
                <div className="text-left">
                  <p className="text-text-primary font-medium">{file.name}</p>
                  <p className="text-text-muted text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-text-muted hover:text-danger ml-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-primary font-medium">Drop CSV file here or click to browse</p>
                <p className="text-text-muted text-sm mt-1">Maximum file size: 100MB</p>
              </>
            )}
          </div>

          <div>
            <label className="label">Project *</label>
            <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required>
              <option value="">Select a project...</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Dataset Name</label>
            <input className="input" placeholder="Customer Data Q1 2024" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input h-20 resize-none" placeholder="Brief description of the dataset..."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {loading && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-muted">Uploading...</span>
                <span className="text-text-primary">{progress}%</span>
              </div>
              <div className="w-full bg-card-hover rounded-full h-2">
                <div className="bg-primary rounded-full h-2 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : <><Upload className="w-4 h-4" /> Upload Dataset</>}
            </button>
            <button type="button" onClick={() => navigate('/datasets')} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadDatasetPage;
