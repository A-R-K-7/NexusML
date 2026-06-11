import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deploymentsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Send, AlertCircle, CheckCircle } from 'lucide-react';

const PredictionPlaygroundPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState(null);
  const [features, setFeatures] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    deploymentsAPI.get(id)
      .then(({ data }) => {
        setDeployment(data.data);
        // Initialize feature inputs from model metadata
        const cols = data.data.modelId?.datasetId?.columnNames || [];
        const target = data.data.modelId?.targetColumn;
        const init = {};
        cols.filter((c) => c !== target).forEach((c) => { init[c] = ''; });
        setFeatures(init);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handlePredict = async () => {
    setPredicting(true);
    setError('');
    setResult(null);
    try {
      const { data } = await deploymentsAPI.predict(id, features);
      setResult(data.prediction);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const featureKeys = Object.keys(features);

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="page-header">
        <button onClick={() => navigate('/deployments')} className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Deployments
        </button>
        <h1 className="page-title">Prediction Playground</h1>
        <p className="page-subtitle">Test your model: <span className="text-primary">{deployment?.name}</span></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form */}
        <div className="card">
          <h2 className="section-title">Input Features</h2>
          <form onSubmit={(e) => { e.preventDefault(); handlePredict(); }}>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {featureKeys.length === 0 ? (
                <p className="text-text-muted text-sm">No feature columns available</p>
              ) : (
                featureKeys.map((key) => (
                  <div key={key}>
                    <label className="label text-xs">{key}</label>
                    <input
                      className="input text-sm"
                      placeholder={`Enter ${key}...`}
                      value={features[key]}
                      onChange={(e) => setFeatures({ ...features, [key]: e.target.value })}
                      required
                    />
                  </div>
                ))
              )}
            </div>
            <button
              type="submit"
              className="btn-primary w-full justify-center mt-4"
              disabled={predicting || deployment?.status !== 'Running'}
            >
              {predicting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Predicting...
                </span>
              ) : <><Send className="w-4 h-4" /> Run Prediction</>}
            </button>
            {deployment?.status !== 'Running' && (
              <p className="text-warning text-xs mt-2 text-center">Deployment must be Running to predict</p>
            )}
          </form>
        </div>

        {/* Result */}
        <div className="card">
          <h2 className="section-title">Prediction Result</h2>
          {error && (
            <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-danger" />
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}
          {result !== null ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-accent mx-auto mb-3" />
              <p className="text-text-muted text-sm mb-2">Prediction</p>
              <p className="text-4xl font-bold gradient-text">{String(result)}</p>
              <p className="text-text-muted text-xs mt-3">
                Target: <span className="text-primary">{deployment?.modelId?.targetColumn}</span>
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-muted">
              <div className="text-center">
                <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Fill in features and click "Run Prediction"</p>
              </div>
            </div>
          )}

          {/* Deployment info */}
          <div className="mt-4 space-y-2 text-xs text-text-muted border-t border-border pt-4">
            <p>Model: <span className="text-text-secondary">{deployment?.modelId?.name} {deployment?.modelId?.version}</span></p>
            <p>Task: <span className="text-text-secondary capitalize">{deployment?.modelId?.taskType}</span></p>
            <p>Endpoint: <code className="text-accent">{deployment?.endpointUrl || '—'}</code></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionPlaygroundPage;
