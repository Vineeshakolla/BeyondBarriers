"""
Beyond Barriers - Student Personalized Learning, Modules & Tests
Handles:
- GET  /api/student/learning/subjects: Enrolled subjects with completion progress
- GET  /api/student/learning/subjects/<subject_id>/modules: Modules list with lock states, scores & adaptive levels
- GET  /api/student/learning/modules/<module_id>: Adaptive module learning content (summary vs detailed)
- GET  /api/student/learning/modules/<module_id>/test: Questions for module test (excluding correct_option)
- POST /api/student/learning/tests/<test_id>/attempt: Submit test answers with confidence signals & evaluate
- GET  /api/student/learning/modules/<module_id>/attempts: Attempt history for this module
- GET  /api/student/learning/progress: Overall learning metrics
"""

from flask import Blueprint, request, jsonify, g, current_app
from backend.database.db import get_db
from backend.app.utils.auth import require_auth, require_role, get_current_user

learning_bp = Blueprint('learning', __name__, url_prefix='/api/student/learning')


def compute_adaptive_level(attempts, last_score, best_score, last_confidence):
    """
    Deterministic rule engine calculating adaptive content depth:
    - 'light': Score >= 80% on 1st attempt AND majority 'Sure' confidence.
    - 'detailed': Score < 60% OR attempts >= 2 OR (score < 80% and last_confidence == 'Guessing').
    - 'standard': Default pace (e.g. 60-79% on first attempt).
    """
    if attempts == 0:
        return 'standard', 'Standard curriculum explanation matching baseline course pace.'
    if attempts == 1 and (last_score >= 80.0) and (last_confidence == 'Sure'):
        return 'light', 'High first-attempt mastery with strong confidence. A lighter summary with high-yield points is recommended.'
    if (last_score < 60.0) or (attempts >= 2) or (last_score < 80.0 and last_confidence == 'Guessing'):
        return 'detailed', 'Remediation and deep conceptual breakdown recommended based on previous assessment struggle or uncertainty.'
    return 'standard', 'Standard explanation level matching typical learning pace.'


@learning_bp.route('/subjects', methods=['GET'])
@require_auth
@require_role('student')
def get_student_subjects():
    """
    Return enrolled subjects for authenticated student with live completion progress.
    Filtered dynamically based on student's class and stream.
    """
    user = get_current_user()
    student_id = user['student_id']

    db = get_db()
    cursor = db.cursor()

    # 1. Get student's class & stream
    cursor.execute('SELECT class, stream FROM students WHERE id = ?', (student_id,))
    st = cursor.fetchone()
    if not st:
        return jsonify({'error': 'Student not found', 'status': 404}), 404

    student_class = st['class']
    student_stream = st['stream']

    # 2. Query subjects for this class and stream
    cursor.execute('''
        SELECT id, name, code, class, stream, description
        FROM subjects
        WHERE class = ? AND (stream = ? OR stream IS NULL OR stream = 'General')
        ORDER BY id ASC
    ''', (student_class, student_stream))
    subjects = [dict(r) for r in cursor.fetchall()]

    # 3. For each subject, calculate module completion progress
    for sub in subjects:
        sub_id = sub['id']
        # Total modules
        cursor.execute('SELECT COUNT(*) as count FROM modules WHERE subject_id = ?', (sub_id,))
        total_modules = cursor.fetchone()['count']

        # Completed modules by this student
        cursor.execute('''
            SELECT COUNT(*) as count, AVG(best_score) as avg_score
            FROM student_modules sm
            JOIN modules m ON sm.module_id = m.id
            WHERE sm.student_id = ? AND m.subject_id = ? AND sm.status = 'completed'
        ''', (student_id, sub_id))
        prog = cursor.fetchone()
        completed_modules = prog['count']
        avg_score = round(prog['avg_score'], 1) if prog['avg_score'] is not None else 0.0

        percentage = round((completed_modules / total_modules * 100)) if total_modules > 0 else 0

        sub['total_modules'] = total_modules
        sub['completed_modules'] = completed_modules
        sub['progress_percentage'] = percentage
        sub['average_score'] = avg_score

    return jsonify({
        'status': 'ok',
        'class': student_class,
        'stream': student_stream,
        'count': len(subjects),
        'subjects': subjects
    }), 200


