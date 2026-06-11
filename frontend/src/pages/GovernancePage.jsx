import { useState, useEffect } from 'react';
import { modelsAPI, governanceAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';

const RISK_LEVELS = {
  Low: { color: 'text-accent border-accent/30 bg-accent/5', icon: '🟢' },
  Medium: { color: 'text-warning border-warning/30 bg-warning/5', icon: '🟡' },
  High: { color: 'text-danger border-danger/30 bg-danger/5', icon: '🔴' },
  Critical: { color: 'text-danger border-danger/30 bg-danger/10', icon: '⛔' },
};

const GovernancePage = () => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    domain: '', impact: '', geography: '', dataTypes: [],
    answers: { q1: '', q2: '', q3: '' },
  });

  useEffect(() => {
    modelsAPI.list().then(({ data }) => setModels(data.data));
  }, []);

  useEffect(() => {
    if (!selectedModel) { setProfile(null); return; }
    setLoading(true);
    governanceAPI.getRisk(selectedModel)
      .then(({ data }) => {
        setProfile(data.data);
        setForm({
          domain: data.data.domain,
          impact: data.data.impact,
          geography: data.data.geography,
          dataTypes: data.data.dataTypes || [],
          answers: data.data.answers || { q1: '', q2: '', q3: '' },
        });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [selectedModel]);

  const toggleDataType = (t) => {
    setForm((f) => ({
      ...f,
      dataTypes: f.dataTypes.includes(t) ? f.dataTypes.filter((x) => x !== t) : [...f.dataTypes, t],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await governanceAPI.createRisk({ ...form, modelId: selectedModel });
      setProfile(data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert('Save failed: ' + (e.response?.data?.error || e.message)); }
    finally { setSaving(false); }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Governance & Risk Assessment</h1>
        <p className="page-subtitle">Assess AI risk levels and manage compliance requirements</p>
      </div>

      {/* Model selector */}
      <div className="card mb-6">
        <label className="label">Select Model to Assess</label>
        <select className="input max-w-md" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
          <option value="">Choose a model...</option>
          {models.map((m) => <option key={m._id} value={m._id}>{m.name} ({m.version})</option>)}
        </select>
      </div>

      {!selectedModel ? (
        <div className="text-center py-16">
          <Shield className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
          <p className="text-text-muted">Select a model to start the risk assessment</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questionnaire */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card">
              <h2 className="section-title">Risk Questionnaire</h2>

              <div className="space-y-5">
                <div>
                  <label className="label">Q1: What industry/domain is this model used in?</label>
                  <select className="input" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}>
                    <option value="">Select domain...</option>
                    {['healthcare', 'finance', 'hr', 'legal', 'marketing', 'operations', 'education', 'other'].map((d) => (
                      <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Q2: What is the scope of impact of incorrect predictions?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { v: 'individual', label: 'Individual', desc: 'Affects 1 person' },
                      { v: 'small_group', label: 'Small Group', desc: 'Affects < 100 people' },
                      { v: 'large_group', label: 'Large Group', desc: 'Affects 100+ people' },
                      { v: 'societal', label: 'Societal', desc: 'Affects society broadly' },
                    ].map((o) => (
                      <button key={o.v} type="button" onClick={() => setForm({ ...form, impact: o.v })}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${form.impact === o.v ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'}`}>
                        <div className="font-medium text-text-primary text-sm">{o.label}</div>
                        <div className="text-text-muted text-xs">{o.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Q3: Where will the model be deployed?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { v: 'eu', label: 'European Union', desc: 'EU AI Act applies' },
                      { v: 'us', label: 'United States', desc: 'US regulations' },
                      { v: 'global', label: 'Global', desc: 'Multiple jurisdictions' },
                      { v: 'other', label: 'Other', desc: 'Specify below' },
                    ].map((o) => (
                      <button key={o.v} type="button" onClick={() => setForm({ ...form, geography: o.v })}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${form.geography === o.v ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'}`}>
                        <div className="font-medium text-text-primary text-sm">{o.label}</div>
                        <div className="text-text-muted text-xs">{o.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">What types of sensitive data does this model use?</label>
                  <div className="flex flex-wrap gap-2">
                    {['demographic', 'biometric', 'financial', 'health', 'behavioral', 'location'].map((t) => (
                      <button key={t} type="button" onClick={() => toggleDataType(t)}
                        className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-all capitalize ${
                          form.dataTypes.includes(t) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-muted hover:border-primary/30'
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleSave} className="btn-primary" disabled={saving || !form.domain || !form.impact || !form.geography}>
                  {saving ? 'Saving...' : saved ? '✓ Saved!' : <><Shield className="w-4 h-4" /> Save Assessment</>}
                </button>
              </div>
            </div>
          </div>

          {/* Risk result */}
          <div className="space-y-4">
            {profile && (
              <div className={`card border-2 ${RISK_LEVELS[profile.riskLevel]?.color || 'border-border'}`}>
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">{RISK_LEVELS[profile.riskLevel]?.icon || '⚪'}</div>
                  <p className="text-text-muted text-sm">Risk Level</p>
                  <p className="text-3xl font-bold text-text-primary mt-1">{profile.riskLevel}</p>
                </div>
                <div className="divider" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Domain</span>
                    <span className="text-text-primary capitalize">{profile.domain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Impact</span>
                    <span className="text-text-primary capitalize">{profile.impact?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Geography</span>
                    <span className="text-text-primary uppercase">{profile.geography}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <h3 className="text-text-primary font-medium text-sm mb-3">Risk Level Guide</h3>
              <div className="space-y-2">
                {[
                  { level: 'Low', desc: 'Minimal governance required', color: 'text-accent' },
                  { level: 'Medium', desc: 'Standard compliance checks', color: 'text-warning' },
                  { level: 'High', desc: 'Full EU AI Act compliance', color: 'text-danger' },
                  { level: 'Critical', desc: 'Legal review required', color: 'text-danger' },
                ].map((r) => (
                  <div key={r.level} className="flex gap-2 text-xs">
                    <span className={`font-medium ${r.color} w-16`}>{r.level}</span>
                    <span className="text-text-muted">{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GovernancePage;
