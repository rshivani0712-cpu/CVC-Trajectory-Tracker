import math
from typing import Dict, Any, Tuple
from app.thresholds import TrainingThresholds

def classify_technique(features: Dict[str, Any], thresholds: TrainingThresholds = None) -> Tuple[str, str]:
    """
    Classifies a trainee's technique based on extracted trajectory features.
    
    Returns a tuple of (classification_string, explanation_string).
    """
    if thresholds is None:
        thresholds = TrainingThresholds()

    # Handle edge cases: empty or missing data
    if not features or (features.get("maximum_depth", 0.0) == 0.0 and features.get("average_pitch", 0.0) == 0.0):
        return "GOOD_TECHNIQUE", "Insufficient data to identify technique issues. Proceeding with default classification."
        
    issues = []
    
    # 1. Depth Check
    # maximum_depth vs max_depth_risk
    if features.get("maximum_depth", 0.0) > thresholds.max_depth_risk:
        issues.append("EXCESSIVE_DEPTH")
        
    # 2. Angle/Pitch Check
    # thresholds are in radians, features are typically in degrees.
    max_angle_deg = math.degrees(thresholds.max_entry_angle)
    min_angle_deg = math.degrees(thresholds.min_entry_angle)
    avg_pitch = features.get("average_pitch", min_angle_deg) # Default to passing if missing
    
    if avg_pitch > max_angle_deg or avg_pitch < min_angle_deg:
        issues.append("EXCESSIVE_ANGLE")
        
    # 3. Yaw Check
    max_yaw_deg = math.degrees(thresholds.max_yaw_deviation_risk)
    if abs(features.get("average_yaw", 0.0)) > max_yaw_deg:
        issues.append("EXCESSIVE_YAW")
        
    # 4. Stability Check
    # High corrections or high variance indicate unstable control
    corrections = features.get("trajectory_corrections", 0)
    pitch_var = features.get("pitch_variance", 0.0)
    yaw_var = features.get("yaw_variance", 0.0)
    if corrections >= 3 or pitch_var > 15.0 or yaw_var > 10.0:
        issues.append("UNSTABLE_TRAJECTORY")
        
    # 5. Classify based on issues
    if len(issues) > 1:
        return "MULTIPLE_VIOLATIONS", f"Trajectory exhibited multiple technique issues: {', '.join(issues)}."
    elif len(issues) == 1:
        issue = issues[0]
        if issue == "EXCESSIVE_DEPTH":
            return "EXCESSIVE_DEPTH", "Trajectory exceeded the maximum safe depth threshold."
        elif issue == "EXCESSIVE_ANGLE":
            return "EXCESSIVE_ANGLE", "Average entry angle deviated significantly from the safe configured bounds."
        elif issue == "EXCESSIVE_YAW":
            return "EXCESSIVE_YAW", "Significant lateral (yaw) deviation from the ideal path."
        elif issue == "UNSTABLE_TRAJECTORY":
            return "UNSTABLE_TRAJECTORY", "Trajectory showed excessive corrections or high variance, indicating poor needle control."
            
    # Check if there are significant threshold violations despite passing averages
    violations = features.get("threshold_violations", 0)
    if violations > 3:
        return "UNSTABLE_TRAJECTORY", "Trajectory had multiple localized threshold violations, indicating unstable execution."

    return "GOOD_TECHNIQUE", "Trajectory remained within the configured training thresholds with stable control."