@learning_bp.route('/subjects/<int:subject_id>/modules', methods=['GET'])
@require_auth
@require_role('student')
def get_subject_modules(subject_id):
    """
    Return all modules for a given subject along with:
    - student's progress and attempts
    - sequential locked/unlocked state
    - adaptive level recommendation based on previous module
    - Subject Final Assessment status (unlocked when all preceding modules completed)
    """
    user = get_current_user()
    student_id = user['student_id']

    db = get_db()
    cursor = db.cursor()

    # Verify subject exists and matches student's scope
    cursor.execute('SELECT id, name, code, class, stream, description FROM subjects WHERE id = ?', (subject_id,))
    subject = cursor.fetchone()
    if not subject:
        return jsonify({'error': 'Subject not found', 'status': 404}), 404

    # Fetch all modules for this subject ordered by module_number
    cursor.execute('''
        SELECT id, subject_id, module_number, title, difficulty_level,
               CASE WHEN title LIKE '%Final%' OR title LIKE '%Assessment%' THEN 1 ELSE 0 END as is_final
        FROM modules
        WHERE subject_id = ?
        ORDER BY module_number ASC
    ''', (subject_id,))
    all_modules = [dict(r) for r in cursor.fetchall()]

    # Fetch student's progress on all modules of this subject
    cursor.execute('''
        SELECT module_id, status, attempts, best_score, last_score, last_confidence, completed_at
        FROM student_modules
        WHERE student_id = ?
    ''', (student_id,))
    progress_map = {r['module_id']: dict(r) for r in cursor.fetchall()}

    # Separate regular modules from final assessment
    regular_modules = [m for m in all_modules if not m['is_final']]
    final_modules = [m for m in all_modules if m['is_final']]

    processed_modules = []
    all_regular_completed = True
    prev_module_completed = True # Module 1 is always unlocked
    prev_metrics = None

    for i, mod in enumerate(regular_modules):
        mod_id = mod['id']
        prog = progress_map.get(mod_id, {
            'status': 'not_started',
            'attempts': 0,
            'best_score': 0.0,
            'last_score': 0.0,
            'last_confidence': None,
            'completed_at': None
        })

        is_completed = (prog['status'] == 'completed')
        if not is_completed:
            all_regular_completed = False

        # Lock condition: First module unlocked; subsequent unlocked if prev module completed or in_progress
        is_locked = not prev_module_completed

        # Adaptive level recommendation based on previous module performance
        if i == 0:
            adaptive_level = 'standard'
            adaptive_reason = 'Baseline standard content.'
        else:
            if prev_metrics:
                adaptive_level, adaptive_reason = compute_adaptive_level(
                    prev_metrics['attempts'],
                    prev_metrics['last_score'],
                    prev_metrics['best_score'],
                    prev_metrics['last_confidence']
                )
            else:
                adaptive_level = 'standard'
                adaptive_reason = 'Standard curriculum progression.'

        mod_entry = {
            'id': mod['id'],
            'module_number': mod['module_number'],
            'title': mod['title'],
            'difficulty_level': mod['difficulty_level'],
            'status': prog['status'],
            'attempts': prog['attempts'],
            'best_score': prog['best_score'],
            'last_score': prog['last_score'],
            'last_confidence': prog['last_confidence'],
            'completed_at': prog['completed_at'],
            'is_locked': is_locked,
            'is_final_assessment': False,
            'adaptive_level': adaptive_level,
            'adaptive_reason': adaptive_reason
        }
        processed_modules.append(mod_entry)

        # Update running tracker for next module
        prev_module_completed = is_completed or (prog['status'] == 'in_progress')
        prev_metrics = prog

    # Handle Final Assessment if defined
    final_assessment_entry = None
    if final_modules:
        f_mod = final_modules[0]
        f_id = f_mod['id']
        f_prog = progress_map.get(f_id, {
            'status': 'not_started',
            'attempts': 0,
            'best_score': 0.0,
            'last_score': 0.0,
            'last_confidence': None,
            'completed_at': None
        })

        final_locked = not all_regular_completed
        final_assessment_entry = {
            'id': f_mod['id'],
            'module_number': f_mod['module_number'],
            'title': f_mod['title'],
            'difficulty_level': f_mod['difficulty_level'],
            'status': f_prog['status'],
            'attempts': f_prog['attempts'],
            'best_score': f_prog['best_score'],
            'last_score': f_prog['last_score'],
            'last_confidence': f_prog['last_confidence'],
            'completed_at': f_prog['completed_at'],
            'is_locked': final_locked,
            'is_final_assessment': True,
            'unlock_requirement': 'Complete all preceding subject modules to unlock the Final Assessment.'
        }
        processed_modules.append(final_assessment_entry)

    # Subject overall stats
    completed_count = sum(1 for m in processed_modules if m['status'] == 'completed')
    total_count = len(processed_modules)
    progress_percentage = round((completed_count / total_count * 100)) if total_count > 0 else 0

    return jsonify({
        'status': 'ok',
        'subject': dict(subject),
        'progress': {
            'completed_count': completed_count,
            'total_count': total_count,
            'percentage': progress_percentage,
            'all_regular_completed': all_regular_completed
        },
        'modules': processed_modules,
        'final_assessment': final_assessment_entry
    }), 200


