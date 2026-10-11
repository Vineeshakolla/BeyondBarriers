# Beyond Barriers — Personalized and Inclusive Education Support System

> **A Unified, Accessible, and Explainable Education Platform Designed to Meet Individual Student Needs.**  
> Central Principle: **"ONE STUDENT PROFILE → PERSONALIZED SUPPORT ACROSS THE ENTIRE PLATFORM"**

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Database Design](#5-database-design)
6. [User Roles & Dashboard Routing](#6-user-roles--dashboard-routing)
7. [Comprehensive Accessibility](#7-comprehensive-accessibility)
8. [Global Voice Agent](#8-global-voice-agent)
9. [Personalized Learning & Metacognitive Testing](#9-personalized-learning--metacognitive-testing)
10. [Academic Support & Priority Engine](#10-academic-support--priority-engine)
11. [Scholarships & Deadline Urgency](#11-scholarships--deadline-urgency)
12. [Connectivity & Format-Aware Resources](#12-connectivity--format-aware-resources)
13. [Career Guidance & 4-Stage Roadmaps](#13-career-guidance--4-stage-roadmaps)
14. [Privacy & Security Model](#14-privacy--security-model)
15. [Setup & Installation Instructions](#15-setup--installation-instructions)
16. [Seeded Demo Accounts](#16-seeded-demo-accounts)
17. [Hackathon Live Demonstration Flow](#17-hackathon-live-demonstration-flow)
18. [Known Limitations](#18-known-limitations)
19. [Future Scope](#19-future-scope)

---

## 1. Project Overview

Standard educational platforms often treat all students identically — assuming constant high-speed broadband, neurotypical learning patterns, unimpaired vision and motor skills, and uniform academic preparedness. **Beyond Barriers** is built from the ground up to dismantle these educational obstacles.

Beyond Barriers integrates:
- **Metacognitive Self-Assessment**: Differentiating true conceptual mastery from lucky guessing through two-dimensional confidence tagging (`Sure` vs. `Guessing`).
- **Deterministic Adaptive Learning**: Calibrating subsequent module content depth (`light`, `standard`, or `detailed`) based on transparent mastery rules rather than unpredictable black-box models.
- **Multimodal Accessibility**: A zero-dependency browser-native global Voice Agent with immediate verbal cancellation (`Stop`), speech queue management, dynamic auto-reading upon navigation, dyslexia-friendly typography, high-contrast themes, and simulation filters for Protanopia, Deuteranopia, and Tritanopia.
- **Explainable Early Academic Support**: Non-stigmatizing, transparent, deterministic academic risk detection identifying attendance drop-offs, guessing anomalies, and conceptual misconceptions without medical or psychological labeling.
- **Connectivity-Aware Educational Equity**: Seamless resource recommendation that elevates offline-friendly, pre-downloadable text guides for students with intermittent or no home internet.
- **Privacy-Preserving Role Scopes**: Cryptographically verified server-side boundaries isolating student academic records, bounding mentors strictly to their assigned roll-number cohorts, locking parents to their single linked child, and strictly insulating the administrator scholarship console from sensitive student academic or disability records.

---

## 2. Key Features

- **Unified Single Profile**: Class, stream, disability profile, connectivity condition, and career interest uniformly drive all downstream learning content, recommendations, and interface styling.
- **Interactive Global Voice Agent**: Hands-free voice navigation across the entire student application with immediate speech cancellation on `"Stop"`, pause/resume, and automatic page content narration.
- **Sure / Guessing Assessment Engine**: Questions prompt students for answer choice and metacognitive confidence, categorizing results into Mastery, Misconceptions, and Lucky Guesses.
- **Adaptive Content Depth**: High first-attempt score with strong confidence suggests light revision summaries; repeated attempts or guessing anomalies recommend in-depth remediation.
- **Explainable Support Priority Engine**: Generates plain-language reasons for student support needs (e.g. attendance dips, declining performance trends) rather than opaque risk numbers.
- **Opportunity & Scholarship Engine**: Deterministic matching based on grade, stream, income bracket, and academic merits with colorblind-safe deadline urgency badges.
- **Connectivity Adaptation**: Automatically shifts recommendation weights to prioritize downloadable and text resources for low-connectivity students.
- **Structured 4-Stage Career Roadmaps**: Curated milestones (`Foundation`, `Core Skills`, `Advanced Skills`, `Career Preparation`) with ordered projects and recommended learning materials.
- **Role-Dedicated Dashboards**: Scoped portals for Students, Mentors, Parents, and Administrators with 100% backend-enforced authorization.

---

## 3. System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   Vite + React Single-Page Application                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │    VoiceContext Engine  │  │         AuthContext State           │  │
│  │ (SpeechSynthesis / Rec) │  │  (Bearer Token / Role Enforcement)  │  │
│  └───────────┬─────────────┘  └──────────────────┬──────────────────┘  │
│              │                                   │                     │
│  ┌───────────┴───────────────────────────────────┴──────────────────┐  │
│  │  Pages: Dashboard | Learning | Tests | Support | Resources       │  │
│  │         Scholarships | Career | Accessibility | Settings         │  │
│  │         Mentor Portal | Parent Portal | Admin Console            │  │
│  └───────────────────────────────────┬──────────────────────────────┘  │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │ HTTP / REST (Bearer Auth)
┌──────────────────────────────────────▼─────────────────────────────────┐
│                        Flask REST API (Python 3)                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │               Cryptographic RBAC & Scope Middleware              │  │
│  │  (@require_auth, @require_role, roll-range scope, child lock)    │  │
│  └───────────┬───────────────────────┬──────────────────────┬───────┘  │
│              │                       │                      │          │
│  ┌───────────▼──────────┐ ┌──────────▼──────────┐ ┌─────────▼────────┐ │
│  │   Learning Service   │ │   Support Priority  │ │   Scholarship &  │ │
│  │ (Adaptive Remediation│ │    Explainability   │ │ Resource Engines │ │
│  │ & Confidence Matrix) │ │    (Deterministic)  │ │ (Deadline Urgency│ │
│  └───────────┬──────────┘ └──────────┬──────────┘ └─────────┬────────┘ │
└──────────────┼───────────────────────┼──────────────────────┼──────────┘
               │                       │                      │
┌──────────────▼───────────────────────▼──────────────────────▼──────────┐
│                   SQLite Database (Relational Schema)                  │
│   22 Tables | Strict Foreign Keys | Seeded Realistic Personas          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Technology Stack

- **Frontend Core**: React 18, Vite 6, Modern Vanilla CSS Design System
- **Client Routing**: React Router DOM v6
- **Voice System**: Web Speech API (`window.speechSynthesis`, `window.SpeechRecognition` / `webkitSpeechRecognition`)
- **Visual & Icons**: Lucide React
- **Backend API**: Python 3.10+, Flask, Flask-CORS
- **Authentication**: Cryptographically secure SHA-256 session bearer tokens with PBKDF2 password hashing (Werkzeug)
- **Database Engine**: SQLite 3 with `PRAGMA foreign_keys = ON`
- **Testing & Verification**: Python Requests, Flask test client, Pytest-compatible suites

---

## 5. Database Design

The relational database (`backend/database/beyond_barriers.db`) comprises **22 normalized tables** with strict foreign key constraints:

| Entity Category | Tables | Description |
|---|---|---|
| **Identity & Auth** | `users`, `sessions` | Hashed credentials, role scopes, active session tokens |
| **User Personas** | `students`, `mentors`, `parents`, `administrators` | Unified student profile, mentor roll ranges, parent-child links |
| **Curriculum** | `subjects`, `modules`, `student_modules` | Class/stream subjects, sequential module prerequisites, status |
| **Assessments** | `tests`, `test_questions`, `test_attempts`, `test_answers` | MCQs, attempt retention, confidence ratings (`Sure`/`Guessing`) |
| **Academic Records** | `attendance`, `marks` | Session attendance records, term exam scores |
| **Opportunities** | `scholarships` | Eligibility criteria, deadlines, income caps, amount |
| **Resources** | `resources` | Downloadable flags, file sizes, format, accessibility tags |
| **Career Roadmaps** | `career_fields`, `career_roles`, `career_roadmap_steps` | 4-stage milestones, key skills, projects, learning links |
| **Mentorship** | `mentor_notes` | Pedagogical notes with `share_with_parent` privacy flag |

---

## 6. User Roles & Dashboard Routing

Authentication dynamically routes users to their dedicated, server-protected workspace:

```text
Login (/login)
  ├── role == 'student'        ──► /student/dashboard
  ├── role == 'mentor'         ──► /mentor/dashboard
  ├── role == 'parent'         ──► /parent/dashboard
  └── role == 'administrator'  ──► /admin/dashboard
```

Every route is safeguarded by both frontend client guards (`ProtectedRoute`) and **strict backend decorators** (`@require_auth`, `@require_role`). Client tampering or role spoofing is rejected with HTTP `401 Unauthorized` or `403 Forbidden`.

---

## 7. Comprehensive Accessibility

Beyond Barriers adheres strictly to WCAG 2.1 AA accessibility standards:

- **Visual Accommodations**:
  - **Colorblind Simulation & Remediation**: SVG filter matrix transforms for `Protanopia`, `Deuteranopia`, and `Tritanopia`.
  - **High-Contrast Mode**: Pure black canvas (`#0a0e1a`) with high-visibility canary yellow text (`#fbbf24`) and cyan borders (`#06b6d4`).
  - **Typography Controls**: Font scaling up to 130% and Dyslexia-friendly typeface support.
  - **Zero Color-Only Information**: All urgency alerts, statuses, and warnings pair colors with distinct icons and semantic text.
- **Hearing Accommodations**:
  - Full transcripts and closed-caption indicators for all educational media.
  - Live subtitles and screen-reader `aria-live="polite"` notifications for speech outputs.
- **Speaking & Motor Accommodations**:
  - Complete parity between voice commands and keyboard/mouse controls. No microphone is required to complete any flow.
  - Full keyboard accessibility with visible focus rings (`:focus-visible`).

---

## 8. Global Voice Agent

The platform features a **single, globally synchronized voice controller** (`VoiceContext.jsx`):

### Supported Voice Commands
- **Navigation & Auto-Reading**:
  - `"Go to Dashboard"` → Navigates to Dashboard, waits for data to render, auto-reads summary.
  - `"Go to My Learning"` → Opens Learning view, narrates enrolled subjects.
  - `"Go to Attendance"` → Opens Academic Performance, reads attendance percentage and exam scores.
  - `"Go to Scholarships"` → Opens Opportunities, reads matched scholarships and urgency.
  - `"Go to Career Guidance"` → Opens Career, reads roadmap and milestones.
  - `"Go to Resources"` → Opens Resources, announces count of offline/accessible items.
  - `"Go to Accessibility Settings"` → Opens Settings, reads current preferences.
- **Speech Control State Machine**:
  - `"Stop"` → **Immediate cancellation** via `speechSynthesis.cancel()`, clears queue, verbally acknowledges with `"Speech stopped."`
  - `"Pause"` → Halts speech at current word; acknowledges with `"Speech paused."`
  - `"Continue"` / `"Resume"` → Resumes speech from paused word position.
  - `"Repeat"` / `"Repeat that"` → Replays the last spoken sentence or active test question.
- **Interactive Voice Testing**:
  - `"Read the question"` → Vocalizes the active MCQ and all four options.
  - `"Option A"` / `"Option B"` / `"Option C"` / `"Option D"` → Selects the MCQ option.
  - `"Sure"` / `"Guessing"` → Sets confidence level for the active question.

---

## 9. Personalized Learning & Metacognitive Testing

1. **Class & Stream Alignment**: Subjects populate dynamically based on the student profile (`Class 10 General` vs. `Class 12 Science`).
2. **Academic Integrity Shield**: Test retrieval APIs exclude `correct_option` and `explanation` from client payloads.
3. **Two-Dimensional Evaluation**:
   - Each answer requires both option selection and a confidence signal (`Sure` vs. `Guessing`).
   - Results map into a Metacognitive Quadrant:
     - **Mastery**: Correct + Sure
     - **Conceptual Misconception**: Incorrect + Sure (Needs targeted correction)
     - **Lucky Guess**: Correct + Guessing (Needs reinforcement)
     - **Recognized Learning Gap**: Incorrect + Guessing
4. **Deterministic Adaptive Content Depth**:
   - `light`: Score $\ge 80\%$ on first attempt with 100% `Sure` confidence.
   - `detailed`: Score $< 60\%$, repeated attempts ($\ge 2$), or low score with `Guessing`.
   - `standard`: Balanced baseline pace.
5. **Prerequisite Gating**: Module tests unlock sequentially; Subject Final Assessment unlocks only after completing all regular modules.

---

## 10. Academic Support & Priority Engine

Step 7 implements a deterministic, non-stigmatizing early support engine:

### Priority Classification
- **Needs Support**: Attendance $< 75\%$, attendance decline $\ge 15\%$, or average test score $< 50\%$.
- **Monitor**: Attendance $75-80\%$, test score $50-65\%$, or high guessing rate ($> 40\%$).
- **Normal**: Consistent attendance $\ge 80\%$ and assessment performance $\ge 65\%$.

### Transparent Explainability
Every priority determination includes plain-language, non-medical explanations:
- *"Overall attendance is 70.7%, which is below the 75% benchmark."*
- *"A high proportion (54.5%) of answers were marked as Guessing, indicating low conceptual certainty."*
- *"Identified 1 conceptual misconception where answers were marked Sure but were incorrect."*

---

## 11. Scholarships & Deadline Urgency

- **Unified Profile Matching**: Matches active opportunities against grade level, stream, academic percentage, family income category, and disability requirements.
- **Transparent Justification**: Clear text breakdown detailing why a student is eligible or which requirement is unmet.
- **Colorblind-Safe Urgency Calculation**:
  - `Due today`: ⚠ Urgent — Due today
  - `1 day remaining`: ⚠ Urgent — 1 day remaining
  - `X days remaining`: ⏳ Closing Soon (2–7 days) or 📅 Open (> 7 days)
  - `Expired`: Expired (never shows negative days like `-3 days`)
  - Always rendered with icon, descriptive badge, and `aria-label`.
- **Administrative Portal**: Administrators can create, edit, activate, or deactivate scholarship postings with full form validation.

---

## 12. Connectivity & Format-Aware Resources

Educational materials automatically adapt to student connectivity constraints:
- **Offline Profile (`None`)**: Automatically filters and ranks lightweight downloadable guides (`.pdf`, `.txt`) as top picks. High-bandwidth streaming video is flagged as `not_recommended`.
- **Intermittent Connectivity**: Recommends low-bandwidth audio masterclasses and downloadable problem sets.
- **Full Broadband**: Unlocks interactive browser simulations and video masterclasses.
- **Sensory Alignment**: Students with visual disabilities receive an automatic ranking boost for structured audio lessons.

---

## 13. Career Guidance & 4-Stage Roadmaps

A deterministic career exploration system aligned to student profile interests:
- **Static 4-Stage Milestones**:
  1. `Foundation`: Core prerequisites and fundamental domain knowledge.
  2. `Core Skills`: Applied toolchains, languages, and technical frameworks.
  3. `Advanced Skills`: Industry specializations, optimization, and system design.
  4. `Career Preparation`: Portfolio projects, open-source work, and interview readiness.
- **Deterministic Roadmaps**: Seeded roadmaps for roles including *AI & Machine Learning Engineer*, *Cybersecurity Analyst*, *Full-Stack Web Developer*, and *Data Analyst*.
- **Role Switching**: Students can explore alternate career roles and fields on demand.

---

## 14. Privacy & Security Model

Beyond Barriers enforces a rigorous, server-side data isolation model:

```text
┌─────────────────────────┬────────────────────────────────────────────────────────┐
│ Persona                 │ Server-Side Enforcement Rules                          │
├─────────────────────────┼────────────────────────────────────────────────────────┤
│ Student                 │ Strictly isolated to own ID. Cannot access other       │
│                         │ students' data or mentor/admin endpoints (403).        │
├─────────────────────────┼────────────────────────────────────────────────────────┤
│ Mentor                  │ Bounded to configured roll range (e.g. Rolls 1–20).    │
│                         │ Accessing outside-cohort student returns 403.          │
│                         │ Cannot view student disability or financial data.      │
├─────────────────────────┼────────────────────────────────────────────────────────┤
│ Parent                  │ Locked to single linked child via database foreign key.│
│                         │ Cannot access other children (403).                    │
│                         │ Private mentor notes (share_with_parent=0) shielded.   │
├─────────────────────────┼────────────────────────────────────────────────────────┤
│ Administrator           │ Management console restricted to scholarships.         │
│                         │ Academic student APIs strictly return 403 Forbidden.   │
│                         │ Zero student marks, attendance, or disability exposed. │
└─────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 15. Setup & Installation Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Initialize & seed SQLite database cleanly
python init_db.py --reset

# Start the Flask API server (Default: http://127.0.0.1:5000)
python run.py
```

### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server (Default: http://localhost:5173)
npm run dev
```

### 3. Production Build Validation
```bash
cd frontend
npm run build
```

---

## 16. Seeded Demo Accounts

All demo accounts use the standard password: `password123`

| Role | Username | Password | Persona Description | Key Demo Highlight |
|---|---|---|---|---|
| **Student (Visually Impaired)** | `student8` | `password123` | Meera Nair (Roll 8, Class 10) | Voice Agent navigation, high-contrast, audio resources |
| **Student (Academic Support)** | `student1` | `password123` | Aarav Sharma (Roll 14, Class 10) | Needs Support priority, Guessing signals, adaptive depth |
| **Student (Offline Mode)** | `student5` | `password123` | Rohan Deshmukh (Roll 22, Class 12) | Offline-first ranking, downloadable study materials |
| **Student (High Performer)** | `student2` | `password123` | Priya Verma (Roll 5, Class 10) | Final assessment unlocked, lighter adaptive depth |
| **Mentor (Cohort 1)** | `mentor1` | `password123` | Dr. Radhika Sen (Rolls 1–20) | Cohort urgency sorting, explainable causes, mentor notes |
| **Mentor (Cohort 2)** | `mentor2` | `password123` | Prof. Vikram Joshi (Rolls 21–40) | Demonstrates roll-range boundary enforcement (403) |
| **Parent** | `parent1` | `password123` | Sunita Sharma (Linked to Aarav) | Child attendance/marks, shared notes visible, private notes hidden |
| **Administrator** | `admin1` | `password123` | P. K. Verma (Scholarship Admin) | Scholarship CRUD, deadline urgency, zero student data access |

---

## 17. Hackathon Live Demonstration Flow

Follow this exact flow during the presentation:

### Part 1: Student Experience (Voice & Accessibility)
1. Login as `student8` / `password123` (Meera Nair).
2. Click the microphone icon or use voice:
   - Say: `"Go to Dashboard"` → Dashboard opens automatically and begins auto-reading summary.
   - Say: `"Stop"` → **Audio halts immediately** and acknowledges: *"Speech stopped."*
   - Say: `"Go to My Learning"` → Navigates to Learning and reads enrolled subjects.
   - Say: `"Pause"` → Audio pauses immediately.
   - Say: `"Continue"` → Audio resumes seamlessly.
3. Open a module test and demonstrate metacognitive assessment:
   - Select an answer and toggle between **Sure** and **Guessing**.
   - Submit test: review Metacognitive Quadrant and deterministic adaptive recommendation (`detailed`).
4. Navigate to **Scholarships** (`"Go to Scholarships"`):
   - Highlight matched opportunities, match explanation, and colorblind-safe deadline urgency badges (`Due today`, `1 day remaining`).
5. Navigate to **Career Guidance** (`"Go to Career Guidance"`):
   - Showcase structured 4-stage milestones from Foundation to Career Preparation.

### Part 2: Mentor Experience (Cohort Scoping & Notes)
1. Login as `mentor1` / `password123` (Dr. Radhika Sen).
2. Show assigned cohort restricted to **Rolls 1–20** (5 students), sorted by urgency: Aarav Sharma (`Needs Support`) is at the top.
3. Click Aarav Sharma to view diagnostic causes: attendance dip, low quiz average, and high guessing percentage.
4. Add a mentor note with **"Share with Parent"** toggled ON.
5. Demonstrate security boundary: attempt to navigate to student roll 22 (`/mentor/students/5`) → server returns **HTTP 403 Forbidden**.

### Part 3: Parent Experience (Single-Child Link & Private Notes)
1. Login as `parent1` / `password123` (Sunita Sharma).
2. Observe child dashboard showing Aarav Sharma's attendance (70.7%), average marks, and learning progress.
3. In Mentor Feedback, verify the shared note created in Part 2 is visible, while private mentor notes remain **completely hidden**.
4. Attempt to access other student records → server returns **HTTP 403 Forbidden**.

### Part 4: Administrator Experience (Privacy Wall)
1. Login as `admin1` / `password123` (P. K. Verma).
2. Show Scholarship Administration console: active postings, create scholarship form, and deadline management.
3. Verify the administrative interface contains **zero student grades, attendance, or disability information**.
4. Directly requesting student academic APIs returns **HTTP 403 Forbidden**.

---

## 18. Known Limitations

1. **Browser Speech Synthesis Variations**: Native browser voices vary across operating systems (macOS, Windows, Linux). The application includes fallback speed/pitch normalizers.
2. **Local Audio Storage**: Audio masterclasses are currently referenced via local mock URLs and static assets rather than an external CDN.
3. **Simulated Institutional SIS**: Student attendance and term exam records are populated from the local relational database rather than a live university SIS API integration.

---

## 19. Future Scope

The following capabilities are explicitly identified as **Future Scope** and are intentionally not implemented in the current hackathon release:
- **Dynamic AI-Generated Career Roadmaps**: Integrating generative LLM agents to produce real-time personalized career steps based on evolving resume inputs.
- **Full Multilingual Translation Pipeline**: Machine-translation models for real-time translation of module contents into 12+ regional Indian languages.
- **Real-Time Speech-to-Speech Tutoring**: Low-latency bidirectional conversational voice AI for real-time Socratic dialogue.
- **External University SIS Connectors**: Native OAuth2 and LTI 1.3 integrations for Canvas, Moodle, and Blackboard.
