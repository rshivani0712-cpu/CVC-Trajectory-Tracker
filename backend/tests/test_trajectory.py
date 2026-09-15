import unittest
import math
from app.trajectory import (
    calculate_depth,
    calculate_yaw,
    calculate_pitch,
    calculate_entry_angle,
    calculate_trajectory_deviation
)

class TestTrajectoryCalculations(unittest.TestCase):
    
    def test_calculate_depth_normal(self):
        # 3-4-5 triangle
        self.assertAlmostEqual(calculate_depth((0, 0, 0), (3, 4, 0)), 5.0)
        
    def test_calculate_depth_boundary(self):
        # Same points
        self.assertAlmostEqual(calculate_depth((1.5, 1.5, 1.5), (1.5, 1.5, 1.5)), 0.0)

    def test_calculate_yaw_normal(self):
        # 45 degrees (pi/4)
        self.assertAlmostEqual(calculate_yaw(1, 1), math.pi / 4)
        # 90 degrees (pi/2)
        self.assertAlmostEqual(calculate_yaw(0, 1), math.pi / 2)
        # 180 degrees (pi)
        self.assertAlmostEqual(calculate_yaw(-1, 0), math.pi)

    def test_calculate_yaw_boundary(self):
        # Origin (dx=0, dy=0) defaults to 0.0 in atan2
        self.assertAlmostEqual(calculate_yaw(0, 0), 0.0)

    def test_calculate_pitch_normal(self):
        # 45 degrees up from xy plane
        self.assertAlmostEqual(calculate_pitch(1, 0, 1), math.pi / 4)
        # Pointing straight up
        self.assertAlmostEqual(calculate_pitch(0, 0, 1), math.pi / 2)
        # Pointing straight down
        self.assertAlmostEqual(calculate_pitch(0, 0, -1), -math.pi / 2)

    def test_calculate_pitch_boundary(self):
        # No movement
        self.assertAlmostEqual(calculate_pitch(0, 0, 0), 0.0)

    def test_calculate_entry_angle_normal(self):
        # Parallel vectors
        self.assertAlmostEqual(calculate_entry_angle((0, 0, 1), (0, 0, 1)), 0.0)
        # Orthogonal vectors
        self.assertAlmostEqual(calculate_entry_angle((1, 0, 0), (0, 0, 1)), math.pi / 2)
        # Opposite vectors
        self.assertAlmostEqual(calculate_entry_angle((0, 0, 1), (0, 0, -1)), math.pi)

    def test_calculate_entry_angle_invalid(self):
        # Zero vector should raise ValueError
        with self.assertRaises(ValueError):
            calculate_entry_angle((0, 0, 0), (0, 0, 1))

    def test_calculate_trajectory_deviation_normal(self):
        # Ideal line along x-axis from (0,0,0) to (10,0,0)
        # Current point at (5, 3, 4) -> shortest distance to x-axis is sqrt(3^2 + 4^2) = 5
        dev = calculate_trajectory_deviation(
            current_point=(5, 3, 4),
            target_point=(10, 0, 0),
            ideal_entry_point=(0, 0, 0)
        )
        self.assertAlmostEqual(dev, 5.0)

    def test_calculate_trajectory_deviation_boundary(self):
        # Current point is exactly on the ideal line
        dev1 = calculate_trajectory_deviation(
            current_point=(5, 5, 5),
            target_point=(10, 10, 10),
            ideal_entry_point=(0, 0, 0)
        )
        self.assertAlmostEqual(dev1, 0.0)

        # Ideal entry and target are identical
        dev2 = calculate_trajectory_deviation(
            current_point=(3, 4, 0),
            target_point=(0, 0, 0),
            ideal_entry_point=(0, 0, 0)
        )
        self.assertAlmostEqual(dev2, 5.0)

if __name__ == '__main__':
    unittest.main()
