"""
Job Sequencing with Deadlines - Greedy Algorithm Implementation.

Problem Description:
--------------------
Given a set of n jobs where each job i has:
  - id: Unique identifier
  - job_name: Identifier or title (e.g., 'J1', 'J2')
  - deadline: Positive integer representing the latest time slot by which the job must finish.
  - profit: Non-negative amount earned if the job is completed on or before its deadline.

Assumptions & Constraints:
--------------------------
1. Each job takes exactly one unit time slot (duration = 1).
   NOTE: This algorithm is strictly for unit-time jobs with deadlines.
   It does NOT solve arbitrary-duration / variable-length scheduling (which is NP-hard or requires different heuristics).
2. Time slots are discrete, 1-indexed: Slot 1 is [0, 1], Slot 2 is [1, 2], ..., Slot D is [D-1, D].
3. Only one job can execute in any given time slot.
4. A job must be assigned to slot t where 1 <= t <= deadline.
5. Objective: Maximize total earned profit.

Greedy Strategy:
----------------
1. Filter out jobs with non-positive profits (profit <= 0), as scheduling them cannot improve the total profit.
2. Sort jobs in descending order of profit. If profits are equal, earlier deadline or job ID is used as tie-breaker.
3. Determine max deadline D across all valid candidate jobs.
4. Initialize a time slot array of size D + 1 (with index 0 unused, slots 1..D initialized to None).
5. For each job in sorted order:
   Search for the latest available slot t from min(job.deadline, D) down to 1:
     - If slot t is empty: assign job to slot t and break.
     - If no slot in 1..min(job.deadline, D) is free: reject the job.
6. Return scheduled jobs, rejected jobs, slot assignments, total profit, and execution details.

Complexity Analysis:
--------------------
- Time Complexity:
    * Sorting n jobs: O(n log n)
    * Finding max deadline D: O(n)
    * Slot search: In the worst case, for each of the n jobs, we check up to min(deadline_i, D) <= D slots.
      Thus slot assignments take O(n * D) in the baseline approach.
    * Overall Time Complexity: O(n log n + n * D)
- Space Complexity:
    * Slot array of size D + 1: O(D)
    * Storing sorted jobs and result structures: O(n)
    * Overall Space Complexity: O(D + n)
"""

from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field


@dataclass
class JobInput:
    """Represents a job input to the scheduling algorithm."""
    job_id: Any
    job_name: str
    deadline: int
    profit: float


@dataclass
class ScheduledJob:
    """Represents a job that has been successfully assigned to a time slot."""
    job_id: Any
    job_name: str
    deadline: int
    profit: float
    assigned_slot: int


@dataclass
class SchedulingResult:
    """Complete output of the greedy scheduling algorithm."""
    total_profit: float
    scheduled_jobs: List[ScheduledJob]
    rejected_jobs: List[str]
    time_slots: Dict[int, Optional[str]]
    jobs_considered: int
    scheduling_order: List[str]
    max_deadline: int
    complexity_info: Dict[str, str] = field(default_factory=lambda: {
        "time_complexity": "O(n log n + n * D)",
        "space_complexity": "O(D + n)",
        "algorithm_type": "Greedy (Job Sequencing with Deadlines)",
        "assumptions": "Unit duration per job (1 time slot per job); discrete time slots 1..D."
    })


