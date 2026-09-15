import unittest
from fastapi.testclient import TestClient
from app.main import app, startup_event
from app.database import Base, engine, get_db
from app.db_models import User, Patient
from app.auth import get_password_hash

class TestPatientsAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        # Run startup event to seed patients
        startup_event()
        
        cls.client = TestClient(app)
        
        db = next(get_db())
        
        # Create a test user for authentication
        db.query(User).filter(User.username == "patient_tester").delete()
        cls.user = User(
            id="test_patient_user",
            username="patient_tester",
            hashed_password=get_password_hash("testpass"),
            role="trainee"
        )
        db.add(cls.user)
        db.commit()

    def setUp(self):
        # Login to get token
        response = self.client.post(
            "/api/auth/login",
            data={"username": "patient_tester", "password": "testpass"}
        )
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_list_patients(self):
        response = self.client.get("/api/patients", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(len(data), 5)
        
        patient_ids = [p["patient_id"] for p in data]
        self.assertIn("patient_001", patient_ids)
        self.assertIn("patient_005", patient_ids)
        
        # Verify specific details of the first patient
        p1 = next(p for p in data if p["patient_id"] == "patient_001")
        self.assertEqual(p1["display_name"], "John (Fat Male)")
        self.assertEqual(p1["bmi_category"], "fat")
        self.assertEqual(p1["anatomy_model_reference"], "models/patients/fat_male.glb")

    def test_get_specific_patient(self):
        response = self.client.get("/api/patients/patient_004", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["display_name"], "Emma (Skinny Female)")
        self.assertEqual(data["sex"], "female")
        self.assertEqual(data["weight"], 50.0)
        self.assertEqual(data["anatomy_model_reference"], "models/patients/skinny_female.glb")

    def test_get_nonexistent_patient(self):
        response = self.client.get("/api/patients/patient_999", headers=self.headers)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Patient not found")

    def test_unauthenticated_access(self):
        response = self.client.get("/api/patients")
        self.assertEqual(response.status_code, 401)
        
        response2 = self.client.get("/api/patients/patient_001")
        self.assertEqual(response2.status_code, 401)

if __name__ == "__main__":
    unittest.main()
