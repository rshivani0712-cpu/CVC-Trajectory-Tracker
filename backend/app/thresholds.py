from enum import Enum
from pydantic import BaseModel

class RiskLevel(str, Enum):
    WITHIN_THRESHOLD = "WITHIN_THRESHOLD"
    WARNING = "WARNING"
    HIGH_RISK = "HIGH_RISK"

class TrainingThresholds(BaseModel):
    """
    Configurable thresholds for training simulation feedback.
    
    IMPORTANT: These values are strictly for simulator scoring and 
    do not represent universal medical rules or clinical guidelines.
    They can be adjusted for different simulator scenarios.
    """
    # Entry angles (e.g. radians or degrees, depending on system implementation)
    min_entry_angle: float = 0.52   # Arbitrary default (~30 deg)
    max_entry_angle: float = 0.87   # Arbitrary default (~50 deg)
    
    # Yaw deviation from the ideal path
    max_yaw_deviation_warning: float = 0.15 
    max_yaw_deviation_risk: float = 0.30 
    
    # Depth (distance units)
    max_depth_warning: float = 4.0
    max_depth_risk: float = 5.0
    
    # Distance from a danger vessel
    min_distance_vessel_warning: float = 1.0
    min_distance_vessel_risk: float = 0.5

def evaluate_simulation_state(
    entry_angle: float,
    yaw_deviation: float,
    depth: float,
    distance_to_vessel: float,
    thresholds: TrainingThresholds = None
) -> RiskLevel:
    """
    Evaluate the current state against the configurable training thresholds.
    Returns:
        HIGH_RISK if any critical bounds are crossed.
        WARNING if warning bounds are crossed (but not critical).
        WITHIN_THRESHOLD otherwise.
    """
    if thresholds is None:
        thresholds = TrainingThresholds()

    # 1. High Risk Evaluation (overrides warnings)
    is_high_risk = (
        distance_to_vessel < thresholds.min_distance_vessel_risk or
        depth > thresholds.max_depth_risk or
        abs(yaw_deviation) > thresholds.max_yaw_deviation_risk
    )
    if is_high_risk:
        return RiskLevel.HIGH_RISK

    # 2. Warning Evaluation
    is_warning = (
        distance_to_vessel <= thresholds.min_distance_vessel_warning or
        depth >= thresholds.max_depth_warning or
        abs(yaw_deviation) >= thresholds.max_yaw_deviation_warning or
        entry_angle <= thresholds.min_entry_angle or
        entry_angle >= thresholds.max_entry_angle
    )
    if is_warning:
        return RiskLevel.WARNING

    # 3. Acceptable state
    return RiskLevel.WITHIN_THRESHOLD
