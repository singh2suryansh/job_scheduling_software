"""
Routes for triggering the Greedy Job Scheduling Algorithm and viewing history.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Job, SchedulingRun, SchedulingResult
from app.algorithms.greedy_scheduler import schedule_jobs_greedy
from app.schemas import (
    APIResponse,
    SchedulingData,
    ScheduledJobItem,
    SchedulingRunSummary,
    SchedulingRunDetail,
    SchedulingResultDetail,
)

router = APIRouter(prefix="/schedule", tags=["Scheduling"])


@router.post(
    "/run",
    response_model=APIResponse[SchedulingData],
    summary="Run greedy job scheduling",
    description="Retrieves all active jobs from the database, executes the greedy scheduling algorithm, persists the run and its results, and returns the schedule."
)
def run_scheduler(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    if not jobs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No jobs found in the database. Please add jobs before running the scheduler."
        )

    # Prepare input data for the pure algorithm
    jobs_data = [
        {
            "job_id": j.id,
            "job_name": j.job_name,
            "deadline": j.deadline,
            "profit": j.profit
        }
        for j in jobs
    ]

    try:
        algo_result = schedule_jobs_greedy(jobs_data)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Scheduling error: {str(val_err)}"
        )

    # Persist the SchedulingRun
    run_record = SchedulingRun(
        total_profit=algo_result.total_profit,
        total_jobs=algo_result.jobs_considered,
        scheduled_count=len(algo_result.scheduled_jobs),
        rejected_count=len(algo_result.rejected_jobs),
        max_deadline=algo_result.max_deadline
    )
    db.add(run_record)
    db.flush()  # Populates run_record.id

    # Create map of job_name to Job object for FK job_id lookup
    jobs_by_name = {j.job_name: j for j in jobs}

    # Store scheduled results
    for sj in algo_result.scheduled_jobs:
        job_obj = jobs_by_name.get(sj.job_name)
        result_entry = SchedulingResult(
            run_id=run_record.id,
            job_id=job_obj.id if job_obj else None,
            job_name=sj.job_name,
            deadline=sj.deadline,
            profit=sj.profit,
            assigned_slot=sj.assigned_slot,
            status="SCHEDULED"
        )
        db.add(result_entry)

    # Store rejected results
    for r_name in algo_result.rejected_jobs:
        job_obj = jobs_by_name.get(r_name)
        result_entry = SchedulingResult(
            run_id=run_record.id,
            job_id=job_obj.id if job_obj else None,
            job_name=r_name,
            deadline=job_obj.deadline if job_obj else 0,
            profit=job_obj.profit if job_obj else 0.0,
            assigned_slot=None,
            status="REJECTED"
        )
        db.add(result_entry)

    db.commit()
    db.refresh(run_record)

    # Prepare response data
    scheduled_items = [
        ScheduledJobItem(
            job_id=sj.job_id,
            job_name=sj.job_name,
            deadline=sj.deadline,
            profit=sj.profit,
            assigned_slot=sj.assigned_slot
        )
        for sj in algo_result.scheduled_jobs
    ]

    data_payload = SchedulingData(
        run_id=run_record.id,
        total_profit=algo_result.total_profit,
        scheduled_jobs=scheduled_items,
        rejected_jobs=algo_result.rejected_jobs,
        time_slots=algo_result.time_slots,
        total_jobs_considered=algo_result.jobs_considered,
        scheduled_count=len(algo_result.scheduled_jobs),
        rejected_count=len(algo_result.rejected_jobs),
        max_deadline=algo_result.max_deadline,
        created_at=run_record.run_at
    )

    return APIResponse(
        success=True,
        message="Scheduling completed successfully",
        data=data_payload
    )


@router.get(
    "/history",
    response_model=APIResponse[List[SchedulingRunSummary]],
    summary="Get scheduling history",
    description="Returns a list of all historical scheduling runs ordered from newest to oldest."
)
def get_scheduling_history(db: Session = Depends(get_db)):
    runs = db.query(SchedulingRun).order_by(SchedulingRun.id.desc()).all()
    summaries = [SchedulingRunSummary.model_validate(r) for r in runs]
    return APIResponse(
        success=True,
        message=f"Retrieved {len(summaries)} historical run(s)",
        data=summaries
    )


@router.get(
    "/history/{run_id}",
    response_model=APIResponse[SchedulingRunDetail],
    summary="Get scheduling run details",
    description="Returns detailed information and individual job allocations for a specific scheduling run."
)
def get_scheduling_run(run_id: int, db: Session = Depends(get_db)):
    run_record = db.query(SchedulingRun).options(
        joinedload(SchedulingRun.results)
    ).filter(SchedulingRun.id == run_id).first()

    if not run_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheduling run with ID {run_id} not found."
        )

    results_details = [
        SchedulingResultDetail.model_validate(res)
        for res in run_record.results
    ]

    detail = SchedulingRunDetail(
        id=run_record.id,
        run_at=run_record.run_at,
        total_profit=run_record.total_profit,
        total_jobs=run_record.total_jobs,
        scheduled_count=run_record.scheduled_count,
        rejected_count=run_record.rejected_count,
        max_deadline=run_record.max_deadline,
        results=results_details
    )

    return APIResponse(
        success=True,
        message=f"Retrieved details for scheduling run {run_id}",
        data=detail
    )

