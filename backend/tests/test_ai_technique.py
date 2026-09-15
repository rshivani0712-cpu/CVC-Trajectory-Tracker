import unittest
import math
from app.ai.technique import classify_technique
from app.thresholds import TrainingThresholds

class TestAITechnique(unittest.TestCase):
    def setUp(self):
        self.thresholds = TrainingThresholds()
        
        # Base features for a good trajectory
        self.good_features = {
            "average_pitch": math.degrees((self.thresholds.min_entry_angle + self.thresholds.max_entry_angle) / 2),
            "pitch_variance": 2.0,
            "average_yaw": 0.0,
            "yaw_variance": 1.0,
            "maximum_depth": self.thresholds.max_depth_warning - 1.0,
            "depth_variance": 0.5,
            "average_deviation": 0.5,
            "maximum_deviation": 1.0,
            "minimum_vessel_distance": self.thresholds.min_distance_vessel_warning + 1.0,
            "threshold_violations": 0,
            "trajectory_corrections": 0,
            "final_score": 95
        }

    def test_good_technique(self):
        technique, reason = classify_technique(self.good_features, self.thresholds)
        self.assertEqual(technique, "GOOD_TECHNIQUE")
        self.assertIn("stable control", reason)

    def test_excessive_angle(self):
        features = self.good_features.copy()
        # Make pitch way too high
        features["average_pitch"] = math.degrees(self.thresholds.max_entry_angle) + 15.0
        technique, reason = classify_technique(features, self.thresholds)
        self.assertEqual(technique, "EXCESSIVE_ANGLE")
        self.assertIn("entry angle", reason)
        
        # Make pitch way too low
        features["average_pitch"] = math.degrees(self.thresholds.min_entry_angle) - 15.0
        technique, reason = classify_technique(features, self.thresholds)
        self.assertEqual(technique, "EXCESSIVE_ANGLE")

    def test_excessive_yaw(self):
        features = self.good_features.copy()
        features["average_yaw"] = math.degrees(self.thresholds.max_yaw_deviation_risk) + 10.0
        technique, reason = classify_technique(features, self.thresholds)
        self.assertEqual(technique, "EXCESSIVE_YAW")
        self.assertIn("lateral", reason)

    def test_excessive_depth(self):
        features = self.good_features.copy()
        features["maximum_depth"] = self.thresholds.max_depth_risk + 2.0
        technique, reason = classify_technique(features, self.thresholds)
        self.assertEqual(technique, "EXCESSIVE_DEPTH")
        self.assertIn("maximum safe depth", reason)

    def test_unstable_trajectory_variance(self):
        features = self.good_features.copy()
        features["pitch_variance"] = 20.0 # High variance
        technique, reason = classify_technique(features, self.thresholds)
        self.assertEqual(technique, "UNSTABLE_TRAJECTORY")
        self.assertIn("variance", reason)

    def test_unstable_trajectory_corrections(self):
        features = self.good_features.copy()
        features["trajectory_corrections"] = 4
        technique, reason = classify_technique(features, self.thresholds)
        self.assertEqual(technique, "UNSTABLE_TRAJECTORY")
        self.assertIn("corrections", reason)
        
    def test_unstable_trajectory_violations(self):
        features = self.good_features.copy()
        features["threshold_violations"] = 4
        technique, reason = classify_technique(features, self.thresholds)
        self.assertEqual(technique, "UNSTABLE_TRAJECTORY")
        self.assertIn("violations", reason)

    def test_multiple_violations(self):
        features = self.good_features.copy()
        features["maximum_depth"] = self.thresholds.max_depth_risk + 2.0
        features["average_pitch"] = math.degrees(self.thresholds.max_entry_angle) + 15.0
        technique, reason = classify_technique(features, self.thresholds)
        self.assertEqual(technique, "MULTIPLE_VIOLATIONS")
        self.assertIn("EXCESSIVE_DEPTH", reason)
        self.assertIn("EXCESSIVE_ANGLE", reason)

    def test_incomplete_empty_data(self):
        technique, reason = classify_technique({}, self.thresholds)
        self.assertEqual(technique, "GOOD_TECHNIQUE")
        self.assertIn("Insufficient data", reason)
        
        # Test missing some keys
        features = {"maximum_depth": 1.0} # Not enough to fail, some keys missing
        technique, reason = classify_technique(features, self.thresholds)
        self.assertEqual(technique, "GOOD_TECHNIQUE")

if __name__ == '__main__':
    unittest.main()
