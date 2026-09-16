import math
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import timedelta

from .models import TrajectoryAnalyzeRequest, TrajectoryAnalyzeResponse, UserCreate, UserResponse, Token, PatientResponse, AccessSiteResponse, TrainingConfigurationRequest, TrainingConfigurationResponse, SessionCreateRequest
import json
from .trajectory import calculate_entry_angle
from .thresholds import evaluate_simulation_state, TrainingThresholds
from .scoring import calculate_training_score
from .vessel import calculate_target_and_danger_distances, calculate_trajectory_deviation_from_target
from .session import create_session, get_session, add_trajectory_record
from .database import engine, get_db
from . import db_models, auth
from .ai.performance import analyze_performance
from .configuration import get_training_configuration

app = FastAPI(title="CVC Digital Twin Simulator API")

@app.on_event("startup")
def startup_event():
    db_models.Base.metadata.create_all(bind=engine)
    
    # Seed Patients
    db = next(get_db())
    try:
        if db.query(db_models.Patient).count() == 0:
            patients = [
                db_models.Patient(
                    patient_id="patient_001",
                    display_name="John (Fat Male)",
                    age_group="adult",
                    sex="male",
                    body_type="obese",
                    bmi_category="fat",
                    height=175.0,
                    weight=110.0,
                    anatomy_model_reference="models/patients/fat_male.glb"
                ),
                db_models.Patient(
                    patient_id="patient_002",
                    display_name="Mike (Skinny Male)",
                    age_group="adult",
                    sex="male",
                    body_type="underweight",
                    bmi_category="skinny",
                    height=180.0,
                    weight=60.0,
                    anatomy_model_reference="models/patients/skinny_male.glb"
                ),
                db_models.Patient(
                    patient_id="patient_003",
                    display_name="Sarah (Fat Female)",
                    age_group="adult",
                    sex="female",
                    body_type="obese",
                    bmi_category="fat",
                    height=160.0,
                    weight=95.0,
                    anatomy_model_reference="models/patients/fat_female.glb"
                ),
                db_models.Patient(
                    patient_id="patient_004",
                    display_name="Emma (Skinny Female)",
                    age_group="adult",
                    sex="female",
                    body_type="underweight",
                    bmi_category="skinny",
                    height=165.0,
                    weight=50.0,
                    anatomy_model_reference="models/patients/skinny_female.glb"
                ),
                db_models.Patient(
                    patient_id="patient_005",
                    display_name="Alex (Teen)",
                    age_group="teen",
                    sex="male",
                    body_type="average",
                    bmi_category="normal",
                    height=150.0,
                    weight=45.0,
                    anatomy_model_reference="models/patients/teen.glb"
                )
            ]
            db.add_all(patients)
            db.commit()
            
        if db.query(db_models.AccessSite).count() == 0:
            access_sites = [
                db_models.AccessSite(
                    access_site_id="site_001",
                    name="Neck",
                    target_vessel="Internal Jugular Vein",
                    danger_vessel="Common Carotid Artery",
                    training_configuration_reference="configs/access_sites/neck.json"
                ),
                db_models.AccessSite(
                    access_site_id="site_002",
                    name="Chest",
                    target_vessel="Subclavian Vein",
                    danger_vessel="Subclavian Artery",
                    training_configuration_reference="configs/access_sites/chest.json"
                ),
                db_models.AccessSite(
                    access_site_id="site_003",
                    name="Groin",
                    target_vessel="Femoral Vein",
                    danger_vessel="Femoral Artery",
                    training_configuration_reference="configs/access_sites/groin.json"
                ),
                db_models.AccessSite(
                    access_site_id="site_004",
                    name="Arms",
                    target_vessel="Basilic Vein",
                    danger_vessel="Brachial Artery",
                    training_configuration_reference="configs/access_sites/arms.json"
                )
            ]
            db.add_all(access_sites)
            db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

# Basic CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# --- Auth Endpoints ---

