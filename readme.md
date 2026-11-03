# Job Scheduling System using Greedy Algorithm

An ADA (Analysis and Design of Algorithms) college project implementing the classic **Job Sequencing with Deadlines** problem using a **Greedy Algorithm**. Built with a Python **FastAPI** backend and a **React + Vite** frontend.

---

## 1. Project Overview & Algorithmic Foundation

The **Job Sequencing with Deadlines** problem is an optimization problem where a set of jobs must be scheduled on a single processor such that total earned profit is maximized, subject to deadlines.

### Assumptions & Constraints
1. **Unit-Time Execution**: Every job requires exactly **one discrete time slot** ($t = 1$).
   > **Note:** This algorithm strictly addresses unit-time tasks with integer deadlines. It does *not* claim to solve variable-length or arbitrary-duration job scheduling.
2. **Single Processor**: Only one job can execute during any given time slot.
3. **Deadline Constraint**: A job must finish on or before its integer deadline $d_i$ (i.e., scheduled in time slot $t \in [1, d_i]$).
4. **Non-preemptive**: Once a job is allocated to a slot, it runs to completion.
5. **Objective**: Maximize the sum of profits of all completed jobs: $\sum_{j \in \text{Scheduled}} \text{profit}(j)$.

---

## 2. Greedy Algorithm & Complexity Analysis

### Greedy Strategy
1. **Filter Non-Profitable Jobs**: Ignore jobs with profit $\le 0$, since scheduling them cannot improve the objective function.
2. **Sort**: Sort candidate jobs in descending order of profit. If profits are equal, earlier deadlines serve as secondary tie-breakers.
3. **Identify Horizon**: Find the maximum deadline $D = \max(d_1, d_2, \ldots, d_n)$ across all jobs.
4. **Slot Array**: Initialize a time slot array of size $D$ (indexed 1 through $D$) as empty.
5. **Latest-Slot Assignment**: For each job in sorted order:
   - Check available slots from $\min(d_i, D)$ backwards down to 1.
   - If an empty slot $t$ is found, assign the job to slot $t$ and mark it as scheduled.
   - If no slot between 1 and $\min(d_i, D)$ is free, reject the job.
6. **Aggregate**: Compute total profit and format scheduled vs. rejected jobs.

### Complexity Analysis
- **Time Complexity**:
  - Sorting $n$ jobs by profit: $\mathcal{O}(n \log n)$
  - Maximum deadline search: $\mathcal{O}(n)$
  - Slot allocation loop: For each of $n$ jobs, we check at most $\min(d_i, D) \le D$ slots: $\mathcal{O}(n \cdot D)$
  - **Overall Time Complexity**: $\mathcal{O}(n \log n + n \cdot D)$
- **Space Complexity**:
  - Time slot array of size $D$: $\mathcal{O}(D)$
  - Sorted job lists and result sets: $\mathcal{O}(n)$
  - **Overall Space Complexity**: $\mathcal{O}(D + n)$

---

## 3. Backend Architecture

```text
backend/
├── app/
│   ├── algorithms/
│   │   ├── __init__.py
│   │   └── greedy_scheduler.py   # Pure, isolated Greedy Algorithm implementation
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── jobs.py              # CRUD endpoints for jobs (/jobs)
│   │   ├── schedule.py          # Run scheduling & view run history (/schedule)
│   │   └── analytics.py         # System stats & performance analytics (/analytics)
│   ├── __init__.py
│   ├── database.py              # SQLAlchemy engine, MySQL connection & SQLite fallback
│   ├── main.py                  # FastAPI initialization, CORS, lifespan & health check
│   ├── models.py                # SQLAlchemy ORM models (Job, SchedulingRun, SchedulingResult)
│   └── schemas.py               # Pydantic v2 validation models & response envelopes
├── tests/
│   ├── test_greedy_scheduler.py # Unit tests for pure greedy algorithm (8+ test cases)
│   └── test_api_endpoints.py    # Integration tests for FastAPI endpoints with SQLite in-memory
├── requirements.txt             # Pinned backend dependencies
├── .env.example                 # Environment variables template
├── .env                         # Local environment settings (gitignored)
└── .gitignore                   # Git ignore file for backend
```

---

## 4. Setup and Installation

### Prerequisites
- macOS / Linux / Windows
- Python 3.10+ (tested with Python 3.14)
- MySQL Server (optional; SQLite fallback enabled by default)

### 1. Create and Activate Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` if using MySQL:
```dotenv
# MySQL Configuration (uncomment if MySQL is running)
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=job_scheduling_db

# Local SQLite fallback database (used automatically if MySQL is not configured)
SQLITE_PATH=job_scheduling.db
```

---

## 5. Running the Backend Server

