import math
from typing import Tuple

def calculate_depth(entry_point: Tuple[float, float, float], current_point: Tuple[float, float, float]) -> float:
    """Calculate the Euclidean distance (depth) from the entry point to the current point."""
    x1, y1, z1 = entry_point
    x2, y2, z2 = current_point
    return math.sqrt((x2 - x1)**2 + (y2 - y1)**2 + (z2 - z1)**2)

def calculate_yaw(dx: float, dy: float) -> float:
    """Calculate yaw angle (in radians) in the xy-plane relative to the x-axis."""
    return math.atan2(dy, dx)

def calculate_pitch(dx: float, dy: float, dz: float) -> float:
    """Calculate pitch angle (in radians) from the xy-plane."""
    horizontal_dist = math.sqrt(dx**2 + dy**2)
    return math.atan2(dz, horizontal_dist)

def calculate_entry_angle(needle_vector: Tuple[float, float, float], surface_normal: Tuple[float, float, float]) -> float:
    """Calculate the entry angle (in radians) between the needle vector and the surface normal."""
    nx, ny, nz = needle_vector
    sx, sy, sz = surface_normal
    
    dot_product = nx*sx + ny*sy + nz*sz
    mag_needle = math.sqrt(nx**2 + ny**2 + nz**2)
    mag_surface = math.sqrt(sx**2 + sy**2 + sz**2)
    
    if mag_needle == 0 or mag_surface == 0:
        raise ValueError("Vectors must have non-zero magnitude to calculate entry angle.")
        
    cos_theta = dot_product / (mag_needle * mag_surface)
    # Clamp to [-1, 1] to prevent floating point domain errors in acos
    cos_theta = max(-1.0, min(1.0, cos_theta))
    return math.acos(cos_theta)

def calculate_trajectory_deviation(
    current_point: Tuple[float, float, float],
    target_point: Tuple[float, float, float],
    ideal_entry_point: Tuple[float, float, float]
) -> float:
    """
    Calculate the shortest distance (deviation) from the current_point to the ideal 
    trajectory line defined by ideal_entry_point and target_point.
    """
    # Vector from entry to target (representing the ideal line)
    line_vec = (
        target_point[0] - ideal_entry_point[0],
        target_point[1] - ideal_entry_point[1],
        target_point[2] - ideal_entry_point[2]
    )
    # Vector from entry to current point
    point_vec = (
        current_point[0] - ideal_entry_point[0],
        current_point[1] - ideal_entry_point[1],
        current_point[2] - ideal_entry_point[2]
    )
    
    line_mag_sq = line_vec[0]**2 + line_vec[1]**2 + line_vec[2]**2
    if line_mag_sq == 0:
        # Fallback: Ideal entry and target are the same point
        return calculate_depth(ideal_entry_point, current_point)
        
    # Project point_vec onto line_vec
    t = (point_vec[0]*line_vec[0] + point_vec[1]*line_vec[1] + point_vec[2]*line_vec[2]) / line_mag_sq
    
    # Find the closest projection point on the line
    proj_point = (
        ideal_entry_point[0] + t * line_vec[0],
        ideal_entry_point[1] + t * line_vec[1],
        ideal_entry_point[2] + t * line_vec[2]
    )
    
    # Deviation is the distance from the current point to its projection on the ideal line
    return calculate_depth(current_point, proj_point)
