import unittest
from app.scoring import calculate_training_score, SimulationScore
from app.thresholds import RiskLevel

class TestScoring(unittest.TestCase):
    def test_good_trajectory(self):
        # Perfect run
        result = calculate_training_score(
            entry_angle_deviation=0.0,
            yaw_deviation=0.0,
            depth_deviation=0.0,
            distance_to_target=0.0,
            distance_to_danger=3.0,
            risk_level=RiskLevel.WITHIN_THRESHOLD
        )
        self.assertEqual(result.score, 100)
        self.assertEqual(result.status, "PASSED")
        self.assertIn("Perfect trajectory", result.feedback_message)

    def test_moderate_deviation(self):
        # 0.1 rad deviation -> 10 pts penalty each. Target dist = 1.0 -> 5 pts penalty. Warning -> 15 pts penalty.
        # Total deduction: 10 + 10 + 5 + 15 = 40. Score = 60
        result = calculate_training_score(
            entry_angle_deviation=0.1,
            yaw_deviation=0.1,
            depth_deviation=0.5,
            distance_to_target=0.5,
            distance_to_danger=2.5,  # > 2.0, so no penalty
            risk_level=RiskLevel.WARNING
        )
        self.assertEqual(result.score, 60)
        self.assertEqual(result.status, "PASSED_WITH_WARNINGS")

    def test_high_risk_trajectory(self):
        # Max out all penalties and trigger HIGH RISK
        result = calculate_training_score(
            entry_angle_deviation=0.3, # max -20
            yaw_deviation=0.3, # max -20
            depth_deviation=3.0,
            distance_to_target=3.0, # sum > 4 -> max -20
            distance_to_danger=0.1, # < 2.0 -> -19
            risk_level=RiskLevel.HIGH_RISK # -40
        )
        # Expected score: 100 - 20 - 20 - 20 - 19 - 40 = -19, bounded to 0
        self.assertEqual(result.score, 0)
        self.assertEqual(result.status, "FAILED")
        self.assertIn("HIGH RISK", result.feedback_message)

    def test_boundary_cases(self):
        # Danger distance exactly on the boundary where penalty drops to 0
        result1 = calculate_training_score(
            entry_angle_deviation=0.0,
            yaw_deviation=0.0,
            depth_deviation=0.0,
            distance_to_target=0.0,
            distance_to_danger=2.0, 
            risk_level=RiskLevel.WITHIN_THRESHOLD
        )
        self.assertEqual(result1.score, 100)

        # Score remains mathematically > 50, but RiskLevel is HIGH_RISK -> Auto FAIL
        result2 = calculate_training_score(
            entry_angle_deviation=0.0,
            yaw_deviation=0.0,
            depth_deviation=0.0,
            distance_to_target=0.0,
            distance_to_danger=2.5,
            risk_level=RiskLevel.HIGH_RISK # -40 points
        )
        # Score = 100 - 40 = 60
        self.assertEqual(result2.score, 60)
        self.assertEqual(result2.status, "FAILED")

if __name__ == '__main__':
    unittest.main()