@learning_bp.route('/modules/<int:module_id>', methods=['GET'])
@require_auth
@require_role('student')
def get_module_content(module_id):
    """
    Retrieve module learning content (both summary and detailed versions),
    along with student's current progress, test details, and adaptive recommendation.
    """
    user = get_current_user()
    student_id = user['student_id']

    db = get_db()
    cursor = db.cursor()

    # Query module
    cursor.execute('''
        SELECT m.id, m.subject_id, m.module_number, m.title, 
               m.summary_content, m.detailed_content, m.difficulty_level,
               s.name as subject_name, s.code as subject_code, s.class, s.stream
        FROM modules m
        JOIN subjects s ON m.subject_id = s.id
        WHERE m.id = ?
    ''', (module_id,))
    module = cursor.fetchone()
    if not module:
        return jsonify({'error': 'Module not found', 'status': 404}), 404

    # Fetch student's progress for this module
    cursor.execute('''
        SELECT status, attempts, best_score, last_score, last_confidence, completed_at
        FROM student_modules
        WHERE student_id = ? AND module_id = ?
    ''', (student_id, module_id))
    prog = cursor.fetchone()
    progress = dict(prog) if prog else {
        'status': 'not_started',
        'attempts': 0,
        'best_score': 0.0,
        'last_score': 0.0,
        'last_confidence': None,
        'completed_at': None
    }

    # If this is not module 1, compute adaptive recommendation based on previous module
    subject_id = module['subject_id']
    module_number = module['module_number']
    if module_number > 1:
        cursor.execute('''
            SELECT sm.attempts, sm.last_score, sm.best_score, sm.last_confidence
            FROM modules m
            JOIN student_modules sm ON m.id = sm.module_id
            WHERE m.subject_id = ? AND m.module_number = ? AND sm.student_id = ?
        ''', (subject_id, module_number - 1, student_id))
        prev = cursor.fetchone()
        if prev:
            adaptive_level, adaptive_reason = compute_adaptive_level(
                prev['attempts'], prev['last_score'], prev['best_score'], prev['last_confidence']
            )
        else:
            adaptive_level = 'standard'
            adaptive_reason = 'Standard explanation mode.'
    else:
        adaptive_level = 'standard'
        adaptive_reason = 'Standard baseline introduction for Module 1.'

    # Query test associated with this module
    cursor.execute('SELECT id, title, passing_score FROM tests WHERE module_id = ?', (module_id,))
    test = cursor.fetchone()

    return jsonify({
        'status': 'ok',
        'module': {
            'id': module['id'],
            'subject_id': module['subject_id'],
            'subject_name': module['subject_name'],
            'subject_code': module['subject_code'],
            'module_number': module['module_number'],
            'title': module['title'],
            'summary_content': module['summary_content'],
            'detailed_content': module['detailed_content'],
            'difficulty_level': module['difficulty_level'],
            'adaptive_level': adaptive_level,
            'adaptive_reason': adaptive_reason
        },
        'progress': progress,
        'test': dict(test) if test else None
    }), 200


