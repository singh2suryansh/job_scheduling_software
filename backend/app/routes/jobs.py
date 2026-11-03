"""
CRUD routes for managing Jobs.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import Job
from app.schemas import (
    APIResponse,
    JobCreate,
    JobUpdate,
    JobResponse,
)

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post(
    "",
    response_model=APIResponse[JobResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new job",
    description="Adds a new job with a unique job_name, positive deadline, and positive profit."
)
def create_job(job_in: JobCreate, db: Session = Depends(get_db)):
    # Check if job with the same name already exists
    existing = db.query(Job).filter(Job.job_name == job_in.job_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job with name '{job_in.job_name}' already exists."
        )

    new_job = Job(
        job_name=job_in.job_name,
        deadline=job_in.deadline,
        profit=job_in.profit
    )
    db.add(new_job)
    try:
        db.commit()
        db.refresh(new_job)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create job: job name '{job_in.job_name}' must be unique."
        )

    return APIResponse(
        success=True,
        message="Job created successfully",
        data=JobResponse.model_validate(new_job)
    )


@router.get(
    "",
    response_model=APIResponse[List[JobResponse]],
    summary="List all jobs",
    description="Retrieves all currently stored jobs in the database."
)
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).order_by(Job.id.asc()).all()
    job_responses = [JobResponse.model_validate(j) for j in jobs]
    return APIResponse(
        success=True,
        message=f"Retrieved {len(job_responses)} job(s)",
        data=job_responses
    )


@router.get(
    "/{job_id}",
    response_model=APIResponse[JobResponse],
    summary="Get job by ID",
    description="Retrieves a specific job by its unique primary key ID."
)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found."
        )
    return APIResponse(
        success=True,
        message="Job retrieved successfully",
        data=JobResponse.model_validate(job)
    )


@router.put(
    "/{job_id}",
    response_model=APIResponse[JobResponse],
    summary="Update a job",
    description="Updates job_name, deadline, and/or profit for an existing job."
)
def update_job(job_id: int, job_in: JobUpdate, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found."
        )

    # Check for name uniqueness if job_name is updated
    if job_in.job_name is not None and job_in.job_name != job.job_name:
        existing = db.query(Job).filter(Job.job_name == job_in.job_name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Job with name '{job_in.job_name}' already exists."
            )
        job.job_name = job_in.job_name

    if job_in.deadline is not None:
        job.deadline = job_in.deadline

    if job_in.profit is not None:
        job.profit = job_in.profit

    try:
        db.commit()
        db.refresh(job)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update job due to database integrity constraint."
        )

    return APIResponse(
        success=True,
        message="Job updated successfully",
        data=JobResponse.model_validate(job)
    )


@router.delete(
    "/{job_id}",
    response_model=APIResponse[dict],
    summary="Delete a job",
    description="Deletes a job from the database by ID."
)
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found."
        )

    job_name = job.job_name
    db.delete(job)
    db.commit()

    return APIResponse(
        success=True,
        message=f"Job '{job_name}' (ID: {job_id}) deleted successfully",
        data={"deleted_job_id": job_id, "job_name": job_name}
    )

