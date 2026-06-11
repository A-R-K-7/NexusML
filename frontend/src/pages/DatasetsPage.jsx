import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { datasetsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { Upload, Database, Table, Calendar, User, Eye, Zap } from 'lucide-react';

const DatasetsPage = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const load = async () => {
      try {
        const params = {};
        if (searchParams.get('projectId')) params.projectId = searchParams.get('projectId');
        const { data } = await datasetsAPI.list(params);
        setDatasets(data.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [searchParams]);

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Datasets</h1>
          <p className="page-subtitle">Upload and manage your training datasets</p>
        </div>
        <button onClick={() => navigate('/datasets/upload')} className="btn-primary">
          <Upload className="w-4 h-4" /> Upload Dataset
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading datasets..." /></div>
      ) : datasets.length === 0 ? (
        <div className="text-center py-20">
          <Database className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
          <h3 className="text-text-primary font-medium mb-2">No datasets yet</h3>
          <p className="text-text-muted text-sm mb-6">Upload your first CSV dataset to start training</p>
          <button onClick={() => navigate('/datasets/upload')} className="btn-primary mx-auto">
            <Upload className="w-4 h-4" /> Upload Dataset
          </button>
        </div>
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Project</th>
                <th className="table-header">Rows</th>
                <th className="table-header">Columns</th>
                <th className="table-header">Status</th>
                <th className="table-header">Uploaded By</th>
                <th className="table-header">Date</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d._id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="font-medium">{d.name}</span>
                    </div>
                    <p className="text-xs text-text-muted pl-6">{d.originalFilename}</p>
                  </td>
                  <td className="table-cell text-text-muted text-xs">{d.projectId?.name || '—'}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1 text-text-secondary">
                      <Table className="w-3.5 h-3.5" />
                      {d.rows?.toLocaleString() || '—'}
                    </div>
                  </td>
                  <td className="table-cell text-text-secondary">{d.columns || '—'}</td>
                  <td className="table-cell"><StatusBadge status={d.status} /></td>
                  <td className="table-cell text-text-muted text-xs">{d.uploadedBy?.name || '—'}</td>
                  <td className="table-cell text-text-muted text-xs">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/datasets/${d._id}`)}
                        className="text-primary hover:underline text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      {d.status === 'ready' && (
                        <button
                          onClick={() => navigate(`/automl?datasetId=${d._id}`)}
                          className="text-accent hover:underline text-xs flex items-center gap-1"
                        >
                          <Zap className="w-3.5 h-3.5" /> Train
                        </button>
                      )}
                    </div>
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

export default DatasetsPage;
