import os
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import json
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, get_db
from app.db_models import User
from app.auth import get_password_hash

client = TestClient(app)

def run_verification():
    # Setup DB
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    
    # Create test users
    db.query(User).filter(User.username.in_(["v_trainee", "v_other", "v_inst"])).delete()
    trainee = User(id="v_trainee", username="v_trainee", hashed_password=get_password_hash("pass"), role="trainee")
    other = User(id="v_other", username="v_other", hashed_password=get_password_hash("pass"), role="trainee")
    instructor = User(id="v_inst", username="v_inst", hashed_password=get_password_hash("pass"), role="instructor")
    db.add_all([trainee, other, instructor])
    db.commit()
    
    # Login
    resp = client.post("/api/auth/login", data={"username": "v_trainee", "password": "pass"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = client.post("/api/auth/login", data={"username": "v_other", "password": "pass"})
    other_token = resp.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}
    
    resp = client.post("/api/auth/login", data={"username": "v_inst", "password": "pass"})
    inst_token = resp.json()["access_token"]
    inst_headers = {"Authorization": f"Bearer {inst_token}"}

    results = {}

    def simulate_session(positions, pitches, yaws, depths):
        # Create session
        resp = client.post("/api/sessions", headers=headers)
        session_id = resp.json()["session_id"]
        
        # Add trajectories
        for i in range(len(positions)):
            payload = {
                "position": positions[i],
                "pitch": pitches[i],
                "yaw": yaws[i],
                "depth": depths[i]
            }
            client.post(f"/api/sessions/{session_id}/trajectory", json=payload, headers=headers)
            
        # Get analysis
        resp = client.get(f"/api/sessions/{session_id}/ai-analysis", headers=headers)
        return resp.json()

    # Good Trajectory (A)
    try:
        # Ideal target is (0,0,0). 
        # Position slightly offset but safe.
        # pitch ~40 deg. yaw ~0.
        pos = [{"x": 1.0, "y": 1.0, "z": 0.0}] * 3
        pitches = [40.0, 40.0, 40.0]
        yaws = [0.0, 0.0, 0.0]
        depths = [1.0, 2.0, 3.0]
        analysis = simulate_session(pos, pitches, yaws, depths)
        
        if analysis["technique"] == "GOOD_TECHNIQUE":
            results["Good trajectory"] = "PASS"
        else:
            results["Good trajectory"] = f"FAIL (Got {analysis['technique']})"
    except Exception as e:
        results["Good trajectory"] = f"FAIL ({e})"

    # Excessive Angle (B)
    try:
        # Pitch very high, e.g. 80 degrees
        pos = [{"x": 1.0, "y": 1.0, "z": 0.0}] * 3
        pitches = [80.0, 80.0, 80.0]
        yaws = [0.0, 0.0, 0.0]
        depths = [1.0, 2.0, 3.0]
        analysis = simulate_session(pos, pitches, yaws, depths)
        
        if analysis["technique"] == "EXCESSIVE_ANGLE" and "angle" in " ".join(analysis["weaknesses"]).lower():
            results["Excessive angle"] = "PASS"
        else:
            results["Excessive angle"] = f"FAIL (Got {analysis['technique']})"
    except Exception as e:
        results["Excessive angle"] = f"FAIL ({e})"

    # Excessive Yaw (C)
    try:
        pos = [{"x": 1.0, "y": 1.0, "z": 0.0}] * 3
        pitches = [40.0, 40.0, 40.0]
        yaws = [30.0, 35.0, 30.0] # High yaw
        depths = [1.0, 2.0, 3.0]
        analysis = simulate_session(pos, pitches, yaws, depths)
        
        if analysis["technique"] == "EXCESSIVE_YAW" and "lateral" in " ".join(analysis["weaknesses"]).lower():
            results["Excessive yaw"] = "PASS"
        else:
            results["Excessive yaw"] = f"FAIL (Got {analysis['technique']})"
    except Exception as e:
        results["Excessive yaw"] = f"FAIL ({e})"

    # Excessive Depth (D)
    try:
        pos = [{"x": 1.0, "y": 1.0, "z": 0.0}] * 3
        pitches = [40.0, 40.0, 40.0]
        yaws = [0.0, 0.0, 0.0]
        depths = [2.0, 6.0, 8.0] # max risk depth is 5.0
        analysis = simulate_session(pos, pitches, yaws, depths)
        
        if analysis["technique"] == "EXCESSIVE_DEPTH":
            results["Excessive depth"] = "PASS"
        else:
            results["Excessive depth"] = f"FAIL (Got {analysis['technique']})"
    except Exception as e:
        results["Excessive depth"] = f"FAIL ({e})"

    # Unstable Trajectory (E)
    try:
        # High variance in pitch and yaw
        pos = [{"x": 1.0, "y": 1.0, "z": 0.0}] * 5
        pitches = [40.0, 60.0, 20.0, 50.0, 30.0]
        yaws = [-10.0, 20.0, -20.0, 10.0, -5.0]
        depths = [1.0, 2.0, 3.0, 4.0, 5.0]
        analysis = simulate_session(pos, pitches, yaws, depths)
        
        if analysis["technique"] == "UNSTABLE_TRAJECTORY":
            results["Unstable trajectory"] = "PASS"
        else:
            results["Unstable trajectory"] = f"FAIL (Got {analysis['technique']})"
    except Exception as e:
        results["Unstable trajectory"] = f"FAIL ({e})"

    # Multiple Violations (F)
    try:
        # Bad angle AND bad depth
        pos = [{"x": 1.0, "y": 1.0, "z": 0.0}] * 3
        pitches = [80.0, 80.0, 80.0]
        yaws = [0.0, 0.0, 0.0]
        depths = [2.0, 6.0, 8.0]
        analysis = simulate_session(pos, pitches, yaws, depths)
        
        if analysis["technique"] == "MULTIPLE_VIOLATIONS":
            results["Multiple violations"] = "PASS"
        else:
            results["Multiple violations"] = f"FAIL (Got {analysis['technique']})"
    except Exception as e:
        results["Multiple violations"] = f"FAIL ({e})"

    # Authorization & Edge Cases
    try:
        auth_passes = True
        
        # Create a session with trainee
        resp = client.post("/api/sessions", headers=headers)
        session_id = resp.json()["session_id"]
        
        # 1. Nonexistent
        resp_404 = client.get("/api/sessions/fake_id/ai-analysis", headers=headers)
        if resp_404.status_code != 404: auth_passes = False
        
        # 2. Unauthorized trainee
        resp_403 = client.get(f"/api/sessions/{session_id}/ai-analysis", headers=other_headers)
        if resp_403.status_code != 403: auth_passes = False
        
        # 3. Instructor can access
        resp_inst = client.get(f"/api/sessions/{session_id}/ai-analysis", headers=inst_headers)
        if resp_inst.status_code != 200: auth_passes = False
        
        # 4. Empty session safely handled
        analysis = resp_inst.json()
        if "Insufficient data" not in analysis["summary"]: auth_passes = False
        
        results["Authorization"] = "PASS" if auth_passes else "FAIL"
    except Exception as e:
        results["Authorization"] = f"FAIL ({e})"

    all_pass = all(v == "PASS" for v in results.values())
    results["AI API"] = "PASS" if all_pass else "FAIL"
    results["End-to-end pipeline"] = "PASS" if all_pass else "FAIL"
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    run_verification()
