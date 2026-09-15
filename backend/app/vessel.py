import math
from typing import Tuple
from pydantic import BaseModel
from .trajectory import calculate_trajectory_deviation

class VesselConfig(BaseModel):
    """
    Configurable, simplified geometric representation of a vessel.
    This uses a simple 3D line segment (start to end) and a radius 
    to represent a cylindrical vessel for math collision boundaries.
    
    IMPORTANT: 
    Do NOT claim that this simplified geometry represents real medically 
    precise patient anatomy. The actual 3D anatomy will be handled by the frontend.
    This is strictly for deterministic backend distance calculations.
    """
    name: str
    start_point: Tuple[float, float, float]
    end_point: Tuple[float, float, float]
    radius: float

class CVCGeometry(BaseModel):
    # TARGET: Internal Jugular Vein
    internal_jugular_vein: VesselConfig = VesselConfig(
        name="Internal Jugular Vein",
        start_point=(0.0, 5.0, -10.0),
        end_point=(0.0, 5.0, -20.0),
        radius=1.5
    )
    # DANGER: Common Carotid Artery
    common_carotid_artery: VesselConfig = VesselConfig(
        name="Common Carotid Artery",
        start_point=(2.0, 4.0, -10.0),
        end_point=(2.0, 4.0, -20.0),
        radius=1.0
    )

def distance_point_to_line_segment(
    point: Tuple[float, float, float], 
    start: Tuple[float, float, float], 
    end: Tuple[float, float, float]
) -> float:
    """Calculate the shortest distance from a 3D point to a line segment."""
    px, py, pz = point
    sx, sy, sz = start
    ex, ey, ez = end
    
    line_vec = (ex - sx, ey - sy, ez - sz)
    point_vec = (px - sx, py - sy, pz - sz)
    
    line_mag_sq = line_vec[0]**2 + line_vec[1]**2 + line_vec[2]**2
    if line_mag_sq == 0:
        return math.sqrt(point_vec[0]**2 + point_vec[1]**2 + point_vec[2]**2)
        
    # Parameter for the projection
    t = (point_vec[0]*line_vec[0] + point_vec[1]*line_vec[1] + point_vec[2]*line_vec[2]) / line_mag_sq
    t = max(0.0, min(1.0, t)) # Clamp to ensure it stays on the segment
    
    proj_x = sx + t * line_vec[0]
    proj_y = sy + t * line_vec[1]
    proj_z = sz + t * line_vec[2]
    
    return math.sqrt((px - proj_x)**2 + (py - proj_y)**2 + (pz - proj_z)**2)

def get_distance_to_vessel(
    needle_tip: Tuple[float, float, float],
    vessel: VesselConfig
) -> float:
    """
    Calculate the distance from the needle tip to the surface of the vessel.
    Returns 0.0 if the needle tip is intersecting or inside the vessel.
    """
    dist_to_center = distance_point_to_line_segment(needle_tip, vessel.start_point, vessel.end_point)
    return max(0.0, dist_to_center - vessel.radius)

def calculate_target_and_danger_distances(
    needle_tip: Tuple[float, float, float],
    geometry: CVCGeometry = None
) -> Tuple[float, float]:
    """
    Calculate Euclidean distance from the needle tip to both structures.
    Returns: (distance_to_target, distance_to_danger).
    """
    if geometry is None:
        geometry = CVCGeometry()
        
    dist_target = get_distance_to_vessel(needle_tip, geometry.internal_jugular_vein)
    dist_danger = get_distance_to_vessel(needle_tip, geometry.common_carotid_artery)
    
    return dist_target, dist_danger

def calculate_trajectory_deviation_from_target(
    current_point: Tuple[float, float, float],
    ideal_entry: Tuple[float, float, float],
    geometry: CVCGeometry = None
) -> float:
    """
    Calculate the basic trajectory deviation relative to the target vessel's center.
    This establishes an ideal line from the entry point to the target vessel midpoint,
    and calculates how far off the current point deviates from that line.
    """
    if geometry is None:
        geometry = CVCGeometry()
        
    target_start = geometry.internal_jugular_vein.start_point
    target_end = geometry.internal_jugular_vein.end_point
    
    # Mock ideal target as the absolute center point of the target vessel
    ideal_target = (
        (target_start[0] + target_end[0]) / 2,
        (target_start[1] + target_end[1]) / 2,
        (target_start[2] + target_end[2]) / 2
    )
    
    return calculate_trajectory_deviation(current_point, ideal_target, ideal_entry)
