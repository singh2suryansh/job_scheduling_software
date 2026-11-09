# Job Scheduling System — Frontend (JOBFLOW)

A modern, responsive React + Vite SaaS dashboard for the **Job Scheduling System using Greedy Algorithm** (Analysis and Design of Algorithms - ADA Project).

---

## 1. Features

- **Dashboard**:
  - Live metric KPI cards (Total Jobs, Scheduled Jobs, Rejected Jobs, Maximized Profit).
  - Profit breakdown bar chart (`Recharts`).
  - Allocation ratio donut chart (Scheduled vs. Rejected tasks).
  - Active candidate job pool preview and execution logs feed.
- **Manage Jobs**:
  - Add and Edit Job modal form with validation (Job Name, Deadline slot, Profit).
  - Quick action to load the textbook ADA preset (J1 through J5).
  - Searchable, sortable, and filterable job table with edit/delete actions.
- **Scheduler Engine (Interactive ADA Demonstration)**:
  - Prominent "RUN GREEDY ALGORITHM" button triggering `POST /schedule/run`.
  - Step-by-step interactive playback console with play/pause, step-forward, step-backward, and speed controls.
  - Visual highlight of candidate job evaluation order, backward slot search, and slot allocation/rejection.
- **Scheduling Results**:
  - Interactive discrete time-slot Gantt/Timeline view ($t = 1 \dots D$).
  - Breakdown of scheduled tasks per slot and rejected tasks with rejection reasons.
  - Historical run browser (`GET /schedule/history`) to inspect past runs and their details.
- **Analytics**:
  - Historical profit yield trends across runs.
  - Scheduled vs Rejected trends stacked chart.
  - Job deadline distribution histogram.
  - Cumulative metrics (Total runs, average profit per run, maximum profit achieved).
- **Algorithm Explanation**:
  - Formal problem statement and mathematical formulation.
  - Unit-time execution caveat and distinction from arbitrary-duration scheduling.
  - Time complexity $O(n \log n + nD)$ and space complexity $O(D + n)$ analysis.
  - Step-by-step textbook walkthrough ($J_1 \dots J_5$) and Python pseudocode.

---

## 2. Technology Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 + `@tailwindcss/vite`
- **Routing**: React Router DOM v7 (with lazy route code splitting)
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios

---

## 3. Getting Started

### 1. Install Dependencies
From the `frontend` directory:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default content:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 3. Run Development Server
```bash
npm run dev
```
The app will run at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
Build output is saved to `dist/` with route-level code splitting.

### 5. Run Linter
```bash
npm run lint
```
