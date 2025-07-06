from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Optional
from models import OptimizationRequest, OptimizationResponse
from optimizer import run_ilp_optimization

app = FastAPI()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/schedule/optimize", response_model=OptimizationResponse)
def optimize_schedule(payload: OptimizationRequest):
    return run_ilp_optimization(payload)
