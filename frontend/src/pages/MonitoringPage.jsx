import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { monitoringAPI, deploymentsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Activity, TrendingDown, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

const CHART_COLORS = {
  requests: '#4F46E5',
  errors: '#EF4444',
  latency: '#22C55E',
};

const TooltipStyle = {
  contentStyle: { background: '#111827', border: '1px solid #1F2937', borderRadius: '8px', color: '#F9FAFB' },
  labelStyle: { color: '#9CA3AF' },
};

const MonitoringPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [deployments, setDeployments] = useState([]);
  const [selectedDep, setSelectedDep] = useState(searchParams.get('deploymentId') || '');
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    deploymentsAPI.list().then(({ data }) => {
      setDeployments(data.data.filter((d) => d.status === 'Running' || d.status === 'Stopped'));
      if (!selectedDep && data.data.length > 0) {
        setSelectedDep(data.data[0]._id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedDep) return;
    const load = async () => {
      setLoading(true);
      try {
        const [s, t] = await Promise.all([
          monitoringAPI.summary(selectedDep, period),
          monitoringAPI.timeseries(selectedDep, period, 'hour'),
        ]);
        setSummary(s.data.data);
        setTimeseries(t.data.data.map((d) => ({
          time: d._id,
          requests: d.requests,
          errors: d.errors,
          latency: Math.round(d.avgLatency),
        })));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [selectedDep, period]);

  const fmt = (n) => (n != null ? Math.round(n) : '—');

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Monitoring</h1>
          <p className="page-subtitle">Track prediction endpoint performance and reliability</p>
        </div>
        <button onClick={() => setSelectedDep(selectedDep)} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="label text-xs">Deployment</label>
          <select className="input w-64" value={selectedDep} onChange={(e) => setSelectedDep(e.target.value)}>
            <option value="">Select deployment...</option>
            {deployments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label text-xs">Period</label>
          <div className="flex gap-2">
            {['1h', '24h', '7d', '30d'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p ? 'bg-primary text-white' : 'bg-card-hover text-text-secondary border border-border hover:text-text-primary'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!selectedDep ? (
        <div className="text-center py-20">
          <Activity className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
          <p className="text-text-muted">Select a deployment to view monitoring data</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Requests', value: summary?.totalRequests?.toLocaleString() || '0', icon: Activity, color: 'bg-primary/10 text-primary' },
              { label: 'Total Errors', value: summary?.totalErrors?.toLocaleString() || '0', icon: AlertTriangle, color: 'bg-danger/10 text-danger' },
              { label: 'Error Rate', value: `${summary?.errorRate || 0}%`, icon: TrendingDown, color: 'bg-warning/10 text-warning' },
              { label: 'Avg Latency', value: `${fmt(summary?.avgLatency)}ms`, icon: Clock, color: 'bg-accent/10 text-accent' },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div className={`stat-icon ${s.color}`}><s.icon className="w-5 h-5" /></div>
                <div>
                  <p className="text-text-muted text-sm">{s.label}</p>
                  <p className="text-xl font-bold text-text-primary">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Requests chart */}
          <div className="card mb-6">
            <h2 className="section-title">Requests Over Time</h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={timeseries}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="time" stroke="#6B7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} />
                <Tooltip {...TooltipStyle} />
                <Area type="monotone" dataKey="requests" stroke="#4F46E5" fill="url(#reqGrad)" strokeWidth={2} name="Requests" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Errors chart */}
            <div className="card">
              <h2 className="section-title">Errors Over Time</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={timeseries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="time" stroke="#6B7280" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#6B7280" tick={{ fontSize: 10 }} />
                  <Tooltip {...TooltipStyle} />
                  <Bar dataKey="errors" fill="#EF4444" name="Errors" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Latency chart */}
            <div className="card">
              <h2 className="section-title">Average Latency (ms)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeseries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="time" stroke="#6B7280" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#6B7280" tick={{ fontSize: 10 }} />
                  <Tooltip {...TooltipStyle} />
                  <Line type="monotone" dataKey="latency" stroke="#22C55E" strokeWidth={2} dot={false} name="Avg Latency (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonitoringPage;
