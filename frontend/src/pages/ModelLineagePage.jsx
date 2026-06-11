import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { modelsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Database, FlaskConical, Package, Rocket, ArrowDown, ChevronRight } from 'lucide-react';

const LineageNode = ({ icon: Icon, title, subtitle, color, status, isLast }) => (
  <div className="flex flex-col items-center">
    <div className={`w-full max-w-xs card flex items-center gap-3 border-l-4 ${color}`}>
      <div className="flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-medium text-sm truncate">{title}</p>
        <p className="text-text-muted text-xs truncate">{subtitle}</p>
      </div>
      {status && <StatusBadge status={status} />}
    </div>
    {!isLast && (
      <div className="flex flex-col items-center my-2">
        <div className="w-px h-6 bg-border" />
        <ArrowDown className="w-4 h-4 text-text-muted" />
        <div className="w-px h-6 bg-border" />
      </div>
    )}
  </div>
);

const ModelLineagePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lineage, setLineage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    modelsAPI.lineage(id)
      .then(({ data }) => setLineage(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!lineage) return <div className="text-danger">Lineage not found</div>;

  const { project, dataset, run, model, deployments } = lineage;

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="page-header">
        <button onClick={() => navigate('/models')} className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Registry
        </button>
        <h1 className="page-title">Model Lineage</h1>
        <p className="page-subtitle">Full provenance chain for <span className="text-primary">{model.name}</span></p>
      </div>

      <div className="flex flex-col items-center gap-0">
        {/* Project */}
        <LineageNode
          icon={({ className }) => <span className="text-lg">📁</span>}
          title={project?.name || 'Unknown Project'}
          subtitle="Project"
          color="border-primary"
        />

        {/* Dataset */}
        <LineageNode
          icon={Database}
          title={dataset?.name || 'Unknown Dataset'}
          subtitle={`${dataset?.rows?.toLocaleString() || 0} rows · ${dataset?.columns || 0} columns`}
          color="border-blue-500"
        />

        {/* Run */}
        <LineageNode
          icon={FlaskConical}
          title={run?.name || 'Training Run'}
          subtitle={`Accuracy: ${run?.metrics?.accuracy ? (run.metrics.accuracy * 100).toFixed(1) + '%' : '—'} · F1: ${run?.metrics?.f1 ? (run.metrics.f1 * 100).toFixed(1) + '%' : '—'}`}
          color="border-purple-500"
          status={run?.status}
        />

        {/* Model */}
        <LineageNode
          icon={Package}
          title={`${model.name} ${model.version}`}
          subtitle={`${model.metrics?.accuracy ? 'Acc: ' + (model.metrics.accuracy * 100).toFixed(1) + '%' : ''} · Status: ${model.status}`}
          color="border-orange-500"
          status={model.status}
          isLast={deployments.length === 0}
        />

        {/* Deployments */}
        {deployments.length > 0 && (
          <div className="w-full max-w-2xl mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {deployments.map((d) => (
              <div key={d._id} className="card flex items-start gap-3 border-l-4 border-accent">
                <Rocket className="w-5 h-5 flex-shrink-0 text-accent mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-medium text-sm truncate">{d.name}</p>
                  <p className="text-text-muted text-xs truncate">{d.endpointUrl || 'No endpoint yet'}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        )}

        {deployments.length === 0 && (
          <div className="mt-6 text-center">
            <div className="border-2 border-dashed border-border rounded-xl p-6 w-64">
              <Rocket className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-text-muted text-sm">Not deployed yet</p>
              <button
                onClick={() => navigate(`/deployments?modelId=${id}`)}
                className="btn-primary mx-auto mt-3 text-sm px-3 py-1.5"
              >
                Deploy Model
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="mt-8 card">
        <h2 className="section-title">Lineage Details</h2>
        <div className="space-y-4 text-sm">
          {[
            { label: 'Model', value: `${model.name} ${model.version}` },
            { label: 'Framework', value: 'AutoGluon' },
            { label: 'Task', value: model.taskType },
            { label: 'Target Column', value: model.targetColumn },
            { label: 'Training Date', value: new Date(model.createdAt).toLocaleString() },
          ].map((r) => (
            <div key={r.label} className="flex justify-between">
              <span className="text-text-muted">{r.label}</span>
              <span className="text-text-primary font-medium capitalize">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelLineagePage;
