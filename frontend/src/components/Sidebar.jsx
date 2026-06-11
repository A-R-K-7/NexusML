import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FolderOpen, Database, FlaskConical,
  Zap, Package, Network, Rocket, Activity, Shield,
  CheckSquare, ScrollText, LogOut, Cpu, ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/datasets', icon: Database, label: 'Datasets' },
  { to: '/runs', icon: FlaskConical, label: 'Experiments' },
  { to: '/automl', icon: Zap, label: 'AutoML' },
  { to: '/models', icon: Package, label: 'Model Registry' },
  { to: '/deployments', icon: Rocket, label: 'Deployments' },
  { to: '/monitoring', icon: Activity, label: 'Monitoring' },
  { to: '/governance', icon: Shield, label: 'Governance' },
  { to: '/checklist', icon: CheckSquare, label: 'Checklist' },
  { to: '/audit', icon: ScrollText, label: 'Audit Log' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <img src="/nexusml.png" alt="NexusML Logo" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-text-primary font-bold text-lg leading-none">NexusML</h1>
            <p className="text-text-muted text-xs">AI Governance Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-card-hover transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary text-xs font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-sm font-medium truncate">{user?.name}</p>
            <p className="text-text-muted text-xs truncate">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-text-muted hover:text-danger transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
