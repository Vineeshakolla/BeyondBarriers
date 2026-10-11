"""
Beyond Barriers - Personalized Lesson Recommendation Engine
Generates dynamic, explainable, and deterministic lesson recommendations using:
1. BKT Concept Mastery (35%)
2. Academic Performance (20%)
3. Attempt History & Question Errors (15%)
4. Confidence Signal (10%)
5. Learning Trend (10%)
6. Attendance & Catch-up Need (5%)
7. Prerequisite Graph Relevance (5%)

Adapts delivery format according to student connectivity, device, accessibility, and preferred format.
Enforces RBAC and student data isolation.
"""

import logging
from backend.app.services.bkt_service import (
    get_or_create_student_concept_mastery,
    determine_mastery_band,
    DEFAULT_BKT_PARAMS
)

logger = logging.getLogger('recommendation_service')

# Configurable Weights (Must sum to 1.0)
RECOMMENDATION_WEIGHTS = {
    'bkt_mastery_gap': 0.35,
    'academic_performance': 0.20,
    'attempt_history': 0.15,
    'confidence_risk': 0.10,
    'learning_trend': 0.10,
    'attendance_catchup': 0.05,
    'prerequisite_relevance': 0.05
}


def determine_recommended_format(student_profile):
    """
    Adapt recommended resource format based on student:
    - internet_access ('full', 'intermittent', 'none')
    - device_access ('personal_laptop', 'shared_smartphone', 'none')
    - preferred_response_format ('visual', 'text', 'audio')
    - disability_type ('visual', 'hearing', 'speech', 'motor', 'none')
    """
    internet = str(student_profile.get('internet_access', 'full')).lower()
    device = str(student_profile.get('device_access', 'personal_laptop')).lower()
    pref_format = str(student_profile.get('preferred_response_format', 'visual')).lower()
    disability = str(student_profile.get('disability_type', 'none')).lower()

    # 1. Offline / Low Bandwidth / Shared Device Constraints
    if internet in ['none', 'offline'] or device == 'none':
        return 'LIGHTWEIGHT'
    
    if internet == 'intermittent' or device == 'shared_smartphone':
        if pref_format == 'audio' or disability == 'visual':
            return 'AUDIO'
        return 'LIGHTWEIGHT'

    # 2. Accessibility Adaptations
    if disability == 'visual':
        return 'AUDIO'
    elif disability == 'hearing':
        return 'TEXT'
    
    # 3. Standard Student Preference
    if pref_format == 'audio':
        return 'AUDIO'
    elif pref_format == 'text':
        return 'TEXT'
    else:
        return 'VISUAL'


def get_student_subject_marks(db, student_id, subject_id):
    """Fetch average marks percentage for student in given subject."""
    cursor = db.cursor()
    cursor.execute('''
        SELECT AVG(percentage) as avg_pct FROM marks
        WHERE student_id = ? AND subject_id = ?
    ''', (student_id, subject_id))
    row = cursor.fetchone()
    if row and row['avg_pct'] is not None:
        return float(row['avg_pct'])
    return 70.0 # Default benchmark if no formal exam marks recorded


def get_student_attendance_data(db, student_id, subject_id):
    """Fetch attendance percentage and trend for student in subject."""
    cursor = db.cursor()
    cursor.execute('''
        SELECT attendance_percentage, trend, consecutive_missed
        FROM attendance
        WHERE student_id = ? AND subject_id = ?
    ''', (student_id, subject_id))
    row = cursor.fetchone()
    if row:
        return {
            'percentage': float(row['attendance_percentage']),
            'trend': row['trend'],
            'missed': row['consecutive_missed']
        }
    return {'percentage': 85.0, 'trend': 'stable', 'missed': 0}


