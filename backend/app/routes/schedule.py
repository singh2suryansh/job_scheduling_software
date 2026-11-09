"""
Routes for triggering the Greedy Job Scheduling Algorithm, viewing history, and comparing runs.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Job, SchedulingRun, SchedulingResult
from app.algorithms.greedy_scheduler import schedule_jobs_greedy
from app.schemas import (
    APIResponse,
    ScheduleRunRequest,
    SchedulingData,
    ScheduledJobItem,
    RejectedJobItem,
    SchedulingRunSummary,
    SchedulingRunDetail,
    SchedulingResultDetail,
    CompareRunsRequest,
    CompareRunsResponse,
    RunComparisonItem,
)

router = APIRouter(prefix="/schedule", tags=["Scheduling"])


@router.post(
    "/run",
    response_model=APIResponse[SchedulingData],
    summary="Run greedy job scheduling",
    description="Executes the greedy scheduling algorithm on either all active jobs or a specific batch, persists run snapshots, and returns results."
)
def run_scheduler(payload: Optional[ScheduleRunRequest] = None, db: Session = Depends(get_db)):
    mode = payload.mode if payload else "ALL_ACTIVE"
    selected_job_ids = payload.job_ids if payload else None

    # Retrieve candidate jobs based on scheduling mode
    if mode == "BATCH" and selected_job_ids:
        jobs = db.query(Job).filter(Job.id.in_(selected_job_ids)).all()
        if not jobs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"None of the requested job IDs {selected_job_ids} exist in the database."
            )
    else:
        mode = "ALL_ACTIVE"
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

    # Persist the SchedulingRun with its distinct scheduling_mode
    run_record = SchedulingRun(
        scheduling_mode=mode,
        total_profit=algo_result.total_profit,
        total_jobs=algo_result.jobs_considered,
        scheduled_count=len(algo_result.scheduled_jobs),
        rejected_count=len(algo_result.rejected_jobs),
        max_deadline=algo_result.max_deadline
    )
    db.add(run_record)
    db.flush()  # Populates run_record.id

    # Create map of job_name to Job object for FK lookup
    jobs_by_name = {j.job_name: j for j in jobs}

    # Store scheduled results with individual profit contributions
    for sj in algo_result.scheduled_jobs:
        job_obj = jobs_by_name.get(sj.job_name)
        result_entry = SchedulingResult(
            run_id=run_record.id,
            job_id=job_obj.id if job_obj else None,
            job_name=sj.job_name,
            deadline=sj.deadline,
            profit=sj.profit,
            assigned_slot=sj.assigned_slot,
            status="SCHEDULED",
            rejection_reason=None,
            profit_contribution=sj.profit_contribution_pct
        )
        db.add(result_entry)

    # Store rejected results with detailed explanations
    rejected_details_map = {r.job_name: r for r in algo_result.rejected_details}
    for r_name in algo_result.rejected_jobs:
        job_obj = jobs_by_name.get(r_name)
        detail_obj = rejected_details_map.get(r_name)
        reason_str = detail_obj.reason if detail_obj else "Exceeded deadline limits."

        result_entry = SchedulingResult(
            run_id=run_record.id,
            job_id=job_obj.id if job_obj else None,
            job_name=r_name,
            deadline=job_obj.deadline if job_obj else (detail_obj.deadline if detail_obj else 0),
            profit=job_obj.profit if job_obj else (detail_obj.profit if detail_obj else 0.0),
            assigned_slot=None,
            status="REJECTED",
            rejection_reason=reason_str,
            profit_contribution=0.0
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
            assigned_slot=sj.assigned_slot,
            profit_contribution_pct=sj.profit_contribution_pct
        )
        for sj in algo_result.scheduled_jobs
    ]

    rejected_item_details = [
        RejectedJobItem(
            job_id=rj.job_id,
            job_name=rj.job_name,
            deadline=rj.deadline,
            profit=rj.profit,
            reason=rj.reason
        )
        for rj in algo_result.rejected_details
    ]

    data_payload = SchedulingData(
        run_id=run_record.id,
        scheduling_mode=run_record.scheduling_mode,
        total_profit=algo_result.total_profit,
        scheduled_jobs=scheduled_items,
        rejected_jobs=algo_result.rejected_jobs,
        rejected_details=rejected_item_details,
        time_slots=algo_result.time_slots,
        total_jobs_considered=algo_result.jobs_considered,
        scheduled_count=len(algo_result.scheduled_jobs),
        rejected_count=len(algo_result.rejected_jobs),
        max_deadline=algo_result.max_deadline,
        execution_steps=algo_result.execution_steps,
        created_at=run_record.run_at
    )

    return APIResponse(
        success=True,
        message=f"Scheduling completed successfully (Mode: {mode})",
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
    description="Returns detailed information, job snapshots, rejection reasons, and profit contributions for a specific run."
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
        scheduling_mode=run_record.scheduling_mode,
        total_profit=run_record.total_profit,
        total_jobs=run_record.total_jobs,
        scheduled_count=run_record.scheduled_count,
        rejected_count=run_record.rejected_count,
        max_deadline=run_record.max_deadline,
        results=results_details
    )

    return APIResponse(
        success=True,
        message=f"Retrieved details for scheduling run #{run_id}",
        data=detail
    )


@router.post(
    "/compare",
    response_model=APIResponse[CompareRunsResponse],
    summary="Compare multiple scheduling runs",
    description="Accepts a list of run IDs and generates side-by-side comparative performance metrics."
)
def compare_runs(payload: CompareRunsRequest, db: Session = Depends(get_db)):
    if not payload.run_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="run_ids list cannot be empty."
        )

    runs = db.query(SchedulingRun).options(
        joinedload(SchedulingRun.results)
    ).filter(SchedulingRun.id.in_(payload.run_ids)).order_by(SchedulingRun.id.asc()).all()

    if not runs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="None of the specified run IDs were found."
        )

    comparison_items = []
    chart_data = []

    for r in runs:
        scheduled_jobs = [res.job_name for res in r.results if res.status == "SCHEDULED"]
        acceptance_rate = round((r.scheduled_count / r.total_jobs * 100.0), 2) if r.total_jobs > 0 else 0.0
        avg_profit = round(r.total_profit / r.scheduled_count, 2) if r.scheduled_count > 0 else 0.0

        item = RunComparisonItem(
            run_id=r.id,
            run_at=r.run_at,
            scheduling_mode=r.scheduling_mode,
            total_jobs=r.total_jobs,
            scheduled_count=r.scheduled_count,
            rejected_count=r.rejected_count,
            total_profit=r.total_profit,
            acceptance_rate=acceptance_rate,
            avg_profit_per_scheduled_job=avg_profit,
            scheduled_job_names=scheduled_jobs
        )
        comparison_items.append(item)

        chart_data.append({
            "run_label": f"Run #{r.id}",
            "run_id": r.id,
            "mode": r.scheduling_mode,
            "total_profit": r.total_profit,
            "total_jobs": r.total_jobs,
            "scheduled": r.scheduled_count,
            "rejected": r.rejected_count,
            "acceptance_rate": acceptance_rate,
        })

    return APIResponse(
        success=True,
        message=f"Comparison generated for {len(comparison_items)} run(s)",
        data=CompareRunsResponse(
            runs=comparison_items,
            comparison_chart=chart_data
        )
    )
