# Job Scheduling System using Greedy Algorithm

An end-to-end full-stack college ADA (Analysis and Design of Algorithms) project implementing the classic **Job Sequencing with Deadlines** problem using a **Greedy Algorithm**. 

Built with:
- **Backend**: Python 3, FastAPI, SQLAlchemy 2.0, PyMySQL / SQLite fallback, Pydantic v2, Pytest.
- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Recharts, Lucide React, Axios, React Router DOM v7.

---

## 1. Algorithmic Foundation & Assumptions

### Problem Definition
Given a set of $n$ jobs where each job $i$ has an integer deadline $d_i \ge 1$ and profit $p_i > 0$. The objective is to maximize total profit earned by scheduling jobs such that each completes on or before its deadline.

### Core Assumptions
1. **Unit-Time Execution**: Every job takes exactly **one discrete time slot** ($t = 1$).
   > **Note:** This algorithm is strictly for unit-time tasks with integer deadlines. It does *not* claim to solve variable-length or arbitrary-duration job scheduling (which is NP-hard or requires different heuristics).
2. **Single Processor**: Only one job can execute during any given time slot $[t-1, t]$.
3. **Deadline Constraint**: A job must finish on or before its deadline (i.e. scheduled in slot $t \in [1, d_i]$).
4. **Objective**: Maximize $\sum_{j \in \text{Scheduled}} p_j$.

### Greedy Strategy
1. **Sort**: Sort candidate jobs in descending order of profit ($\mathcal{O}(n \log n)$).
2. **Horizon**: Find maximum deadline $D = \max(d_1, \dots, d_n)$ and allocate slot array $1 \dots D$.
3. **Latest-Slot Assignment**: For each job in sorted order, check slots backwards from $\min(d_i, D)$ down to 1. Assign to the first vacant slot found. If none are free, reject the job.
4. **Aggregate**: Compute total profit and format scheduled vs. rejected jobs.

### Complexity
- **Time Complexity**: $\mathcal{O}(n \log n + n \cdot D)$
- **Space Complexity**: $\mathcal{O}(D + n)$

---

## 2. Project Directory Structure

```text
job_scheduling/
│
├── frontend/                     # React + Vite application
│   ├── public/
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── Sidebar.jsx       # Persistent responsive navigation
│   │   │   ├── Navbar.jsx        # Breadcrumbs, API health pill & notification bell
│   │   │   ├── StatCard.jsx      # SaaS metric KPI cards
│   │   │   ├── JobForm.jsx       # Add/Edit job form with validation & reset
│   │   │   ├── JobTable.jsx      # Sortable/searchable job catalog table
│   │   │   ├── ScheduleTimeline.jsx # Discrete time slot Gantt/Timeline ($t = 1 \dots D$)
│   │   │   ├── ProfitChart.jsx   # Recharts profit breakdown visualization
│   │   │   └── LoadingSpinner.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Overview KPIs, allocation donut & recent runs
│   │   │   ├── Jobs.jsx          # Job management, CRUD operations & textbook preset
│   │   │   ├── Scheduler.jsx     # Live greedy algorithm runner & step-by-step playback
│   │   │   ├── Results.jsx       # Timeline audit, rejected jobs & historical run inspector
│   │   │   ├── Analytics.jsx     # Cumulative stats, profit trends & deadline histogram
│   │   │   └── Algorithm.jsx     # Formal ADA theory, pseudocode, and proof
│   │   ├── services/
│   │   │   └── api.js            # Axios client with FastAPI endpoints
│   │   ├── App.jsx               # Route configuration with React.lazy code splitting
│   │   ├── index.css             # Tailwind CSS v4 styling & dark theme variables
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js            # Vite config with @tailwindcss/vite plugin
│   ├── .env.example
│   └── README.md
│
├── backend/                      # Python FastAPI application
│   ├── app/
│   │   ├── algorithms/
│   │   │   └── greedy_scheduler.py # Pure, framework-agnostic Greedy Algorithm
│   │   ├── routes/
│   │   │   ├── jobs.py           # CRUD operations (/jobs)
│   │   │   ├── schedule.py       # Execution and run history (/schedule)
│   │   │   └── analytics.py      # System performance analytics (/analytics)
│   │   ├── database.py           # SQLAlchemy MySQL engine & SQLite fallback
│   │   ├── main.py               # FastAPI app, CORS, lifespan & health checks
│   │   ├── models.py             # ORM models (Job, SchedulingRun, SchedulingResult)
│   │   └── schemas.py            # Pydantic v2 validation models & response envelopes
│   ├── tests/
│   │   ├── test_greedy_scheduler.py # Unit tests for pure greedy algorithm (8 test cases)
│   │   └── test_api_endpoints.py    # Integration tests for FastAPI endpoints with in-memory DB
│   ├── requirements.txt          # Pinned backend dependencies
│   ├── .env.example
│   └── .env                      # Local environment configuration
│
└── readme.md                     # Comprehensive project documentation
```

---

## 3. Running the Backend (FastAPI)

1. **Activate virtual environment**:
   ```bash
   cd backend
   source venv/bin/activate
   ```
2. **Install dependencies** (if not already installed):
   ```bash
   pip install -r requirements.txt
   ```
3. **Start the server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
4. **Verify interactive Swagger docs**:
   - Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
   - Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
5. **Run backend automated tests**:
   ```bash
   PYTHONPATH=backend venv/bin/pytest tests -v
   ```

---

## 4. Running the Frontend (React + Vite)

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # VITE_API_BASE_URL=http://127.0.0.1:8000
   ```
4. **Start the development server**:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Automated Tests Summary

The automated test suite in `backend/tests` contains 20 comprehensive tests:
- **Unit Tests (`test_greedy_scheduler.py`)**:
  - `test_empty_input`: Handles empty job list.
  - `test_basic_job_scheduling`: Classic textbook ADA problem ($J_1 \dots J_5$).
  - `test_identical_deadlines`: Greedy preference for highest profit.
  - `test_identical_profits`: Tie-breaking and slot allocation.
  - `test_different_deadlines_and_profits`: Mixed deadlines and slot search.
  - `test_rejected_jobs`: Rejection when slots $\le d_i$ are exhausted.
  - `test_invalid_inputs`: Non-positive deadlines and invalid profits.
  - `test_non_positive_profit_ignored`: Avoids non-improving jobs.
  - `test_maximum_profit_calculation`: Optimal profit sum verification.
- **Integration Tests (`test_api_endpoints.py`)**:
  - `test_root_endpoint`, `test_health_endpoint`.
  - `test_create_and_get_job`, `test_create_job_duplicate_name_error`.
  - `test_create_job_invalid_deadline`, `test_create_job_invalid_profit`.
  - `test_update_job`, `test_delete_job`.
  - `test_schedule_run_empty_database` (returns 400 when no jobs exist).
  - `test_schedule_run_and_history_persistence` (verifies run records and individual slot allocations in DB).
  - `test_analytics_distinguishes_latest_and_cumulative`.
