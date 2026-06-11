import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { runsAPI, modelsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import {
  ArrowLeft, Package, Clock, Target, Cpu, CheckCircle2,
  AlertCircle, RefreshCw, TrendingUp, BarChart2
} from 'lucide-react';

const MetricCard = ({ label, value, color = 'text-primary' }) => (
  <div className="bg-card-hover rounded-xl p-4 text-center">
    <p className="text-text-muted text-xs mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>
      {value != null ? (typeof value === 'number' && value <= 1 && value >= 0
        ? `${(value * 100).toFixed(1)}%`
        : typeof value === 'number' ? value.toFixed(4) : value)
        : '—'}
    </p>
  </div>
);

const RunDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const pollRef = useRef(null);

  const fetchRun = async () => {
    try {
      const { data } = await runsAPI.status(id);
      setRun(data.data);

      // Stop polling when terminal state reached
      if (data.data.status === 'completed' || data.data.status === 'failed') {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchRun();
      setLoading(false);
    };
    init();

    // Start polling every 4 seconds for live status
    pollRef.current = setInterval(fetchRun, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  const handleRegister = async () => {
    if (!run) return;
    setRegistering(true);
    setRegisterError('');
    try {
      await modelsAPI.register({
        projectId: run.projectId?._id || run.projectId,
        runId: run._id,
        datasetId: run.datasetId?._id || run.datasetId,
        name: run.name,
        description: `Auto-registered from run: ${run.name}`,
        version: 'v1.0',
        tags: [run.parameters?.preset, run.parameters?.taskType].filter(Boolean),
      });
      setRegistered(true);
      setTimeout(() => navigate('/models'), 1500);
    } catch (err) {
      setRegisterError(err.response?.data?.error || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!run) return <div className="text-danger p-8">Run not found</div>;

  const isRunning = run.status === 'running';
  const isCompleted = run.status === 'completed';
  const isFailed = run.status === 'failed';
  const isClassification = run.parameters?.taskType !== 'regression';
  const duration = run.finishedAt && run.startedAt
    ? Math.round((new Date(run.finishedAt) - new Date(run.startedAt)) / 1000)
    : null;

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="page-header">
        <button
          onClick={() => navigate('/runs')}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-4 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Experiments
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">{run.name}</h1>
            <p className="page-subtitle">
              {run.projectId?.name} · {run.datasetId?.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isRunning && (
              <div className="flex items-center gap-2 text-primary text-sm animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Live updating...
              </div>
            )}
            <StatusBadge status={run.status} />
          </div>
        </div>
      </div>

      {/* Live training progress */}
      {isRunning && (
        <div className="card mb-6 border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-text-primary font-semibold">
                {run.jobId?.startsWith('sim-')
                  ? 'Simulating AutoML training...'
                  : 'AutoGluon is training your model...'}
              </p>
              <p className="text-text-muted text-sm mt-1">
                Preset: <span className="text-primary capitalize">{run.parameters?.preset}</span>
                {' · '}
                Target: <span className="text-primary">{run.parameters?.targetColumn}</span>
                {' · '}
                This page auto-refreshes every 4 seconds
              </p>
              <div className="mt-3 w-full bg-background rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <div className="card mb-6 border border-danger/30 bg-danger/5">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-danger flex-shrink-0" />
            <div>
              <p className="text-danger font-semibold">Training Failed</p>
              <p className="text-text-muted text-sm mt-1">{run.errorMessage || 'Unknown error'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      {isCompleted && run.metrics && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> Performance Metrics
            </h2>
            {run.jobId && !run.jobId.startsWith('sim-') && (
              <span className="badge-green text-xs">Real AutoGluon</span>
            )}
            {run.jobId?.startsWith('sim-') && (
              <span className="badge-yellow text-xs">Simulated</span>
            )}
          </div>

          {isClassification ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Accuracy" value={run.metrics.accuracy} color="text-accent" />
              <MetricCard label="F1 Score" value={run.metrics.f1} color="text-primary" />
              <MetricCard label="Precision" value={run.metrics.precision} color="text-blue-400" />
              <MetricCard label="Recall" value={run.metrics.recall} color="text-purple-400" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <MetricCard label="RMSE" value={run.metrics.rmse} color="text-warning" />
              <MetricCard label="MAE" value={run.metrics.mae} color="text-orange-400" />
              <MetricCard label="R² Score" value={run.metrics.r2} color="text-accent" />
            </div>
          )}

          {run.metrics.trainingTime && (
            <div className="mt-4 flex items-center gap-2 text-text-muted text-sm">
              <Clock className="w-4 h-4" />
              Training time: <span className="text-text-primary font-medium">{run.metrics.trainingTime}s</span>
              {duration && (
                <span className="ml-4">Total wall time: <span className="text-text-primary font-medium">{duration}s</span></span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Register Model */}
      {isCompleted && (
        <div className="card mb-6 border border-accent/20 bg-accent/5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-text-primary font-semibold flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-accent" /> Register as Model
              </h2>
              <p className="text-text-muted text-sm">
                Save this trained model to the Model Registry for deployment and governance tracking.
              </p>
              {registerError && (
                <p className="text-danger text-sm mt-2">{registerError}</p>
              )}
            </div>
            <button
              onClick={handleRegister}
              className="btn-primary ml-4 flex-shrink-0"
              disabled={registering || registered}
            >
              {registered ? (
                <><CheckCircle2 className="w-4 h-4" /> Registered!</>
              ) : registering ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering...</>
              ) : (
                <><Package className="w-4 h-4" /> Register Model</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Run parameters */}
      <div className="card">
        <h2 className="section-title">Run Parameters</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Task Type', value: run.parameters?.taskType },
            { label: 'Target Column', value: run.parameters?.targetColumn },
            { label: 'Preset', value: run.parameters?.preset },
            { label: 'Time Limit', value: run.parameters?.timeLimit ? `${run.parameters.timeLimit}s` : '—' },
            { label: 'Dataset', value: run.datasetId?.name },
            { label: 'Dataset Rows', value: run.datasetId?.rows?.toLocaleString() },
            { label: 'Started', value: run.startedAt ? new Date(run.startedAt).toLocaleString() : '—' },
            { label: 'Finished', value: run.finishedAt ? new Date(run.finishedAt).toLocaleString() : run.status === 'running' ? 'In progress...' : '—' },
            { label: 'Created by', value: run.createdBy?.name },
          ].map((r) => (
            <div key={r.label} className="bg-card-hover rounded-lg p-3">
              <p className="text-text-muted text-xs mb-1">{r.label}</p>
              <p className="text-text-primary text-sm font-medium capitalize">{r.value || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RunDetailPage;
