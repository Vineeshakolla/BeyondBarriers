-- ============================================================================
-- BEYOND BARRIERS - UNIFIED DATABASE SCHEMA (SQLite)
-- Core Principle: "ONE STUDENT PROFILE -> PERSONALIZED SUPPORT ACROSS PLATFORM"
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. SYSTEM METADATA
CREATE TABLE IF NOT EXISTS system_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. STUDENTS (The Central Unified Profile)
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    roll_number INTEGER UNIQUE NOT NULL,
    roll_code TEXT UNIQUE NOT NULL, -- e.g. 'CS-014'
    class TEXT NOT NULL,            -- e.g. 'Class 10'
    stream TEXT DEFAULT 'General',  -- e.g. 'General', 'Science', 'Commerce'
    disability_type TEXT DEFAULT 'none', -- 'none', 'visual', 'hearing', 'speech', 'motor'
    internet_access TEXT NOT NULL DEFAULT 'full', -- 'full', 'intermittent', 'none'
    device_access TEXT NOT NULL DEFAULT 'personal_laptop', -- 'personal_laptop', 'shared_smartphone', 'none'
    income_category TEXT NOT NULL DEFAULT '<3L', -- '<1.5L', '<3L', '<8L', '>8L'
    career_interest TEXT DEFAULT 'Artificial Intelligence',
    preferred_response_format TEXT NOT NULL DEFAULT 'visual', -- 'visual', 'text', 'audio'
    preferred_language TEXT NOT NULL DEFAULT 'en', -- 'en', 'hi'
    is_profile_completed BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. MENTORS (Scope restricted by assigned roll number range)
CREATE TABLE IF NOT EXISTS mentors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT DEFAULT 'Academic Support',
    assigned_roll_start INTEGER NOT NULL,
    assigned_roll_end INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (assigned_roll_start <= assigned_roll_end)
);

-- 4. PARENTS (Linked to exactly ONE student)
CREATE TABLE IF NOT EXISTS parents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    linked_student_id INTEGER UNIQUE NOT NULL,
    relationship TEXT DEFAULT 'Parent/Guardian',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (linked_student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 5. ADMINISTRATORS (Scholarship management; zero access to marks/disabilities)
CREATE TABLE IF NOT EXISTS administrators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Scholarship Director',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    class TEXT NOT NULL,
    stream TEXT DEFAULT 'General',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. MODULES (Supports adaptive content: summary vs detailed)
CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    module_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary_content TEXT NOT NULL,   -- Lighter version for high-performing/fast review
    detailed_content TEXT NOT NULL,  -- In-depth version with examples & remediation
    difficulty_level TEXT NOT NULL DEFAULT 'standard', -- 'introductory', 'standard', 'advanced'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE (subject_id, module_number)
);

-- 8. STUDENT MODULE PROGRESS (Adaptive learning tracker)
CREATE TABLE IF NOT EXISTS student_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    module_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
    attempts INTEGER NOT NULL DEFAULT 0,
    best_score REAL NOT NULL DEFAULT 0.0,
    last_score REAL NOT NULL DEFAULT 0.0,
    last_confidence TEXT, -- 'Sure', 'Guessing'
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    UNIQUE (student_id, module_id)
);

-- 9. TESTS (Associated with modules)
CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    passing_score REAL NOT NULL DEFAULT 60.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- 10. TEST QUESTIONS
CREATE TABLE IF NOT EXISTS test_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL, -- 'A', 'B', 'C', 'D'
    explanation TEXT,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    UNIQUE (test_id, question_number)
);

-- 11. TEST ATTEMPTS
CREATE TABLE IF NOT EXISTS test_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL,
    score REAL NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    sure_count INTEGER NOT NULL DEFAULT 0,
    guessing_count INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

-- 12. TEST ANSWERS (Stores confidence signal: 'Sure' or 'Guessing')
CREATE TABLE IF NOT EXISTS test_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    selected_option TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    confidence TEXT NOT NULL, -- 'Sure', 'Guessing'
    FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE
);