@learning_bp.route('/modules/<int:module_id>/lesson-plan', methods=['GET'])
@require_auth
@require_role('student')
def get_ai_lesson_plan(module_id):
    """
    AI Lesson Model Endpoint:
    Returns structured default lesson plan for the module,
    along with AI recommendations for related class levels, prerequisites,
    and adaptive learning pace.
    """
    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        SELECT m.id, m.title, m.module_number, m.difficulty_level, m.summary_content,
               s.name as subject_name, s.code as subject_code, s.class as subject_class, s.stream
        FROM modules m
        JOIN subjects s ON m.subject_id = s.id
        WHERE m.id = ?
    ''', (module_id,))
    module = cursor.fetchone()
    if not module:
        return jsonify({'error': 'Module not found', 'status': 404}), 404

    current_class = module['subject_class']
    subject_name = module['subject_name']
    module_title = module['title']

    # AI Class & Grade Level Suggestions related to this subject topic
    related_classes = [
        {
            'class': 'Class 9',
            'level_type': 'Prerequisite Foundation',
            'description': f"Introduces foundational principles of {subject_name} necessary before attempting {module_title}."
        },
        {
            'class': current_class,
            'level_type': 'Target Class Level',
            'description': f"Core standard curriculum aligned with {current_class} {module['stream']} competencies."
        },
        {
            'class': 'Class 11',
            'level_type': 'Advanced Extension',
            'description': f"Higher secondary application topics extending {module_title} into advanced science & tech."
        }
    ]

    default_lesson_plan = {
        'title': f"Default Lesson Plan: {module_title}",
        'subject': subject_name,
        'target_class': current_class,
        'estimated_duration': '45 Minutes (3 Micro-sessions)',
        'prerequisites': f"Class 9 basic concepts in {subject_name}.",
        'objectives': [
            f"Understand core definitions and principles of {module_title}.",
            "Master key formulas, concepts, and problem-solving strategies.",
            "Apply concepts in diagnostic check and verify confidence level."
        ],
        'roadmap': [
            {'step': 1, 'phase': 'Foundational Overview', 'duration': '10 mins', 'focus': 'Key definitions, real-world examples, and visual summary.'},
            {'step': 2, 'phase': 'Deep Conceptual Breakdown', 'duration': '20 mins', 'focus': 'Step-by-step formula derivations and detailed explanations.'},
            {'step': 3, 'phase': 'Adaptive Assessment', 'duration': '15 mins', 'focus': 'Diagnostic test attempt with confidence tracking.'}
        ],
        'ai_recommendation': f"AI Analysis: Completing this lesson plan for {current_class} ensures 100% readiness for Module {module['module_number'] + 1}."
    }

    return jsonify({
        'status': 'ok',
        'module_id': module_id,
        'subject': subject_name,
        'current_class': current_class,
        'related_classes': related_classes,
        'lesson_plan': default_lesson_plan
    }), 200


@learning_bp.route('/modules/<int:module_id>/test', methods=['GET'])
@require_auth
@require_role('student')
def get_module_test(module_id):
    """
    Retrieve test metadata and questions for student taking the test.
    ACADEMIC INTEGRITY ENFORCEMENT:
    Excludes 'correct_option' and 'explanation' to prevent network payload cheating.
    """
    db = get_db()
    cursor = db.cursor()

    # Query test
    cursor.execute('''
        SELECT t.id, t.module_id, t.title, t.passing_score,
               m.title as module_title, s.name as subject_name
        FROM tests t
        JOIN modules m ON t.module_id = m.id
        JOIN subjects s ON m.subject_id = s.id
        WHERE t.module_id = ?
    ''', (module_id,))
    test = cursor.fetchone()
    if not test:
        return jsonify({'error': 'No test found for this module', 'status': 404}), 404

    # Query questions WITHOUT correct_option
    cursor.execute('''
        SELECT id, test_id, question_number, question_text,
               option_a, option_b, option_c, option_d
        FROM test_questions
        WHERE test_id = ?
        ORDER BY question_number ASC
    ''', (test['id'],))
    questions = [dict(r) for r in cursor.fetchall()]

    return jsonify({
        'status': 'ok',
        'test': {
            'id': test['id'],
            'module_id': test['module_id'],
            'module_title': test['module_title'],
            'subject_name': test['subject_name'],
            'title': test['title'],
            'passing_score': test['passing_score'],
            'question_count': len(questions)
        },
        'questions': questions
    }), 200


@learning_bp.route('/tests/<int:test_id>/attempt', methods=['POST'])
@require_auth
@require_role('student')
def submit_test_attempt(test_id):
    """
    Submit test answers with Confidence signal ('Sure' / 'Guessing').
    Evaluates:
    - correctness against test_questions.correct_option
    - total score percentage
    - mastery breakdown (Sure & Correct vs Misconception vs Guessing)
    - persists in test_attempts and test_answers (never overwrites history)
    - updates student_modules completion status
    - determines adaptive level recommendation for next module
    """
    user = get_current_user()
    student_id = user['student_id']

    data = request.get_json() or {}
    submitted_answers = data.get('answers', [])

    if not submitted_answers:
        return jsonify({'error': 'No answers submitted', 'status': 400}), 400

    db = get_db()
    cursor = db.cursor()

    # Query test
    cursor.execute('''
        SELECT t.id, t.module_id, t.title, t.passing_score, m.subject_id, m.module_number
        FROM tests t
        JOIN modules m ON t.module_id = m.id
        WHERE t.id = ?
    ''', (test_id,))
    test = cursor.fetchone()
    if not test:
        return jsonify({'error': 'Test not found', 'status': 404}), 404

    module_id = test['module_id']
    passing_score = test['passing_score']

    # Query all correct questions for this test
    cursor.execute('''
        SELECT id, question_number, question_text, option_a, option_b, option_c, option_d,
               correct_option, explanation
        FROM test_questions
        WHERE test_id = ?
        ORDER BY question_number ASC
    ''', (test_id,))
    questions = {r['id']: dict(r) for r in cursor.fetchall()}

    if not questions:
        return jsonify({'error': 'Test has no questions configured', 'status': 400}), 400

    # Build answer evaluation map
    answers_map = {a.get('question_id'): a for a in submitted_answers}

    total_questions = len(questions)
    correct_count = 0
    sure_count = 0
    guessing_count = 0

    evaluated_answers = []
    sure_correct = 0
    sure_incorrect = 0
    guessing_correct = 0
    guessing_incorrect = 0

    for q_id, q in questions.items():
        sub_ans = answers_map.get(q_id, {})
        selected_opt = str(sub_ans.get('selected_option', '')).strip().upper()
        confidence = str(sub_ans.get('confidence', 'Sure')).strip().capitalize()
        if confidence not in ['Sure', 'Guessing']:
            confidence = 'Sure'

        is_correct = (selected_opt == q['correct_option'])
        if is_correct:
            correct_count += 1

        if confidence == 'Sure':
            sure_count += 1
            if is_correct:
                sure_correct += 1
            else:
                sure_incorrect += 1
        else:
            guessing_count += 1
            if is_correct:
                guessing_correct += 1
            else:
                guessing_incorrect += 1

        evaluated_answers.append({
            'question_id': q_id,
            'question_number': q['question_number'],
            'question_text': q['question_text'],
            'selected_option': selected_opt,
            'correct_option': q['correct_option'],
            'is_correct': is_correct,
            'confidence': confidence,
            'explanation': q['explanation']
        })

    # Calculate final score percentage
    score = round((correct_count / total_questions) * 100, 1)
    passed = (score >= passing_score)

    # Determine attempt number for this student on this test
    cursor.execute('''
        SELECT COUNT(*) as count FROM test_attempts
        WHERE student_id = ? AND test_id = ?
    ''', (student_id, test_id))
    prev_attempts_count = cursor.fetchone()['count']
    attempt_number = prev_attempts_count + 1

    # Insert into test_attempts (Never overwrites historical attempts!)
    cursor.execute('''
        INSERT INTO test_attempts
        (student_id, test_id, attempt_number, score, total_questions, correct_count, sure_count, guessing_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (student_id, test_id, attempt_number, score, total_questions, correct_count, sure_count, guessing_count))
    attempt_id = cursor.lastrowid

    # Insert individual test_answers
    for ans in evaluated_answers:
        cursor.execute('''
            INSERT INTO test_answers
            (attempt_id, question_id, selected_option, is_correct, confidence)
            VALUES (?, ?, ?, ?, ?)
        ''', (attempt_id, ans['question_id'], ans['selected_option'], 1 if ans['is_correct'] else 0, ans['confidence']))

    # Update student_modules status
    majority_confidence = 'Sure' if sure_count >= guessing_count else 'Guessing'
    cursor.execute('''
        SELECT status, attempts, best_score, last_score FROM student_modules
        WHERE student_id = ? AND module_id = ?
    ''', (student_id, module_id))
    existing_mod = cursor.fetchone()

    if existing_mod:
        new_attempts = existing_mod['attempts'] + 1
        new_best = max(existing_mod['best_score'], score)
        new_status = 'completed' if (passed or existing_mod['status'] == 'completed') else 'in_progress'

        cursor.execute('''
            UPDATE student_modules
            SET attempts = ?,
                best_score = ?,
                last_score = ?,
                last_confidence = ?,
                status = ?,
                completed_at = CASE WHEN ? = 1 AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END,
                updated_at = CURRENT_TIMESTAMP
            WHERE student_id = ? AND module_id = ?
        ''', (new_attempts, new_best, score, majority_confidence, new_status, 1 if passed else 0, student_id, module_id))
    else:
        cursor.execute('''
            INSERT INTO student_modules
            (student_id, module_id, status, attempts, best_score, last_score, last_confidence, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END)
        ''', (student_id, module_id, 'completed' if passed else 'in_progress', 1, score, score, majority_confidence, 1 if passed else 0))

    db.commit()

    # BKT & Recommendation Engine Integration: Update concept mastery & recalculate recommendations
    try:
        from backend.app.services.bkt_service import record_question_attempt
        from backend.app.services.recommendation_service import generate_and_save_student_recommendations

        # Find concepts for this module
        cursor.execute("SELECT id FROM concepts WHERE chapter_id = ?", (module_id,))
        mod_concept_rows = cursor.fetchall()
        mod_concept_ids = [r['id'] for r in mod_concept_rows]

        for ans in evaluated_answers:
            q_id = ans['question_id']
            # Get question concept_id if set
            cursor.execute("SELECT concept_id FROM test_questions WHERE id = ?", (q_id,))
            q_row = cursor.fetchone()
            concept_id = q_row['concept_id'] if (q_row and q_row['concept_id']) else (mod_concept_ids[0] if mod_concept_ids else None)
            
            if concept_id:
                record_question_attempt(
                    db=db,
                    student_id=student_id,
                    concept_id=concept_id,
                    is_correct=ans['is_correct'],
                    confidence=ans['confidence'],
                    question_id=q_id
                )

        # Recalculate top personalized recommendations after test completion
        generate_and_save_student_recommendations(db, student_id, top_n=3)
    except Exception as bkt_err:
        current_app.logger.warning(f"BKT recommendation update warning: {bkt_err}")

    # Compute next module's recommended adaptive depth
    next_adaptive_level, next_adaptive_reason = compute_adaptive_level(
        attempt_number, score, score, majority_confidence
    )

    return jsonify({
        'status': 'ok',
        'message': 'Test attempt evaluated and recorded successfully',
        'result': {
            'attempt_id': attempt_id,
            'attempt_number': attempt_number,
            'score': score,
            'passed': passed,
            'passing_score': passing_score,
            'total_questions': total_questions,
            'correct_count': correct_count,
            'sure_count': sure_count,
            'guessing_count': guessing_count,
            'confidence_analysis': {
                'sure_correct': sure_correct,
                'sure_incorrect': sure_incorrect,
                'guessing_correct': guessing_correct,
                'guessing_incorrect': guessing_incorrect
            },
            'next_module_adaptive': {
                'level': next_adaptive_level,
                'reason': next_adaptive_reason
            },
            'answers': evaluated_answers
        }
    }), 200


