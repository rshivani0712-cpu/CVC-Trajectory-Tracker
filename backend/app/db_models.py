from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="trainee") # trainee, instructor, admin
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("TrainingSession", back_populates="user", cascade="all, delete-orphan")

class TrainingSession(Base):
    __tablename__ = "training_sessions"

    session_id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True) # Nullable until auth is added
    patient_id = Column(String, nullable=True)
    access_site_id = Column(String, nullable=True)
    training_configuration = Column(String, nullable=True) # Store as JSON string
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    latest_score = Column(Integer, nullable=True)
    final_score = Column(Integer, nullable=True)

    user = relationship("User", back_populates="sessions")
    records = relationship("TrajectoryRecord", back_populates="session", cascade="all, delete-orphan", order_by="TrajectoryRecord.timestamp")

class TrajectoryRecord(Base):
    __tablename__ = "trajectory_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("training_sessions.session_id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    pitch = Column(Float)
    yaw = Column(Float)
    depth = Column(Float)
    pos_x = Column(Float, nullable=True)
    pos_y = Column(Float, nullable=True)
    pos_z = Column(Float, nullable=True)
    vessel_distance_target = Column(Float)
    vessel_distance_danger = Column(Float)
    deviation = Column(Float)
    status = Column(String)
    score = Column(Integer)

    session = relationship("TrainingSession", back_populates="records")

class Patient(Base):
    __tablename__ = "patients"

    patient_id = Column(String, primary_key=True, index=True, default=generate_uuid)
    display_name = Column(String, nullable=False)
    age_group = Column(String, nullable=False)
    sex = Column(String, nullable=False)
    body_type = Column(String, nullable=False)
    bmi_category = Column(String, nullable=False)
    height = Column(Float, nullable=False) # in cm
    weight = Column(Float, nullable=False) # in kg
    anatomy_model_reference = Column(String, nullable=False)

class AccessSite(Base):
    __tablename__ = "access_sites"

    access_site_id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, nullable=False)
    target_vessel = Column(String, nullable=False)
    danger_vessel = Column(String, nullable=False)
    training_configuration_reference = Column(String, nullable=False)
