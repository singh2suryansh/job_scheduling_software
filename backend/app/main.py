"""
FastAPI application entry point for Job Scheduling System using Greedy Algorithm.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import engine, Base, check_db_health
from app.routes import jobs, schedule, analytics

# Lifespan context manager for database initialization
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables if they do not exist
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Job Scheduling System - Greedy Algorithm API",
    description=(
        "An educational ADA (Analysis and Design of Algorithms) backend implementing "
        "the classic Job Sequencing with Deadlines algorithm using a Greedy strategy. "
        "Maximizes total profit given unit-time jobs with discrete deadlines."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS for React frontend (Vite default: http://localhost:5173)
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(jobs.router)
app.include_router(schedule.router)
app.include_router(analytics.router)


@app.get(
    "/",
    tags=["Root"],
    summary="Root entry point",
    description="Provides API status and interactive documentation links."
)
def root():
    return {
        "success": True,
        "message": "Welcome to the Job Scheduling System API (Greedy Algorithm)",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "health_check": "/health",
        "version": "1.0.0"
    }


@app.get(
    "/health",
    tags=["Health"],
    summary="Health check endpoint",
    description="Reports the service status and database connectivity."
)
def health_check():
    db_status = check_db_health()
    overall_status = "healthy" if db_status.get("status") == "connected" else "degraded"
    status_code = status.HTTP_200_OK if overall_status == "healthy" else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": overall_status,
            "database": db_status,
            "algorithm": {
                "name": "Job Sequencing with Deadlines",
                "strategy": "Greedy (Highest Profit First)",
                "time_complexity": "O(n log n + n * D)",
                "space_complexity": "O(D + n)"
            }
        }
    )

