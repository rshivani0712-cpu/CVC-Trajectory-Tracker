from .thresholds import TrainingThresholds
from .db_models import Patient, AccessSite

def get_training_configuration(patient: Patient, access_site: AccessSite) -> TrainingThresholds:
    """
    Generate deterministic, configurable training simulation parameters based 
    on the combined synthetic patient profile and the access site.
    
    IMPORTANT: These are prototype simulation parameters and do NOT 
    represent universal clinical guidelines.
    """
    
    # Start with the base defaults
    thresholds = TrainingThresholds()
    
    # Adjust depth based on patient body type/BMI
    if patient.bmi_category == "fat" or patient.body_type == "obese":
        thresholds.max_depth_warning += 2.0
        thresholds.max_depth_risk += 2.0
    elif patient.bmi_category == "skinny" or patient.body_type == "underweight":
        thresholds.max_depth_warning -= 1.0
        thresholds.max_depth_risk -= 1.0
        
    # Adjust angle/depth based on access site
    if access_site.name == "Neck":
        # Usually shallower angle required for neck
        thresholds.max_entry_angle -= 0.1
    elif access_site.name == "Groin":
        # Usually deeper angle/depth for femoral
        thresholds.max_depth_warning += 1.0
        thresholds.max_depth_risk += 1.0
    elif access_site.name == "Chest":
        # Subclavian can be tricky, lower warning distance
        thresholds.min_distance_vessel_warning += 0.5
        
    # Pediatric/Teen safety margins are tighter
    if patient.age_group == "teen":
        thresholds.max_depth_warning -= 1.0
        thresholds.max_depth_risk -= 1.0
        thresholds.min_distance_vessel_risk += 0.2
        
    # Ensure sane limits (e.g., depth risk never <= 0)
    thresholds.max_depth_warning = max(1.0, thresholds.max_depth_warning)
    thresholds.max_depth_risk = max(1.5, thresholds.max_depth_risk)
        
    return thresholds
