const statusConfig = {
  // Run statuses
  completed: { label: 'Completed', cls: 'badge-green' },
  running: { label: 'Running', cls: 'badge-blue' },
  pending: { label: 'Pending', cls: 'badge-yellow' },
  failed: { label: 'Failed', cls: 'badge-red' },
  // Deployment statuses
  Running: { label: 'Running', cls: 'badge-green' },
  Deploying: { label: 'Deploying', cls: 'badge-blue' },
  Pending: { label: 'Pending', cls: 'badge-yellow' },
  Failed: { label: 'Failed', cls: 'badge-red' },
  Stopped: { label: 'Stopped', cls: 'badge-gray' },
  // Model statuses
  production: { label: 'Production', cls: 'badge-green' },
  staging: { label: 'Staging', cls: 'badge-blue' },
  draft: { label: 'Draft', cls: 'badge-yellow' },
  archived: { label: 'Archived', cls: 'badge-gray' },
  // Risk levels
  Low: { label: 'Low Risk', cls: 'badge-green' },
  Medium: { label: 'Medium Risk', cls: 'badge-yellow' },
  High: { label: 'High Risk', cls: 'badge-red' },
  Critical: { label: 'Critical', cls: 'badge-red' },
  // Dataset
  ready: { label: 'Ready', cls: 'badge-green' },
  processing: { label: 'Processing', cls: 'badge-blue' },
  uploading: { label: 'Uploading', cls: 'badge-yellow' },
  error: { label: 'Error', cls: 'badge-red' },
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || { label: status, cls: 'badge-gray' };
  return <span className={config.cls}>{config.label}</span>;
};

export default StatusBadge;
