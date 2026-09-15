from typing import Dict, Any, List
from app.db_models import TrainingSession
from app.thresholds import TrainingThresholds
from app.ai.features import extract_features
from app.ai.technique import classify_technique

def analyze_performance(session: TrainingSession, thresholds: TrainingThresholds = None) -> Dict[str, Any]:
    """
    Analyzes a completed training session to generate a deterministic performance report.
    Returns:
        Dict containing performance_level, technique, strengths, weaknesses, recommendations, and summary.
    """
    if thresholds is None:
        thresholds = TrainingThresholds()
        
    if not session.records:
        return {
            "performance_level": "NEEDS_IMPROVEMENT",
            "technique": "GOOD_TECHNIQUE",
            "strengths": [],
            "weaknesses": ["No trajectory data recorded."],
            "recommendations": ["Ensure tracking is active before starting the simulation."],
            "summary": "Insufficient data to analyze performance."
        }
        
    features = extract_features(session)
    technique_class, _ = classify_technique(features, thresholds)
    
    score = features.get("final_score", 0)
    violations = features.get("threshold_violations", 0)
    
    # 1. Determine Performance Level
    level = "NEEDS_IMPROVEMENT"
    if technique_class == "GOOD_TECHNIQUE":
        if score >= 90:
            level = "EXCELLENT"
        else:
            level = "GOOD"
    elif technique_class == "MULTIPLE_VIOLATIONS" or violations > 2:
        level = "HIGH_RISK_PERFORMANCE"
    else:
        # Single issues like EXCESSIVE_ANGLE, EXCESSIVE_YAW, EXCESSIVE_DEPTH, UNSTABLE_TRAJECTORY
        if score < 60:
            level = "HIGH_RISK_PERFORMANCE"
        else:
            level = "NEEDS_IMPROVEMENT"
            
    # Strict override for dangerous depths
    if features.get("maximum_depth", 0.0) > thresholds.max_depth_risk:
        level = "HIGH_RISK_PERFORMANCE"
        
    strengths: List[str] = []
    weaknesses: List[str] = []
    recommendations: List[str] = []
    
    # 2. Identify Strengths
    if features.get("yaw_variance", 0.0) < 2.0 and "YAW" not in technique_class:
        strengths.append("Stable yaw control")
        
    if features.get("average_deviation", 0.0) < 1.0 and "UNSTABLE" not in technique_class:
        strengths.append("High trajectory accuracy")
        
    if features.get("depth_variance", 0.0) < 1.5 and features.get("maximum_depth", 0.0) <= thresholds.max_depth_warning:
        strengths.append("Good depth control")
        
    if violations == 0:
        strengths.append("No threshold violations")
        
    if not strengths and score >= 70:
        strengths.append("Generally acceptable overall control")
        
    # 3. Identify Weaknesses & Recommendations
    if technique_class == "EXCESSIVE_DEPTH" or features.get("maximum_depth", 0.0) > thresholds.max_depth_warning:
        weaknesses.append("Maximum depth exceeded the configured training threshold")
        recommendations.append("Practice shallow insertion and improved depth perception.")
        
    if technique_class == "EXCESSIVE_ANGLE":
        weaknesses.append("Entry angle deviated significantly from target bounds")
        recommendations.append("Focus on initial alignment and maintaining the correct entry angle.")
        
    if technique_class == "EXCESSIVE_YAW":
        weaknesses.append("Excessive lateral (yaw) deviation detected")
        recommendations.append("Keep the needle aligned laterally with the target vessel without drifting.")
        
    if technique_class == "UNSTABLE_TRAJECTORY":
        weaknesses.append("Trajectory showed unstable movements or excessive corrections")
        recommendations.append("Work on smooth, continuous movements rather than jerky corrections.")
        
    if technique_class == "MULTIPLE_VIOLATIONS":
        weaknesses.append("Multiple safety and technique violations during the procedure")
        recommendations.append("Review all fundamental simulator rules and parameters before the next attempt.")
        
    if violations > 0 and "violations" not in " ".join(weaknesses):
        weaknesses.append(f"Recorded {violations} training threshold violation(s)")
        recommendations.append("Focus on staying strictly within the safe threshold bounds.")
        
    if not weaknesses and score < 100:
        weaknesses.append("Minor accuracy deviations from the ideal optimal path")
        recommendations.append("Continue practicing for perfect accuracy and stability.")

    # 4. Generate Summary
    if level == "EXCELLENT":
        summary = "Outstanding performance with excellent control and accuracy."
    elif level == "GOOD":
        summary = "Overall performance was good, but there is some room for refinement."
    elif level == "NEEDS_IMPROVEMENT":
        issue = technique_class.replace("_", " ").lower()
        summary = f"Performance needs improvement. The primary issue detected was {issue}."
    else:
        summary = "High risk performance detected. Fundamental technique review is strongly recommended."

    return {
        "performance_level": level,
        "technique": technique_class,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        "summary": summary
    }
