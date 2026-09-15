import unittest
import os

# Override the database URL to use an in-memory SQLite database before any SQLAlchemy models load
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from fastapi.testclient import TestClient
from app.main import app, startup_event
from app.database import engine
from app.db_models import Base

class TestSessionAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=engine)
        
    def setUp(self):
        # Ensure a clean slate before each test
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        startup_event()
        
        # Create a test user and get auth token for session tests
        self.client.post("/api/auth/register", json={
            "username": "testtrainee",
            "password": "testpassword",
            "role": "trainee"
        })
        login_res = self.client.post("/api/auth/login", data={
            "username": "testtrainee",
            "password": "testpassword"
        })
        self.token = login_res.json()["access_token"]
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}

    def test_create_session(self):
        response = self.client.post("/api/sessions", json={"patient_id": "patient_001", "access_site_id": "site_001"}, headers=self.auth_headers)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        
        self.assertIn("session_id", data)
        self.assertIn("start_time", data)
        self.assertEqual(len(data["trajectory_records"]), 0)
        self.assertIsNone(data.get("latest_score"))
        self.assertIsNone(data.get("final_score"))

    def test_get_session(self):
        create_resp = self.client.post("/api/sessions", json={"patient_id": "patient_001", "access_site_id": "site_001"}, headers=self.auth_headers)
        session_id = create_resp.json()["session_id"]
        
        get_resp = self.client.get(f"/api/sessions/{session_id}", headers=self.auth_headers)
        self.assertEqual(get_resp.status_code, 200)
        self.assertEqual(get_resp.json()["session_id"], session_id)

    def test_get_invalid_session(self):
        get_resp = self.client.get("/api/sessions/invalid-session-id", headers=self.auth_headers)
        self.assertEqual(get_resp.status_code, 404)

    def test_add_trajectory_to_session(self):
        create_resp = self.client.post("/api/sessions", json={"patient_id": "patient_001", "access_site_id": "site_001"}, headers=self.auth_headers)
        session_id = create_resp.json()["session_id"]
        
        payload = {
            "position": {"x": 2.0, "y": 1.5, "z": 0.0},
            "pitch": 41.0,
            "yaw": 3.0,
            "depth": 18.0
        }
        
        # Post the trajectory
        traj_resp = self.client.post(f"/api/sessions/{session_id}/trajectory", json=payload, headers=self.auth_headers)
        self.assertEqual(traj_resp.status_code, 200)
        
        # Verify the session recorded it correctly
        get_resp = self.client.get(f"/api/sessions/{session_id}", headers=self.auth_headers)
        session_data = get_resp.json()
        
        self.assertEqual(len(session_data["trajectory_records"]), 1)
        record = session_data["trajectory_records"][0]
        
        self.assertIn("timestamp", record)
        self.assertEqual(record["pitch"], 41.0)
        self.assertEqual(record["depth"], 18.0)
        self.assertIn("score", record)
        self.assertIn("status", record)
        
        # Verify score propagation
        self.assertEqual(session_data["latest_score"], record["score"])
        self.assertEqual(session_data["final_score"], record["score"])

    def test_create_session_invalid_patient(self):
        response = self.client.post("/api/sessions", json={"patient_id": "patient_999", "access_site_id": "site_001"}, headers=self.auth_headers)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Patient not found")

    def test_create_session_invalid_site(self):
        response = self.client.post("/api/sessions", json={"patient_id": "patient_001", "access_site_id": "site_999"}, headers=self.auth_headers)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Access site not found")

    def test_add_trajectory_uses_session_configuration(self):
        # Fat Male (patient_001) + Neck (site_001) -> max_depth_warning = 6.0, max_depth_risk = 7.0
        # Skinny Male (patient_002) + Neck (site_001) -> max_depth_warning = 3.0, max_depth_risk = 4.0
        
        # Create session for Fat Male
        fat_resp = self.client.post("/api/sessions", json={"patient_id": "patient_001", "access_site_id": "site_001"}, headers=self.auth_headers)
        fat_session_id = fat_resp.json()["session_id"]
        
        # Create session for Skinny Male
        skinny_resp = self.client.post("/api/sessions", json={"patient_id": "patient_002", "access_site_id": "site_001"}, headers=self.auth_headers)
        skinny_session_id = skinny_resp.json()["session_id"]
        
        # A trajectory with depth 4.5
        payload = {
            "position": {"x": 2.0, "y": 1.5, "z": 4.5},
            "pitch": 45.0, # Just normal angle
            "yaw": 0.0,
            "depth": 4.5
        }
        
        fat_traj = self.client.post(f"/api/sessions/{fat_session_id}/trajectory", json=payload, headers=self.auth_headers)
        skinny_traj = self.client.post(f"/api/sessions/{skinny_session_id}/trajectory", json=payload, headers=self.auth_headers)
        
        # Fat patient: 4.5 is below warning (6.0), so status might be PASSED (depending on other factors, but not HIGH RISK for depth)
        fat_status = fat_traj.json()["status"]
        
        # Skinny patient: 4.5 is above risk (4.0), so status MUST be FAILED (due to HIGH RISK)
        skinny_status = skinny_traj.json()["status"]
        
        self.assertNotEqual(fat_status, "FAILED", f"Fat patient should not fail on depth 4.5. Status: {fat_status}")
        self.assertEqual(skinny_status, "FAILED", f"Skinny patient should fail on depth 4.5. Status: {skinny_status}")
        self.assertIn("Safety bound breached", skinny_traj.json()["feedback"])

if __name__ == "__main__":
    unittest.main()
