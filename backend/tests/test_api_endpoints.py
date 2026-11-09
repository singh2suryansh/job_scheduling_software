"""
Integration tests for FastAPI endpoints: Jobs, Scheduling, Analytics, and Health.
Uses an isolated in-memory SQLite database to ensure no real user data is modified.
"""

import pytest
from starlette.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

# Create an in-memory SQLite database for test isolation
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def test_db():
    """Create fresh tables for each test and drop them afterwards."""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(test_db):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ==============================================================================
# Health and Root Tests
# ==============================================================================

def test_root_endpoint(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "docs_url" in data


def test_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "database" in data
    assert "algorithm" in data


# ==============================================================================
# Jobs CRUD & Validation Tests
# ==============================================================================

def test_create_and_get_job(client):
    payload = {"job_name": "J1", "deadline": 2, "profit": 100.0}
    res = client.post("/jobs", json=payload)
    assert res.status_code == 201
    body = res.json()
    assert body["success"] is True
    assert body["data"]["job_name"] == "J1"
    assert body["data"]["deadline"] == 2
    assert body["data"]["profit"] == 100.0
    job_id = body["data"]["id"]

    # Retrieve by ID
    get_res = client.get(f"/jobs/{job_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == job_id


def test_create_job_duplicate_name_error(client):
    client.post("/jobs", json={"job_name": "UniqueJob", "deadline": 1, "profit": 50})
    # Attempt duplicate
    res = client.post("/jobs", json={"job_name": "UniqueJob", "deadline": 2, "profit": 60})
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]


def test_create_job_invalid_deadline(client):
    # Deadline <= 0
    res = client.post("/jobs", json={"job_name": "BadJob", "deadline": 0, "profit": 50})
    assert res.status_code == 422


def test_create_job_invalid_profit(client):
    # Profit <= 0
    res = client.post("/jobs", json={"job_name": "BadProfit", "deadline": 2, "profit": 0})
    assert res.status_code == 422


def test_update_job(client):
    create_res = client.post("/jobs", json={"job_name": "OldName", "deadline": 1, "profit": 50})
    job_id = create_res.json()["data"]["id"]

    update_res = client.put(f"/jobs/{job_id}", json={"job_name": "NewName", "profit": 75.0})
    assert update_res.status_code == 200
    assert update_res.json()["data"]["job_name"] == "NewName"
    assert update_res.json()["data"]["profit"] == 75.0
    assert update_res.json()["data"]["deadline"] == 1


def test_delete_job(client):
    create_res = client.post("/jobs", json={"job_name": "ToDelete", "deadline": 1, "profit": 10})
    job_id = create_res.json()["data"]["id"]

    del_res = client.delete(f"/jobs/{job_id}")
    assert del_res.status_code == 200

    # Verify not found afterwards
    get_res = client.get(f"/jobs/{job_id}")
    assert get_res.status_code == 404


# ==============================================================================
# Scheduling and Persistence Tests
# ==============================================================================

def test_schedule_run_empty_database(client):
    # When no jobs exist, return 400 Bad Request
    res = client.post("/schedule/run")
    assert res.status_code == 400
    assert "No jobs found" in res.json()["detail"]


def test_schedule_run_and_history_persistence(client):
    """Test 9 & 10: Schedule execution and persistence of run history."""
    # Seed jobs
    sample_jobs = [
        {"job_name": "J1", "deadline": 2, "profit": 100},
        {"job_name": "J2", "deadline": 1, "profit": 19},
        {"job_name": "J3", "deadline": 2, "profit": 27},
        {"job_name": "J4", "deadline": 1, "profit": 25},
        {"job_name": "J5", "deadline": 3, "profit": 15},
    ]
    for j in sample_jobs:
        client.post("/jobs", json=j)

    # Run scheduler
    run_res = client.post("/schedule/run")
    assert run_res.status_code == 200
    run_data = run_res.json()
    assert run_data["success"] is True

    sched_data = run_data["data"]
    assert sched_data["total_profit"] == 142.0
    assert sched_data["scheduled_count"] == 3
    assert sched_data["rejected_count"] == 2
    assert "J4" in sched_data["rejected_jobs"]
    assert "J2" in sched_data["rejected_jobs"]

    run_id = sched_data["run_id"]

    # Check history list
    hist_res = client.get("/schedule/history")
    assert hist_res.status_code == 200
    history_items = hist_res.json()["data"]
    assert len(history_items) == 1
    assert history_items[0]["id"] == run_id
    assert history_items[0]["total_profit"] == 142.0

    # Check detailed run history
    detail_res = client.get(f"/schedule/history/{run_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()["data"]
    assert len(detail_data["results"]) == 5
    scheduled_results = [r for r in detail_data["results"] if r["status"] == "SCHEDULED"]
    assert len(scheduled_results) == 3


# ==============================================================================
# Analytics Tests
# ==============================================================================

def test_analytics_distinguishes_latest_and_cumulative(client):
    # Initially no runs
    res0 = client.get("/analytics")
    assert res0.status_code == 200
    assert res0.json()["data"]["total_jobs"] == 0
    assert res0.json()["data"]["total_runs"] == 0
    assert res0.json()["data"]["latest_run"] is None

    # Add jobs and run scheduler
    client.post("/jobs", json={"job_name": "A", "deadline": 1, "profit": 50})
    client.post("/jobs", json={"job_name": "B", "deadline": 1, "profit": 100})
    client.post("/schedule/run")

    res1 = client.get("/analytics")
    data1 = res1.json()["data"]
    assert data1["total_jobs"] == 2
    assert data1["total_runs"] == 1
    assert data1["latest_run"]["total_profit"] == 100.0
    assert data1["latest_run"]["scheduled_count"] == 1
    assert data1["latest_run"]["rejected_count"] == 1
    assert data1["cumulative_stats"]["total_profit_accumulated"] == 100.0
    assert data1["cumulative_stats"]["max_profit_achieved"] == 100.0



def test_bulk_create_and_seed_jobs(client):
    """Test bulk job creation and seed sample jobs endpoint."""
    # 1. Seed textbook jobs
    seed_res = client.post("/jobs/seed")
    assert seed_res.status_code == 201
    assert seed_res.json()["data"]["total_created"] == 5

    # 2. Re-seeding without force skips duplicates
    seed_res2 = client.post("/jobs/seed")
    assert seed_res2.status_code == 201
    assert seed_res2.json()["data"]["total_created"] == 0
    assert len(seed_res2.json()["data"]["skipped_jobs"]) == 5

    # 3. Bulk insert custom batch
    bulk_payload = {
        "jobs": [
            {"job_name": "Batch_A", "deadline": 2, "profit": 200},
            {"job_name": "Batch_B", "deadline": 1, "profit": 80},
        ],
        "allow_duplicates": False
    }
    bulk_res = client.post("/jobs/bulk", json=bulk_payload)
    assert bulk_res.status_code == 201
    assert bulk_res.json()["data"]["total_created"] == 2


def test_batch_mode_scheduling_and_data_isolation(client):
    """Test data isolation: Run #1 (5 jobs), Run #2 (3 jobs), job deletion leaves history intact."""
    # Seed Run #1 jobs: J1..J5
    client.post("/jobs/seed")
    run1_res = client.post("/schedule/run", json={"mode": "ALL_ACTIVE"})
    assert run1_res.status_code == 200
    run1_id = run1_res.json()["data"]["run_id"]
    assert run1_res.json()["data"]["total_jobs_considered"] == 5

    # Add Run #2 batch: J6, J7, J8
    j6 = client.post("/jobs", json={"job_name": "J6", "deadline": 1, "profit": 50}).json()["data"]["id"]
    j7 = client.post("/jobs", json={"job_name": "J7", "deadline": 2, "profit": 150}).json()["data"]["id"]
    j8 = client.post("/jobs", json={"job_name": "J8", "deadline": 2, "profit": 300}).json()["data"]["id"]

    # Run scheduler only for batch J6, J7, J8
    run2_res = client.post("/schedule/run", json={"mode": "BATCH", "job_ids": [j6, j7, j8]})
    assert run2_res.status_code == 200
    run2_id = run2_res.json()["data"]["run_id"]
    assert run2_res.json()["data"]["total_jobs_considered"] == 3
    assert run2_res.json()["data"]["scheduling_mode"] == "BATCH"

    # Verify Run #1 and Run #2 have independent snapshots
    detail1 = client.get(f"/schedule/history/{run1_id}").json()["data"]
    detail2 = client.get(f"/schedule/history/{run2_id}").json()["data"]
    assert detail1["total_jobs"] == 5
    assert detail2["total_jobs"] == 3
    assert {r["job_name"] for r in detail2["results"]} == {"J6", "J7", "J8"}

    # Test Run Comparison
    comp_res = client.post("/schedule/compare", json={"run_ids": [run1_id, run2_id]})
    assert comp_res.status_code == 200
    assert len(comp_res.json()["data"]["runs"]) == 2

    # Delete J1 from active jobs
    jobs_list = client.get("/jobs").json()["data"]
    j1_obj = next(j for j in jobs_list if j["job_name"] == "J1")
    client.delete(f"/jobs/{j1_obj['id']}")

    # Verify Run #1 history is completely intact (data isolation rule!)
    detail1_after = client.get(f"/schedule/history/{run1_id}").json()["data"]
    assert detail1_after["total_jobs"] == 5
    j1_result = next(r for r in detail1_after["results"] if r["job_name"] == "J1")
    assert j1_result["profit"] == 100.0
    assert j1_result["assigned_slot"] == 2
