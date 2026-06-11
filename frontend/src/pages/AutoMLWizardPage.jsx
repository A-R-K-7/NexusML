import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { datasetsAPI, projectsAPI, runsAPI } from '../services/api';
import { ArrowLeft, ArrowRight, Zap, CheckCircle, Loader, Info } from 'lucide-react';

const STEPS = ['Select Dataset', 'Target Column', 'Task Type', 'Settings & Launch'];

const AutoMLWizardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDatasetId = searchParams.get('datasetId');

  const [step, setStep] = useState(0);
  const [datasets, setDatasets] = useState([]);
  const [form, setForm] = useState({
    datasetId: preselectedDatasetId || '',
    targetColumn: '',
    taskType: 'classification',
    preset: 'balanced',
    timeLimit: 120,
    name: '',
  });
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [createdRunId, setCreatedRunId] = useState(null);
  const [error, setError] = useState('');

  // Load datasets
  useEffect(() => {
    datasetsAPI.list().then(({ data }) => {
      const ready = data.data.filter((d) => d.status === 'ready');
      setDatasets(ready);
    });
  }, []);

  // Resolve selected dataset whenever datasetId changes
  useEffect(() => {
    if (!form.datasetId) { setSelectedDataset(null); return; }
    const ds = datasets.find((d) => d._id === form.datasetId);
    if (ds) {
      setSelectedDataset(ds);
      // Jump to step 1 if dataset was pre-selected from URL
      if (preselectedDatasetId && step === 0) setStep(1);
    }
  }, [form.datasetId, datasets]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const projectId = selectedDataset?.projectId?._id
        || selectedDataset?.projectId
        || form.projectId;

      if (!projectId) {
        throw new Error('Could not determine project. Please select a dataset that belongs to a project.');
      }

      const { data } = await runsAPI.create({
        projectId,
        datasetId: form.datasetId,
        name: form.name || `AutoML — ${selectedDataset?.name} — ${form.preset}`,
        parameters: {
          targetColumn: form.targetColumn,
          taskType: form.taskType,
          preset: form.preset,
          timeLimit: Number(form.timeLimit),
        },
      });

      setCreatedRunId(data.data._id);
      setDone(true);
      // Navigate to run detail so user can watch live progress
      setTimeout(() => navigate(`/runs/${data.data._id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to start training');
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-96 animate-fade-in">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
          <h2 className="text-text-primary text-xl font-semibold mb-2">Training Started!</h2>
          <p className="text-text-muted">Taking you to the live run view...</p>
        </div>
      </div>
    );
  }

  const canNext = [
    form.datasetId,                          // step 0
    form.targetColumn,                        // step 1
    form.taskType,                            // step 2
    form.timeLimit && form.preset,            // step 3
  ][step];

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="page-title mb-0">AutoML Wizard</h1>
        </div>
        <p className="page-subtitle">Configure and launch an AutoML training job in 4 steps</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all flex-shrink-0 ${
              i < step ? 'bg-accent text-white' :
              i === step ? 'bg-primary text-white ring-4 ring-primary/20' :
              'bg-card-hover text-text-muted border border-border'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 ${i < step ? 'bg-accent' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-text-muted mb-6 -mt-4">
        {STEPS.map((s, i) => (
          <span key={i} className={`${i === step ? 'text-primary font-medium' : ''}`}
            style={{ width: `${100 / STEPS.length}%`, textAlign: i === 0 ? 'left' : i === STEPS.length - 1 ? 'right' : 'center' }}>
            {s}
          </span>
        ))}
      </div>

      <div className="card min-h-[320px]">
        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-lg px-4 py-3 mb-4 text-danger text-sm flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* ── Step 0: Dataset ── */}
        {step === 0 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-text-primary font-semibold text-lg">Select Dataset</h2>
            <p className="text-text-muted text-sm">Choose a ready dataset to train on</p>

            {datasets.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                <p className="text-text-muted mb-3">No ready datasets found</p>
                <button onClick={() => navigate('/datasets/upload')} className="btn-primary mx-auto text-sm">
                  Upload a Dataset first
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {datasets.map((d) => (
                  <button
                    key={d._id}
                    type="button"
                    onClick={() => setForm({ ...form, datasetId: d._id })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      form.datasetId === d._id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/30 hover:bg-card-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text-primary">{d.name}</p>
                        <p className="text-text-muted text-xs mt-0.5">
                          {d.rows?.toLocaleString() || '?'} rows · {d.columns || '?'} columns
                          {d.projectId?.name ? ` · ${d.projectId.name}` : ''}
                        </p>
                      </div>
                      {form.datasetId === d._id && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedDataset && (
              <div className="bg-card-hover rounded-lg p-3 flex gap-4 text-xs text-text-muted">
                <span>Columns: <span className="text-text-primary">{selectedDataset.columnNames?.join(', ')}</span></span>
              </div>
            )}
          </div>
        )}

        {/* ── Step 1: Target Column ── */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-text-primary font-semibold text-lg">Select Target Column</h2>
            <p className="text-text-muted text-sm">Which column should the model learn to predict?</p>

            {selectedDataset?.columnNames?.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {selectedDataset.columnNames.map((col) => {
                  const dtype = selectedDataset.dataTypes?.[col] || 'unknown';
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setForm({ ...form, targetColumn: col })}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                        form.targetColumn === col
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/30 hover:bg-card-hover'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-text-primary">{col}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          dtype === 'numeric' ? 'bg-blue-500/10 text-blue-400' : 'bg-accent/10 text-accent'
                        }`}>
                          {dtype}
                        </span>
                      </div>
                      {form.targetColumn === col && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-text-muted">No column info available</p>
            )}
          </div>
        )}

        {/* ── Step 2: Task Type ── */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-text-primary font-semibold text-lg">Task Type</h2>
            <p className="text-text-muted text-sm">What kind of ML problem is this?</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  v: 'classification',
                  label: 'Classification',
                  desc: 'Predict a category\ne.g. churn: yes/no, fraud/not-fraud',
                  icon: '🎯',
                  hint: selectedDataset?.dataTypes?.[form.targetColumn] === 'categorical' ? '✓ Recommended for this column' : null,
                },
                {
                  v: 'regression',
                  label: 'Regression',
                  desc: 'Predict a number\ne.g. price, sales amount',
                  icon: '📈',
                  hint: selectedDataset?.dataTypes?.[form.targetColumn] === 'numeric' ? '✓ Recommended for this column' : null,
                },
              ].map((t) => (
                <button
                  key={t.v}
                  type="button"
                  onClick={() => setForm({ ...form, taskType: t.v })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.taskType === t.v ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <div className="font-semibold text-text-primary">{t.label}</div>
                  <div className="text-text-muted text-xs mt-1 whitespace-pre-line">{t.desc}</div>
                  {t.hint && <div className="text-accent text-xs mt-2 font-medium">{t.hint}</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Settings ── */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-text-primary font-semibold text-lg">Training Settings</h2>

            <div>
              <label className="label">Training Preset</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: 'fast', label: 'Fast', desc: 'Quick results', detail: '~1 min · RF, KNN', time: 60 },
                  { v: 'balanced', label: 'Balanced', desc: 'Good accuracy', detail: '~3 min · GBM, RF, XT', time: 180 },
                  { v: 'best', label: 'Best Quality', desc: 'Max accuracy', detail: '~10 min · Full ensemble', time: 600 },
                ].map((p) => (
                  <button
                    key={p.v}
                    type="button"
                    onClick={() => setForm({ ...form, preset: p.v, timeLimit: p.time })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.preset === p.v ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="font-semibold text-text-primary text-sm">{p.label}</div>
                    <div className="text-text-muted text-xs mt-0.5">{p.desc}</div>
                    <div className="text-primary text-xs mt-1">{p.detail}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Run Name (optional)</label>
                <input
                  className="input"
                  placeholder="Auto-generated if blank"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Time Limit (seconds)</label>
                <input
                  type="number" className="input" min={30} max={3600}
                  value={form.timeLimit}
                  onChange={(e) => setForm({ ...form, timeLimit: e.target.value })}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-card-hover rounded-xl p-4 text-sm space-y-2 border border-border">
              <p className="font-semibold text-text-primary mb-2">Training Summary</p>
              <div className="grid grid-cols-2 gap-y-1 text-text-secondary">
                <span className="text-text-muted">Dataset</span>
                <span className="text-text-primary font-medium">{selectedDataset?.name}</span>
                <span className="text-text-muted">Target</span>
                <span className="text-primary font-medium">{form.targetColumn}</span>
                <span className="text-text-muted">Task</span>
                <span className="text-text-primary capitalize">{form.taskType}</span>
                <span className="text-text-muted">Preset</span>
                <span className="text-text-primary capitalize">{form.preset}</span>
                <span className="text-text-muted">Time Limit</span>
                <span className="text-text-primary">{form.timeLimit}s</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-blue-400 text-xs">
                If the ML service (Docker) is running, real AutoGluon training will be performed.
                Otherwise, a realistic simulation will run automatically as a fallback.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => step === 0 ? navigate('/runs') : setStep(s => s - 1)}
          className="btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="btn-primary"
            disabled={!canNext}
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} className="btn-primary" disabled={submitting}>
            {submitting ? (
              <><Loader className="w-4 h-4 animate-spin" /> Launching...</>
            ) : (
              <><Zap className="w-4 h-4" /> Launch Training</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default AutoMLWizardPage;