def schedule_jobs_greedy(jobs_data: List[Dict[str, Any]]) -> SchedulingResult:
    """
    Executes the Greedy Job Sequencing with Deadlines algorithm.

    Args:
        jobs_data: List of dicts, each containing:
                   - 'id' or 'job_id'
                   - 'job_name' or 'name'
                   - 'deadline': int > 0
                   - 'profit': number >= 0

    Returns:
        SchedulingResult containing:
            - total_profit: sum of profits of scheduled jobs
            - scheduled_jobs: list of ScheduledJob objects with assigned_slot
            - rejected_jobs: list of rejected job names
            - time_slots: dict mapping slot number (1..D) to job_name or None
            - jobs_considered: total count of input jobs
            - scheduling_order: sequence of job names considered in greedy order
            - max_deadline: maximum deadline among considered jobs
    """
    if not jobs_data:
        return SchedulingResult(
            total_profit=0.0,
            scheduled_jobs=[],
            rejected_jobs=[],
            time_slots={},
            jobs_considered=0,
            scheduling_order=[],
            max_deadline=0,
        )

    # 1. Parse and validate job inputs
    valid_jobs: List[JobInput] = []
    rejected_immediately: List[str] = []

    for item in jobs_data:
        job_id = item.get("job_id", item.get("id"))
        job_name = str(item.get("job_name", item.get("name", f"Job-{job_id}"))).strip()
        deadline = item.get("deadline")
        profit = item.get("profit")

        # Validate deadline
        if deadline is None or not isinstance(deadline, (int, float)) or int(deadline) <= 0:
            raise ValueError(f"Invalid deadline for job '{job_name}': deadline must be a positive integer.")
        deadline = int(deadline)

        # Validate profit
        if profit is None or not isinstance(profit, (int, float)):
            raise ValueError(f"Invalid profit for job '{job_name}': profit must be a number.")
        profit = float(profit)

        # Non-positive profit jobs cannot improve profit, reject them
        if profit <= 0:
            rejected_immediately.append(job_name)
            continue

        valid_jobs.append(JobInput(
            job_id=job_id,
            job_name=job_name,
            deadline=deadline,
            profit=profit
        ))

    if not valid_jobs:
        return SchedulingResult(
            total_profit=0.0,
            scheduled_jobs=[],
            rejected_jobs=rejected_immediately,
            time_slots={},
            jobs_considered=len(jobs_data),
            scheduling_order=[],
            max_deadline=0,
        )

    # 2. Sort jobs in descending order of profit.
    # Tie-breaker: earlier deadline first, then job_name
    valid_jobs.sort(key=lambda j: (-j.profit, j.deadline, str(j.job_name)))

    # 3. Find maximum deadline D
    max_deadline = max(j.deadline for j in valid_jobs)

    # 4. Initialize time slot array (1-indexed, size max_deadline + 1)
    # slots[t] will hold the assigned JobInput, or None if empty
    slots: List[Optional[JobInput]] = [None] * (max_deadline + 1)

    scheduled_jobs: List[ScheduledJob] = []
    rejected_jobs: List[str] = list(rejected_immediately)
    scheduling_order: List[str] = [j.job_name for j in valid_jobs]

    # 5. Greedy slot assignment: assign each job to the latest available free slot <= deadline
    for job in valid_jobs:
        assigned = False
        # Latest available slot: from min(job.deadline, max_deadline) down to 1
        start_slot = min(job.deadline, max_deadline)
        for t in range(start_slot, 0, -1):
            if slots[t] is None:
                slots[t] = job
                assigned = True
                scheduled_jobs.append(ScheduledJob(
                    job_id=job.job_id,
                    job_name=job.job_name,
                    deadline=job.deadline,
                    profit=job.profit,
                    assigned_slot=t
                ))
                break

        if not assigned:
            rejected_jobs.append(job.job_name)

    # Sort scheduled jobs by assigned time slot for clean chronologic display
    scheduled_jobs.sort(key=lambda sj: sj.assigned_slot)

    # Calculate total profit
    total_profit = sum(sj.profit for sj in scheduled_jobs)

    # Construct time_slots dictionary {1: "J1", 2: "J3", ...}
    time_slots_map: Dict[int, Optional[str]] = {
        t: slots[t].job_name if slots[t] is not None else None
        for t in range(1, max_deadline + 1)
    }

    return SchedulingResult(
        total_profit=total_profit,
        scheduled_jobs=scheduled_jobs,
        rejected_jobs=rejected_jobs,
        time_slots=time_slots_map,
        jobs_considered=len(jobs_data),
        scheduling_order=scheduling_order,
        max_deadline=max_deadline,
    )

