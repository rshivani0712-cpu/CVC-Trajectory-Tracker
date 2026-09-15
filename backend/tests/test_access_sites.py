import unittest
from fastapi.testclient import TestClient
from app.main import app, startup_event
from app.database import Base, engine, get_db
from app.db_models import User, AccessSite
from app.auth import get_password_hash

class TestAccessSitesAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        # Run startup event to seed access sites
        startup_event()
        
        cls.client = TestClient(app)
        
        db = next(get_db())
        
        # Create a test user for authentication
        db.query(User).filter(User.username == "access_tester").delete()
        cls.user = User(
            id="test_access_user",
            username="access_tester",
            hashed_password=get_password_hash("testpass"),
            role="trainee"
        )
        db.add(cls.user)
        db.commit()

    def setUp(self):
        # Login to get token
        response = self.client.post(
            "/api/auth/login",
            data={"username": "access_tester", "password": "testpass"}
        )
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_list_access_sites(self):
        response = self.client.get("/api/access-sites", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(len(data), 4)
        
        site_names = [s["name"] for s in data]
        self.assertIn("Neck", site_names)
        self.assertIn("Chest", site_names)
        self.assertIn("Groin", site_names)
        self.assertIn("Arms", site_names)
        
        # Verify specific details of the first site
        s1 = next(s for s in data if s["access_site_id"] == "site_001")
        self.assertEqual(s1["name"], "Neck")
        self.assertEqual(s1["target_vessel"], "Internal Jugular Vein")
        self.assertEqual(s1["danger_vessel"], "Common Carotid Artery")

    def test_get_specific_access_site(self):
        response = self.client.get("/api/access-sites/site_003", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["name"], "Groin")
        self.assertEqual(data["target_vessel"], "Femoral Vein")
        self.assertEqual(data["danger_vessel"], "Femoral Artery")

    def test_get_nonexistent_access_site(self):
        response = self.client.get("/api/access-sites/site_999", headers=self.headers)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Access site not found")

    def test_unauthenticated_access(self):
        response = self.client.get("/api/access-sites")
        self.assertEqual(response.status_code, 401)
        
        response2 = self.client.get("/api/access-sites/site_001")
        self.assertEqual(response2.status_code, 401)

if __name__ == "__main__":
    unittest.main()
