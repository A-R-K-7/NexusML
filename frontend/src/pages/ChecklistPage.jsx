import { useState, useEffect } from 'react';
import { modelsAPI, governanceAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckSquare, Square, Check } from 'lucide-react';

const CATEGORY_ICONS = {
  documentation: '📄',
  evaluation: '🧪',
  monitoring: '📊',
  review: '👥',
  compliance: '🏛️',
  other: '📋',
};

const ChecklistPage = () => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    modelsAPI.list().then(({ data }) => setModels(data.data));
  }, []);

  useEffect(() => {
    if (!selectedModel) { setChecklist(null); return; }
    setLoading(true);
    governanceAPI.getChecklist(selectedModel)
      .then(({ data }) => setChecklist(data.data))
      .catch(() => setChecklist(null))
      .finally(() => setLoading(false));
  }, [selectedModel]);

  const toggleItem = async (itemId, completed) => {
    setUpdating(itemId);
    try {
      await governanceAPI.updateChecklist(itemId, { completed: !completed });
      const { data } = await governanceAPI.getChecklist(selectedModel);
      setChecklist(data.data);
    } catch (e) { console.error(e); }
    finally { setUpdating(null); }
  };

  const grouped = checklist?.items?.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {}) || {};

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Compliance Checklist</h1>
        <p className="page-subtitle">Track governance requirements for each model</p>
      </div>

      <div className="card mb-6">
        <label className="label">Select Model</label>
        <select className="input max-w-md" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
          <option value="">Choose a model...</option>
          {models.map((m) => <option key={m._id} value={m._id}>{m.name} ({m.version})</option>)}
        </select>
      </div>

      {!selectedModel ? (
        <div className="text-center py-16">
          <CheckSquare className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
          <p className="text-text-muted">Select a model to view its compliance checklist</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : !checklist || checklist.items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-muted">No checklist items. Complete a risk assessment first to generate items.</p>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-text-primary font-semibold">Overall Progress</h2>
              <span className="text-2xl font-bold gradient-text">{checklist.progress}%</span>
            </div>
            <div className="w-full bg-card-hover rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary to-accent rounded-full h-3 transition-all duration-500"
                style={{ width: `${checklist.progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-text-muted">
              <span>{checklist.completed} of {checklist.total} items completed</span>
              <span>{checklist.total - checklist.completed} remaining</span>
            </div>
          </div>

          {/* Items by category */}
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="card">
                <h3 className="text-text-primary font-medium mb-4 flex items-center gap-2">
                  <span>{CATEGORY_ICONS[category] || '📋'}</span>
                  <span className="capitalize">{category}</span>
                  <span className="text-text-muted text-xs ml-auto">
                    {items.filter((i) => i.completed).length}/{items.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => toggleItem(item._id, item.completed)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        item.completed ? 'bg-accent/5 border border-accent/10' : 'hover:bg-card-hover border border-transparent'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                        updating === item._id ? 'border-2 border-primary animate-spin' :
                        item.completed ? 'bg-accent' : 'border-2 border-border'
                      }`}>
                        {item.completed && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${item.completed ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                          {item.item}
                        </p>
                        {item.completedAt && (
                          <p className="text-xs text-text-muted mt-0.5">
                            Completed {new Date(item.completedAt).toLocaleDateString()}
                            {item.completedBy && ` by ${item.completedBy.name}`}
                          </p>
                        )}
                      </div>
                      {item.required && !item.completed && (
                        <span className="badge-red text-xs">Required</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ChecklistPage;
