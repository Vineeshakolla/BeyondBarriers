import sqlite3
import os
from flask import g, current_app
from backend.database import seed_data

def get_db():
    """
    Get or create a SQLite database connection for the current application context.
    Uses sqlite3.Row factory so rows can be accessed by column name.
    """
    if 'db' not in g:
        db_path = current_app.config['DATABASE_PATH']
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)

        g.db = sqlite3.connect(
            db_path,
            detect_types=sqlite3.PARSE_DECLTYPES,
            timeout=30.0,
            isolation_level=None,
            check_same_thread=False
        )
        g.db.row_factory = sqlite3.Row
        # Enable foreign key enforcement & busy timeout in SQLite
        g.db.execute('PRAGMA foreign_keys = ON;')
        g.db.execute('PRAGMA busy_timeout = 30000;')

    return g.db

def close_db(e=None):
    """Close the database connection if open."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def execute_schema(conn):
    """Execute schema.sql against the given connection."""
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    migrate_schema(conn)

def migrate_schema(conn):
    """Ensure newly introduced columns exist in preexisting SQLite database."""
    cursor = conn.cursor()
    
    # Users table migration
    cursor.execute("PRAGMA table_info(users)")
    usr_cols = {row[1] for row in cursor.fetchall()}
    if usr_cols:
        if 'is_demo' not in usr_cols:
            cursor.execute("ALTER TABLE users ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT 0")

    # Scholarships table migration
    cursor.execute("PRAGMA table_info(scholarships)")
    sch_cols = {row[1] for row in cursor.fetchall()}
    if sch_cols:
        if 'amount' not in sch_cols:
            cursor.execute("ALTER TABLE scholarships ADD COLUMN amount TEXT NOT NULL DEFAULT '₹50,000 / year'")
        if 'eligible_stream' not in sch_cols:
            cursor.execute("ALTER TABLE scholarships ADD COLUMN eligible_stream TEXT NOT NULL DEFAULT 'All'")
        if 'created_by' not in sch_cols:
            cursor.execute("ALTER TABLE scholarships ADD COLUMN created_by INTEGER REFERENCES users(id)")
        if 'updated_at' not in sch_cols:
            cursor.execute("ALTER TABLE scholarships ADD COLUMN updated_at TIMESTAMP")

    # Resources table migration
    cursor.execute("PRAGMA table_info(resources)")
    res_cols = {row[1] for row in cursor.fetchall()}
    if res_cols:
        if 'format' not in res_cols:
            cursor.execute("ALTER TABLE resources ADD COLUMN format TEXT NOT NULL DEFAULT 'text'")
        if 'is_downloadable' not in res_cols:
            cursor.execute("ALTER TABLE resources ADD COLUMN is_downloadable BOOLEAN NOT NULL DEFAULT 0")
        if 'language' not in res_cols:
            cursor.execute("ALTER TABLE resources ADD COLUMN language TEXT NOT NULL DEFAULT 'en'")
        if 'estimated_size_mb' not in res_cols:
            cursor.execute("ALTER TABLE resources ADD COLUMN estimated_size_mb REAL NOT NULL DEFAULT 1.0")
        if 'has_captions' not in res_cols:
            cursor.execute("ALTER TABLE resources ADD COLUMN has_captions BOOLEAN NOT NULL DEFAULT 1")
        if 'has_transcript' not in res_cols:
            cursor.execute("ALTER TABLE resources ADD COLUMN has_transcript BOOLEAN NOT NULL DEFAULT 1")

    # Career roles table migration
    cursor.execute("PRAGMA table_info(career_roles)")
    role_cols = {row[1] for row in cursor.fetchall()}
    if role_cols:
        if 'related_roles' not in role_cols:
            cursor.execute("ALTER TABLE career_roles ADD COLUMN related_roles TEXT DEFAULT ''")
        if 'suggested_learning_areas' not in role_cols:
            cursor.execute("ALTER TABLE career_roles ADD COLUMN suggested_learning_areas TEXT DEFAULT ''")

    # Career roadmap steps table migration
    cursor.execute("PRAGMA table_info(career_roadmap_steps)")
    step_cols = {row[1] for row in cursor.fetchall()}
    if step_cols:
        if 'learning_resources' not in step_cols:
            cursor.execute("ALTER TABLE career_roadmap_steps ADD COLUMN learning_resources TEXT DEFAULT ''")

    # Test questions table migration (concept_id linkage)
    cursor.execute("PRAGMA table_info(test_questions)")
    q_cols = {row[1] for row in cursor.fetchall()}
    if q_cols:
        if 'concept_id' not in q_cols:
            cursor.execute("ALTER TABLE test_questions ADD COLUMN concept_id INTEGER REFERENCES concepts(id)")

    # Ensure BKT tables exist in existing database instances
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS concepts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chapter_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            prerequisite_concept_id INTEGER REFERENCES concepts(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS lessons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            learning_objective TEXT,
            difficulty_level TEXT NOT NULL DEFAULT 'standard',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS student_concept_mastery (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
            p_l0 REAL NOT NULL DEFAULT 0.20,
            p_t REAL NOT NULL DEFAULT 0.15,
            p_g REAL NOT NULL DEFAULT 0.20,
            p_s REAL NOT NULL DEFAULT 0.10,
            mastery_probability REAL NOT NULL DEFAULT 0.20,
            attempt_count INTEGER NOT NULL DEFAULT 0,
            correct_count INTEGER NOT NULL DEFAULT 0,
            sure_count INTEGER NOT NULL DEFAULT 0,
            guessing_count INTEGER NOT NULL DEFAULT 0,
            trend TEXT NOT NULL DEFAULT 'INSUFFICIENT_DATA',
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (student_id, concept_id)
        );
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS student_question_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            question_id INTEGER REFERENCES test_questions(id) ON DELETE SET NULL,
            concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
            is_correct BOOLEAN NOT NULL,
            confidence TEXT NOT NULL DEFAULT 'Sure',
            attempt_number INTEGER NOT NULL DEFAULT 1,
            answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS lesson_resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
            resource_type TEXT NOT NULL,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            access_requirement TEXT NOT NULL DEFAULT 'offline_friendly',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS student_recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
            concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
            action_type TEXT NOT NULL,
            priority_score REAL NOT NULL,
            reason TEXT NOT NULL,
            recommended_format TEXT NOT NULL DEFAULT 'TEXT',
            recommended_resource_type TEXT NOT NULL DEFAULT 'LESSON',
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')

    # Seed concepts, lessons, and initial student mastery if concepts table is empty
    cursor.execute("SELECT COUNT(*) FROM concepts")
    row = cursor.fetchone()
    if row and row[0] == 0 and hasattr(seed_data, 'CONCEPTS'):
        for c in seed_data.CONCEPTS:
            cursor.execute('''
                INSERT OR REPLACE INTO concepts (id, chapter_id, name, description, prerequisite_concept_id)
                VALUES (?, ?, ?, ?, ?)
            ''', (c["id"], c["chapter_id"], c["name"], c["description"], c["prerequisite_concept_id"]))
        for l in seed_data.LESSONS:
            cursor.execute('''
                INSERT OR REPLACE INTO lessons (id, concept_id, title, content, learning_objective, difficulty_level)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (l["id"], l["concept_id"], l["title"], l["content"], l["learning_objective"], l["difficulty_level"]))
        for lr in seed_data.LESSON_RESOURCES:
            cursor.execute('''
                INSERT OR REPLACE INTO lesson_resources (id, lesson_id, resource_type, title, url, access_requirement)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (lr["id"], lr["lesson_id"], lr["resource_type"], lr["title"], lr["url"], lr["access_requirement"]))
        for scm in seed_data.STUDENT_CONCEPT_MASTERY:
            cursor.execute('''
                INSERT OR REPLACE INTO student_concept_mastery
                (student_id, concept_id, p_l0, p_t, p_g, p_s, mastery_probability, attempt_count, correct_count, sure_count, guessing_count, trend)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                scm["student_id"], scm["concept_id"], scm["p_l0"], scm["p_t"], scm["p_g"], scm["p_s"],
                scm["mastery_probability"], scm["attempt_count"], scm["correct_count"],
                scm["sure_count"], scm["guessing_count"], scm["trend"]
            ))

    conn.commit()

def seed_database(conn):
    """Populate database with comprehensive mock datasets from seed_data.py."""
    cursor = conn.cursor()
    cursor.execute('PRAGMA foreign_keys = OFF;')

    # 1. Students
    for s in seed_data.STUDENTS:
        cursor.execute('''
            INSERT OR REPLACE INTO students 
            (id, name, roll_number, roll_code, class, stream, disability_type, 
             internet_access, device_access, income_category, career_interest, 
             preferred_response_format, preferred_language, is_profile_completed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            s["id"], s["name"], s["roll_number"], s["roll_code"], s["class"], s["stream"],
            s["disability_type"], s["internet_access"], s["device_access"], s["income_category"],
            s["career_interest"], s["preferred_response_format"], s["preferred_language"],
            s.get("is_profile_completed", 1)
        ))

    # 2. Mentors
    for m in seed_data.MENTORS:
        cursor.execute('''
            INSERT OR REPLACE INTO mentors 
            (id, name, email, department, assigned_roll_start, assigned_roll_end)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            m["id"], m["name"], m["email"], m["department"],
            m["assigned_roll_start"], m["assigned_roll_end"]
        ))

    # 3. Parents
    for p in seed_data.PARENTS:
        cursor.execute('''
            INSERT OR REPLACE INTO parents 
            (id, name, email, linked_student_id, relationship)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            p["id"], p["name"], p["email"], p["linked_student_id"], p["relationship"]
        ))

    # 4. Administrators
    for a in seed_data.ADMINISTRATORS:
        cursor.execute('''
            INSERT OR REPLACE INTO administrators 
            (id, name, email, title)
            VALUES (?, ?, ?, ?)
        ''', (
            a["id"], a["name"], a["email"], a["title"]
        ))

    # 5. Users (Hashed credentials - seeded early so child foreign keys succeed)
    from werkzeug.security import generate_password_hash
    for u in seed_data.USERS:
        cursor.execute('''
            INSERT OR REPLACE INTO users 
            (id, username, password_hash, role, student_id, mentor_id, parent_id, administrator_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            u["id"], u["username"], generate_password_hash(u["password"]),
            u["role"], u["student_id"], u["mentor_id"], u["parent_id"], u["administrator_id"]
        ))

    # 6. Subjects
    for sub in seed_data.SUBJECTS:
        cursor.execute('''
            INSERT OR REPLACE INTO subjects 
            (id, name, code, class, stream, description)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            sub["id"], sub["name"], sub["code"], sub["class"], sub["stream"], sub["description"]
        ))

    # 6. Modules
    for mod in seed_data.MODULES:
        cursor.execute('''
            INSERT OR REPLACE INTO modules 
            (id, subject_id, module_number, title, summary_content, detailed_content, difficulty_level)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            mod["id"], mod["subject_id"], mod["module_number"], mod["title"],
            mod["summary_content"], mod["detailed_content"], mod["difficulty_level"]
        ))

    # 7. Tests
    for t in seed_data.TESTS:
        cursor.execute('''
            INSERT OR REPLACE INTO tests 
            (id, module_id, title, passing_score)
            VALUES (?, ?, ?, ?)
        ''', (
            t["id"], t["module_id"], t["title"], t["passing_score"]
        ))

    # 8. Test Questions
    for q in seed_data.TEST_QUESTIONS:
        cursor.execute('''
            INSERT OR REPLACE INTO test_questions 
            (id, test_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            q["id"], q["test_id"], q["question_number"], q["question_text"],
            q["option_a"], q["option_b"], q["option_c"], q["option_d"],
            q["correct_option"], q["explanation"]
        ))

    # 9. Student Module Progress
    for sm in seed_data.STUDENT_MODULES:
        cursor.execute('''
            INSERT OR REPLACE INTO student_modules 
            (student_id, module_id, status, attempts, best_score, last_score, last_confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            sm["student_id"], sm["module_id"], sm["status"],
            sm["attempts"], sm["best_score"], sm["last_score"], sm["last_confidence"]
        ))

    # 10. Test Attempts
    for ta in seed_data.TEST_ATTEMPTS:
        cursor.execute('''
            INSERT OR REPLACE INTO test_attempts 
            (id, student_id, test_id, attempt_number, score, total_questions, correct_count, sure_count, guessing_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            ta["id"], ta["student_id"], ta["test_id"], ta["attempt_number"],
            ta["score"], ta["total_questions"], ta["correct_count"],
            ta["sure_count"], ta["guessing_count"]
        ))

    # 11. Test Answers
    for ans in seed_data.TEST_ANSWERS:
        cursor.execute('''
            INSERT OR REPLACE INTO test_answers 
            (id, attempt_id, question_id, selected_option, is_correct, confidence)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            ans["id"], ans["attempt_id"], ans["question_id"], ans["selected_option"],
            ans["is_correct"], ans["confidence"]
        ))

    # 12. Attendance
    for att in seed_data.ATTENDANCE:
        cursor.execute('''
            INSERT OR REPLACE INTO attendance 
            (student_id, subject_id, total_classes, attended_classes, attendance_percentage, trend, consecutive_missed)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            att["student_id"], att["subject_id"], att["total_classes"],
            att["attended_classes"], att["attendance_percentage"], att["trend"], att["consecutive_missed"]
        ))

    # 13. Marks
    for m in seed_data.MARKS:
        cursor.execute('''
            INSERT OR REPLACE INTO marks 
            (student_id, subject_id, assessment_name, marks_obtained, total_marks, percentage, grade)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            m["student_id"], m["subject_id"], m["assessment_name"],
            m["marks_obtained"], m["total_marks"], m["percentage"], m["grade"]
        ))

    # 14. Resources
    for r in seed_data.RESOURCES:
        cursor.execute('''
            INSERT OR REPLACE INTO resources 
            (id, title, resource_type, subject_id, class, content_url, access_requirement, description, has_captions, has_transcript)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            r["id"], r["title"], r["resource_type"], r["subject_id"], r["class"],
            r["content_url"], r["access_requirement"], r["description"],
            r["has_captions"], r["has_transcript"]
        ))

    # 15. Scholarships
    for sc in seed_data.SCHOLARSHIPS:
        cursor.execute('''
            INSERT OR REPLACE INTO scholarships 
            (id, title, provider, description, amount, eligible_class, eligible_stream, min_academic_percentage, 
             category_requirement, max_income_limit, disability_required, deadline, application_url, is_active, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            sc["id"], sc["title"], sc["provider"], sc["description"], sc.get("amount", "₹50,000 / year"),
            sc["eligible_class"], sc.get("eligible_stream", "All"),
            sc["min_academic_percentage"], sc["category_requirement"], sc["max_income_limit"],
            sc["disability_required"], sc["deadline"], sc["application_url"], sc["is_active"],
            sc.get("created_by", 4)
        ))

    # 15.5 Resources
    if hasattr(seed_data, 'RESOURCES'):
        for r in seed_data.RESOURCES:
            cursor.execute('''
                INSERT OR REPLACE INTO resources 
                (id, title, resource_type, format, subject_id, class, content_url,
                 access_requirement, is_downloadable, language, estimated_size_mb,
                 description, has_captions, has_transcript)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                r["id"], r["title"], r["resource_type"], r.get("format", "text"),
                r["subject_id"], r["class"], r["content_url"],
                r["access_requirement"], r.get("is_downloadable", 0),
                r.get("language", "en"), r.get("estimated_size_mb", 1.0),
                r.get("description", ""), r.get("has_captions", 1), r.get("has_transcript", 1)
            ))

    # 16. Career Fields
    for cf in seed_data.CAREER_FIELDS:
        cursor.execute('''
            INSERT OR REPLACE INTO career_fields (id, name, description, icon)
            VALUES (?, ?, ?, ?)
        ''', (cf["id"], cf["name"], cf["description"], cf["icon"]))

    # 17. Career Roles
    for cr in seed_data.CAREER_ROLES:
        cursor.execute('''
            INSERT OR REPLACE INTO career_roles 
            (id, career_field_id, title, description, average_salary_range, related_roles, suggested_learning_areas)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            cr["id"], cr["career_field_id"], cr["title"], cr["description"],
            cr["average_salary_range"], cr.get("related_roles", ""), cr.get("suggested_learning_areas", "")
        ))

    # 18. Career Roadmap Steps
    for step in seed_data.CAREER_ROADMAP_STEPS:
        cursor.execute('''
            INSERT OR REPLACE INTO career_roadmap_steps 
            (career_role_id, stage, stage_order, title, description, key_skills, recommended_projects, learning_resources)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            step["career_role_id"], step["stage"], step["stage_order"],
            step["title"], step["description"], step["key_skills"], step["recommended_projects"],
            step.get("learning_resources", "[]")
        ))

    # 19. Mentor Notes
    for note in seed_data.MENTOR_NOTES:
        cursor.execute('''
            INSERT OR REPLACE INTO mentor_notes 
            (id, mentor_id, student_id, note, share_with_parent, follow_up_completed)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            note["id"], note["mentor_id"], note["student_id"], note["note"],
            note["share_with_parent"], note["follow_up_completed"]
        ))

    # 20. Concepts (Class 10 CBSE BKT granularity)
    if hasattr(seed_data, 'CONCEPTS'):
        for c in seed_data.CONCEPTS:
            cursor.execute('''
                INSERT OR REPLACE INTO concepts (id, chapter_id, name, description, prerequisite_concept_id)
                VALUES (?, ?, ?, ?, ?)
            ''', (c["id"], c["chapter_id"], c["name"], c["description"], c["prerequisite_concept_id"]))

    # 21. Lessons
    if hasattr(seed_data, 'LESSONS'):
        for l in seed_data.LESSONS:
            cursor.execute('''
                INSERT OR REPLACE INTO lessons (id, concept_id, title, content, learning_objective, difficulty_level)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (l["id"], l["concept_id"], l["title"], l["content"], l["learning_objective"], l["difficulty_level"]))

    # 22. Lesson Resources
    if hasattr(seed_data, 'LESSON_RESOURCES'):
        for lr in seed_data.LESSON_RESOURCES:
            cursor.execute('''
                INSERT OR REPLACE INTO lesson_resources (id, lesson_id, resource_type, title, url, access_requirement)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (lr["id"], lr["lesson_id"], lr["resource_type"], lr["title"], lr["url"], lr["access_requirement"]))

    # 23. Student Concept Mastery (BKT)
    if hasattr(seed_data, 'STUDENT_CONCEPT_MASTERY'):
        for scm in seed_data.STUDENT_CONCEPT_MASTERY:
            cursor.execute('''
                INSERT OR REPLACE INTO student_concept_mastery
                (student_id, concept_id, p_l0, p_t, p_g, p_s, mastery_probability, attempt_count, correct_count, sure_count, guessing_count, trend)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                scm["student_id"], scm["concept_id"], scm["p_l0"], scm["p_t"], scm["p_g"], scm["p_s"],
                scm["mastery_probability"], scm["attempt_count"], scm["correct_count"],
                scm["sure_count"], scm["guessing_count"], scm["trend"]
            ))

    # Update system_meta
    cursor.execute('''
        INSERT OR REPLACE INTO system_meta (key, value)
        VALUES ('database_status', 'ready_step_3'),
               ('project', 'Beyond Barriers'),
               ('schema_version', '4.0.0-bkt-recommendations'),
               ('seed_records', 'populated');
    ''')

    conn.commit()
    cursor.execute('PRAGMA foreign_keys = ON;')

def init_db(app=None, load_seed=True, reset=False):
    """
    Initialize SQLite database connection, execute schema, and optionally load seed data.
    Ensures persistent database data is NOT deleted or overwritten on app restarts.
    """
    if app:
        db_path = app.config['DATABASE_PATH']
    else:
        db_path = current_app.config['DATABASE_PATH']

    if reset and os.path.exists(db_path):
        try:
            os.remove(db_path)
            print(f"[RESET] Database removed at {db_path}")
        except Exception:
            pass

    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    db_exists = os.path.exists(db_path)

    conn = sqlite3.connect(db_path, timeout=30.0)
    try:
        conn.execute('PRAGMA foreign_keys = ON;')
        conn.execute('PRAGMA busy_timeout = 30000;')

        if not db_exists:
            execute_schema(conn)
            if load_seed:
                seed_database(conn)
        else:
            try:
                migrate_schema(conn)
                from werkzeug.security import generate_password_hash
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM users WHERE username = 'demo'")
                if not cursor.fetchone():
                    cursor.execute('''
                        INSERT INTO users (username, password_hash, role, student_id, is_active, is_demo)
                        VALUES (?, ?, 'student', 1, 1, 1)
                    ''', ('demo', generate_password_hash('demo123')))
                conn.commit()
            except sqlite3.OperationalError as op_err:
                print(f"[WARN] init_db schema check notice: {op_err}")
    finally:
        conn.close()
    print(f"[OK] SQLite Database initialized cleanly at: {db_path}")
