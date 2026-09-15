from pydantic import BaseModel

class Position(BaseModel):
    x: float
    y: float
    z: float

class TrajectoryAnalyzeRequest(BaseModel):
    position: Position
    pitch: float
    yaw: float
    depth: float

class TrajectoryAnalyzeResponse(BaseModel):
    angle: float
    pitch: float
    yaw: float
    depth: float
    deviation: float
    distance_to_target: float
    distance_to_danger: float
    status: str
    score: int
    feedback: str

# --- Auth Models ---

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "trainee" # allow overriding role during prototype registration

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class PatientResponse(BaseModel):
    patient_id: str
    display_name: str
    age_group: str
    sex: str
    body_type: str
    bmi_category: str
    height: float
    weight: float
    anatomy_model_reference: str
    
    class Config:
        from_attributes = True

class AccessSiteResponse(BaseModel):
    access_site_id: str
    name: str
    target_vessel: str
    danger_vessel: str
    training_configuration_reference: str

    class Config:
        from_attributes = True

class SessionCreateRequest(BaseModel):
    patient_id: str
    access_site_id: str

class TrainingConfigurationRequest(BaseModel):
    patient_id: str
    access_site_id: str

class TrainingConfigurationResponse(BaseModel):
    patient: PatientResponse
    access_site: AccessSiteResponse
    target_vessel: str
    danger_vessel: str
    training_parameters: dict
