import unittest
from app.thresholds import evaluate_simulation_state, TrainingThresholds, RiskLevel

class TestThresholds(unittest.TestCase):
    def setUp(self):
        # We explicitly configure the thresholds to ensure deterministic tests
        self.thresholds = TrainingThresholds(
            min_entry_angle=0.5,
            max_entry_angle=1.0,
            max_yaw_deviation_warning=0.2,
            max_yaw_deviation_risk=0.4,
            max_depth_warning=4.0,
            max_depth_risk=5.0,
            min_distance_vessel_warning=1.0,
            min_distance_vessel_risk=0.5
        )

    def test_within_threshold(self):
        # Normal, safe values
        result = evaluate_simulation_state(
            entry_angle=0.75,
            yaw_deviation=0.1,
            depth=2.0,
            distance_to_vessel=2.0,
            thresholds=self.thresholds
        )
        self.assertEqual(result, RiskLevel.WITHIN_THRESHOLD)

    def test_warning_case(self):
        # Entry angle too low -> WARNING
        result1 = evaluate_simulation_state(
            entry_angle=0.4,
            yaw_deviation=0.1,
            depth=2.0,
            distance_to_vessel=2.0,
            thresholds=self.thresholds
        )
        self.assertEqual(result1, RiskLevel.WARNING)

        # Depth slightly high -> WARNING
        result2 = evaluate_simulation_state(
            entry_angle=0.75,
            yaw_deviation=0.1,
            depth=4.5,
            distance_to_vessel=2.0,
            thresholds=self.thresholds
        )
        self.assertEqual(result2, RiskLevel.WARNING)

    def test_high_risk_case(self):
        # Dangerously close to vessel -> HIGH RISK
        result1 = evaluate_simulation_state(
            entry_angle=0.75,
            yaw_deviation=0.1,
            depth=2.0,
            distance_to_vessel=0.2,
            thresholds=self.thresholds
        )
        self.assertEqual(result1, RiskLevel.HIGH_RISK)

        # Depth is critically high -> HIGH RISK
        result2 = evaluate_simulation_state(
            entry_angle=0.75,
            yaw_deviation=0.1,
            depth=5.5,
            distance_to_vessel=2.0,
            thresholds=self.thresholds
        )
        self.assertEqual(result2, RiskLevel.HIGH_RISK)

    def test_boundary_cases(self):
        # Exactly on the warning boundary for depth -> WARNING
        result_warn = evaluate_simulation_state(
            entry_angle=0.75,
            yaw_deviation=0.1,
            depth=4.0,
            distance_to_vessel=2.0,
            thresholds=self.thresholds
        )
        self.assertEqual(result_warn, RiskLevel.WARNING)

        # Exactly on the risk boundary for depth -> WARNING
        # (It must strictly exceed max_depth_risk to be HIGH_RISK)
        result_edge_risk = evaluate_simulation_state(
            entry_angle=0.75,
            yaw_deviation=0.1,
            depth=5.0,
            distance_to_vessel=2.0,
            thresholds=self.thresholds
        )
        self.assertEqual(result_edge_risk, RiskLevel.WARNING)

        # Just barely past the risk boundary -> HIGH RISK
        result_high_risk = evaluate_simulation_state(
            entry_angle=0.75,
            yaw_deviation=0.1,
            depth=5.001,
            distance_to_vessel=2.0,
            thresholds=self.thresholds
        )
        self.assertEqual(result_high_risk, RiskLevel.HIGH_RISK)

if __name__ == '__main__':
    unittest.main()
