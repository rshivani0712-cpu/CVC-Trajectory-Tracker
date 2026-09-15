import unittest
import math
from app.ai.performance import analyze_performance
from app.db_models import TrainingSession, TrajectoryRecord
from app.thresholds import TrainingThresholds

class TestAIPerformance(unittest.TestCase):
    def setUp(self):
        self.thresholds = TrainingThresholds()
        self.good_pitch = math.degrees((self.thresholds.min_entry_angle + self.thresholds.max_entry_angle) / 2)
        
    def _create_session(self, pitch: float, yaw: float, depth: float, dev: float, score: int, violations: int = 0) -> TrainingSession:
        session = TrainingSession(session_id="test", final_score=score)
        
        # We need variance to be small for strengths to trigger, so create identical records 
        records = []
        for _ in range(5):
            status = "WARNING" if violations > 0 else "WITHIN_THRESHOLD"
            records.append(
                TrajectoryRecord(
                    pitch=pitch, 
                    yaw=yaw, 
                    depth=depth, 
                    deviation=dev, 
                    vessel_distance_target=10.0,
                    vessel_distance_danger=15.0,
                    status=status,
                    score=score
                )
            )
            violations -= 1 # Only have the exact number of violations requested
            
        session.records = records
        return session

    def test_excellent_performance(self):
        session = self._create_session(pitch=self.good_pitch, yaw=0.0, depth=1.0, dev=0.5, score=95)
        analysis = analyze_performance(session, self.thresholds)
        
        self.assertEqual(analysis["performance_level"], "EXCELLENT")
        self.assertEqual(analysis["technique"], "GOOD_TECHNIQUE")
        self.assertIn("Stable yaw control", analysis["strengths"])
        self.assertIn("No threshold violations", analysis["strengths"])
        self.assertIn("Minor accuracy deviations", analysis["weaknesses"][0])
        
    def test_good_performance(self):
        # Good but score < 90
        session = self._create_session(pitch=self.good_pitch, yaw=0.0, depth=1.0, dev=0.5, score=85)
        analysis = analyze_performance(session, self.thresholds)
        
        self.assertEqual(analysis["performance_level"], "GOOD")
        self.assertEqual(analysis["technique"], "GOOD_TECHNIQUE")

    def test_needs_improvement_angle(self):
        # Bad angle, decent score
        bad_pitch = math.degrees(self.thresholds.max_entry_angle) + 20.0
        session = self._create_session(pitch=bad_pitch, yaw=0.0, depth=1.0, dev=0.5, score=70)
        analysis = analyze_performance(session, self.thresholds)
        
        self.assertEqual(analysis["performance_level"], "NEEDS_IMPROVEMENT")
        self.assertEqual(analysis["technique"], "EXCESSIVE_ANGLE")
        
        weaknesses_str = " ".join(analysis["weaknesses"])
        self.assertIn("angle", weaknesses_str.lower())
        self.assertIn("Focus on initial alignment", " ".join(analysis["recommendations"]))
        
    def test_high_risk_depth(self):
        # Exceeds max depth risk
        bad_depth = self.thresholds.max_depth_risk + 3.0
        session = self._create_session(pitch=self.good_pitch, yaw=0.0, depth=bad_depth, dev=0.5, score=40)
        analysis = analyze_performance(session, self.thresholds)
        
        self.assertEqual(analysis["performance_level"], "HIGH_RISK_PERFORMANCE")
        self.assertEqual(analysis["technique"], "EXCESSIVE_DEPTH")
        
        weaknesses_str = " ".join(analysis["weaknesses"])
        self.assertIn("depth", weaknesses_str.lower())

    def test_high_risk_multiple_violations(self):
        # More than 2 violations triggers HIGH_RISK_PERFORMANCE usually, or MULTIPLE_VIOLATIONS from technique
        bad_pitch = math.degrees(self.thresholds.max_entry_angle) + 20.0
        bad_depth = self.thresholds.max_depth_risk + 3.0
        session = self._create_session(pitch=bad_pitch, yaw=0.0, depth=bad_depth, dev=0.5, score=30, violations=5)
        
        analysis = analyze_performance(session, self.thresholds)
        self.assertEqual(analysis["performance_level"], "HIGH_RISK_PERFORMANCE")
        self.assertEqual(analysis["technique"], "MULTIPLE_VIOLATIONS")
        
    def test_unstable_trajectory(self):
        session = TrainingSession(session_id="unstable", final_score=65)
        # Create records with high variance to trigger UNSTABLE_TRAJECTORY
        session.records = [
            TrajectoryRecord(pitch=self.good_pitch, yaw=0.0, depth=1.0, deviation=0.5, vessel_distance_target=10.0, vessel_distance_danger=10.0, status="WITHIN_THRESHOLD", score=80),
            TrajectoryRecord(pitch=self.good_pitch+20, yaw=15.0, depth=2.0, deviation=1.0, vessel_distance_target=8.0, vessel_distance_danger=8.0, status="WARNING", score=70),
            TrajectoryRecord(pitch=self.good_pitch-20, yaw=-15.0, depth=3.0, deviation=1.5, vessel_distance_target=6.0, vessel_distance_danger=6.0, status="WARNING", score=60),
            TrajectoryRecord(pitch=self.good_pitch, yaw=0.0, depth=4.0, deviation=0.5, vessel_distance_target=4.0, vessel_distance_danger=4.0, status="WITHIN_THRESHOLD", score=65),
        ]
        
        analysis = analyze_performance(session, self.thresholds)
        # 3 corrections, high variance -> UNSTABLE_TRAJECTORY
        self.assertEqual(analysis["technique"], "UNSTABLE_TRAJECTORY")
        self.assertEqual(analysis["performance_level"], "NEEDS_IMPROVEMENT")
        
        weaknesses_str = " ".join(analysis["weaknesses"])
        self.assertIn("unstable", weaknesses_str.lower())
        self.assertIn("smooth", " ".join(analysis["recommendations"]).lower())

if __name__ == '__main__':
    unittest.main()
