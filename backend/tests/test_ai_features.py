import unittest
from app.ai.features import extract_features, count_trajectory_corrections, calculate_variance
from app.db_models import TrainingSession, TrajectoryRecord

class TestAIFeatures(unittest.TestCase):
    def setUp(self):
        self.empty_session = TrainingSession(session_id="empty", final_score=0, records=[])
        
        # Create a mock session with simulated records
        self.active_session = TrainingSession(session_id="active", final_score=85)
        self.active_session.records = [
            TrajectoryRecord(pitch=40.0, yaw=0.0, depth=1.0, deviation=0.5, vessel_distance_target=10.0, vessel_distance_danger=15.0, status="WITHIN_THRESHOLD", score=100),
            TrajectoryRecord(pitch=45.0, yaw=2.0, depth=5.0, deviation=1.0, vessel_distance_target=8.0, vessel_distance_danger=12.0, status="WITHIN_THRESHOLD", score=90),
            # Sudden correction (pitch change > 5.0, yaw change > 5.0)
            TrajectoryRecord(pitch=52.0, yaw=8.0, depth=10.0, deviation=2.0, vessel_distance_target=5.0, vessel_distance_danger=8.0, status="WARNING", score=80),
            TrajectoryRecord(pitch=50.0, yaw=6.0, depth=15.0, deviation=3.0, vessel_distance_target=2.0, vessel_distance_danger=4.0, status="HIGH_RISK", score=70)
        ]

    def test_calculate_variance(self):
        self.assertEqual(calculate_variance([10.0], 10.0), 0.0)
        
        values = [2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0]
        mean = sum(values) / len(values) # 40/8 = 5.0
        # Variances: (3^2=9) + 1 + 1 + 1 + 0 + 0 + 4 + 16 = 32. 32/8 = 4.0
        self.assertEqual(calculate_variance(values, mean), 4.0)

    def test_count_trajectory_corrections(self):
        corrections = count_trajectory_corrections(self.active_session.records, threshold=5.0)
        # 1st to 2nd: pitch diff 5.0, yaw diff 2.0 -> no correction (> 5.0 required)
        # 2nd to 3rd: pitch diff 7.0, yaw diff 6.0 -> 1 correction
        # 3rd to 4th: pitch diff 2.0, yaw diff 2.0 -> no correction
        self.assertEqual(corrections, 1)

    def test_extract_features_empty_session(self):
        features = extract_features(self.empty_session)
        self.assertEqual(features["average_pitch"], 0.0)
        self.assertEqual(features["threshold_violations"], 0)
        self.assertEqual(features["final_score"], 0)

    def test_extract_features_active_session(self):
        features = extract_features(self.active_session)
        
        # Expected averages
        # Pitches: 40, 45, 52, 50 -> sum = 187 -> avg = 46.75
        self.assertEqual(features["average_pitch"], 46.75)
        
        # Maximum depth: 15.0
        self.assertEqual(features["maximum_depth"], 15.0)
        
        # Deviations: 0.5, 1.0, 2.0, 3.0 -> sum = 6.5 -> avg = 1.625
        self.assertAlmostEqual(features["average_deviation"], 1.62, places=2)
        self.assertEqual(features["maximum_deviation"], 3.0)
        
        # Minimum vessel distance
        # Danger distances: 15, 12, 8, 4 -> min 4.0
        # Target distances: 10, 8, 5, 2 -> min 2.0
        # Overall min -> 2.0
        self.assertEqual(features["minimum_vessel_distance"], 2.0)
        
        # Violations (WARNING + HIGH_RISK) -> 2
        self.assertEqual(features["threshold_violations"], 2)
        
        # Corrections -> 1
        self.assertEqual(features["trajectory_corrections"], 1)
        
        # Final Score
        self.assertEqual(features["final_score"], 85)

if __name__ == '__main__':
    unittest.main()
