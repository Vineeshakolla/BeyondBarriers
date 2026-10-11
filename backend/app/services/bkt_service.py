"""
Beyond Barriers - Bayesian Knowledge Tracing (BKT) Service
Implements concept/skill-level BKT tracking with configurable parameters.
Maintains P(L0), P(T), P(G), P(S), and posterior P(L_next) for each student + concept.
Secondary signals: confidence ('Sure' / 'Guessing') and learning trend.
"""

import logging
from datetime import datetime

logger = logging.getLogger('bkt_service')

# Configurable defaults
DEFAULT_BKT_PARAMS = {
    'p_l0': 0.20, # Initial mastery probability
    'p_t':  0.15, # Learning transition probability
    'p_g':  0.20, # Guessing probability
    'p_s':  0.10  # Slip probability
}


def calculate_bkt_posterior(p_l, is_correct, p_g=DEFAULT_BKT_PARAMS['p_g'], p_s=DEFAULT_BKT_PARAMS['p_s'], p_t=DEFAULT_BKT_PARAMS['p_t']):
    """
    Calculate updated BKT mastery probability after observing response.
    Returns new P(L_next) bounded between 0.01 and 0.99.
    """
    p_l = max(0.01, min(0.99, float(p_l)))

    if is_correct:
        # P(correct) = P(L)*(1-P(S)) + (1-P(L))*P(G)
        p_obs = (p_l * (1.0 - p_s)) + ((1.0 - p_l) * p_g)
        p_l_given_obs = (p_l * (1.0 - p_s)) / p_obs if p_obs > 0 else p_l
    else:
        # P(incorrect) = P(L)*P(S) + (1-P(L))*(1-P(G))
        p_obs = (p_l * p_s) + ((1.0 - p_l) * (1.0 - p_g))
        p_l_given_obs = (p_l * p_s) / p_obs if p_obs > 0 else p_l

    # Apply learning transition
    p_l_next = p_l_given_obs + ((1.0 - p_l_given_obs) * p_t)
    return max(0.01, min(0.99, round(p_l_next, 4)))


def determine_mastery_band(mastery_probability):
    """
    Classify BKT mastery probability into configurable prototype bands:
    - P(L) < 0.40       -> LOW
    - 0.40 <= P(L) < 0.70 -> DEVELOPING
    - 0.70 <= P(L) < 0.85 -> PROFICIENT
    - P(L) >= 0.85      -> MASTERED
    """
    p = float(mastery_probability)
    if p < 0.40:
        return 'LOW'
    elif p < 0.70:
        return 'DEVELOPING'
    elif p < 0.85:
        return 'PROFICIENT'
    else:
        return 'MASTERED'


def calculate_trend_from_history(attempts):
    """
    Calculate deterministic learning trend from recent question attempts:
    States: 'IMPROVING', 'STABLE', 'DECLINING', 'INSUFFICIENT_DATA'
    """
    if not attempts or len(attempts) < 2:
        return 'INSUFFICIENT_DATA'
    
    # Sort attempts chronologically
    sorted_attempts = sorted(attempts, key=lambda a: a.get('answered_at', ''))
    recent = sorted_attempts[-5:] # Last 5 attempts max
    
    scores = [1.0 if a.get('is_correct') else 0.0 for a in recent]
    
    # Compare first half vs second half average
    mid = len(scores) // 2
    first_half_avg = sum(scores[:mid]) / max(1, mid)
    second_half_avg = sum(scores[mid:]) / max(1, len(scores) - mid)
    
    diff = second_half_avg - first_half_avg
    if diff >= 0.20:
        return 'IMPROVING'
    elif diff <= -0.20:
        return 'DECLINING'
    else:
        return 'STABLE'