-- 13. ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    total_classes INTEGER NOT NULL DEFAULT 0,
    attended_classes INTEGER NOT NULL DEFAULT 0,
    attendance_percentage REAL NOT NULL DEFAULT 0.0,
    trend TEXT NOT NULL DEFAULT 'stable', -- 'improving', 'stable', 'declining'
    consecutive_missed INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE (student_id, subject_id)
);

-- 14. MARKS
CREATE TABLE IF NOT EXISTS marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    assessment_name TEXT NOT NULL, -- e.g. 'Term 1 Exam', 'Unit Assessment'
    marks_obtained REAL NOT NULL,
    total_marks REAL NOT NULL DEFAULT 100.0,
    percentage REAL NOT NULL,
    grade TEXT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 15. RESOURCES (Adaptive based on connectivity and device)
CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    resource_type TEXT NOT NULL, -- 'textbook', 'article', 'video', 'interactive', 'document'
    format TEXT NOT NULL DEFAULT 'text', -- 'text', 'visual', 'audio', 'interactive'
    subject_id INTEGER,
    class TEXT NOT NULL,
    content_url TEXT NOT NULL,
    access_requirement TEXT NOT NULL DEFAULT 'offline_friendly', -- 'offline_friendly', 'low_bandwidth', 'high_speed'
    is_downloadable BOOLEAN NOT NULL DEFAULT 0,
    language TEXT NOT NULL DEFAULT 'en',
    estimated_size_mb REAL NOT NULL DEFAULT 1.0,
    description TEXT,
    has_captions BOOLEAN NOT NULL DEFAULT 1,
    has_transcript BOOLEAN NOT NULL DEFAULT 1,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- 16. SCHOLARSHIPS
CREATE TABLE IF NOT EXISTS scholarships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    provider TEXT NOT NULL,
    description TEXT NOT NULL,
    amount TEXT NOT NULL DEFAULT '₹50,000 / year',
    eligible_class TEXT NOT NULL,
    eligible_stream TEXT NOT NULL DEFAULT 'All', -- 'All', 'General', 'Science', 'Commerce', 'Arts'
    min_academic_percentage REAL NOT NULL DEFAULT 0.0,
    category_requirement TEXT NOT NULL DEFAULT 'All', -- 'All', 'General', 'OBC', 'SC', 'ST', 'EWS', 'Disability'
    max_income_limit REAL NOT NULL DEFAULT 0.0,       -- 0.0 = no limit
    disability_required BOOLEAN NOT NULL DEFAULT 0,
    deadline TEXT NOT NULL, -- 'YYYY-MM-DD'
    application_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 17. SCHOLARSHIP MATCHES (Tracking calculated matches and student applications)
CREATE TABLE IF NOT EXISTS scholarship_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    scholarship_id INTEGER NOT NULL,
    match_percentage INTEGER NOT NULL,
    is_eligible BOOLEAN NOT NULL,
    eligibility_notes TEXT,
    applied BOOLEAN NOT NULL DEFAULT 0,
    applied_at TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE,
    UNIQUE (student_id, scholarship_id)
);

-- 18. CAREER FIELDS
CREATE TABLE IF NOT EXISTS career_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT
);

-- 19. CAREER ROLES
CREATE TABLE IF NOT EXISTS career_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    career_field_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    average_salary_range TEXT,
    related_roles TEXT DEFAULT '', -- Comma-separated related role titles
    suggested_learning_areas TEXT DEFAULT '',
    FOREIGN KEY (career_field_id) REFERENCES career_fields(id) ON DELETE CASCADE,
    UNIQUE (career_field_id, title)
);

-- 20. CAREER ROADMAP STEPS (4 stages: Foundation -> Core Skills -> Advanced Skills -> Career Preparation)
CREATE TABLE IF NOT EXISTS career_roadmap_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    career_role_id INTEGER NOT NULL,
    stage TEXT NOT NULL, -- 'Foundation', 'Core Skills', 'Advanced Skills', 'Career Preparation'
    stage_order INTEGER NOT NULL, -- 1, 2, 3, 4
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    key_skills TEXT NOT NULL, -- Comma-separated or JSON string
    recommended_projects TEXT,
    learning_resources TEXT DEFAULT '', -- JSON string of curated educational links
    FOREIGN KEY (career_role_id) REFERENCES career_roles(id) ON DELETE CASCADE,
    UNIQUE (career_role_id, stage_order)
);