From the `backend` directory (with virtual environment activated):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Alternatively, from the project root:
```bash
PYTHONPATH=backend backend/venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Interactive Documentation
Once started, open:
- **Interactive Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 6. API Reference

All responses follow a consistent envelope:
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

### Job Management (`/jobs`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/jobs` | Create a job (`job_name`, `deadline` > 0, `profit` > 0) |
| `GET` | `/jobs` | List all saved jobs |
| `GET` | `/jobs/{job_id}` | Retrieve a specific job by ID |
| `PUT` | `/jobs/{job_id}` | Update job details |
| `DELETE` | `/jobs/{job_id}` | Delete a job |

#### Example Job Creation Request (`POST /jobs`):
```json
{
  "job_name": "J1",
  "deadline": 2,
  "profit": 100.0
}
```

### Scheduling (`/schedule`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/schedule/run` | Execute greedy scheduling on all active jobs |
| `GET` | `/schedule/history` | List all past scheduling runs |
| `GET` | `/schedule/history/{run_id}` | View details and allocations of a specific run |

#### Example Scheduling Response (`POST /schedule/run`):
```json
{
  "success": true,
  "message": "Scheduling completed successfully",
  "data": {
    "run_id": 1,
    "total_profit": 142.0,
    "scheduled_jobs": [
      {
        "job_id": 3,
        "job_name": "J3",
        "deadline": 2,
        "profit": 27.0,
        "assigned_slot": 1
      },
      {
        "job_id": 1,
        "job_name": "J1",
        "deadline": 2,
        "profit": 100.0,
        "assigned_slot": 2
      },
      {
        "job_id": 5,
        "job_name": "J5",
        "deadline": 3,
        "profit": 15.0,
        "assigned_slot": 3
      }
    ],
    "rejected_jobs": [
      "J4",
      "J2"
    ],
    "time_slots": {
      "1": "J3",
      "2": "J1",
      "3": "J5"
    },
    "total_jobs_considered": 5,
    "scheduled_count": 3,
    "rejected_count": 2,
    "max_deadline": 3,
    "created_at": "2026-11-03T18:41:00Z"
  }
}
```

### Analytics (`/analytics`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics` | System metrics, latest run result vs. cumulative stats |

#### Example Analytics Response:
```json
{
  "success": true,
  "message": "Analytics retrieved successfully",
  "data": {
    "total_jobs": 5,
    "total_runs": 1,
    "latest_run": {
      "run_id": 1,
      "run_at": "2026-11-03T18:41:00Z",
      "total_profit": 142.0,
      "total_jobs": 5,
      "scheduled_count": 3,
      "rejected_count": 2,
      "scheduled_jobs": ["J3", "J1", "J5"],
      "rejected_jobs": ["J4", "J2"]
    },
    "cumulative_stats": {
      "total_runs": 1,
      "total_profit_accumulated": 142.0,
      "average_profit_per_run": 142.0,
      "max_profit_achieved": 142.0,
      "total_jobs_scheduled": 3,
      "total_jobs_rejected": 2
    }
  }
}
```

---

## 7. Automated Testing

The project includes an automated test suite using `pytest`. Tests use an isolated in-memory SQLite database, guaranteeing that test executions never touch real user data.

To run the test suite:
```bash
PYTHONPATH=backend backend/venv/bin/pytest backend/tests -v
```

### Test Coverage Highlights:
1. `test_empty_input`: Handles empty job list gracefully.
2. `test_basic_job_scheduling`: Textbook ADA problem verification ($J_1 \ldots J_5$).
3. `test_identical_deadlines`: Verifies greedy selection picks the highest profit job.
4. `test_identical_profits`: Verifies tie-breaking and slot allocation.
5. `test_different_deadlines_and_profits`: Verifies slot assignments under mixed parameters.
6. `test_rejected_jobs`: Verifies proper classification of rejected jobs when capacity is exceeded.
7. `test_invalid_inputs`: Validates rejection of non-positive deadlines and invalid profits.
8. `test_maximum_profit_calculation`: Verifies algorithmic optimality of profit sums.
9. `test_api_endpoints`: End-to-end integration tests for `/jobs`, `/schedule/run`, `/schedule/history`, `/analytics`, and `/health`.
10. `test_schedule_run_and_history_persistence`: Verifies database transaction persistence of runs and results.

---

## 8. Frontend Integration Guide

The React frontend (in `frontend/`) can connect to this backend via REST calls (e.g., using `axios` or `fetch`).

### Example Frontend Service (`frontend/src/services/api.js`):
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Jobs API
export const getJobs = () => api.get('/jobs');
export const createJob = (job) => api.post('/jobs', job);
export const updateJob = (id, job) => api.put(`/jobs/${id}`, job);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);

// Scheduling API
export const runSchedule = () => api.post('/schedule/run');
export const getScheduleHistory = () => api.get('/schedule/history');
export const getScheduleRunDetail = (id) => api.get(`/schedule/history/${id}`);

// Analytics API
export const getAnalytics = () => api.get('/analytics');

// Health Check
export const checkHealth = () => api.get('/health');
```

