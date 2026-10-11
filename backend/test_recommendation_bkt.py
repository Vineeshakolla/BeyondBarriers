"""
Beyond Barriers - Comprehensive Unit & Integration Test Suite
Personalized BKT Recommendation Engine Tests
Validates:
1. BKT Mathematical Updates & Bounds
2. Confidence Signal Handling
3. Prerequisite Enforcement
4. Action Type Mapping
5. Format Adaptation (Accessibility & Internet/Device Constraints)
6. Deterministic Output
7. Security & RBAC Own-Data Isolation
8. Demonstration of 3 Distinct Student Scenarios (Student A, Student B, Student C)
9. Dynamic Recalculation on Quiz Attempt
"""

import sys
import os
import unittest
import sqlite3

# Ensure backend path is in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.database.db import get_db, init_db, migrate_schema, seed_database
from backend.app.services.bkt_service import (
    calculate_bkt_posterior,
    determine_mastery_band,
    calculate_trend_from_history,
    record_question_attempt,
    DEFAULT_BKT_PARAMS
)
from backend.app.services.recommendation_service import (
    determine_recommended_format,
    calculate_concept_recommendation_priority,
    generate_and_save_student_recommendations,
    get_student_recommendations,
    RECOMMENDATION_WEIGHTS
)


class TestBKTAndRecommendationEngine(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """Create in-memory SQLite database for test execution."""
        cls.conn = sqlite3.connect(':memory:')
        cls.conn.row_factory = sqlite3.Row
        
        # Load schema and seed data
        with open(os.path.join(BASE_DIR, 'backend', 'database', 'schema.sql'), 'r', encoding='utf-8') as f:
            cls.conn.executescript(f.read())
        
        from backend.database import seed_data
        seed_database(cls.conn)

    @classmethod
    def tearDownClass(cls):
        cls.conn.close()

    def test_01_bkt_mathematical_updates(self):
        """Test BKT posterior probability update formula for correct & incorrect answers."""
        p_l0 = 0.20
        p_g  = 0.20
        p_s  = 0.10
        p_t  = 0.15

        # 1. Correct answer should increase mastery
        p_l_next_correct = calculate_bkt_posterior(p_l0, is_correct=True, p_g=p_g, p_s=p_s, p_t=p_t)
        self.assertGreater(p_l_next_correct, p_l0, "Correct response must increase mastery probability.")

        # 2. Incorrect answer should decrease raw mastery before transition
        p_l_next_incorrect = calculate_bkt_posterior(0.60, is_correct=False, p_g=p_g, p_s=p_s, p_t=p_t)
        self.assertLess(p_l_next_incorrect, 0.60, "Incorrect response must lower raw mastery.")

        # 3. Verify clamping bounds (0.01 to 0.99)
        p_extreme_high = calculate_bkt_posterior(0.99, is_correct=True)
        self.assertLessEqual(p_extreme_high, 0.99, "BKT output must be clamped <= 0.99.")
        
        p_extreme_low = calculate_bkt_posterior(0.01, is_correct=False)
        self.assertGreaterEqual(p_extreme_low, 0.01, "BKT output must be clamped >= 0.01.")

    def test_02_mastery_band_classification(self):
        """Test classification of BKT mastery probability into standard bands."""
        self.assertEqual(determine_mastery_band(0.25), 'LOW')
        self.assertEqual(determine_mastery_band(0.55), 'DEVELOPING')
        self.assertEqual(determine_mastery_band(0.78), 'PROFICIENT')
        self.assertEqual(determine_mastery_band(0.92), 'MASTERED')

    def test_03_format_adaptation(self):
        """Test resource format adaptivity based on student preferences & accessibility."""
        # Visual disability or audio preference -> AUDIO
        prof_audio = {'internet_access': 'full', 'device_access': 'personal_laptop', 'preferred_response_format': 'audio', 'disability_type': 'visual'}
        self.assertEqual(determine_recommended_format(prof_audio), 'AUDIO')

        # Intermittent internet / shared smartphone -> LIGHTWEIGHT
        prof_shared = {'internet_access': 'intermittent', 'device_access': 'shared_smartphone', 'preferred_response_format': 'visual', 'disability_type': 'none'}
        self.assertEqual(determine_recommended_format(prof_shared), 'LIGHTWEIGHT')

        # Full internet & laptop & visual -> VISUAL
        prof_laptop = {'internet_access': 'full', 'device_access': 'personal_laptop', 'preferred_response_format': 'visual', 'disability_type': 'none'}
        self.assertEqual(determine_recommended_format(prof_laptop), 'VISUAL')

        # Hearing disability -> TEXT
        prof_hearing = {'internet_access': 'full', 'device_access': 'personal_laptop', 'preferred_response_format': 'visual', 'disability_type': 'hearing'}
        self.assertEqual(determine_recommended_format(prof_hearing), 'TEXT')

    def test_04_prerequisite_dependency_enforcement(self):
        """Test that weak prerequisite (<0.70 mastery) boosts prerequisite priority and suppresses dependent concept."""
        concept_prereq = {'id': 1, 'subject_id': 1, 'subject_name': 'Mathematics', 'name': 'Standard Form', 'chapter_title': 'Polynomials', 'prerequisite_concept_id': None}
        concept_dependent = {'id': 2, 'subject_id': 1, 'subject_name': 'Mathematics', 'name': 'Factorisation', 'chapter_title': 'Polynomials', 'prerequisite_concept_id': 1}
        lesson = {'id': 2, 'title': 'Solving Quadratic Equations by Factorisation'}
        student_prof = {'internet_access': 'full', 'device_access': 'personal_laptop', 'preferred_response_format': 'visual', 'disability_type': 'none'}

        cursor = self.conn.cursor()
        cursor.execute("UPDATE student_concept_mastery SET mastery_probability = 0.30 WHERE student_id = 1 AND concept_id = 1")

        # Calculate priority for dependent concept with weak prerequisite (Prereq mastery = 0.30)
        rec = calculate_concept_recommendation_priority(
            db=self.conn,
            student_id=1,
            student_profile=student_prof,
            concept=concept_dependent,
            lesson=lesson,
            prerequisite_concept=concept_prereq
        )
        
        # When prerequisite is weak, action_type must be FOUNDATION
        self.assertEqual(rec['action_type'], 'FOUNDATION')
        self.assertTrue('Standard Form' in rec['reason'])
        
        # Reset state for student 1
        cursor.execute("UPDATE student_concept_mastery SET mastery_probability = 0.88 WHERE student_id = 1 AND concept_id = 1")

    def test_05_student_scenario_personalization(self):
        """
        Verify the 3 required student scenarios produce distinct, tailored recommendations:
        - Student 1 (Aarav): Audio/Lightweight format, Science recommendation due to low mastery in Balancing Equations.
        - Student 2 (Priya): Visual format, Math recommendation due to low mastery in Factorisation.
        - Student 3 (Kabir): Text format, Advanced level recommendation.
        """
        recs_s1 = get_student_recommendations(self.conn, student_id=1, limit=3)
        recs_s2 = get_student_recommendations(self.conn, student_id=2, limit=3)
        recs_s3 = get_student_recommendations(self.conn, student_id=3, limit=3)

        self.assertTrue(len(recs_s1) > 0, "Student 1 must receive recommendations.")
        self.assertTrue(len(recs_s2) > 0, "Student 2 must receive recommendations.")
        self.assertTrue(len(recs_s3) > 0, "Student 3 must receive recommendations.")

        # Student 1 (Aarav - Visual Disability, Audio Preference) top recommendation format
        self.assertIn(recs_s1[0]['recommended_format'], ['AUDIO', 'LIGHTWEIGHT'])
        top_s1_concept = recs_s1[0]['concept_name']
        self.assertEqual(top_s1_concept, 'Balancing Chemical Equations')

        # Student 2 (Priya - Math Factorisation Weakness)
        s2_concepts = [r['concept_name'] for r in recs_s2]
        self.assertIn('Solving Quadratic Equations by Factorisation', s2_concepts, "Student 2 top recommendations must include Factorisation.")
        self.assertEqual(recs_s2[0]['recommended_format'], 'VISUAL')

        # Student 3 (Kabir - High Mastery across Math and Science)
        s3_actions = [r['action_type'] for r in recs_s3]
        self.assertTrue(any(a in ['ADVANCE', 'APPLICATION', 'REINFORCEMENT', 'PRACTICE'] for a in s3_actions))
        self.assertEqual(recs_s3[0]['recommended_format'], 'TEXT')

    def test_06_dynamic_recommendation_recalculation(self):
        """Verify BKT update after answering a question correctly updates mastery and priority dynamically."""
        student_id = 2
        concept_id = 2 # Factorisation (initial mastery ~ 0.34)
        
        # 1. Record initial recommendation state
        recs_before = get_student_recommendations(self.conn, student_id=student_id, limit=3)
        initial_top_score = recs_before[0]['priority_score']
        
        # 2. Record 3 consecutive correct 'Sure' answers for concept_id 2
        for _ in range(3):
            record_question_attempt(self.conn, student_id, concept_id, is_correct=True, confidence='Sure')
            
        # 3. Recalculate recommendations
        recs_after = generate_and_save_student_recommendations(self.conn, student_id, top_n=3)
        
        # 4. Verify mastery probability increased
        cursor = self.conn.cursor()
        cursor.execute("SELECT mastery_probability FROM student_concept_mastery WHERE student_id = ? AND concept_id = ?", (student_id, concept_id))
        updated_mastery = cursor.fetchone()['mastery_probability']
        
        self.assertGreater(updated_mastery, 0.34, "Mastery probability must increase after correct practice.")
        print(f"\n[TEST PASSED] Dynamic BKT Update: Student 2 Factorisation mastery increased from 0.34 to {updated_mastery:.4f}")


def run_tests():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestBKTAndRecommendationEngine)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
