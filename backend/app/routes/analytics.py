"""
Analytics route providing real-time metrics and comparative statistics.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Job, SchedulingRun, SchedulingResult
from app.schemas import (
    APIResponse,
    AnalyticsData,
    LatestRunAnalytics,
    CumulativeStats,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "",
    response_model=APIResponse[AnalyticsData],
    summary="Get scheduling system analytics",
    description="Provides real-time system metrics, distinguishing latest run performance from cumulative historical statistics."
)
def get_analytics(db: Session = Depends(get_db)):
    # 1. Total jobs currently in the system
    total_jobs = db.query(func.count(Job.id)).scalar() or 0

    # 2. Total number of scheduling runs executed
    total_runs = db.query(func.count(SchedulingRun.id)).scalar() or 0

    # 3. Latest run statistics
    latest_run_obj = db.query(SchedulingRun).order_by(SchedulingRun.id.desc()).first()
    latest_run_data = None

    if latest_run_obj:
        scheduled_names = [
            r.job_name for r in latest_run_obj.results if r.status == "SCHEDULED"
        ]
        rejected_names = [
            r.job_name for r in latest_run_obj.results if r.status == "REJECTED"
        ]

        latest_run_data = LatestRunAnalytics(
            run_id=latest_run_obj.id,
            run_at=latest_run_obj.run_at,
            total_profit=latest_run_obj.total_profit,
            total_jobs=latest_run_obj.total_jobs,
            scheduled_count=latest_run_obj.scheduled_count,
            rejected_count=latest_run_obj.rejected_count,
            scheduled_jobs=scheduled_names,
            rejected_jobs=rejected_names
        )

    # 4. Cumulative historical statistics
    if total_runs > 0:
        agg = db.query(
            func.sum(SchedulingRun.total_profit).label("total_profit_accumulated"),
            func.avg(SchedulingRun.total_profit).label("avg_profit"),
            func.max(SchedulingRun.total_profit).label("max_profit"),
            func.sum(SchedulingRun.scheduled_count).label("total_scheduled"),
            func.sum(SchedulingRun.rejected_count).label("total_rejected")
        ).first()

        cumulative_stats = CumulativeStats(
            total_runs=total_runs,
            total_profit_accumulated=float(agg.total_profit_accumulated or 0.0),
            average_profit_per_run=round(float(agg.avg_profit or 0.0), 2),
            max_profit_achieved=float(agg.max_profit or 0.0),
            total_jobs_scheduled=int(agg.total_scheduled or 0),
            total_jobs_rejected=int(agg.total_rejected or 0)
        )
    else:
        cumulative_stats = CumulativeStats(
            total_runs=0,
            total_profit_accumulated=0.0,
            average_profit_per_run=0.0,
            max_profit_achieved=0.0,
            total_jobs_scheduled=0,
            total_jobs_rejected=0
        )

    analytics_payload = AnalyticsData(
        total_jobs=total_jobs,
        total_runs=total_runs,
        latest_run=latest_run_data,
        cumulative_stats=cumulative_stats
    )

    return APIResponse(
        success=True,
        message="Analytics retrieved successfully",
        data=analytics_payload
    )