@learning_bp.route('/modules/<int:module_id>/attempts', methods=['GET'])
@require_auth
@require_role('student')
def get_module_attempt_history(module_id):
    """
    Return all previous attempts made by the authenticated student on this module's test.
    """
    user = get_current_user()
    student_id = user['student_id']

    db = get_db()
    cursor = db.cursor()

    cursor.execute('''
        SELECT ta.id, ta.test_id, ta.attempt_number, ta.score, ta.total_questions,
               ta.correct_count, ta.sure_count, ta.guessing_count, ta.completed_at
        FROM test_attempts ta
        JOIN tests t ON ta.test_id = t.id
        WHERE ta.student_id = ? AND t.module_id = ?
        ORDER BY ta.attempt_number ASC
    ''', (student_id, module_id))
    attempts = [dict(r) for r in cursor.fetchall()]

    return jsonify({
        'status': 'ok',
        'module_id': module_id,
        'count': len(attempts),
        'attempts': attempts
    }), 200


@learning_bp.route('/progress', methods=['GET'])
@require_auth
@require_role('student')
def get_overall_learning_progress():
    """
    Return high-level learning summary metrics for the authenticated student.
    """
    user = get_current_user()
    student_id = user['student_id']

    db = get_db()
    cursor = db.cursor()

    # Get student's class and stream
    cursor.execute('SELECT class, stream FROM students WHERE id = ?', (student_id,))
    st = cursor.fetchone()
    if not st:
        return jsonify({'error': 'Student not found', 'status': 404}), 404

    # Total enrolled subjects
    cursor.execute('''
        SELECT COUNT(*) as count FROM subjects
        WHERE class = ? AND (stream = ? OR stream IS NULL OR stream = 'General')
    ''', (st['class'], st['stream']))
    total_subjects = cursor.fetchone()['count']

    # Total modules across enrolled subjects
    cursor.execute('''
        SELECT COUNT(m.id) as count
        FROM modules m
        JOIN subjects s ON m.subject_id = s.id
        WHERE s.class = ? AND (s.stream = ? OR s.stream IS NULL OR s.stream = 'General')
    ''', (st['class'], st['stream']))
    total_modules = cursor.fetchone()['count']

    # Completed modules count and average score
    cursor.execute('''
        SELECT COUNT(*) as count, AVG(best_score) as avg_score
        FROM student_modules sm
        JOIN modules m ON sm.module_id = m.id
        JOIN subjects s ON m.subject_id = s.id
        WHERE sm.student_id = ? AND s.class = ? AND (s.stream = ? OR s.stream IS NULL OR s.stream = 'General')
          AND sm.status = 'completed'
    ''', (student_id, st['class'], st['stream']))
    prog = cursor.fetchone()
    completed_modules = prog['count']
    average_score = round(prog['avg_score'], 1) if prog['avg_score'] is not None else 0.0

    # Total tests attempted
    cursor.execute('SELECT COUNT(*) as count FROM test_attempts WHERE student_id = ?', (student_id,))
    total_attempts = cursor.fetchone()['count']

    return jsonify({
        'status': 'ok',
        'metrics': {
            'total_subjects': total_subjects,
            'total_modules': total_modules,
            'completed_modules': completed_modules,
            'completion_percentage': round((completed_modules / total_modules * 100)) if total_modules > 0 else 0,
            'average_score': average_score,
            'total_attempts': total_attempts
        }
    }), 200