def get_or_create_student_concept_mastery(db, student_id, concept_id):
    """Retrieve or initialize student concept mastery record."""
    cursor = db.cursor()
    cursor.execute('''
        SELECT id, student_id, concept_id, p_l0, p_t, p_g, p_s, 
               mastery_probability, attempt_count, correct_count, 
               sure_count, guessing_count, trend
        FROM student_concept_mastery
        WHERE student_id = ? AND concept_id = ?
    ''', (student_id, concept_id))
    row = cursor.fetchone()
    
    if row:
        return dict(row)
    
    # Insert default initial record
    p_l0 = DEFAULT_BKT_PARAMS['p_l0']
    p_t  = DEFAULT_BKT_PARAMS['p_t']
    p_g  = DEFAULT_BKT_PARAMS['p_g']
    p_s  = DEFAULT_BKT_PARAMS['p_s']
    
    cursor.execute('''
        INSERT INTO student_concept_mastery
        (student_id, concept_id, p_l0, p_t, p_g, p_s, mastery_probability, 
         attempt_count, correct_count, sure_count, guessing_count, trend)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 'INSUFFICIENT_DATA')
    ''', (student_id, concept_id, p_l0, p_t, p_g, p_s, p_l0))
    db.commit()
    
    cursor.execute('''
        SELECT id, student_id, concept_id, p_l0, p_t, p_g, p_s, 
               mastery_probability, attempt_count, correct_count, 
               sure_count, guessing_count, trend
        FROM student_concept_mastery
        WHERE student_id = ? AND concept_id = ?
    ''', (student_id, concept_id))
    return dict(cursor.fetchone())


def record_question_attempt(db, student_id, concept_id, is_correct, confidence='Sure', question_id=None):
    """
    Log a student question attempt, update BKT concept mastery, and update learning trend.
    """
    cursor = db.cursor()
    
    # Retrieve current mastery state
    mastery = get_or_create_student_concept_mastery(db, student_id, concept_id)
    current_p_l = mastery['mastery_probability']
    p_g = mastery['p_g']
    p_s = mastery['p_s']
    p_t = mastery['p_t']
    
    # Log question attempt
    attempt_num = mastery['attempt_count'] + 1
    cursor.execute('''
        INSERT INTO student_question_attempts
        (student_id, question_id, concept_id, is_correct, confidence, attempt_number)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (student_id, question_id, concept_id, 1 if is_correct else 0, confidence, attempt_num))
    
    # Calculate updated BKT mastery
    new_p_l = calculate_bkt_posterior(current_p_l, is_correct, p_g=p_g, p_s=p_s, p_t=p_t)
    
    # Update attempt & correctness counts
    new_attempt_count = mastery['attempt_count'] + 1
    new_correct_count = mastery['correct_count'] + (1 if is_correct else 0)
    new_sure_count = mastery['sure_count'] + (1 if confidence == 'Sure' else 0)
    new_guessing_count = mastery['guessing_count'] + (1 if confidence == 'Guessing' else 0)
    
    # Fetch all attempts for concept to update trend
    cursor.execute('''
        SELECT is_correct, answered_at FROM student_question_attempts
        WHERE student_id = ? AND concept_id = ?
        ORDER BY answered_at ASC
    ''', (student_id, concept_id))
    attempts = [dict(r) for r in cursor.fetchall()]
    new_trend = calculate_trend_from_history(attempts)
    
    cursor.execute('''
        UPDATE student_concept_mastery
        SET mastery_probability = ?,
            attempt_count = ?,
            correct_count = ?,
            sure_count = ?,
            guessing_count = ?,
            trend = ?,
            last_updated = CURRENT_TIMESTAMP
        WHERE student_id = ? AND concept_id = ?
    ''', (new_p_l, new_attempt_count, new_correct_count, new_sure_count, new_guessing_count, new_trend, student_id, concept_id))
    
    db.commit()
    
    return {
        'concept_id': concept_id,
        'previous_mastery': current_p_l,
        'new_mastery': new_p_l,
        'mastery_band': determine_mastery_band(new_p_l),
        'trend': new_trend,
        'is_correct': is_correct,
        'confidence': confidence
    }
