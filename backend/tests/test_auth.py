import unittest
import os
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from fastapi.testclient import TestClient
from app.main import app, startup_event
from app.database import engine
from app.db_models import Base

class TestAuthAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=engine)
        
    def setUp(self):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        startup_event()

    def test_register_user(self):
        res = self.client.post("/api/auth/register", json={
            "username": "testuser",
            "password": "password123",
            "role": "trainee"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["username"], "testuser")
        self.assertEqual(data["role"], "trainee")
        self.assertIn("id", data)

    def test_login_user(self):
        self.client.post("/api/auth/register", json={
            "username": "testuser",
            "password": "password123",
            "role": "trainee"
        })
        
        # OAuth2 password flow expects form data
        res = self.client.post("/api/auth/login", data={
            "username": "testuser",
            "password": "password123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")

    def test_invalid_login(self):
        self.client.post("/api/auth/register", json={"username": "user", "password": "pwd", "role": "trainee"})
        res = self.client.post("/api/auth/login", data={"username": "user", "password": "wrongpassword"})
        self.assertEqual(res.status_code, 401)
        
    def test_role_restrictions(self):
        # Create trainee and instructor
        self.client.post("/api/auth/register", json={"username": "trainee1", "password": "pwd", "role": "trainee"})
        self.client.post("/api/auth/register", json={"username": "instructor1", "password": "pwd", "role": "instructor"})
        self.client.post("/api/auth/register", json={"username": "trainee2", "password": "pwd", "role": "trainee"})
        
        # Login trainee1
        t1_token = self.client.post("/api/auth/login", data={"username": "trainee1", "password": "pwd"}).json()["access_token"]
        t1_headers = {"Authorization": f"Bearer {t1_token}"}

        # Login trainee2
        t2_token = self.client.post("/api/auth/login", data={"username": "trainee2", "password": "pwd"}).json()["access_token"]
        t2_headers = {"Authorization": f"Bearer {t2_token}"}
        
        # Login instructor
        i_token = self.client.post("/api/auth/login", data={"username": "instructor1", "password": "pwd"}).json()["access_token"]
        i_headers = {"Authorization": f"Bearer {i_token}"}
        
        # Trainee 1 creates session
        res_session = self.client.post("/api/sessions", json={"patient_id": "patient_001", "access_site_id": "site_001"}, headers=t1_headers)
        self.assertEqual(res_session.status_code, 201)
        session_id = res_session.json()["session_id"]
        
        # Instructor tries to add trajectory (should fail, restricted to trainee)
        payload = {"position": {"x": 2.0, "y": 1.5, "z": 0.0}, "pitch": 41.0, "yaw": 3.0, "depth": 18.0}
        res_traj_inst = self.client.post(f"/api/sessions/{session_id}/trajectory", json=payload, headers=i_headers)
        self.assertEqual(res_traj_inst.status_code, 403)
        
        # Trainee 1 adds trajectory (should pass)
        res_traj_tr = self.client.post(f"/api/sessions/{session_id}/trajectory", json=payload, headers=t1_headers)
        self.assertEqual(res_traj_tr.status_code, 200)
        
        # Instructor views Trainee 1's session (should pass)
        res_view_inst = self.client.get(f"/api/sessions/{session_id}", headers=i_headers)
        self.assertEqual(res_view_inst.status_code, 200)

        # Trainee 2 tries to view Trainee 1's session (should fail)
        res_view_t2 = self.client.get(f"/api/sessions/{session_id}", headers=t2_headers)
        self.assertEqual(res_view_t2.status_code, 403)

if __name__ == '__main__':
    unittest.main()