@app.post("/api/auth/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(db_models.User).filter(db_models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_password = auth.get_password_hash(user.password)
    new_user = db_models.User(
        username=user.username,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(db_models.User).filter(db_models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


def process_trajectory_request(request: TrajectoryAnalyzeRequest, thresholds: TrainingThresholds = None) -> TrajectoryAnalyzeResponse:
    """Core logic extracted to be reused by both the simple analyze and the session routes."""
    pitch_rad = math.radians(request.pitch)
    yaw_rad = math.radians(request.yaw)
    
    nx = math.cos(pitch_rad) * math.cos(yaw_rad)
    ny = math.cos(pitch_rad) * math.sin(yaw_rad)
    nz = math.sin(pitch_rad)
    needle_vector = (nx, ny, nz)
    surface_normal = (0.0, 0.0, 1.0)
    
    try:
        angle_rad = calculate_entry_angle(needle_vector, surface_normal)
        angle_deg = math.degrees(angle_rad)
    except ValueError:
        angle_rad = 0.0
        angle_deg = 0.0
        
    current_pos = (request.position.x, request.position.y, request.position.z)
    ideal_entry_point = (0.0, 0.0, 0.0) 
    
    dist_target, dist_danger = calculate_target_and_danger_distances(current_pos)
    deviation = calculate_trajectory_deviation_from_target(current_pos, ideal_entry_point)
    
    risk_level = evaluate_simulation_state(
        entry_angle=angle_rad,
        yaw_deviation=yaw_rad,
        depth=request.depth,
        distance_to_vessel=dist_danger,
        thresholds=thresholds
    )
    
    ideal_angle = math.radians(45.0)
    
    score_result = calculate_training_score(
        entry_angle_deviation=(angle_rad - ideal_angle),
        yaw_deviation=yaw_rad,
        depth_deviation=deviation,
        distance_to_target=dist_target,
        distance_to_danger=dist_danger,
        risk_level=risk_level
    )
    
    return TrajectoryAnalyzeResponse(
        angle=round(angle_deg, 2),
        pitch=request.pitch,
        yaw=request.yaw,
        depth=request.depth,
        deviation=round(deviation, 2),
        distance_to_target=round(dist_target, 2),
        distance_to_danger=round(dist_danger, 2),
        status=score_result.status,
        score=score_result.score,
        feedback=score_result.feedback_message
    )


@app.post("/api/trajectory/analyze", response_model=TrajectoryAnalyzeResponse)
def analyze_trajectory(request: TrajectoryAnalyzeRequest):
    return process_trajectory_request(request)


# --- Session Management Endpoints ---

@app.post("/api/sessions", status_code=201)
def start_session(request: Optional[SessionCreateRequest] = None, db: Session = Depends(get_db), current_user: db_models.User = Depends(auth.RequireRole(["trainee", "instructor", "admin"]))):
    """Initialize a new simulation training session with a specific patient and access site."""
    if db.query(db_models.Patient).count() == 0 or db.query(db_models.AccessSite).count() == 0:
        startup_event()

    req_patient_id = (request.patient_id if request and request.patient_id is not None else None) or "patient_001"
    req_site_id = (request.access_site_id if request and request.access_site_id is not None else None) or "site_001"

    patient = db.query(db_models.Patient).filter(db_models.Patient.patient_id == req_patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    site = db.query(db_models.AccessSite).filter(db_models.AccessSite.access_site_id == req_site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Access site not found")
        
    config = get_training_configuration(patient, site)
    config_json = json.dumps(config.model_dump())
    
    session = create_session(
        db, 
        user_id=current_user.id,
        patient_id=req_patient_id,
        access_site_id=req_site_id,
        training_configuration=config_json
    )
    return {
        "session_id": session.session_id,
        "start_time": session.start_time,
        "latest_score": session.latest_score,
        "final_score": session.final_score,
        "trajectory_records": session.records,
        "patient_id": session.patient_id,
        "access_site_id": session.access_site_id,
        "training_configuration": session.training_configuration
    }

from .ai.performance import analyze_performance
@app.get("/api/sessions/{session_id}")
def retrieve_session(session_id: str, db: Session = Depends(get_db), current_user: db_models.User = Depends(auth.get_current_user)):
    """Retrieve an existing training session from the database. Enforces RBAC."""
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Trainees can only view their own sessions
    if current_user.role == "trainee" and session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this session")
        
    # Fetch patient and site
    patient = None
    if session.patient_id:
        patient = db.query(db_models.Patient).filter(db_models.Patient.patient_id == session.patient_id).first()
        
    access_site = None
    if session.access_site_id:
        access_site = db.query(db_models.AccessSite).filter(db_models.AccessSite.access_site_id == session.access_site_id).first()
        
    # Histories
    pitch_history = []
    yaw_history = []
    depth_history = []
    entry_angle_history = []
    deviation_history = []
    vessel_distance_history = []
    status_changes = []
    
    violations = 0
    last_status = None
    
    for record in session.records:
        pitch_history.append(record.pitch)
        yaw_history.append(record.yaw)
        depth_history.append(record.depth)
        deviation_history.append(record.deviation)
        vessel_distance_history.append(record.vessel_distance_danger)
        
        # calculate angle
        pitch_rad = math.radians(record.pitch)
        yaw_rad = math.radians(record.yaw)
        nx = math.cos(pitch_rad) * math.cos(yaw_rad)
        ny = math.cos(pitch_rad) * math.sin(yaw_rad)
        nz = math.sin(pitch_rad)
        
        try:
            angle_rad = calculate_entry_angle((nx, ny, nz), (0.0, 0.0, 1.0))
            angle_deg = math.degrees(angle_rad)
        except Exception:
            angle_deg = 0.0
            
        entry_angle_history.append(round(angle_deg, 2))
        
        if record.status != last_status:
            status_changes.append({"timestamp": record.timestamp.isoformat(), "status": record.status})
            last_status = record.status
            
        if record.status in ["FAILED", "HIGH_RISK"]:
            violations += 1
            
    # AI analysis
    ai_analysis = None
    if session.records:
        analysis = analyze_performance(session)
        analysis["session_id"] = session.session_id
        score = 0
        if session.final_score is not None:
            score = session.final_score
        elif session.latest_score is not None:
            score = session.latest_score
        analysis["score"] = score
        ai_analysis = analysis

    return {
        "session_id": session.session_id,
        "start_time": session.start_time,
        "end_time": session.end_time,
        "latest_score": session.latest_score,
        "final_score": session.final_score,
        "patient": patient,
        "access_site": access_site,
        "training_configuration": session.training_configuration,
        "trajectory_records": session.records,
        "pitch_history": pitch_history,
        "yaw_history": yaw_history,
        "depth_history": depth_history,
        "entry_angle_history": entry_angle_history,
        "deviation_history": deviation_history,
        "vessel_distance_history": vessel_distance_history,
        "status_changes": status_changes,
        "violations": violations,
        "ai_analysis": ai_analysis
    }

@app.post("/api/sessions/{session_id}/trajectory", response_model=TrajectoryAnalyzeResponse)
def add_trajectory_to_session(session_id: str, request: TrajectoryAnalyzeRequest, db: Session = Depends(get_db), current_user: db_models.User = Depends(auth.RequireRole(["trainee"]))):
    """Process a trajectory input and record it against the session. Only Trainees can do this to their own session."""
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this session")
        
    # Decode the session's historical training configuration
    session_thresholds = None
    if session.training_configuration:
        try:
            config_dict = json.loads(session.training_configuration)
            session_thresholds = TrainingThresholds(**config_dict)
        except Exception:
            pass
            
    # Run identical analysis logic with session's thresholds
    response = process_trajectory_request(request, thresholds=session_thresholds)
    
    # Save the record
    add_trajectory_record(
        db=db,
        session_id=session_id,
        pitch=response.pitch,
        yaw=response.yaw,
        depth=response.depth,
        pos_x=request.position.x,
        pos_y=request.position.y,
        pos_z=request.position.z,
        vessel_distance_target=response.distance_to_target,
        vessel_distance_danger=response.distance_to_danger,
        deviation=response.deviation,
        status=response.status,
        score=response.score
    )
    
    return response

@app.get("/api/sessions/{session_id}/ai-analysis")
def get_ai_analysis(session_id: str, db: Session = Depends(get_db), current_user: db_models.User = Depends(auth.get_current_user)):
    """Analyze a trainee's overall performance using the deterministic AI analysis layer. Enforces RBAC."""
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Trainees can only view their own sessions
    if current_user.role == "trainee" and session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this session")
        
    analysis = analyze_performance(session)
    # Add required response fields
    analysis["session_id"] = session.session_id
    
    # Extract score from session, falling back to 0 if none
    score = 0
    if session.final_score is not None:
        score = session.final_score
    elif session.latest_score is not None:
        score = session.latest_score
        
    analysis["score"] = score
    
    return analysis

@app.get("/api/sessions/{session_id}/trajectory_records")
def get_trajectory_records(session_id: str, db: Session = Depends(get_db), current_user: db_models.User = Depends(auth.get_current_user)):
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if current_user.role == "trainee" and session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this session")
        
    records = db.query(db_models.TrajectoryRecord).filter(db_models.TrajectoryRecord.session_id == session_id).order_by(db_models.TrajectoryRecord.timestamp).all()
    
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "pitch": r.pitch,
            "yaw": r.yaw,
            "depth": r.depth,
            "pos_x": r.pos_x,
            "pos_y": r.pos_y,
            "pos_z": r.pos_z,
            "status": r.status
        } for r in records
    ]

# --- User Endpoints ---

@app.get("/api/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: db_models.User = Depends(auth.get_current_user)):
    """Only admins and instructors can list all users."""
    if current_user.role not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return db.query(db_models.User).all()

@app.post("/api/auth/heartbeat")
def heartbeat(db: Session = Depends(get_db), current_user: db_models.User = Depends(auth.get_current_user)):
    """Update last active timestamp for the current user."""
    from datetime import datetime
    current_user.last_active_at = datetime.utcnow()
    db.commit()
    return {"status": "ok"}

@app.delete("/api/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), current_user: db_models.User = Depends(auth.get_current_user)):
    """Delete a user. Instructors can only delete trainees. Admins can delete anyone except themselves."""
    if current_user.role not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete users")
        
    user_to_delete = db.query(db_models.User).filter(db_models.User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
        
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    if current_user.role == "instructor" and user_to_delete.role != "trainee":
        raise HTTPException(status_code=403, detail="Instructors can only delete trainee accounts")
        
    db.delete(user_to_delete)
    db.commit()
    return {"status": "deleted"}

# --- Patient Endpoints ---

@app.get("/api/patients", response_model=List[PatientResponse])
def list_patients(db: Session = Depends(get_db), current_user: db_models.User = Depends(auth.get_current_user)):
    """Retrieve all synthetic patient profiles."""
    return db.query(db_models.Patient).all()

@app.get("/api/patients/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: str, db: Session = Depends(get_db), current_user: db_models.User = Depends(auth.get_current_user)):
    """Retrieve a specific synthetic patient profile."""
    patient = db.query(db_models.Patient).filter(db_models.Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

# --- Access Sites Endpoints ---

@app.get("/api/access-sites", response_model=List[AccessSiteResponse])
def list_access_sites(db: Session = Depends(get_db), current_user: db_models.User = Depends(auth.get_current_user)):
    """Retrieve all configurable simulation access sites."""
    return db.query(db_models.AccessSite).all()

@app.get("/api/access-sites/{access_site_id}", response_model=AccessSiteResponse)
def get_access_site(access_site_id: str, db: Session = Depends(get_db), current_user: db_models.User = Depends(auth.get_current_user)):
    """Retrieve a specific access site configuration."""
    site = db.query(db_models.AccessSite).filter(db_models.AccessSite.access_site_id == access_site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Access site not found")
    return site

@app.post("/api/training/configuration", response_model=TrainingConfigurationResponse)
def get_configuration(request: TrainingConfigurationRequest, db: Session = Depends(get_db), current_user: db_models.User = Depends(auth.get_current_user)):
    """Retrieve combined configurable training parameters for a selected patient and access site."""
    patient = db.query(db_models.Patient).filter(db_models.Patient.patient_id == request.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    site = db.query(db_models.AccessSite).filter(db_models.AccessSite.access_site_id == request.access_site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Access site not found")
        
    thresholds = get_training_configuration(patient, site)
    
    return TrainingConfigurationResponse(
        patient=patient,
        access_site=site,
        target_vessel=site.target_vessel,
        danger_vessel=site.danger_vessel,
        training_parameters=thresholds.model_dump()
    )