def generate_explanation_reason(action_type, concept_name, mastery_prob, trend, attempts_count, sure_count, guessing_count, prereq_name=None, attendance_pct=100.0):
    """Generate human-readable, student-friendly explanation for recommendation."""
    mastery_pct = int(round(mastery_prob * 100))
    
    if action_type == 'FOUNDATION':
        if prereq_name:
            return f"Strengthen prerequisite '{prereq_name}' to unlock advanced concepts in {concept_name}."
        return f"Review foundational concepts to build confidence in {concept_name}."
    
    elif action_type == 'CATCH_UP':
        if attendance_pct < 75.0:
            return f"Catch up on missed material in {concept_name} (current attendance: {int(attendance_pct)}%)."
        return f"Catch up on key practice problems for {concept_name}."

    elif action_type == 'RETEACH':
        if guessing_count > sure_count:
            return f"Your estimated mastery in {concept_name} is developing ({mastery_pct}%). Frequent guessing detected—review core definitions."
        if trend == 'DECLINING':
            return f"Recent quiz attempts on {concept_name} show declining accuracy ({mastery_pct}% mastery). Revisit key explanations."
        return f"Your mastery in {concept_name} is currently developing ({mastery_pct}%). Practice core steps to strengthen your foundation."

    elif action_type == 'PRACTICE':
        if trend == 'IMPROVING':
            return f"You are making steady progress in {concept_name} ({mastery_pct}% mastery). Continue practicing to reach proficiency!"
        return f"Concept {concept_name} is developing ({mastery_pct}%). Solve guided practice problems to build speed and accuracy."

    elif action_type == 'REINFORCEMENT':
        return f"You have strong understanding of {concept_name} ({mastery_pct}%). Complete consolidation exercises to master this topic."

    elif action_type == 'APPLICATION':
        return f"High mastery achieved in {concept_name} ({mastery_pct}%). Challenge yourself with real-world application problems."

    elif action_type == 'ADVANCE':
        if prereq_name:
            return f"Great job! Having mastered prerequisite '{prereq_name}', move forward to {concept_name}."
        return f"Strong concept mastery ({mastery_pct}%). Ready to advance to the next learning objective!"

    return f"Recommended based on your current learning progress in {concept_name}."


def calculate_concept_recommendation_priority(
    db, student_id, student_profile, concept, lesson, prerequisite_concept=None
):
    """
    Calculate deterministic priority score (0.0 to 1.0) and action type for a candidate concept/lesson.
    """
    concept_id = concept['id']
    subject_id = concept['subject_id']
    
    # 1. Fetch current BKT Mastery
    mastery = get_or_create_student_concept_mastery(db, student_id, concept_id)
    p_l = mastery['mastery_probability']
    attempt_count = mastery['attempt_count']
    correct_count = mastery['correct_count']
    sure_count = mastery['sure_count']
    guessing_count = mastery['guessing_count']
    trend = mastery['trend']
    
    # 2. Check Prerequisite Mastery if concept has a prerequisite
    prereq_mastery_prob = 1.0
    prereq_weak = False
    if prerequisite_concept:
        prereq_mastery_rec = get_or_create_student_concept_mastery(db, student_id, prerequisite_concept['id'])
        prereq_mastery_prob = prereq_mastery_rec['mastery_probability']
        if prereq_mastery_prob < 0.70:
            prereq_weak = True

    # 3. Factor 1: BKT Mastery Gap (35%)
    # If prerequisite is weak, shift focus to prerequisite concept instead of this concept
    mastery_gap = (1.0 - p_l)
    score_bkt_gap = RECOMMENDATION_WEIGHTS['bkt_mastery_gap'] * mastery_gap

    # 4. Factor 2: Academic Performance (20%)
    subject_marks_pct = get_student_subject_marks(db, student_id, subject_id)
    marks_gap = max(0.0, (100.0 - subject_marks_pct) / 100.0)
    score_academic = RECOMMENDATION_WEIGHTS['academic_performance'] * marks_gap

    # 5. Factor 3: Attempt History & Error Difficulty (15%)
    incorrect_count = max(0, attempt_count - correct_count)
    attempt_risk = min(1.0, incorrect_count / 4.0)
    score_attempts = RECOMMENDATION_WEIGHTS['attempt_history'] * attempt_risk

    # 6. Factor 4: Confidence Signal (10%)
    # Guessing ratio or incorrect+sure risk
    confidence_risk = 0.0
    if attempt_count > 0:
        guessing_ratio = guessing_count / float(attempt_count)
        confidence_risk = min(1.0, guessing_ratio * 1.2)
    score_confidence = RECOMMENDATION_WEIGHTS['confidence_risk'] * confidence_risk

    # 7. Factor 5: Learning Trend (10%)
    trend_score_map = {
        'DECLINING': 1.0,
        'STABLE': 0.5,
        'INSUFFICIENT_DATA': 0.4,
        'IMPROVING': 0.1
    }
    score_trend = RECOMMENDATION_WEIGHTS['learning_trend'] * trend_score_map.get(trend, 0.4)

    # 8. Factor 6: Attendance & Catch-Up Need (5%)
    att_data = get_student_attendance_data(db, student_id, subject_id)
    attendance_pct = att_data['percentage']
    att_gap = max(0.0, (100.0 - attendance_pct) / 100.0)
    score_attendance = RECOMMENDATION_WEIGHTS['attendance_catchup'] * att_gap

    # 9. Factor 7: Prerequisite Relevance (5%)
    prereq_relevance = 1.0 if prereq_weak else 0.2
    score_prereq = RECOMMENDATION_WEIGHTS['prerequisite_relevance'] * prereq_relevance

    # Total Weighted Priority Score
    raw_priority = (
        score_bkt_gap +
        score_academic +
        score_attempts +
        score_confidence +
        score_trend +
        score_attendance +
        score_prereq
    )

    # 10. Determine Action Type & Final Adjustments
    if prereq_weak:
        # Suppress dependent concept if prerequisite is weak
        raw_priority *= 0.3
        action_type = 'FOUNDATION'
    elif attendance_pct < 70.0 and p_l < 0.60:
        action_type = 'CATCH_UP'
    elif p_l < 0.40:
        action_type = 'RETEACH'
    elif p_l < 0.70:
        action_type = 'PRACTICE'
    elif p_l < 0.85:
        action_type = 'REINFORCEMENT'
    else:
        # High mastery (p_l >= 0.85): Mastered content receives lower priority for repeat basic lessons
        raw_priority *= 0.4
        action_type = 'ADVANCE' if attempt_count <= 5 else 'APPLICATION'

    final_priority = max(0.01, min(0.99, round(raw_priority, 4)))

    prereq_name = prerequisite_concept['name'] if prerequisite_concept else None
    reason = generate_explanation_reason(
        action_type=action_type,
        concept_name=concept['name'],
        mastery_prob=p_l,
        trend=trend,
        attempts_count=attempt_count,
        sure_count=sure_count,
        guessing_count=guessing_count,
        prereq_name=prereq_name,
        attendance_pct=attendance_pct
    )

    recommended_format = determine_recommended_format(student_profile)

    return {
        'lesson_id': lesson['id'],
        'concept_id': concept_id,
        'subject_id': subject_id,
        'subject_name': concept['subject_name'],
        'chapter_title': concept['chapter_title'],
        'concept_name': concept['name'],
        'lesson_title': lesson['title'],
        'action_type': action_type,
        'mastery_probability': p_l,
        'mastery_band': determine_mastery_band(p_l),
        'priority_score': final_priority,
        'reason': reason,
        'recommended_format': recommended_format,
        'recommended_resource_type': 'LESSON',
        'prereq_weak': prereq_weak
    }


