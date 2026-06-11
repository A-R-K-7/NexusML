import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nexusml_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nexusml_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardAPI = {
  summary: () => api.get('/dashboard/summary'),
  activity: () => api.get('/dashboard/activity'),
  monitoring: () => api.get('/dashboard/monitoring'),
  governance: () => api.get('/dashboard/governance'),
};

// ─── Projects ────────────────────────────────────────────────────────────────
export const projectsAPI = {
  create: (data) => api.post('/projects', data),
  list: (params) => api.get('/projects', { params }),
  get: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// ─── Datasets ────────────────────────────────────────────────────────────────
export const datasetsAPI = {
  upload: (formData, onProgress) =>
    api.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    }),
  list: (params) => api.get('/datasets', { params }),
  get: (id) => api.get(`/datasets/${id}`),
};

// ─── Runs ────────────────────────────────────────────────────────────────────
export const runsAPI = {
  create: (data) => api.post('/runs', data),
  list: (params) => api.get('/runs', { params }),
  get: (id) => api.get(`/runs/${id}`),
  status: (id) => api.get(`/runs/${id}/status`),
};

// ─── Models ──────────────────────────────────────────────────────────────────
export const modelsAPI = {
  register: (data) => api.post('/models/register', data),
  list: (params) => api.get('/models', { params }),
  get: (id) => api.get(`/models/${id}`),
  update: (id, data) => api.put(`/models/${id}`, data),
  lineage: (id) => api.get(`/models/${id}/lineage`),
};

// ─── Deployments ─────────────────────────────────────────────────────────────
export const deploymentsAPI = {
  deploy: (data) => api.post('/deployments', data),
  list: (params) => api.get('/deployments', { params }),
  get: (id) => api.get(`/deployments/${id}`),
  stop: (id) => api.put(`/deployments/${id}/stop`),
  predict: (id, features) => api.post(`/deployments/${id}/predict`, { features }),
};

// ─── Monitoring ──────────────────────────────────────────────────────────────
export const monitoringAPI = {
  overview: () => api.get('/monitoring/overview'),
  summary: (deploymentId, period) => api.get(`/monitoring/${deploymentId}`, { params: { period } }),
  timeseries: (deploymentId, period, granularity) =>
    api.get(`/monitoring/${deploymentId}/timeseries`, { params: { period, granularity } }),
};

// ─── Governance ──────────────────────────────────────────────────────────────
export const governanceAPI = {
  createRisk: (data) => api.post('/governance/risk', data),
  getRisk: (modelId) => api.get(`/governance/risk/${modelId}`),
  getChecklist: (modelId) => api.get(`/governance/checklist/${modelId}`),
  updateChecklist: (itemId, data) => api.put(`/governance/checklist/${itemId}`, data),
};

// ─── Audit ───────────────────────────────────────────────────────────────────
export const auditAPI = {
  list: (params) => api.get('/audit', { params }),
};

export default api;