-- 21. MENTOR NOTES (share_with_parent controls parent visibility)
CREATE TABLE IF NOT EXISTS mentor_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    share_with_parent BOOLEAN NOT NULL DEFAULT 0,
    follow_up_completed BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 22. USERS (Authentication credentials & role linking)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL, -- 'student', 'mentor', 'parent', 'administrator'
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    mentor_id INTEGER REFERENCES mentors(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES parents(id) ON DELETE CASCADE,
    administrator_id INTEGER REFERENCES administrators(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    is_demo BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (role IN ('student', 'mentor', 'parent', 'administrator'))
);

-- 23. SESSIONS (Session tokens for authenticated requests)
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- 24. CONCEPTS (Class 10 Skill/Concept granularity for BKT)
CREATE TABLE IF NOT EXISTS concepts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    prerequisite_concept_id INTEGER REFERENCES concepts(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 25. LESSONS (Specific learning units tied to concepts)
CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    learning_objective TEXT,
    difficulty_level TEXT NOT NULL DEFAULT 'standard', -- 'introductory', 'standard', 'advanced'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 26. STUDENT CONCEPT MASTERY (Bayesian Knowledge Tracing per student + concept)
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
    trend TEXT NOT NULL DEFAULT 'INSUFFICIENT_DATA', -- 'IMPROVING', 'STABLE', 'DECLINING', 'INSUFFICIENT_DATA'
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, concept_id)
);

-- 27. STUDENT QUESTION ATTEMPTS (Historical question log with confidence)
CREATE TABLE IF NOT EXISTS student_question_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES test_questions(id) ON DELETE SET NULL,
    concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    confidence TEXT NOT NULL DEFAULT 'Sure', -- 'Sure', 'Guessing'
    attempt_number INTEGER NOT NULL DEFAULT 1,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 28. LESSON RESOURCES (Format and access adaptivity)
CREATE TABLE IF NOT EXISTS lesson_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL, -- 'VIDEO', 'TEXT', 'AUDIO', 'INTERACTIVE', 'DOWNLOADABLE'
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    access_requirement TEXT NOT NULL DEFAULT 'offline_friendly', -- 'offline_friendly', 'low_bandwidth', 'high_speed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 29. STUDENT RECOMMENDATIONS (Calculated personalized recommendations)
CREATE TABLE IF NOT EXISTS student_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'FOUNDATION', 'RETEACH', 'PRACTICE', 'REINFORCEMENT', 'APPLICATION', 'ADVANCE', 'CATCH_UP'
    priority_score REAL NOT NULL,
    reason TEXT NOT NULL,
    recommended_format TEXT NOT NULL DEFAULT 'TEXT', -- 'TEXT', 'AUDIO', 'VISUAL', 'LIGHTWEIGHT'
    recommended_resource_type TEXT NOT NULL DEFAULT 'LESSON',
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE & SCOPE-BASED QUERYING
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_modules_subject ON modules(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_modules ON student_modules(student_id, module_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts ON test_attempts(student_id, test_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_scholarships_active ON scholarships(is_active, deadline);
CREATE INDEX IF NOT EXISTS idx_mentor_notes_student ON mentor_notes(student_id, share_with_parent);
CREATE INDEX IF NOT EXISTS idx_career_roadmap ON career_roadmap_steps(career_role_id, stage_order);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_concepts_chapter ON concepts(chapter_id);
CREATE INDEX IF NOT EXISTS idx_lessons_concept ON lessons(concept_id);
CREATE INDEX IF NOT EXISTS idx_student_concept_mastery ON student_concept_mastery(student_id, concept_id);
CREATE INDEX IF NOT EXISTS idx_student_question_attempts ON student_question_attempts(student_id, concept_id);
CREATE INDEX IF NOT EXISTS idx_student_recommendations ON student_recommendations(student_id, is_active);


