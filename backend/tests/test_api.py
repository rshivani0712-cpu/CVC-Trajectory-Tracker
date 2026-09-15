import unittest
import os
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
from fastapi.testclient import TestClient
from app.main import app

class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_trajectory_analyze(self):
        payload = {
            "position": {
                "x": 2.0,
                "y": 1.5,
                "z": 0.0
            },
            "pitch": 41.0,
            "yaw": 3.0,
            "depth": 18.0
        }
        
        response = self.client.post("/api/trajectory/analyze", json=payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        
        # Validate returned schema maps exactly to endpoints
        self.assertIn("angle", data)
        self.assertIn("pitch", data)
        self.assertIn("yaw", data)
        self.assertIn("depth", data)
        self.assertIn("deviation", data)
        self.assertIn("distance_to_target", data)
        self.assertIn("distance_to_danger", data)
        self.assertIn("status", data)
        self.assertIn("score", data)
        self.assertIn("feedback", data)
        
        # Check preserved input fields
        self.assertEqual(data["pitch"], 41.0)
        self.assertEqual(data["yaw"], 3.0)
        self.assertEqual(data["depth"], 18.0)
        
        # Verify calculated values and integrated logic
        self.assertIsInstance(data["distance_to_target"], float)
        self.assertIsInstance(data["distance_to_danger"], float)
        self.assertIsInstance(data["score"], int)
        self.assertIsInstance(data["status"], str)
        self.assertIsInstance(data["feedback"], str)
        
        print("\nTest Payload:", payload)
        print("API Response:", data)

if __name__ == '__main__':
    unittest.main()