@learning_bp.route('/modules/<int:module_id>/doubt', methods=['POST'])
@require_auth
@require_role('student')
def ask_module_doubt(module_id):
    """
    POST /api/student/learning/modules/<module_id>/doubt
    Student Doubt Clarification Endpoint powered by Gemini API.
    Only authenticated Student role has access.
    Validates question, verifies student scope, retrieves module content from DB,
    and returns Gemini AI clarification.
    """
    user = get_current_user()
    student_id = user['student_id']

    # 1. Parse & validate request body
    data = request.get_json() or {}
    question = str(data.get('question', '')).strip()
    history = data.get('history', [])

    if not question:
        return jsonify({'success': False, 'error': 'Please enter a valid question.', 'status': 400}), 400

    if len(question) > 2000:
        return jsonify({'success': False, 'error': 'Question is too long (maximum 2000 characters).', 'status': 400}), 400

    db = get_db()
    cursor = db.cursor()

    # 2. Verify student exists
    cursor.execute('SELECT class, stream FROM students WHERE id = ?', (student_id,))
    st = cursor.fetchone()
    if not st:
        return jsonify({'success': False, 'error': 'Student profile not found.', 'status': 404}), 404

    # 3. Retrieve module content & subject scope from database (never trust frontend blindly)
    cursor.execute('''
        SELECT m.id, m.subject_id, m.module_number, m.title,
               m.summary_content, m.detailed_content, m.difficulty_level,
               s.name as subject_name, s.code as subject_code, s.class as subject_class, s.stream as subject_stream
        FROM modules m
        JOIN subjects s ON m.subject_id = s.id
        WHERE m.id = ?
    ''', (module_id,))
    module = cursor.fetchone()

    if not module:
        return jsonify({'success': False, 'error': 'Module not found.', 'status': 404}), 404

    module = dict(module)

    # 4. Verify student is authorized for this subject/class
    if module['subject_class'] != st['class']:
        return jsonify({'success': False, 'error': 'Access denied to this module content.', 'status': 403}), 403

    # 5. Build minimal safe lesson context for Gemini
    lesson_context = {
        'subject_name': module['subject_name'],
        'subject_code': module['subject_code'],
        'module_number': module['module_number'],
        'title': module['title'],
        'summary_content': module['summary_content'],
        'detailed_content': module['detailed_content'],
        'difficulty_level': module['difficulty_level']
    }

    # 6. Query Gemini service
    from backend.app.services.gemini_service import ask_gemini_doubt
    res = ask_gemini_doubt(lesson_context, question, history)

    if not res.get('success'):
        return jsonify({
            'success': False,
            'error': res.get('error', "Sorry, I couldn't process your question right now. Please try again.")
        }), 500

    return jsonify({
        'success': True,
        'answer': res['answer'],
        'module_id': module_id,
        'module_title': module['title'],
        'is_fallback': res.get('is_fallback', False)
    }), 200

