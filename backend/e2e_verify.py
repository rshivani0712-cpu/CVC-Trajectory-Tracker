import os
import sys
import json
import time
import urllib.request
import urllib.error
import subprocess

def make_request(method, url, data=None, token=None):
    headers = {}
    if data:
        # Check if form data or json
        if isinstance(data, str) and '=' in data:
            headers['Content-Type'] = 'application/x-www-form-urlencoded'
            body = data.encode('utf-8')
        else:
            headers['Content-Type'] = 'application/json'
            body = json.dumps(data).encode('utf-8')
    else:
        body = None

    if token:
        headers['Authorization'] = f'Bearer {token}'
        
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())
    except urllib.error.URLError as e:
        return 0, str(e)

def run_verification():
    print("Starting FastAPI server...")
    
    # We will use sqlite for this E2E test to avoid local Postgres dependency issues.
    env = os.environ.copy()
    env["DATABASE_URL"] = "sqlite:///./e2e_test.db"
    
    # Cleanup previous db if exists
    db_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "e2e_test.db")
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
        except OSError:
            pass
    if os.path.exists("e2e_test.db"):
        try:
            os.remove("e2e_test.db")
        except OSError:
            pass
        
    # Start the server
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000"],
        env=env,
        cwd=os.path.dirname(os.path.abspath(__file__))
    )
    
    try:
        # Wait for server to start
        for i in range(10):
            time.sleep(1)
            status, _ = make_request("GET", "http://127.0.0.1:8000/api/health")
            if status == 200:
                print("Server started successfully.")
                break
        else:
            print("Failed to start server.")
            return False

        print("\n--- Verifying GET /api/health ---")
        status, res = make_request("GET", "http://127.0.0.1:8000/api/health")
        assert status == 200 and res.get("status") == "ok", f"Health check failed: {res}"
        print("Health check PASS")
        
        print("\n--- Verifying Registration ---")
        status, res = make_request("POST", "http://127.0.0.1:8000/api/auth/register", {"username": "trainee1", "password": "password123", "role": "trainee"})
        assert status == 200 and res.get("username") == "trainee1", f"Registration failed: {res}"
        
        status, res = make_request("POST", "http://127.0.0.1:8000/api/auth/register", {"username": "instructor1", "password": "password123", "role": "instructor"})
        assert status == 200, f"Instructor registration failed: {res}"
        print("Registration PASS")

        print("\n--- Verifying Login & JWT ---")
        status, res = make_request("POST", "http://127.0.0.1:8000/api/auth/login", "username=trainee1&password=password123")
        assert status == 200 and "access_token" in res, f"Login failed: {res}"
        trainee_token = res["access_token"]
        
        status, res = make_request("POST", "http://127.0.0.1:8000/api/auth/login", "username=instructor1&password=password123")
        assert status == 200 and "access_token" in res, f"Instructor Login failed: {res}"
        instructor_token = res["access_token"]
        print("Login PASS")

        print("\n--- Verifying Session Creation & Authorization ---")
        status, res = make_request("POST", "http://127.0.0.1:8000/api/sessions", token=trainee_token)
        assert status in [200, 201] and "session_id" in res, f"Session creation failed: {res}"
        session_id = res["session_id"]
        print("Session creation PASS")

        print("\n--- Verifying Trajectory Submission & Calculations ---")
        payload = {
            "position": {"x": 2.0, "y": 1.5, "z": 0.0},
            "pitch": 41.0,
            "yaw": 3.0,
            "depth": 18.0
        }
        
        # Instructor should fail (Role verification)
        status, res = make_request("POST", f"http://127.0.0.1:8000/api/sessions/{session_id}/trajectory", payload, token=instructor_token)
        assert status == 403, f"Role verification failed (instructor allowed): {res}"
        
        # Trainee should pass
        status, traj_res = make_request("POST", f"http://127.0.0.1:8000/api/sessions/{session_id}/trajectory", payload, token=trainee_token)
        assert status == 200, f"Trajectory submission failed: {traj_res}"
        
        assert "pitch" in traj_res and traj_res["pitch"] == 41.0
        assert "yaw" in traj_res and traj_res["yaw"] == 3.0
        assert "angle" in traj_res
        assert "depth" in traj_res and traj_res["depth"] == 18.0
        assert "deviation" in traj_res
        assert "distance_to_target" in traj_res
        assert "distance_to_danger" in traj_res
        assert "status" in traj_res
        assert "score" in traj_res
        assert "feedback" in traj_res
        print("Trajectory Calculations and Thresholds PASS")
        
        print("\n--- Verifying Persistence ---")
        status, sess_res = make_request("GET", f"http://127.0.0.1:8000/api/sessions/{session_id}", token=trainee_token)
        assert status == 200, f"Session retrieval failed: {sess_res}"
        assert len(sess_res["trajectory_records"]) == 1, "Trajectory record not persisted"
        assert sess_res["latest_score"] == traj_res["score"], "Score not updated in session"
        print("Persistence PASS")
        
        print("\nALL E2E CHECKS PASSED!")
        return True
    finally:
        print("\nStopping server...")
        process.terminate()
        process.wait()

if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
