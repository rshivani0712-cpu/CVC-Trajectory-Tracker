from pydantic import BaseModel
from .thresholds import RiskLevel

class SimulationScore(BaseModel):
    score: int
    status: str
    feedback_message: str

def calculate_training_score(
    entry_angle_deviation: float,
    yaw_deviation: float,
    depth_deviation: float,
    distance_to_target: float,
    distance_to_danger: float,
    risk_level: RiskLevel
) -> SimulationScore:
    """
    Calculates a transparent, deterministic training score from 0 to 100.
    
    IMPORTANT: This is strictly a TRAINING SIMULATION score based on mathematical 
    deviations and is NOT a clinical assessment or medical device reading.
    """
    score = 100.0
    messages = []
    
    # 1. Entry Angle Deviation Penalty (Max 20 pts)
    # Deduct 1 point per 0.01 radians deviation (100x multiplier)
    entry_penalty = min(20.0, abs(entry_angle_deviation) * 100.0)
    score -= entry_penalty
    if entry_penalty > 10:
        messages.append("Entry angle needs improvement.")
        
    # 2. Yaw Deviation Penalty (Max 20 pts)
    # Deduct 1 point per 0.01 radians deviation
    yaw_penalty = min(20.0, abs(yaw_deviation) * 100.0)
    score -= yaw_penalty
    if yaw_penalty > 10:
        messages.append("Significant yaw deviation detected.")
        
    # 3. Depth & Target Distance Penalty (Max 20 pts total)
    # Deduct 5 points per unit of deviation
    target_penalty = min(20.0, (abs(depth_deviation) + abs(distance_to_target)) * 5.0)
    score -= target_penalty
    if target_penalty > 10:
        messages.append("Final target accuracy is suboptimal.")
        
    # 4. Danger Proximity Penalty (Max 20 pts)
    # Apply penalty if closer than 2.0 units to danger vessel
    danger_penalty = 0.0
    if distance_to_danger < 2.0:
        danger_penalty = min(20.0, (2.0 - distance_to_danger) * 10.0)
        score -= danger_penalty
        if danger_penalty > 10:
            messages.append("Too close to danger vessel.")
            
    # 5. Threshold Violations (Flat penalties)
    if risk_level == RiskLevel.HIGH_RISK:
        score -= 40.0
        messages.append("HIGH RISK violation: Safety bound breached.")
    elif risk_level == RiskLevel.WARNING:
        score -= 15.0
        messages.append("WARNING: Approaching unsafe bounds.")

    # Clamp the final score strictly between 0 and 100
    final_score = int(max(0, min(100, round(score))))
    
    # Status determination based on score and risk level
    if risk_level == RiskLevel.HIGH_RISK or final_score < 50:
        status = "FAILED"
    elif risk_level == RiskLevel.WARNING or final_score < 80:
        status = "PASSED_WITH_WARNINGS"
    else:
        status = "PASSED"
        
    if not messages:
        messages.append("Perfect trajectory. Excellent execution.")
        
    return SimulationScore(
        score=final_score,
        status=status,
        feedback_message=" ".join(messages)
    )