def generate_and_save_student_recommendations(db, student_id, top_n=3):
    """
    Core Recommendation Engine Pipeline:
    1. Retrieve Student Unified Profile.
    2. Query Class 10 concepts, lessons, and prerequisite links.
    3. Calculate priority scores for candidate lessons.
    4. Rank candidates deterministically, applying subject diversity.
    5. Save top N active recommendations in student_recommendations table.
    6. Return formatted recommendation list.
    """
    cursor = db.cursor()
    
    # 1. Retrieve Student Unified Profile
    cursor.execute('''
        SELECT id, name, roll_number, class, stream, disability_type, 
               internet_access, device_access, preferred_response_format, preferred_language
        FROM students WHERE id = ?
    ''', (student_id,))
    student_profile_row = cursor.fetchone()
    if not student_profile_row:
        logger.error(f"Student profile ID {student_id} not found.")
        return []
    student_profile = dict(student_profile_row)

    # 2. Fetch all Class 10 concepts with subject & chapter metadata
    cursor.execute('''
        SELECT c.id, c.chapter_id, c.name, c.description, c.prerequisite_concept_id,
               m.title as chapter_title, m.subject_id, s.name as subject_name
        FROM concepts c
        JOIN modules m ON c.chapter_id = m.id
        JOIN subjects s ON m.subject_id = s.id
        WHERE s.class = 'Class 10'
        ORDER BY s.id ASC, m.module_number ASC, c.id ASC
    ''')
    concepts_rows = cursor.fetchall()
    if not concepts_rows:
        logger.warning("No Class 10 concepts found in database.")
        return []
    
    concepts_by_id = {r['id']: dict(r) for r in concepts_rows}

    # Fetch corresponding lessons
    cursor.execute('''
        SELECT l.id, l.concept_id, l.title, l.content, l.learning_objective, l.difficulty_level
        FROM lessons l
        JOIN concepts c ON l.concept_id = c.id
        ORDER BY l.id ASC
    ''')
    lessons_by_concept = {}
    for row in cursor.fetchall():
        c_id = row['concept_id']
        if c_id not in lessons_by_concept:
            lessons_by_concept[c_id] = dict(row)

    # 3. Calculate candidate priority scores
    candidates = []
    for c_id, concept in concepts_by_id.items():
        lesson = lessons_by_concept.get(c_id)
        if not lesson:
            continue
        
        prereq_concept = None
        if concept['prerequisite_concept_id']:
            prereq_concept = concepts_by_id.get(concept['prerequisite_concept_id'])
        
        cand = calculate_concept_recommendation_priority(
            db=db,
            student_id=student_id,
            student_profile=student_profile,
            concept=concept,
            lesson=lesson,
            prerequisite_concept=prereq_concept
        )
        candidates.append(cand)

    # Sort candidates deterministically by priority score descending
    candidates.sort(key=lambda x: (-x['priority_score'], x['subject_id'], x['concept_id']))

    # 4. Apply Diversity Selection across subjects
    selected_recs = []
    seen_subjects = set()
    
    # First pass: Pick top scoring concept per subject
    for cand in candidates:
        subj = cand['subject_name']
        if subj not in seen_subjects:
            selected_recs.append(cand)
            seen_subjects.add(subj)
        if len(selected_recs) >= top_n:
            break
    
    # Second pass: Fill remaining slots if fewer subjects than top_n
    if len(selected_recs) < top_n:
        selected_ids = {r['concept_id'] for r in selected_recs}
        for cand in candidates:
            if cand['concept_id'] not in selected_ids:
                selected_recs.append(cand)
                selected_ids.add(cand['concept_id'])
            if len(selected_recs) >= top_n:
                break

    # Re-sort final selection by priority score descending
    selected_recs.sort(key=lambda x: -x['priority_score'])

    # 5. Save in student_recommendations table (Deactivate old recommendations)
    cursor.execute('UPDATE student_recommendations SET is_active = 0 WHERE student_id = ?', (student_id,))
    
    saved_results = []
    for rec in selected_recs:
        cursor.execute('''
            INSERT INTO student_recommendations
            (student_id, lesson_id, concept_id, action_type, priority_score, reason, recommended_format, recommended_resource_type, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ''', (
            student_id,
            rec['lesson_id'],
            rec['concept_id'],
            rec['action_type'],
            rec['priority_score'],
            rec['reason'],
            rec['recommended_format'],
            rec['recommended_resource_type']
        ))
        rec_id = cursor.lastrowid
        rec['id'] = rec_id
        saved_results.append(rec)

    db.commit()
    return saved_results


