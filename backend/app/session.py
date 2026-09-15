from typing import Optional
from sqlalchemy.orm import Session
from . import db_models
import uuid

def create_session(
    db: Session, 
    user_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    access_site_id: Optional[str] = None,
    training_configuration: Optional[str] = None
) -> db_models.TrainingSession:
    db_session = db_models.TrainingSession(
        session_id=str(uuid.uuid4()),
        user_id=user_id,
        patient_id=patient_id,
        access_site_id=access_site_id,
        training_configuration=training_configuration
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def get_session(db: Session, session_id: str) -> Optional[db_models.TrainingSession]:
    return db.query(db_models.TrainingSession).filter(db_models.TrainingSession.session_id == session_id).first()

def add_trajectory_record(
    db: Session, 
    session_id: str, 
    pitch: float, 
    yaw: float, 
    depth: float, 
    vessel_distance_target: float, 
    vessel_distance_danger: float, 
    deviation: float, 
    status: str, 
    score: int
) -> Optional[db_models.TrainingSession]:
    
    session = get_session(db, session_id)
    if not session:
        return None
        
    record = db_models.TrajectoryRecord(
        session_id=session_id,
        pitch=pitch,
        yaw=yaw,
        depth=depth,
        vessel_distance_target=vessel_distance_target,
        vessel_distance_danger=vessel_distance_danger,
        deviation=deviation,
        status=status,
        score=score
    )
    db.add(record)
    
    session.latest_score = score
    session.final_score = score
    
    db.commit()
    db.refresh(session)
    return session
