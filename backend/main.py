from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import OptimizationRequest, OptimizationResponse
from optimizer import run_ilp_optimization

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",  # Angular via Docker or dev
    "http://127.0.0.1:3000"   # Some browsers use this
],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/schedule/optimize", response_model=OptimizationResponse)
def optimize_schedule(payload: OptimizationRequest):
    return run_ilp_optimization(payload)
