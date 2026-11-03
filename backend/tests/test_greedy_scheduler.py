"""
Unit tests for the Greedy Job Scheduling Algorithm (Job Sequencing with Deadlines).

Tests:
1. Basic job scheduling (textbook example)
2. Jobs with identical deadlines
3. Jobs with identical profits
4. Jobs with different deadlines and profits
5. Rejected jobs when slots are filled
6. Empty input
7. Invalid inputs (negative deadline, zero deadline, invalid profit)
8. Maximum profit calculation optimality
9. Non-positive profit jobs handled properly
"""

import pytest
from app.algorithms.greedy_scheduler import schedule_jobs_greedy, JobInput


def test_empty_input():
    """Test 6: Empty job list returns 0 profit and empty results."""
    result = schedule_jobs_greedy([])
    assert result.total_profit == 0.0
    assert len(result.scheduled_jobs) == 0
    assert len(result.rejected_jobs) == 0
    assert result.time_slots == {}
    assert result.jobs_considered == 0


def test_basic_job_scheduling():
    """Test 1: Classic textbook example."""
    jobs = [
        {"job_id": 1, "job_name": "J1", "deadline": 2, "profit": 100},
        {"job_id": 2, "job_name": "J2", "deadline": 1, "profit": 19},
        {"job_id": 3, "job_name": "J3", "deadline": 2, "profit": 27},
        {"job_id": 4, "job_name": "J4", "deadline": 1, "profit": 25},
        {"job_id": 5, "job_name": "J5", "deadline": 3, "profit": 15},
    ]

    result = schedule_jobs_greedy(jobs)

    # In sorted order of profit:
    # J1: profit 100, deadline 2 -> slot 2
    # J3: profit 27, deadline 2 -> slot 1
    # J4: profit 25, deadline 1 -> slots 1 is taken -> rejected
    # J2: profit 19, deadline 1 -> slots 1 is taken -> rejected
    # J5: profit 15, deadline 3 -> slot 3
    # Total profit = 100 + 27 + 15 = 142
    assert result.total_profit == 142.0
    scheduled_names = [j.job_name for j in result.scheduled_jobs]
    assert "J1" in scheduled_names
    assert "J3" in scheduled_names
    assert "J5" in scheduled_names
    assert "J2" in result.rejected_jobs
    assert "J4" in result.rejected_jobs

    # Verify slot assignments
    slot_map = {j.job_name: j.assigned_slot for j in result.scheduled_jobs}
    assert slot_map["J3"] == 1
    assert slot_map["J1"] == 2
    assert slot_map["J5"] == 3


def test_identical_deadlines():
    """Test 2: Jobs with identical deadlines compete for the same slot."""
    jobs = [
        {"job_id": 1, "job_name": "A", "deadline": 1, "profit": 50},
        {"job_id": 2, "job_name": "B", "deadline": 1, "profit": 90},
        {"job_id": 3, "job_name": "C", "deadline": 1, "profit": 30},
    ]

    result = schedule_jobs_greedy(jobs)

    # Only 1 slot exists. Highest profit job B (90) must be scheduled in slot 1.
    assert result.total_profit == 90.0
    assert len(result.scheduled_jobs) == 1
    assert result.scheduled_jobs[0].job_name == "B"
    assert result.scheduled_jobs[0].assigned_slot == 1
    assert set(result.rejected_jobs) == {"A", "C"}


def test_identical_profits():
    """Test 3: Jobs with identical profits."""
    jobs = [
        {"job_id": 1, "job_name": "J1", "deadline": 2, "profit": 50},
        {"job_id": 2, "job_name": "J2", "deadline": 1, "profit": 50},
        {"job_id": 3, "job_name": "J3", "deadline": 2, "profit": 50},
    ]

    result = schedule_jobs_greedy(jobs)

    # Max deadline is 2, so at most 2 jobs can be scheduled
    assert len(result.scheduled_jobs) == 2
    assert len(result.rejected_jobs) == 1
    assert result.total_profit == 100.0


