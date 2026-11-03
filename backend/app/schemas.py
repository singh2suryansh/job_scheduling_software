"""
Pydantic schemas for request validation and response serialization.
"""

from datetime import datetime
from typing import Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, Field, field_validator

T = TypeVar("T")


# ==============================================================================
# Generic API Envelope
# ==============================================================================

class APIResponse(BaseModel, Generic[T]):
    """Standard unified response wrapper for all API endpoints."""
    success: bool = True
    message: str
    data: Optional[T] = None


# ==============================================================================
# Job Schemas
# ==============================================================================

class JobBase(BaseModel):
    """Base job attributes with validation."""
    job_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Unique name or code for the job (e.g. 'J1', 'Compile Code')"
    )
    deadline: int = Field(
        ...,
        gt=0,
        description="Deadline in discrete time slots (must be positive integer >= 1)"
    )
    profit: float = Field(
        ...,
        gt=0,
        description="Profit earned if completed by deadline (must be positive > 0)"
    )

    @field_validator("job_name")
    @classmethod
    def validate_job_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("job_name cannot be empty or only whitespace.")
        return trimmed


class JobCreate(JobBase):
    """Schema for creating a new job."""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "job_name": "J1",
                "deadline": 2,
                "profit": 100.0
            }
        }
    )


class JobUpdate(BaseModel):
    """Schema for updating an existing job."""
    job_name: Optional[str] = Field(None, min_length=1, max_length=100)
    deadline: Optional[int] = Field(None, gt=0)
    profit: Optional[float] = Field(None, gt=0)

    @field_validator("job_name")
    @classmethod
    def validate_job_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("job_name cannot be empty or only whitespace.")
            return trimmed
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "job_name": "J1_Updated",
                "deadline": 3,
                "profit": 120.0
            }
        }
    )


class JobResponse(JobBase):
    """Schema for job responses from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Scheduling Schemas
# ==============================================================================

class ScheduledJobItem(BaseModel):
    """Single scheduled job item details."""
    job_id: Optional[int] = None
    job_name: str
    deadline: int
    profit: float
    assigned_slot: int


class SchedulingResultDetail(BaseModel):
    """Detailed item in scheduling run results."""
    id: int
    job_id: Optional[int]
    job_name: str
    deadline: int
    profit: float
    assigned_slot: Optional[int]
    status: str

    model_config = ConfigDict(from_attributes=True)


class SchedulingData(BaseModel):
    """Data payload for POST /schedule/run."""
    run_id: int
    total_profit: float
    scheduled_jobs: List[ScheduledJobItem]
    rejected_jobs: List[str]
    time_slots: Dict[int, Optional[str]]
    total_jobs_considered: int
    scheduled_count: int
    rejected_count: int
    max_deadline: int
    created_at: datetime


class SchedulingRunSummary(BaseModel):
    """Summary of a historical scheduling run."""
    id: int
    run_at: datetime
    total_profit: float
    total_jobs: int
    scheduled_count: int
    rejected_count: int
    max_deadline: int

    model_config = ConfigDict(from_attributes=True)


class SchedulingRunDetail(SchedulingRunSummary):
    """Full detail of a scheduling run including all result items."""
    results: List[SchedulingResultDetail]


# ==============================================================================
# Analytics Schemas
# ==============================================================================

class LatestRunAnalytics(BaseModel):
    """Summary of the most recent scheduling run."""
    run_id: int
    run_at: datetime
    total_profit: float
    total_jobs: int
    scheduled_count: int
    rejected_count: int
    scheduled_jobs: List[str]
    rejected_jobs: List[str]


class CumulativeStats(BaseModel):
    """Cumulative historical performance metrics."""
    total_runs: int
    total_profit_accumulated: float
    average_profit_per_run: float
    max_profit_achieved: float
    total_jobs_scheduled: int
    total_jobs_rejected: int


class AnalyticsData(BaseModel):
    """Payload for GET /analytics."""
    total_jobs: int
    total_runs: int
    latest_run: Optional[LatestRunAnalytics] = None
    cumulative_stats: CumulativeStats

