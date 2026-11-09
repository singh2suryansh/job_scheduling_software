"""
CRUD routes for managing Jobs, including bulk addition and textbook seeders.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import Job
from app.schemas import (
    APIResponse,
    JobCreate,
    JobBulkCreate,
    JobBulkCreateResponse,
    JobUpdate,
    JobResponse,
)

router = APIRouter(prefix="/jobs", tags=["Jobs"])

TEXTBOOK_SAMPLE_JOBS = [
    {"job_name": "J1", "deadline": 2, "profit": 100.0},
    {"job_name": "J2", "deadline": 1, "profit": 19.0},
    {"job_name": "J3", "deadline": 2, "profit": 27.0},
    {"job_name": "J4", "deadline": 1, "profit": 25.0},
    {"job_name": "J5", "deadline": 3, "profit": 15.0},
]


@router.post(
    "",
    response_model=APIResponse[JobResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new job",
    description="Adds a new job with a unique job_name, positive deadline, and positive profit."
)
def create_job(job_in: JobCreate, db: Session = Depends(get_db)):
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


@router.post(
    "/bulk",
    response_model=APIResponse[JobBulkCreateResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Bulk create jobs",
    description="Inserts multiple jobs at once in a transactional batch."
)
def bulk_create_jobs(payload: JobBulkCreate, db: Session = Depends(get_db)):
    if not payload.jobs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The jobs array cannot be empty."
        )

    existing_names = {j.job_name for j in db.query(Job.job_name).all()}
    created_jobs = []
    skipped_jobs = []

    for item in payload.jobs:
        final_name = item.job_name
        if final_name in existing_names:
            if payload.allow_duplicates:
                # Append suffix to make it unique
                suffix = 1
                while f"{final_name}_{suffix}" in existing_names:
                    suffix += 1
                final_name = f"{final_name}_{suffix}"
            else:
                skipped_jobs.append(item.job_name)
                continue

        job_obj = Job(
            job_name=final_name,
            deadline=item.deadline,
            profit=item.profit
        )
        db.add(job_obj)
        existing_names.add(final_name)
        created_jobs.append(job_obj)

    try:
        db.commit()
        for j in created_jobs:
            db.refresh(j)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database batch insertion failed: {str(e)}"
        )

    return APIResponse(
        success=True,
        message=f"Successfully created {len(created_jobs)} jobs ({len(skipped_jobs)} skipped)",
        data=JobBulkCreateResponse(
            created_jobs=[JobResponse.model_validate(j) for j in created_jobs],
            skipped_jobs=skipped_jobs,
            total_created=len(created_jobs)
        )
    )


@router.post(
    "/seed",
    response_model=APIResponse[JobBulkCreateResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Load textbook sample jobs",
    description="Loads 5 canonical ADA jobs (J1..J5). Prevents duplicate insertion unless force=True."
)
def seed_sample_jobs(
    force: bool = Query(False, description="Set to true to re-insert even if sample jobs already exist"),
    db: Session = Depends(get_db)
):
    existing_jobs = db.query(Job).all()
    existing_names = {j.job_name for j in existing_jobs}

    created = []
    skipped = []

    for sample in TEXTBOOK_SAMPLE_JOBS:
        name = sample["job_name"]
        if name in existing_names:
            if not force:
                skipped.append(name)
                continue
            else:
                # Add unique suffix if forced
                suffix = 2
                while f"{name}_{suffix}" in existing_names:
                    suffix += 1
                name = f"{name}_{suffix}"

        job = Job(
            job_name=name,
            deadline=sample["deadline"],
            profit=sample["profit"]
        )
        db.add(job)
        existing_names.add(name)
        created.append(job)

    if not created and skipped:
        return APIResponse(
            success=True,
            message="Sample jobs already present in the database. Use force=true to add them again.",
            data=JobBulkCreateResponse(
                created_jobs=[],
                skipped_jobs=skipped,
                total_created=0
            )
        )

    db.commit()
    for j in created:
        db.refresh(j)

    return APIResponse(
        success=True,
        message=f"Inserted {len(created)} textbook sample jobs ({len(skipped)} already existed)",
        data=JobBulkCreateResponse(
            created_jobs=[JobResponse.model_validate(j) for j in created],
            skipped_jobs=skipped,
            total_created=len(created)
        )
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
    description="Deletes a job from the database by ID. Historical run results referencing this job are safely retained."
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