def test_different_deadlines_and_profits():
    """Test 4: Diverse deadlines and profits."""
    jobs = [
        {"job_id": 1, "job_name": "Job1", "deadline": 4, "profit": 70},
        {"job_id": 2, "job_name": "Job2", "deadline": 1, "profit": 80},
        {"job_id": 3, "job_name": "Job3", "deadline": 4, "profit": 30},
        {"job_id": 4, "job_name": "Job4", "deadline": 1, "profit": 10},
    ]

    result = schedule_jobs_greedy(jobs)

    # Job2 (profit 80, deadline 1) -> slot 1
    # Job1 (profit 70, deadline 4) -> slot 4
    # Job3 (profit 30, deadline 4) -> slot 3
    # Job4 (profit 10, deadline 1) -> rejected (slot 1 full)
    assert result.total_profit == 180.0
    scheduled_names = [j.job_name for j in result.scheduled_jobs]
    assert scheduled_names == ["Job2", "Job3", "Job1"]  # sorted by assigned slot 1, 3, 4
    assert result.rejected_jobs == ["Job4"]


def test_rejected_jobs():
    """Test 5: Explicit test for jobs that cannot fit."""
    jobs = [
        {"job_id": 1, "job_name": "X1", "deadline": 1, "profit": 100},
        {"job_id": 2, "job_name": "X2", "deadline": 1, "profit": 90},
        {"job_id": 3, "job_name": "X3", "deadline": 1, "profit": 80},
    ]

    result = schedule_jobs_greedy(jobs)
    assert len(result.scheduled_jobs) == 1
    assert result.scheduled_jobs[0].job_name == "X1"
    assert result.rejected_jobs == ["X2", "X3"]


def test_invalid_inputs():
    """Test 7: Negative or zero deadlines, non-numeric values."""
    # Zero deadline
    with pytest.raises(ValueError, match="deadline must be a positive integer"):
        schedule_jobs_greedy([{"job_name": "Bad", "deadline": 0, "profit": 50}])

    # Negative deadline
    with pytest.raises(ValueError, match="deadline must be a positive integer"):
        schedule_jobs_greedy([{"job_name": "Bad", "deadline": -2, "profit": 50}])

    # Non-numeric profit
    with pytest.raises(ValueError, match="profit must be a number"):
        schedule_jobs_greedy([{"job_name": "Bad", "deadline": 2, "profit": "not_a_number"}])


def test_non_positive_profit_ignored():
    """Jobs with 0 or negative profit are immediately rejected without wasting slots."""
    jobs = [
        {"job_id": 1, "job_name": "FreeJob", "deadline": 2, "profit": 0},
        {"job_id": 2, "job_name": "NegativeJob", "deadline": 1, "profit": -10},
        {"job_id": 3, "job_name": "ValuableJob", "deadline": 1, "profit": 100},
    ]

    result = schedule_jobs_greedy(jobs)
    assert result.total_profit == 100.0
    assert len(result.scheduled_jobs) == 1
    assert result.scheduled_jobs[0].job_name == "ValuableJob"
    assert set(result.rejected_jobs) == {"FreeJob", "NegativeJob"}


def test_maximum_profit_calculation():
    """Test 8: Verify profit calculation matches maximum sum possible."""
    jobs = [
        {"job_id": 1, "job_name": "A", "deadline": 2, "profit": 60},
        {"job_id": 2, "job_name": "B", "deadline": 1, "profit": 100},
        {"job_id": 3, "job_name": "C", "deadline": 3, "profit": 20},
        {"job_id": 4, "job_name": "D", "deadline": 2, "profit": 40},
        {"job_id": 5, "job_name": "E", "deadline": 1, "profit": 20},
    ]

    result = schedule_jobs_greedy(jobs)

    # Greedy order:
    # B: profit 100, deadline 1 -> slot 1
    # A: profit 60, deadline 2 -> slot 2
    # D: profit 40, deadline 2 -> slot 2 & 1 full -> rejected
    # C: profit 20, deadline 3 -> slot 3
    # E: profit 20, deadline 1 -> rejected
    assert result.total_profit == 180.0
    assert sum(j.profit for j in result.scheduled_jobs) == result.total_profit

