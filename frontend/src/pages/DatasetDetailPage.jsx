import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { datasetsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Database, Table, Zap, Download, Tag } from 'lucide-react';

const DatasetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    datasetsAPI.get(id)
      .then(({ data }) => setDataset(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!dataset) return <div className="text-danger p-8">Dataset not found</div>;

  const columns = dataset.columnNames || [];
  const sampleData = dataset.sampleData || [];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <button
          onClick={() => navigate('/datasets')}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-4 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Datasets
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-400" />
              {dataset.name}
            </h1>
            <p className="page-subtitle">{dataset.originalFilename}</p>
          </div>
          <div className="flex gap-3">
            <StatusBadge status={dataset.status} />
            <button
              onClick={() => navigate(`/automl?datasetId=${dataset._id}`)}
              className="btn-primary"
            >
              <Zap className="w-4 h-4" /> Train on this Dataset
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Rows', value: dataset.rows?.toLocaleString() ?? '—', icon: Table },
          { label: 'Columns', value: dataset.columns ?? '—', icon: Database },
          { label: 'File Size', value: dataset.fileSizeBytes
            ? `${(dataset.fileSizeBytes / 1024).toFixed(0)} KB`
            : '—', icon: Download },
          { label: 'Project', value: dataset.projectId?.name ?? '—', icon: Tag },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon bg-blue-500/10 text-blue-400">
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-text-muted text-sm">{s.label}</p>
              <p className="text-xl font-bold text-text-primary">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Column schema */}
      {columns.length > 0 && (
        <div className="card mb-6">
          <h2 className="section-title">Column Schema</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">#</th>
                  <th className="table-header">Column Name</th>
                  <th className="table-header">Detected Type</th>
                  <th className="table-header">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((col, i) => {
                  const dtype = dataset.dataTypes?.[col] || 'unknown';
                  return (
                    <tr key={col} className="table-row">
                      <td className="table-cell text-text-muted text-xs">{i + 1}</td>
                      <td className="table-cell font-medium font-mono">{col}</td>
                      <td className="table-cell">
                        <span className={dtype === 'numeric'
                          ? 'badge-blue'
                          : dtype === 'categorical'
                          ? 'badge-green'
                          : 'badge-gray'}>
                          {dtype}
                        </span>
                      </td>
                      <td className="table-cell text-text-muted text-xs">
                        {dtype === 'numeric' ? 'Good for regression or feature' : 'Good for classification target or feature'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sample data */}
      {sampleData.length > 0 && (
        <div className="card">
          <h2 className="section-title">Sample Data (first {sampleData.length} rows)</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="table-header whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleData.map((row, ri) => (
                  <tr key={ri} className="table-row">
                    {columns.map((col) => (
                      <td key={col} className="table-cell text-xs whitespace-nowrap max-w-32 truncate">
                        {row[col] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {columns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted">No schema information available yet.</p>
        </div>
      )}
    </div>
  );
};

export default DatasetDetailPage;
