import unittest
import math
from app.vessel import (
    VesselConfig,
    CVCGeometry,
    get_distance_to_vessel,
    calculate_target_and_danger_distances,
    calculate_trajectory_deviation_from_target
)

class TestVesselGeometry(unittest.TestCase):
    def setUp(self):
        # Override geometry for clean, predictable mathematical tests
        self.geometry = CVCGeometry(
            internal_jugular_vein=VesselConfig(
                name="Internal Jugular Vein",
                start_point=(0.0, 5.0, -10.0),
                end_point=(0.0, 5.0, -20.0),
                radius=1.5
            ),
            common_carotid_artery=VesselConfig(
                name="Common Carotid Artery",
                start_point=(3.0, 5.0, -10.0),
                end_point=(3.0, 5.0, -20.0),
                radius=1.0
            )
        )

    def test_normal_position(self):
        # A normal position safely above the vessels
        tip = (0.0, 5.0, 0.0)
        dist_target, dist_danger = calculate_target_and_danger_distances(tip, self.geometry)
        
        # dist_target center is at (0, 5, -10), distance to (0, 5, 0) is 10.0. 
        # Minus radius 1.5 -> 8.5
        self.assertAlmostEqual(dist_target, 8.5)
        
        # dist_danger center is at (3, 5, -10), distance to (0, 5, 0) is sqrt(3^2 + 10^2) 
        # Minus radius 1.0
        expected_danger = math.sqrt(3**2 + 10**2) - 1.0
        self.assertAlmostEqual(dist_danger, expected_danger)

    def test_close_to_target_position(self):
        # Exactly on the outer edge of the target vessel
        tip = (1.5, 5.0, -15.0)
        dist_target, dist_danger = calculate_target_and_danger_distances(tip, self.geometry)
        
        # Target distance should be 0.0 because it's intersecting the surface
        self.assertAlmostEqual(dist_target, 0.0)
        
        # Danger center is at (3, 5, -15). Distance from (1.5, 5, -15) to center is 1.5
        # Minus radius 1.0 -> 0.5
        self.assertAlmostEqual(dist_danger, 0.5)

    def test_close_to_danger_position(self):
        # Position perfectly deep inside the danger vessel
        tip = (3.0, 5.0, -15.0)
        dist_target, dist_danger = calculate_target_and_danger_distances(tip, self.geometry)
        
        # Should be clamped to 0.0 when fully inside
        self.assertAlmostEqual(dist_danger, 0.0)
        
        # Distance to target center (0, 5, -15) is 3.0. Minus radius 1.5 -> 1.5
        self.assertAlmostEqual(dist_target, 1.5)

    def test_boundary_cases(self):
        # 1. Needle perfectly centered in target vessel (dead center)
        tip_center = (0.0, 5.0, -15.0)
        dist_target, _ = calculate_target_and_danger_distances(tip_center, self.geometry)
        self.assertAlmostEqual(dist_target, 0.0)
        
        # 2. Needle passes beyond the vessel segment ends
        # Segment ends at z=-20. Needle is pushed to z=-25.
        # Closest point on segment is its absolute end (0, 5, -20).
        tip_past_end = (0.0, 5.0, -25.0)
        dist_target_past, _ = calculate_target_and_danger_distances(tip_past_end, self.geometry)
        # Distance to (0, 5, -20) is 5.0. Minus radius 1.5 -> 3.5
        self.assertAlmostEqual(dist_target_past, 3.5)

    def test_trajectory_deviation_calculation(self):
        ideal_entry = (0.0, 0.0, 0.0)
        # Midpoint of the target vessel will be (0.0, 5.0, -15.0)
        
        # Case A: Current point is flawlessly on the ideal line connecting entry and target
        # Midpoint on this line (t=0.5) is (0.0, 2.5, -7.5)
        current = (0.0, 2.5, -7.5)
        dev = calculate_trajectory_deviation_from_target(current, ideal_entry, self.geometry)
        self.assertAlmostEqual(dev, 0.0)
        
        # Case B: Current point deviates horizontally by 2.0 units on X-axis
        current_off = (2.0, 2.5, -7.5)
        dev_off = calculate_trajectory_deviation_from_target(current_off, ideal_entry, self.geometry)
        self.assertAlmostEqual(dev_off, 2.0)

if __name__ == '__main__':
    unittest.main()
