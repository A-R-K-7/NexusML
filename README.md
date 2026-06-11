# NexusML — AI Governance & MLOps Platform

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20-green?logo=node.js" />
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" />
  <img src="https://img.shields.io/badge/FastAPI-0.111-teal?logo=fastapi" />
  <img src="https://img.shields.io/badge/MongoDB-7.0-green?logo=mongodb" />
  <img src="https://img.shields.io/badge/MinIO-Storage-red?logo=minio" />
  <img src="https://img.shields.io/badge/Docker-Compose-blue?logo=docker" />
</p>

**NexusML** is a unified MLOps and AI Governance platform enabling teams to train, deploy, monitor, and govern machine learning models in a single platform.

---

## 🚀 Quick Start

### Prerequisites

- Docker Desktop (installed)
- Node.js 18+
- Python 3.11+
- MongoDB (installed via winget)

### Option 1: Docker Compose (Full Stack)

```bash
# Start all services
docker-compose up -d

# Seed the database with demo data
docker exec nexusml-backend node src/scripts/seed.js
```

Access the app at: **http://localhost:3000**

### Option 2: Manual Setup (Development)

#### 1. Start MongoDB (Windows)
```powershell
# MongoDB should already be running as a Windows service
# If not, start it:
net start MongoDB
```

#### 2. Start MinIO
```bash
# Using Docker just for MinIO:
docker run -d --name nexusml-minio \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=nexusml_minio \
  -e MINIO_ROOT_PASSWORD=nexusml_minio_secret \
  minio/minio server /data --console-address ":9001"
```

#### 3. Backend
```bash
cd backend
npm install
# Edit .env if needed (MongoDB URI)
npm run dev
```

#### 4. Seed Database
```bash
cd backend
npm run seed
```

#### 5. ML Service (Optional)
```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### 6. Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: **http://localhost:5173** | Backend: **http://localhost:5000** | MinIO Console: **http://localhost:9001**

---

## 👤 Demo Accounts

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Owner | alex@nexusml.ai | password123 |
| Contributor | maria@nexusml.ai | password123 |
| Viewer | james@nexusml.ai | password123 |

---

## 🏗️ Architecture

```
nexusml/
├── frontend/        # React + Vite + Tailwind CSS
├── backend/         # Node.js + Express + Mongoose
├── ml-service/      # Python + FastAPI + AutoGluon
└── docker-compose.yml
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React SPA |
| Backend API | 5000 | Express REST API |
| ML Service | 8000 | FastAPI AutoML |
| MongoDB | 27017 | Database |
| MinIO | 9000 | Object storage |
| MinIO Console | 9001 | MinIO web UI |

---

## 🔌 API Overview

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login (returns JWT)
- `GET /api/auth/me` — Current user

### Projects
- `GET/POST /api/projects`
- `GET/PUT/DELETE /api/projects/:id`

### Datasets
- `POST /api/datasets/upload` — Upload CSV
- `GET /api/datasets`
- `GET /api/datasets/:id`

### Experiments
- `POST /api/runs` — Start training
- `GET /api/runs`
- `GET /api/runs/:id`
- `GET /api/runs/:id/status`

### Models
- `POST /api/models/register`
- `GET /api/models`
- `GET /api/models/:id`
- `GET /api/models/:id/lineage`

### Deployments
- `POST /api/deployments`
- `GET /api/deployments`
- `PUT /api/deployments/:id/stop`
- `POST /api/deployments/:id/predict`

### Monitoring
- `GET /api/monitoring/:deploymentId`
- `GET /api/monitoring/:deploymentId/timeseries`

### Governance
- `POST /api/governance/risk`
- `GET /api/governance/checklist/:modelId`

### Audit
- `GET /api/audit`

### Dashboard
- `GET /api/dashboard/summary`
- `GET /api/dashboard/activity`

---

## 🎨 UI Features

- **Dark theme** with #0B1020 background
- **12 pages** across the full ML lifecycle
- **Recharts** for monitoring visualizations
- **Drag-and-drop** dataset upload
- **4-step AutoML wizard**
- **Model lineage DAG** visualization
- **Risk assessment** questionnaire
- **Compliance checklist** with progress tracking
- **Audit timeline** with event filtering

---

## 🛡️ User Roles

| Permission | Owner | Contributor | Viewer |
|-----------|-------|-------------|--------|
| Create projects | ✅ | ✅ | ❌ |
| Upload datasets | ✅ | ✅ | ❌ |
| Run training | ✅ | ✅ | ❌ |
| Register models | ✅ | ✅ | ❌ |
| Deploy models | ✅ | ✅ | ❌ |
| Delete projects | ✅ | ❌ | ❌ |
| View all | ✅ | ✅ | ✅ |

---

## 📊 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3, React Router v6, Recharts, Axios |
| Backend | Node.js 20, Express, Mongoose, JWT, bcryptjs, Multer |
| ML Service | Python 3.11, FastAPI, AutoGluon, Pandas |
| Database | MongoDB 7.0 |
| Storage | MinIO |
| Deployment | Docker, Docker Compose |

---

*Built for the NexusML MVP pitch — June 2026*
