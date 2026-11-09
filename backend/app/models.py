"""
SQLAlchemy models for the Job Scheduling System.

Tables:
1. jobs: Master list of user-created jobs.
2. scheduling_runs: Records of each execution of the greedy scheduler with mode.
3. scheduling_results: Individual job assignments, rejections, reasons, and profit contributions.
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Job(Base):
    """
    Represents an active input job submitted by a user.
    """
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    job_name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    deadline: Mapped[int] = mapped_column(Integer, nullable=False)
    profit: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationship to historical results referencing this job (Set null on delete so history is preserved!)
    results: Mapped[List["SchedulingResult"]] = relationship("SchedulingResult", back_populates="job")

    def __repr__(self) -> str:
        return f"<Job id={self.id} name='{self.job_name}' deadline={self.deadline} profit={self.profit}>"


class SchedulingRun(Base):
    """
    Represents a specific execution of the Greedy Scheduling algorithm.
    """
    __tablename__ = "scheduling_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    run_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    scheduling_mode: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="ALL_ACTIVE"
    )  # "ALL_ACTIVE", "BATCH", "SIMULATION"
    total_profit: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_jobs: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    scheduled_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rejected_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_deadline: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # One-to-many relationship to individual snapshot results of this run
    results: Mapped[List["SchedulingResult"]] = relationship(
        "SchedulingResult",
        back_populates="run",
        cascade="all, delete-orphan",
        order_by="SchedulingResult.assigned_slot"
    )

    def __repr__(self) -> str:
        return f"<SchedulingRun id={self.id} mode={self.scheduling_mode} run_at={self.run_at} profit={self.total_profit}>"


class SchedulingResult(Base):
    """
    Stores the immutable outcome of an individual job within a scheduling run snapshot.
    Preserves job parameters at run-time even if the original job is updated or deleted.
    """
    __tablename__ = "scheduling_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    run_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("scheduling_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    job_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("jobs.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    job_name: Mapped[str] = mapped_column(String(100), nullable=False)
    deadline: Mapped[int] = mapped_column(Integer, nullable=False)
    profit: Mapped[float] = mapped_column(Float, nullable=False)
    assigned_slot: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # "SCHEDULED" or "REJECTED"
    rejection_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    profit_contribution: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=0.0)

    # Relationships
    run: Mapped["SchedulingRun"] = relationship("SchedulingRun", back_populates="results")
    job: Mapped[Optional["Job"]] = relationship("Job", back_populates="results")

    def __repr__(self) -> str:
        return f"<SchedulingResult id={self.id} run_id={self.run_id} job='{self.job_name}' slot={self.assigned_slot} status='{self.status}'>"
