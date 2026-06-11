import os
import uuid
import time
import threading
from typing import Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

# ─── App Setup ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="NexusML ML Service",
    description="AutoML training and prediction service powered by AutoGluon",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Directories ─────────────────────────────────────────────────────────────
# Datasets are uploaded by the backend to this shared mount
UPLOADS_DIR = os.getenv("UPLOADS_DIR", "/app/uploads")
MODELS_DIR = os.getenv("MODELS_DIR", "/app/models")
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# ─── In-memory job store ─────────────────────────────────────────────────────
jobs: dict = {}

# ─── Schemas ─────────────────────────────────────────────────────────────────
class TrainRequest(BaseModel):
    run_id: str
    dataset_filename: str          # filename saved in UPLOADS_DIR
    target_column: str
    task_type: str = "classification"
    preset: str = "balanced"       # fast | balanced | best
    time_limit: int = 120

class PredictRequest(BaseModel):
    artifact_path: str
    features: dict

# ─── Preset mapping ──────────────────────────────────────────────────────────
PRESET_MAP = {
    "fast": "fast_training",
    "balanced": "medium_quality",
    "best": "best_quality",
}

# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "NexusML ML Service",
        "timestamp": datetime.utcnow().isoformat(),
        "uploads_dir": UPLOADS_DIR,
        "models_dir": MODELS_DIR,
    }

# ─── Training ─────────────────────────────────────────────────────────────────
def run_training(job_id: str, run_id: str, dataset_filename: str,
                 target_column: str, task_type: str, preset: str, time_limit: int):
    """Blocking training function executed in a background thread."""
    jobs[job_id]["status"] = "running"
    jobs[job_id]["started_at"] = datetime.utcnow().isoformat()

    try:
        # 1. Load dataset from shared uploads volume
        dataset_path = os.path.join(UPLOADS_DIR, dataset_filename)
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(
                f"Dataset file not found: {dataset_path}. "
                f"Files available: {os.listdir(UPLOADS_DIR)}"
            )

        print(f"📂 Loading dataset: {dataset_path}")
        df = pd.read_csv(dataset_path)
        print(f"✅ Dataset loaded: {df.shape[0]} rows × {df.shape[1]} columns")

        if target_column not in df.columns:
            raise ValueError(
                f"Target column '{target_column}' not found. "
                f"Available: {list(df.columns)}"
            )

        # Drop rows where target is null
        df = df.dropna(subset=[target_column])

        # 2. AutoGluon training
        from autogluon.tabular import TabularPredictor

        mapped_preset = PRESET_MAP.get(preset, "medium_quality")
        model_path = os.path.join(MODELS_DIR, run_id)

        print(f"🚀 Starting AutoGluon training | preset={mapped_preset} | time_limit={time_limit}s")
        t_start = time.time()

        predictor = TabularPredictor(
            label=target_column,
            path=model_path,
            verbosity=1,
        ).fit(
            train_data=df,
            presets=mapped_preset,
            time_limit=time_limit,
            # Disable hyperparameter tuning for speed in MVP
            hyperparameters={
                "GBM": {},
                "RF": {},
                "XT": {},
                "KNN": {},
            },
        )

        training_time = round(time.time() - t_start, 2)
        print(f"✅ Training complete in {training_time}s")

        # 3. Evaluate on training data to get metrics
        eval_result = predictor.evaluate(df, silent=True)
        leaderboard = predictor.leaderboard(silent=True)

        metrics = {"trainingTime": training_time}

        if task_type == "regression":
            metrics.update({
                "rmse": round(abs(float(eval_result.get("root_mean_squared_error", 0))), 4),
                "mae": round(abs(float(eval_result.get("mean_absolute_error", 0))), 4),
                "r2": round(float(eval_result.get("r2", 0)), 4),
            })
        else:
            metrics.update({
                "accuracy": round(float(eval_result.get("accuracy", 0)), 4),
                "f1": round(float(eval_result.get("f1", 0)), 4),
                "precision": round(float(eval_result.get("precision", eval_result.get("f1", 0))), 4),
                "recall": round(float(eval_result.get("recall", eval_result.get("f1", 0))), 4),
            })

        jobs[job_id].update({
            "status": "completed",
            "metrics": metrics,
            "artifact_path": model_path,
            "finished_at": datetime.utcnow().isoformat(),
        })
        print(f"📊 Metrics: {metrics}")

    except Exception as e:
        print(f"❌ Training job {job_id} failed: {e}")
        jobs[job_id].update({
            "status": "failed",
            "error": str(e),
            "finished_at": datetime.utcnow().isoformat(),
        })


@app.post("/train")
async def train(req: TrainRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())

    jobs[job_id] = {
        "job_id": job_id,
        "run_id": req.run_id,
        "status": "pending",
        "metrics": None,
        "artifact_path": None,
        "error": None,
        "created_at": datetime.utcnow().isoformat(),
        "started_at": None,
        "finished_at": None,
    }

    background_tasks.add_task(
        run_training,
        job_id, req.run_id, req.dataset_filename,
        req.target_column, req.task_type, req.preset, req.time_limit
    )

    return {"job_id": job_id, "status": "pending", "message": "Training job submitted"}


@app.get("/jobs/{job_id}")
async def get_job(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return job


# ─── Prediction ──────────────────────────────────────────────────────────────
@app.post("/predict")
async def predict(req: PredictRequest):
    if not os.path.exists(req.artifact_path):
        raise HTTPException(
            status_code=404,
            detail=f"Model artifact not found: {req.artifact_path}"
        )

    try:
        from autogluon.tabular import TabularPredictor
        predictor = TabularPredictor.load(req.artifact_path)

        input_df = pd.DataFrame([req.features])
        prediction = predictor.predict(input_df)

        result = prediction.iloc[0]
        if hasattr(result, "item"):
            result = result.item()

        # Get prediction probabilities if classification
        proba = None
        try:
            proba_df = predictor.predict_proba(input_df)
            proba = proba_df.iloc[0].to_dict()
            proba = {str(k): round(float(v), 4) for k, v in proba.items()}
        except Exception:
            pass

        return {
            "prediction": result,
            "probabilities": proba,
            "artifact_path": req.artifact_path,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
