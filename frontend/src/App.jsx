import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// App pages
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import CreateProjectPage from './pages/CreateProjectPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import DatasetsPage from './pages/DatasetsPage';
import DatasetDetailPage from './pages/DatasetDetailPage';
import UploadDatasetPage from './pages/UploadDatasetPage';
import RunsPage from './pages/RunsPage';
import RunDetailPage from './pages/RunDetailPage';
import AutoMLWizardPage from './pages/AutoMLWizardPage';
import ModelRegistryPage from './pages/ModelRegistryPage';
import ModelLineagePage from './pages/ModelLineagePage';
import DeploymentPage from './pages/DeploymentPage';
import PredictionPlaygroundPage from './pages/PredictionPlaygroundPage';
import MonitoringPage from './pages/MonitoringPage';
import GovernancePage from './pages/GovernancePage';
import ChecklistPage from './pages/ChecklistPage';
import AuditLogPage from './pages/AuditLogPage';

const AppLayout = ({ children }) => (
  <ProtectedRoute>
    <div className="bg-ambient" />
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />

          <Route path="/projects" element={<AppLayout><ProjectsPage /></AppLayout>} />
          <Route path="/projects/new" element={<AppLayout><CreateProjectPage /></AppLayout>} />
          <Route path="/projects/:id" element={<AppLayout><ProjectDetailPage /></AppLayout>} />

          <Route path="/datasets" element={<AppLayout><DatasetsPage /></AppLayout>} />
          <Route path="/datasets/upload" element={<AppLayout><UploadDatasetPage /></AppLayout>} />
          <Route path="/datasets/:id" element={<AppLayout><DatasetDetailPage /></AppLayout>} />

          <Route path="/runs" element={<AppLayout><RunsPage /></AppLayout>} />
          <Route path="/runs/:id" element={<AppLayout><RunDetailPage /></AppLayout>} />
          <Route path="/automl" element={<AppLayout><AutoMLWizardPage /></AppLayout>} />

          <Route path="/models" element={<AppLayout><ModelRegistryPage /></AppLayout>} />
          <Route path="/models/:id/lineage" element={<AppLayout><ModelLineagePage /></AppLayout>} />
          <Route path="/lineage" element={<AppLayout><ModelRegistryPage /></AppLayout>} />

          <Route path="/deployments" element={<AppLayout><DeploymentPage /></AppLayout>} />
          <Route path="/deployments/:id/playground" element={<AppLayout><PredictionPlaygroundPage /></AppLayout>} />

          <Route path="/monitoring" element={<AppLayout><MonitoringPage /></AppLayout>} />
          <Route path="/governance" element={<AppLayout><GovernancePage /></AppLayout>} />
          <Route path="/checklist" element={<AppLayout><ChecklistPage /></AppLayout>} />
          <Route path="/audit" element={<AppLayout><AuditLogPage /></AppLayout>} />

          {/* Default */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
