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
   It does NOT solve arbitrary-duration / variable-length scheduling.
2. Time slots are discrete, 1-indexed: Slot 1 is [0, 1], Slot 2 is [1, 2], ..., Slot D is [D-1, D].
3. Only one job can execute in any given time slot.
4. A job must be assigned to slot t where 1 <= t <= deadline.
5. Objective: Maximize total earned profit.

Greedy Strategy:
----------------
1. Sort jobs in descending order of profit.
2. Determine max deadline D across all candidate jobs.
3. Initialize slot array of size D + 1.
4. For each job in sorted order:
   Search for the latest available slot t from min(job.deadline, D) down to 1:
     - If slot t is empty: assign job to slot t.
     - If no slot in 1..min(job.deadline, D) is free: reject the job with a specific reason.
5. Calculate profit contributions and generate step-by-step trace.

Complexity:
-----------
Time: O(n log n + nD)
Space: O(D + n)
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
    profit_contribution_pct: float = 0.0


@dataclass
class RejectedJobDetail:
    """Detailed rejection information for an unscheduled job."""
    job_id: Any
    job_name: str
    deadline: int
    profit: float
    reason: str


@dataclass
class ExecutionStep:
    """Step snapshot for interactive algorithm visualization & pseudocode tracing."""
    step_number: int
    operation: str
    description: str
    pseudocode_line: int
    current_job: Optional[str]
    current_slot: Optional[int]
    slots_state: Dict[int, Optional[str]]
    accumulated_profit: float
    scheduled_so_far: List[str]
    rejected_so_far: List[str]


@dataclass
class SchedulingResult:
    """Complete output of the greedy scheduling algorithm."""
    total_profit: float
    scheduled_jobs: List[ScheduledJob]
    rejected_jobs: List[str]
    rejected_details: List[RejectedJobDetail]
    time_slots: Dict[int, Optional[str]]
    jobs_considered: int
    scheduling_order: List[str]
    max_deadline: int
    execution_steps: List[Dict[str, Any]]
    complexity_info: Dict[str, str] = field(default_factory=lambda: {
        "time_complexity": "O(n log n + n * D)",
        "space_complexity": "O(D + n)",
        "algorithm_type": "Greedy (Job Sequencing with Deadlines)",
        "assumptions": "Unit duration per job (1 time slot per job); discrete time slots 1..D."
    })


