import unittest
from fastapi.testclient import TestClient
from app.main import app, startup_event
from app.database import Base, engine, get_db
from app.db_models import User
from app.auth import get_password_hash

class TestConfigurationAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        # Run startup event to seed patients and access sites
        startup_event()
        
        cls.client = TestClient(app)
        
        db = next(get_db())
        
        # Create a test user for authentication
        db.query(User).filter(User.username == "config_tester").delete()
        cls.user = User(
            id="test_config_user",
            username="config_tester",
            hashed_password=get_password_hash("testpass"),
            role="trainee"
        )
        db.add(cls.user)
        db.commit()

    def setUp(self):
        # Login to get token
        response = self.client.post(
            "/api/auth/login",
            data={"username": "config_tester", "password": "testpass"}
        )
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_get_configuration_fat_male_neck(self):
        # Fat Male (patient_001) + Neck (site_001)
        response = self.client.post(
            "/api/training/configuration",
            headers=self.headers,
            json={
                "patient_id": "patient_001",
                "access_site_id": "site_001"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["patient"]["patient_id"], "patient_001")
        self.assertEqual(data["access_site"]["name"], "Neck")
        self.assertEqual(data["target_vessel"], "Internal Jugular Vein")
        
        params = data["training_parameters"]
        # Base max_depth_warning is 4.0. Fat adds 2.0 -> 6.0
        self.assertEqual(params["max_depth_warning"], 6.0)
        # Base max_depth_risk is 5.0. Fat adds 2.0 -> 7.0
        self.assertEqual(params["max_depth_risk"], 7.0)
        # Neck reduces max_entry_angle from 0.87 to 0.77
        self.assertAlmostEqual(params["max_entry_angle"], 0.77, places=5)

    def test_get_configuration_teen_chest(self):
        # Teen (patient_005) + Chest (site_002)
        response = self.client.post(
            "/api/training/configuration",
            headers=self.headers,
            json={
                "patient_id": "patient_005",
                "access_site_id": "site_002"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["patient"]["patient_id"], "patient_005")
        self.assertEqual(data["access_site"]["name"], "Chest")
        
        params = data["training_parameters"]
        # Base warning depth is 4.0. Teen decreases by 1.0 -> 3.0
        self.assertEqual(params["max_depth_warning"], 3.0)
        # Chest increases min_distance_vessel_warning by 0.5 (from 1.0 -> 1.5)
        self.assertEqual(params["min_distance_vessel_warning"], 1.5)

    def test_get_configuration_skinny_female_groin(self):
        # Skinny Female (patient_004) + Groin (site_003)
        response = self.client.post(
            "/api/training/configuration",
            headers=self.headers,
            json={
                "patient_id": "patient_004",
                "access_site_id": "site_003"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        params = data["training_parameters"]
        # Skinny decreases max_depth_warning by 1.0. Groin increases it by 1.0. Net is +0.0 => 4.0
        self.assertEqual(params["max_depth_warning"], 4.0)

    def test_get_configuration_invalid_patient(self):
        response = self.client.post(
            "/api/training/configuration",
            headers=self.headers,
            json={
                "patient_id": "patient_999",
                "access_site_id": "site_001"
            }
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Patient not found")

    def test_get_configuration_invalid_site(self):
        response = self.client.post(
            "/api/training/configuration",
            headers=self.headers,
            json={
                "patient_id": "patient_001",
                "access_site_id": "site_999"
            }
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Access site not found")

    def test_unauthenticated_access(self):
        response = self.client.post(
            "/api/training/configuration",
            json={
                "patient_id": "patient_001",
                "access_site_id": "site_001"
            }
        )
        self.assertEqual(response.status_code, 401)

if __name__ == "__main__":
    unittest.main()