def get_student_recommendations(db, student_id, limit=3):
    """
    Retrieve active recommendations for authenticated student.
    Recalculates dynamically if no active recommendations are stored.
    """
    cursor = db.cursor()
    cursor.execute('''
        SELECT r.id, r.student_id, r.lesson_id, r.concept_id, r.action_type, 
               r.priority_score, r.reason, r.recommended_format, r.recommended_resource_type,
               l.title as lesson_title, c.name as concept_name, m.title as chapter_title,
               s.name as subject_name, m.id as module_id
        FROM student_recommendations r
        JOIN lessons l ON r.lesson_id = l.id
        JOIN concepts c ON r.concept_id = c.id
        JOIN modules m ON c.chapter_id = m.id
        JOIN subjects s ON m.subject_id = s.id
        WHERE r.student_id = ? AND r.is_active = 1
        ORDER BY r.priority_score DESC
        LIMIT ?
    ''', (student_id, limit))
    rows = cursor.fetchall()

    if rows:
        results = []
        for r in rows:
            rec = dict(r)
            # Attach BKT mastery band
            mastery = get_or_create_student_concept_mastery(db, student_id, rec['concept_id'])
            rec['mastery_probability'] = mastery['mastery_probability']
            rec['mastery_band'] = determine_mastery_band(mastery['mastery_probability'])
            rec['trend'] = mastery['trend']
            results.append(rec)
        return results

    # Recalculate dynamically if missing
    return generate_and_save_student_recommendations(db, student_id, top_n=limit)