def schedule_jobs_greedy(jobs_data: List[Dict[str, Any]]) -> SchedulingResult:
    """
    Executes the Greedy Job Sequencing with Deadlines algorithm.
    Produces comprehensive scheduling allocations, detailed rejection reasons,
    individual profit contributions, and step-by-step execution traces.
    """
    if not jobs_data:
        return SchedulingResult(
            total_profit=0.0,
            scheduled_jobs=[],
            rejected_jobs=[],
            rejected_details=[],
            time_slots={},
            jobs_considered=0,
            scheduling_order=[],
            max_deadline=0,
            execution_steps=[],
        )

    # 1. Parse and validate job inputs
    valid_jobs: List[JobInput] = []
    rejected_immediately: List[RejectedJobDetail] = []
    rejected_names: List[str] = []

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
            reason = f"Profit ({profit}) <= 0; non-positive profit jobs cannot improve the objective function."
            rejected_immediately.append(RejectedJobDetail(
                job_id=job_id,
                job_name=job_name,
                deadline=deadline,
                profit=profit,
                reason=reason
            ))
            rejected_names.append(job_name)
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
            rejected_jobs=rejected_names,
            rejected_details=rejected_immediately,
            time_slots={},
            jobs_considered=len(jobs_data),
            scheduling_order=[],
            max_deadline=0,
            execution_steps=[],
        )

    # 2. Sort jobs in descending order of profit.
    # Tie-breaker: earlier deadline first, then job_name
    valid_jobs.sort(key=lambda j: (-j.profit, j.deadline, str(j.job_name)))

    # 3. Find maximum deadline D
    max_deadline = max(j.deadline for j in valid_jobs)

    # 4. Initialize time slot array (1-indexed, size max_deadline + 1)
    slots: List[Optional[JobInput]] = [None] * (max_deadline + 1)

    scheduled_jobs: List[ScheduledJob] = []
    rejected_details: List[RejectedJobDetail] = list(rejected_immediately)
    rejected_jobs: List[str] = list(rejected_names)
    scheduling_order: List[str] = [j.job_name for j in valid_jobs]

    # Initialize execution trace for visual playback
    steps: List[Dict[str, Any]] = []
    step_counter = 1

    # Step 1: Initial state
    current_slots_dict = {t: None for t in range(1, max_deadline + 1)}
    steps.append({
        "step_number": step_counter,
        "operation": "SORT",
        "description": f"Sorted {len(valid_jobs)} jobs by descending profit (O(n log n)). Max deadline horizon D = {max_deadline}.",
        "pseudocode_line": 2,
        "current_job": None,
        "current_slot": None,
        "slots_state": dict(current_slots_dict),
        "accumulated_profit": 0.0,
        "scheduled_so_far": [],
        "rejected_so_far": list(rejected_names),
    })
    step_counter += 1

    current_profit = 0.0
    scheduled_names_list: List[str] = []

    # 5. Greedy slot assignment: assign each job to the latest available free slot <= deadline
    for job in valid_jobs:
        assigned = False
        start_slot = min(job.deadline, max_deadline)

        # Check slots backwards
        for t in range(start_slot, 0, -1):
            if slots[t] is None:
                slots[t] = job
                assigned = True
                current_profit += job.profit
                current_slots_dict[t] = job.job_name
                scheduled_names_list.append(job.job_name)

                scheduled_jobs.append(ScheduledJob(
                    job_id=job.job_id,
                    job_name=job.job_name,
                    deadline=job.deadline,
                    profit=job.profit,
                    assigned_slot=t,
                    profit_contribution_pct=0.0  # Computed after total_profit is final
                ))

                steps.append({
                    "step_number": step_counter,
                    "operation": "ASSIGN_SLOT",
                    "description": f"Examined latest free slot for '{job.job_name}' (deadline: {job.deadline}, profit: ₹{job.profit}). Assigned to Slot {t}.",
                    "pseudocode_line": 6,
                    "current_job": job.job_name,
                    "current_slot": t,
                    "slots_state": dict(current_slots_dict),
                    "accumulated_profit": current_profit,
                    "scheduled_so_far": list(scheduled_names_list),
                    "rejected_so_far": list(rejected_jobs),
                })
                step_counter += 1
                break

        if not assigned:
            # Build explanatory rejection reason
            occupied_by = [
                f"Slot {s}: {slots[s].job_name}"
                for s in range(1, start_slot + 1)
                if slots[s] is not None
            ]
            occupied_str = ", ".join(occupied_by) if occupied_by else "capacity exhausted"
            reason = f"All slots 1..{start_slot} before deadline {job.deadline} occupied by higher-profit jobs ({occupied_str})."

            rejected_jobs.append(job.job_name)
            rejected_details.append(RejectedJobDetail(
                job_id=job.job_id,
                job_name=job.job_name,
                deadline=job.deadline,
                profit=job.profit,
                reason=reason
            ))

            steps.append({
                "step_number": step_counter,
                "operation": "REJECT_JOB",
                "description": f"Rejected '{job.job_name}' (deadline: {job.deadline}, profit: ₹{job.profit}). {reason}",
                "pseudocode_line": 8,
                "current_job": job.job_name,
                "current_slot": None,
                "slots_state": dict(current_slots_dict),
                "accumulated_profit": current_profit,
                "scheduled_so_far": list(scheduled_names_list),
                "rejected_so_far": list(rejected_jobs),
            })
            step_counter += 1

    # Sort scheduled jobs by assigned time slot for clean chronologic display
    scheduled_jobs.sort(key=lambda sj: sj.assigned_slot)

    # Calculate total profit
    total_profit = sum(sj.profit for sj in scheduled_jobs)

    # Compute individual profit contribution % for each scheduled job
    if total_profit > 0:
        for sj in scheduled_jobs:
            sj.profit_contribution_pct = round((sj.profit / total_profit) * 100.0, 2)

    # Final summary step in execution trace
    steps.append({
        "step_number": step_counter,
        "operation": "FINALIZE",
        "description": f"Greedy scheduling complete. Total Profit: ₹{total_profit}. Scheduled {len(scheduled_jobs)} / {len(jobs_data)} jobs.",
        "pseudocode_line": 10,
        "current_job": None,
        "current_slot": None,
        "slots_state": dict(current_slots_dict),
        "accumulated_profit": total_profit,
        "scheduled_so_far": list(scheduled_names_list),
        "rejected_so_far": list(rejected_jobs),
    })

    # Construct time_slots dictionary {1: "J1", 2: "J3", ...}
    time_slots_map: Dict[int, Optional[str]] = {
        t: slots[t].job_name if slots[t] is not None else None
        for t in range(1, max_deadline + 1)
    }

    return SchedulingResult(
        total_profit=total_profit,
        scheduled_jobs=scheduled_jobs,
        rejected_jobs=rejected_jobs,
        rejected_details=rejected_details,
        time_slots=time_slots_map,
        jobs_considered=len(jobs_data),
        scheduling_order=scheduling_order,
        max_deadline=max_deadline,
        execution_steps=steps,
    )
