"""
Beyond Barriers - Academic Risk Detection & Support Priority Engine
Service: support_engine.py

Calculates explainable, deterministic support priority signals using:
1. Test performance (average score, latest score, trends)
2. Attendance (percentage, trend, consecutive missed)
3. Metacognitive confidence (Sure vs Guessing distribution, misconceptions)
4. Module attempt history (repeated attempts on difficult modules)

Produces:
- Priority category: 'Normal', 'Monitor', 'Needs Support', or 'Insufficient Data'
- Composite risk score (0.0 - 10.0 scale)
- Plain-language explainable reasons derived strictly from observable data
- Subject-level diagnostic support statuses
- Actionable, supportive recommendations
"""

def calculate_support_priority(db, student_id):
    cursor = db.cursor()

    # 1. Fetch student base record
    cursor.execute('''
        SELECT id, name, roll_number, roll_code, class, stream
        FROM students WHERE id = ?
    ''', (student_id,))
    student_row = cursor.fetchone()
    if not student_row:
        return None

    student_info = dict(student_row)

    # 2. Fetch attendance records
    cursor.execute('''
        SELECT a.id, a.subject_id, s.name as subject_name,
               a.total_classes, a.attended_classes, a.attendance_percentage,
               a.trend, a.consecutive_missed
        FROM attendance a
        JOIN subjects s ON a.subject_id = s.id
        WHERE a.student_id = ?
    ''', (student_id,))
    attendance_rows = [dict(r) for r in cursor.fetchall()]

    # 3. Fetch marks records
    cursor.execute('''
        SELECT m.id, m.subject_id, s.name as subject_name,
               m.assessment_name, m.marks_obtained, m.total_marks,
               m.percentage, m.grade, m.recorded_at
        FROM marks m
        JOIN subjects s ON m.subject_id = s.id
        WHERE m.student_id = ?
        ORDER BY m.recorded_at DESC
    ''', (student_id,))
    marks_rows = [dict(r) for r in cursor.fetchall()]

    # 4. Fetch test attempts and associated test/module info
    cursor.execute('''
        SELECT ta.id, ta.test_id, ta.attempt_number, ta.score,
               ta.total_questions, ta.correct_count, ta.sure_count,
               ta.guessing_count, ta.completed_at,
               t.title as test_title, t.module_id,
               m.title as module_title, m.subject_id,
               s.name as subject_name
        FROM test_attempts ta
        JOIN tests t ON ta.test_id = t.id
        JOIN modules m ON t.module_id = m.id
        JOIN subjects s ON m.subject_id = s.id
        WHERE ta.student_id = ?
        ORDER BY ta.completed_at ASC
    ''', (student_id,))
    attempt_rows = [dict(r) for r in cursor.fetchall()]

    # 5. Fetch student_modules progress
    cursor.execute('''
        SELECT sm.module_id, sm.status, sm.attempts, sm.best_score,
               sm.last_score, sm.last_confidence,
               m.title as module_title, m.subject_id, s.name as subject_name
        FROM student_modules sm
        JOIN modules m ON sm.module_id = m.id
        JOIN subjects s ON m.subject_id = s.id
        WHERE sm.student_id = ?
    ''', (student_id,))
    student_module_rows = [dict(r) for r in cursor.fetchall()]

    # 6. Fetch test answers for confidence & misconception analysis
    cursor.execute('''
        SELECT ans.id, ans.attempt_id, ans.is_correct, ans.confidence,
               ta.test_id
        FROM test_answers ans
        JOIN test_attempts ta ON ans.attempt_id = ta.id
        WHERE ta.student_id = ?
    ''', (student_id,))
    answer_rows = [dict(r) for r in cursor.fetchall()]

    # 7. Fetch all enrolled subjects for this student's class and stream
    cursor.execute('''
        SELECT id, name, code FROM subjects
        WHERE class = ? AND (stream = ? OR stream IS NULL OR stream = 'General')
    ''', (student_info['class'], student_info['stream']))
    enrolled_subjects = [dict(r) for r in cursor.fetchall()]

    # -------------------------------------------------------------------------
    # COMPUTE SIGNALS
    # -------------------------------------------------------------------------

    # A. ATTENDANCE SIGNALS
    total_classes = sum(r['total_classes'] for r in attendance_rows)
    attended_classes = sum(r['attended_classes'] for r in attendance_rows)
    overall_attendance = round((attended_classes / total_classes * 100), 1) if total_classes > 0 else None
    
    declining_attendance_count = sum(1 for r in attendance_rows if r.get('trend') == 'declining')
    max_consecutive_missed = max([r.get('consecutive_missed', 0) for r in attendance_rows], default=0)
    attendance_declining = declining_attendance_count > 0 or max_consecutive_missed >= 2

    attendance_risk = 0.0
    if overall_attendance is not None:
        if overall_attendance < 65.0:
            attendance_risk = 3.0
        elif overall_attendance < 75.0:
            attendance_risk = 2.0
        elif overall_attendance < 80.0:
            attendance_risk = 1.0

    attendance_trend_risk = 1.0 if attendance_declining else 0.0

    # B. PERFORMANCE SIGNALS
    test_scores = [r['score'] for r in attempt_rows]
    marks_scores = [r['percentage'] for r in marks_rows]
    all_scores = test_scores if test_scores else marks_scores

    avg_test_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else None
    latest_score = attempt_rows[-1]['score'] if attempt_rows else (marks_rows[0]['percentage'] if marks_rows else None)

    # Score trend across attempts
    score_trend = 'insufficient'
    score_trend_risk = 0.0
    if len(test_scores) >= 2:
        half = len(test_scores) // 2
        first_half_avg = sum(test_scores[:half]) / half
        second_half_avg = sum(test_scores[half:]) / (len(test_scores) - half)
        diff = second_half_avg - first_half_avg
        if diff >= 8.0:
            score_trend = 'improving'
            score_trend_risk = -0.5 # mitigation
        elif diff <= -8.0:
            score_trend = 'declining'
            score_trend_risk = 1.0
        else:
            score_trend = 'stable'
            score_trend_risk = 0.0

    performance_risk = 0.0
    if avg_test_score is not None:
        if avg_test_score < 50.0:
            performance_risk = 3.0
        elif avg_test_score < 60.0:
            performance_risk = 2.0
        elif avg_test_score < 70.0:
            performance_risk = 1.0

    # C. METACOGNITIVE CONFIDENCE SIGNALS
    total_answers = len(answer_rows)
    guessing_answers = [a for a in answer_rows if a.get('confidence') == 'Guessing']
    sure_answers = [a for a in answer_rows if a.get('confidence') == 'Sure']
    sure_incorrect = [a for a in sure_answers if not a.get('is_correct')]
    sure_correct = [a for a in sure_answers if a.get('is_correct')]

    guessing_rate = round((len(guessing_answers) / total_answers * 100), 1) if total_answers > 0 else 0.0
    misconception_count = len(sure_incorrect)
    misconception_rate = round((misconception_count / total_answers * 100), 1) if total_answers > 0 else 0.0

    confidence_risk = 0.0
    if total_answers > 0:
        if guessing_rate >= 50.0:
            confidence_risk += 1.5
        elif guessing_rate >= 30.0:
            confidence_risk += 0.75

        if misconception_rate >= 25.0:
            confidence_risk += 1.0

    # D. MODULE ATTEMPT DIFFICULTY SIGNALS
    struggling_modules = [
        sm for sm in student_module_rows
        if sm.get('attempts', 0) >= 2 and sm.get('last_score', 0.0) < 60.0
    ]
    attempt_risk = min(len(struggling_modules) * 0.75, 1.5)

    # -------------------------------------------------------------------------
    # COMPOSITE SCORE & PRIORITY DETERMINATION
    # -------------------------------------------------------------------------
    has_data = (overall_attendance is not None) or (avg_test_score is not None) or (total_answers > 0)

    if not has_data:
        priority = 'Insufficient Data'
        composite_score = 0.0
        status_label = 'No Data'
    else:
        raw_score = attendance_risk + attendance_trend_risk + performance_risk + score_trend_risk + confidence_risk + attempt_risk
        composite_score = round(max(0.0, min(10.0, raw_score)), 1)

        # Priority category thresholds
        if composite_score >= 4.5 or (overall_attendance is not None and overall_attendance < 65.0) or (avg_test_score is not None and avg_test_score < 50.0 and (attendance_declining or score_trend == 'declining')):
            priority = 'Needs Support'
            status_label = 'Needs Support'
        elif composite_score >= 2.2:
            priority = 'Monitor'
            status_label = 'Monitor'
        else:
            priority = 'Normal'
            status_label = 'Normal'

    # -------------------------------------------------------------------------
    # EXPLAINABLE REASONS GENERATION (Observable facts only)
    # -------------------------------------------------------------------------
    reasons = []

    if priority == 'Insufficient Data':
        reasons.append("Insufficient assessment and attendance activity recorded yet to evaluate academic support signals.")
    else:
        # Attendance reasons
        if overall_attendance is not None and overall_attendance < 75.0:
            reasons.append(f"Overall attendance is {overall_attendance}%, which is below the 75% benchmark.")
        elif overall_attendance is not None and overall_attendance >= 85.0 and priority == 'Normal':
            reasons.append(f"Consistent and reliable attendance maintained at {overall_attendance}%.")

        if attendance_declining:
            if max_consecutive_missed >= 2:
                reasons.append(f"Attendance has shown a declining trend with {max_consecutive_missed} consecutive classes missed.")
            else:
                reasons.append("Recent attendance shows a declining pattern across enrolled subjects.")

        # Performance reasons
        if avg_test_score is not None and avg_test_score < 60.0:
            reasons.append(f"Recent assessment average is {avg_test_score}%, indicating core concepts require reinforcement.")
        elif avg_test_score is not None and avg_test_score >= 80.0 and priority == 'Normal':
            reasons.append(f"Strong assessment performance demonstrating mastery with an average score of {avg_test_score}%.")

        if score_trend == 'declining':
            reasons.append("Recent assessment performance has declined across consecutive attempts.")
        elif score_trend == 'improving':
            reasons.append("Recent assessment performance shows positive improvement across attempts.")

        # Confidence reasons
        if guessing_rate >= 40.0:
            reasons.append(f"A high proportion ({guessing_rate}%) of answers were marked as Guessing, indicating low conceptual certainty.")
        elif guessing_rate < 20.0 and priority == 'Normal':
            reasons.append("High answer certainty with minimal guessing across diagnostic checks.")

        if misconception_count > 0:
            reasons.append(f"Identified {misconception_count} conceptual misconception(s) where answers were marked Sure but were incorrect.")

        # Attempt difficulty reasons
        if struggling_modules:
            titles = [f"'{sm['module_title']}'" for sm in struggling_modules[:2]]
            reasons.append(f"Repeated attempts recorded on {len(struggling_modules)} challenging module(s): {', '.join(titles)}.")

        # Fallback explanation if few rules fired
        if not reasons:
            if priority == 'Needs Support':
                reasons.append("Multiple academic indicators warrant additional study support and review.")
            elif priority == 'Monitor':
                reasons.append("Moderate variation observed across attendance or assessment consistency.")
            else:
                reasons.append("Academic performance and attendance are well-balanced and meeting expectations.")

    # -------------------------------------------------------------------------
    # SUPPORTIVE GUIDANCE RECOMMENDATIONS
    # -------------------------------------------------------------------------
    guidance = []
    if priority == 'Needs Support':
        if struggling_modules:
            guidance.append(f"Review the remedial summary material for {struggling_modules[0]['module_title']}.")
        if attendance_declining:
            guidance.append("Coordinate with your mentor to catch up on missed class concepts.")
        if guessing_rate >= 40.0:
            guidance.append("Practice untimed self-check quizzes before taking final module assessments.")
    elif priority == 'Monitor':
        guidance.append("Focus on strengthening topics with moderate scores to maintain positive progress.")
        guidance.append("Regularly review module summary notes before diagnostic checks.")
    elif priority == 'Normal':
        guidance.append("Excellent progress! Continue with advanced modules and explore career roadmaps.")
    else:
        guidance.append("Begin your curriculum modules to establish your personalized learning baseline.")

    # -------------------------------------------------------------------------
    # SUBJECT-LEVEL ANALYSIS
    # -------------------------------------------------------------------------
    subject_support = []
    for s in enrolled_subjects:
        s_id = s['id']
        s_att = next((a for a in attendance_rows if a['subject_id'] == s_id), None)
        s_att_pct = s_att['attendance_percentage'] if s_att else None
        
        s_attempts = [a for a in attempt_rows if a.get('subject_id') == s_id]
        s_scores = [a['score'] for a in s_attempts]
        s_avg_score = round(sum(s_scores) / len(s_scores), 1) if s_scores else None

        # Determine subject status
        s_status = 'Normal'
        s_note = 'On track'
        if (s_att_pct is not None and s_att_pct < 70.0) or (s_avg_score is not None and s_avg_score < 55.0):
            s_status = 'Needs Support'
            s_note = 'Lower test scores or attendance drop'
        elif (s_att_pct is not None and s_att_pct < 78.0) or (s_avg_score is not None and s_avg_score < 68.0):
            s_status = 'Monitor'
            s_note = 'Moderate consistency'
        elif s_att_pct is None and s_avg_score is None:
            s_status = 'No Data'
            s_note = 'No recorded assessments yet'

        subject_support.append({
            'subject_id': s_id,
            'subject_name': s['name'],
            'subject_code': s['code'],
            'attendance_percentage': s_att_pct,
            'average_score': s_avg_score,
            'status': s_status,
            'note': s_note
        })

    return {
        'student': student_info,
        'support_priority': priority,
        'status_label': status_label,
        'composite_risk_score': composite_score,
        'metrics': {
            'overall_attendance': overall_attendance,
            'attendance_trend': 'declining' if attendance_declining else ('improving' if any(r.get('trend') == 'improving' for r in attendance_rows) else 'stable'),
            'consecutive_missed_classes': max_consecutive_missed,
            'average_test_score': avg_test_score,
            'latest_score': latest_score,
            'score_trend': score_trend,
            'total_test_attempts': len(attempt_rows),
            'total_answers_analyzed': total_answers,
            'guessing_rate': guessing_rate,
            'sure_count': len(sure_answers),
            'guessing_count': len(guessing_answers),
            'misconception_count': misconception_count,
            'struggling_modules_count': len(struggling_modules)
        },
        'reasons': reasons,
        'guidance': guidance,
        'subject_support': subject_support,
        'recent_attempts': attempt_rows[-5:] if attempt_rows else [],
        'recent_marks': marks_rows[:5] if marks_rows else []
    }
