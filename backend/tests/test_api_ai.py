import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, engine
from app.db_models import Base, User, TrainingSession, TrajectoryRecord
from app.auth import get_password_hash

class TestAPIAIAnalysis(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        Base.metadata.create_all(bind=engine)
        
        # We need a user to authenticate
        db = next(get_db())
        
        # Clean db if dirty
        db.query(TrajectoryRecord).delete()
        db.query(TrainingSession).delete()
        db.query(User).delete()
        db.commit()
        
        # Create a trainee
        trainee = User(
            id="trainee_id", 
            username="ai_trainee", 
            hashed_password=get_password_hash("password123"), 
            role="trainee"
        )
        # Create another trainee to test unauthorized access
        other = User(
            id="other_id",
            username="other_trainee",
            hashed_password=get_password_hash("password123"),
            role="trainee"
        )
        db.add(trainee)
        db.add(other)
        db.commit()
        
        # Create a session with records
        session1 = TrainingSession(
            session_id="session_with_data",
            user_id="trainee_id",
            final_score=85
        )
        db.add(session1)
        db.commit()
        
        records = [
            TrajectoryRecord(session_id="session_with_data", pitch=45.0, yaw=0.0, depth=1.0, deviation=0.5, vessel_distance_target=10.0, vessel_distance_danger=15.0, status="WITHIN_THRESHOLD", score=90),
            TrajectoryRecord(session_id="session_with_data", pitch=46.0, yaw=1.0, depth=2.0, deviation=0.6, vessel_distance_target=9.0, vessel_distance_danger=14.0, status="WITHIN_THRESHOLD", score=85),
            TrajectoryRecord(session_id="session_with_data", pitch=47.0, yaw=2.0, depth=3.0, deviation=0.7, vessel_distance_target=8.0, vessel_distance_danger=13.0, status="WITHIN_THRESHOLD", score=80),
        ]
        db.add_all(records)
        db.commit()
        
        # Create an empty session
        session2 = TrainingSession(
            session_id="session_empty",
            user_id="trainee_id",
            final_score=None
        )
        db.add(session2)
        db.commit()
        db.close()
        
        # Login to get tokens
        resp = self.client.post("/api/auth/login", data={"username": "ai_trainee", "password": "password123"})
        self.trainee_token = resp.json()["access_token"]
        
        resp2 = self.client.post("/api/auth/login", data={"username": "other_trainee", "password": "password123"})
        self.other_token = resp2.json()["access_token"]
        
    def tearDown(self):
        db = next(get_db())
        db.query(TrajectoryRecord).delete()
        db.query(TrainingSession).delete()
        db.query(User).delete()
        db.commit()
        db.close()

    def test_authenticated_valid_session_with_records(self):
        headers = {"Authorization": f"Bearer {self.trainee_token}"}
        resp = self.client.get("/api/sessions/session_with_data/ai-analysis", headers=headers)
        self.assertEqual(resp.status_code, 200)
        
        data = resp.json()
        self.assertEqual(data["session_id"], "session_with_data")
        self.assertIn("performance_level", data)
        self.assertIn("technique", data)
        self.assertIn("strengths", data)
        self.assertIn("weaknesses", data)
        self.assertIn("recommendations", data)
        self.assertIn("summary", data)
        
        # Check actual values based on our records (Good pitch, no violations)
        self.assertEqual(data["performance_level"], "GOOD") 
        self.assertEqual(data["technique"], "GOOD_TECHNIQUE")
        self.assertEqual(data["score"], 85)

    def test_nonexistent_session(self):
        headers = {"Authorization": f"Bearer {self.trainee_token}"}
        resp = self.client.get("/api/sessions/fake_session_id/ai-analysis", headers=headers)
        self.assertEqual(resp.status_code, 404)

    def test_unauthorized_access(self):
        headers = {"Authorization": f"Bearer {self.other_token}"}
        resp = self.client.get("/api/sessions/session_with_data/ai-analysis", headers=headers)
        self.assertEqual(resp.status_code, 403)
        self.assertIn("Not authorized", resp.json()["detail"])

    def test_session_no_trajectory_records(self):
        headers = {"Authorization": f"Bearer {self.trainee_token}"}
        resp = self.client.get("/api/sessions/session_empty/ai-analysis", headers=headers)
        self.assertEqual(resp.status_code, 200)
        
        data = resp.json()
        self.assertEqual(data["session_id"], "session_empty")
        self.assertEqual(data["technique"], "GOOD_TECHNIQUE")
        self.assertIn("Insufficient data", data["summary"])
        self.assertEqual(data["score"], 0)

if __name__ == '__main__':
    unittest.main()
