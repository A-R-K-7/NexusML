import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import {
  FolderOpen, Database, FlaskConical, Package,
  Rocket, Activity, Shield, TrendingUp, Clock, CheckSquare
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="stat-card card-hover">
    <div className={`stat-icon ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-text-muted text-sm">{label}</p>
      <p className="text-2xl font-bold text-text-primary">{value ?? '—'}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  </div>
);

const ACTION_ICONS = {
  PROJECT_CREATED: '📁', DATASET_UPLOADED: '📊', TRAINING_STARTED: '🚀',
  TRAINING_COMPLETED: '✅', MODEL_REGISTERED: '📦', MODEL_DEPLOYED: '🌐',
  RISK_UPDATED: '🛡️', CHECKLIST_UPDATED: '☑️', USER_REGISTERED: '👤',
};

const RISK_COLORS = { Low: '#22C55E', Medium: '#F59E0B', High: '#EF4444', Critical: '#DC2626' };

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [monitoring, setMonitoring] = useState(null);
  const [governance, setGovernance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a, m, g] = await Promise.all([
          dashboardAPI.summary(),
          dashboardAPI.activity(),
          dashboardAPI.monitoring(),
          dashboardAPI.governance(),
        ]);
        setSummary(s.data.data);
        setActivity(a.data.data);
        setMonitoring(m.data.data);
        setGovernance(g.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  const riskData = governance?.riskDistribution?.map((r) => ({
    name: r._id || 'Unknown',
    value: r.count,
  })) || [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
          <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="page-subtitle">
          Here's what's happening across your AI platform today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard icon={FolderOpen} label="Projects" value={summary?.projects} color="bg-primary/10 text-primary" />
        <StatCard icon={Database} label="Datasets" value={summary?.datasets} color="bg-blue-500/10 text-blue-400" />
        <StatCard icon={FlaskConical} label="Experiments" value={summary?.runs} color="bg-purple-500/10 text-purple-400" sub={`${summary?.completedRuns} completed`} />
        <StatCard icon={Package} label="Models" value={summary?.models} color="bg-orange-500/10 text-orange-400" />
        <StatCard icon={Rocket} label="Deployments" value={summary?.deployments} color="bg-accent/10 text-accent" sub={`${summary?.runningDeployments} running`} />
        <StatCard icon={Activity} label="Req (24h)" value={monitoring?.totalRequests ?? 0} color="bg-pink-500/10 text-pink-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Monitoring snapshot */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Monitoring (24h)</h2>
            <button onClick={() => navigate('/monitoring')} className="text-primary text-sm hover:underline">
              View all →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Requests', value: monitoring?.totalRequests ?? 0, color: 'text-accent' },
              { label: 'Errors', value: monitoring?.totalErrors ?? 0, color: 'text-danger' },
              { label: 'Avg Latency', value: monitoring?.avgLatency ? `${Math.round(monitoring.avgLatency)}ms` : '—', color: 'text-warning' },
            ].map((m) => (
              <div key={m.label} className="bg-card-hover rounded-lg p-4">
                <p className="text-text-muted text-xs mb-1">{m.label}</p>
                <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Governance */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Governance</h2>
            <button onClick={() => navigate('/governance')} className="text-primary text-sm hover:underline">
              View →
            </button>
          </div>

          {riskData.length > 0 ? (
            <div className="flex items-center gap-4">
              <PieChart width={100} height={100}>
                <Pie data={riskData} cx={45} cy={45} innerRadius={25} outerRadius={45} dataKey="value">
                  {riskData.map((r) => (
                    <Cell key={r.name} fill={RISK_COLORS[r.name] || '#6B7280'} />
                  ))}
                </Pie>
              </PieChart>
              <div className="space-y-1.5">
                {riskData.map((r) => (
                  <div key={r.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: RISK_COLORS[r.name] || '#6B7280' }} />
                    <span className="text-text-secondary text-xs">{r.name}</span>
                    <span className="text-text-primary text-xs font-medium ml-auto">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-text-muted text-sm">No risk profiles yet</p>
          )}

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-text-muted text-xs">Checklist Progress</span>
              <span className="text-text-primary text-xs font-medium">{governance?.checklistProgress ?? 0}%</span>
            </div>
            <div className="w-full bg-card-hover rounded-full h-1.5">
              <div
                className="bg-accent rounded-full h-1.5 transition-all duration-500"
                style={{ width: `${governance?.checklistProgress ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Recent Activity</h2>
          <button onClick={() => navigate('/audit')} className="text-primary text-sm hover:underline">
            Full audit log →
          </button>
        </div>

        {activity.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">No activity yet. Start by creating a project.</p>
        ) : (
          <div className="space-y-3">
            {activity.slice(0, 8).map((log) => (
              <div key={log._id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-card-hover transition-colors">
                <span className="text-lg flex-shrink-0">{ACTION_ICONS[log.action] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm">
                    <span className="font-medium">{log.userId?.name || 'System'}</span>
                    {' — '}
                    <span className="text-text-secondary">{log.action.replace(/_/g, ' ')}</span>
                  </p>
                  {log.projectId && (
                    <p className="text-text-muted text-xs">Project: {log.projectId?.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-text-muted text-xs flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {new Date(log.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
