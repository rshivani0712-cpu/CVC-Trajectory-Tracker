from typing import List, Dict, Any
from app.db_models import TrainingSession, TrajectoryRecord

def calculate_variance(values: List[float], mean: float) -> float:
    """
    Calculates the variance of a list of numerical values.
    """
    if len(values) < 2:
        return 0.0
    return sum((x - mean) ** 2 for x in values) / len(values)

def count_trajectory_corrections(records: List[TrajectoryRecord], threshold: float = 5.0) -> int:
    """
    Count significant direction changes based on pitch or yaw changes between consecutive records.
    Threshold is in degrees.
    """
    corrections = 0
    if len(records) < 2:
        return 0
    
    for i in range(1, len(records)):
        prev = records[i-1]
        curr = records[i]
        
        pitch_diff = abs(curr.pitch - prev.pitch)
        yaw_diff = abs(curr.yaw - prev.yaw)
        
        if pitch_diff > threshold or yaw_diff > threshold:
            corrections += 1
            
    return corrections

def extract_features(session: TrainingSession) -> Dict[str, Any]:
    """
    Extracts statistical features from a completed trajectory session for AI analysis.
    Uses existing session and trajectory records.
    """
    records = session.records
    
    if not records:
        return {
            "average_pitch": 0.0,
            "pitch_variance": 0.0,
            "average_yaw": 0.0,
            "yaw_variance": 0.0,
            "maximum_depth": 0.0,
            "depth_variance": 0.0,
            "average_deviation": 0.0,
            "maximum_deviation": 0.0,
            "minimum_vessel_distance": 0.0,
            "threshold_violations": 0,
            "trajectory_corrections": 0,
            "final_score": session.final_score or 0
        }
        
    pitches = [r.pitch for r in records]
    yaws = [r.yaw for r in records]
    depths = [r.depth for r in records]
    deviations = [r.deviation for r in records]
    danger_distances = [r.vessel_distance_danger for r in records]
    target_distances = [r.vessel_distance_target for r in records]
    
    avg_pitch = sum(pitches) / len(pitches)
    avg_yaw = sum(yaws) / len(yaws)
    avg_depth = sum(depths) / len(depths)
    avg_dev = sum(deviations) / len(deviations)
    
    violations = sum(1 for r in records if r.status in ["WARNING", "HIGH_RISK"])
    
    # Take the absolute minimum distance to any vessel (danger or target) 
    # to evaluate how close the needle got overall to critical structures.
    # The instructions simply request "minimum vessel distance".
    min_danger = min(danger_distances) if danger_distances else float('inf')
    min_target = min(target_distances) if target_distances else float('inf')
    min_vessel_dist = min(min_danger, min_target)
    if min_vessel_dist == float('inf'):
        min_vessel_dist = 0.0
    
    return {
        "average_pitch": round(avg_pitch, 2),
        "pitch_variance": round(calculate_variance(pitches, avg_pitch), 2),
        "average_yaw": round(avg_yaw, 2),
        "yaw_variance": round(calculate_variance(yaws, avg_yaw), 2),
        "maximum_depth": round(max(depths), 2),
        "depth_variance": round(calculate_variance(depths, avg_depth), 2),
        "average_deviation": round(avg_dev, 2),
        "maximum_deviation": round(max(deviations), 2),
        "minimum_vessel_distance": round(min_vessel_dist, 2),
        "threshold_violations": violations,
        "trajectory_corrections": count_trajectory_corrections(records),
        "final_score": session.final_score or (records[-1].score if records else 0)
    }
