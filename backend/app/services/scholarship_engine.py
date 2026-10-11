"""
Beyond Barriers - Scholarship & Opportunity Engine (Step 8)
===========================================================
Deterministic scholarship matching, transparent eligibility explanations,
deadline urgency calculations, and multi-disability accessible formatting.

CRITICAL PRIVACY BOUNDARY:
- Admin scholarship interface and endpoints MUST NOT query or return student
  academic, attendance, test performance, or disability information.
- This engine is purely used within student-authorized contexts to match
  opportunities against the student's own unified profile.
"""

import datetime
import re

# Income category mapping in INR
INCOME_BRACKET_AMOUNTS = {
    '<1.5L': 150000.0,
    '<3L': 300000.0,
    '<8L': 800000.0,
    '>8L': 2000000.0
}

def get_current_date():
    """Return the reference today date (can be overridden in tests)."""
    return datetime.date.today()

def parse_deadline(deadline_str):
    """Safely parse a deadline string in YYYY-MM-DD format."""
    if not deadline_str:
        return None
    try:
        if isinstance(deadline_str, datetime.date):
            return deadline_str
        if isinstance(deadline_str, datetime.datetime):
            return deadline_str.date()
        clean_str = str(deadline_str).split('T')[0].strip()
        return datetime.datetime.strptime(clean_str, '%Y-%m-%d').date()
    except Exception:
        return None

def calculate_deadline_urgency(deadline_val, reference_date=None):
    """
    Calculate deadline urgency with days remaining, semantic state, and accessible labels.
    
    States:
    - expired: days_remaining < 0 (Label: "Expired", never show negative days like -3)
    - due_today: days_remaining == 0 (Label: "Due today")
    - closing_tomorrow: days_remaining == 1 (Label: "1 day remaining")
    - closing_soon: 2 <= days_remaining <= 7 (Label: "{N} days remaining")
    - open: days_remaining > 7 (Label: "{N} days remaining")

    Returns structured dict with icon, label, and accessible aria description.
    Never relies on color alone.
    """
    if reference_date is None:
        reference_date = get_current_date()

    deadline_date = parse_deadline(deadline_val)
    if not deadline_date:
        return {
            'deadline_date': str(deadline_val) if deadline_val else 'Unknown',
            'formatted_deadline': 'Unspecified',
            'days_remaining': 0,
            'raw_days': 0,
            'is_expired': False,
            'urgency_state': 'unknown',
            'urgency_label': 'Deadline unspecified',
            'icon_name': 'HelpCircle',
            'badge_text': 'Deadline unspecified',
            'aria_label': 'Application deadline is unspecified'
        }

    days_remaining = (deadline_date - reference_date).days

    if days_remaining < 0:
        return {
            'deadline_date': deadline_date.isoformat(),
            'formatted_deadline': deadline_date.strftime('%d/%m/%Y'),
            'days_remaining': 0,
            'raw_days': days_remaining,
            'is_expired': True,
            'urgency_state': 'expired',
            'urgency_label': 'Expired',
            'icon_name': 'AlertOctagon',
            'badge_text': 'Expired',
            'aria_label': f'Application expired on {deadline_date.strftime("%d %B %Y")}'
        }
    elif days_remaining == 0:
        return {
            'deadline_date': deadline_date.isoformat(),
            'formatted_deadline': deadline_date.strftime('%d/%m/%Y'),
            'days_remaining': 0,
            'raw_days': 0,
            'is_expired': False,
            'urgency_state': 'due_today',
            'urgency_label': 'Due today',
            'icon_name': 'AlertTriangle',
            'badge_text': '⚠ Urgent — Due today',
            'aria_label': 'Application deadline is today. Urgent action required.'
        }
    elif days_remaining == 1:
        return {
            'deadline_date': deadline_date.isoformat(),
            'formatted_deadline': deadline_date.strftime('%d/%m/%Y'),
            'days_remaining': 1,
            'raw_days': 1,
            'is_expired': False,
            'urgency_state': 'closing_tomorrow',
            'urgency_label': '1 day remaining',
            'icon_name': 'AlertTriangle',
            'badge_text': '⚠ Urgent — 1 day remaining',
            'aria_label': 'Application deadline is tomorrow. 1 day remaining.'
        }
    elif 2 <= days_remaining <= 7:
        return {
            'deadline_date': deadline_date.isoformat(),
            'formatted_deadline': deadline_date.strftime('%d/%m/%Y'),
            'days_remaining': days_remaining,
            'raw_days': days_remaining,
            'is_expired': False,
            'urgency_state': 'closing_soon',
            'urgency_label': f'{days_remaining} days remaining',
            'icon_name': 'Clock',
            'badge_text': f'⏳ Closing Soon — {days_remaining} days remaining',
            'aria_label': f'Application closing soon in {days_remaining} days on {deadline_date.strftime("%d %B %Y")}'
        }
    else:
        return {
            'deadline_date': deadline_date.isoformat(),
            'formatted_deadline': deadline_date.strftime('%d/%m/%Y'),
            'days_remaining': days_remaining,
            'raw_days': days_remaining,
            'is_expired': False,
            'urgency_state': 'open',
            'urgency_label': f'{days_remaining} days remaining',
            'icon_name': 'Calendar',
            'badge_text': f'📅 {days_remaining} days remaining',
            'aria_label': f'Application open with {days_remaining} days remaining until {deadline_date.strftime("%d %B %Y")}'
        }


def get_student_academic_percentage(db, student_id):
    """
    Calculate the student's benchmark academic percentage from term marks or test attempts.
    Returns float percentage (e.g. 82.5).
    """
    cursor = db.cursor()
    # 1. Average from recorded subject marks
    cursor.execute('''
        SELECT AVG(percentage) as avg_marks
        FROM marks
        WHERE student_id = ?
    ''', (student_id,))
    row = cursor.fetchone()
    if row and row['avg_marks'] is not None:
        return round(float(row['avg_marks']), 1)

    # 2. Fallback to average score across test attempts
    cursor.execute('''
        SELECT AVG(score) as avg_test_score
        FROM test_attempts
        WHERE student_id = ?
    ''', (student_id,))
    t_row = cursor.fetchone()
    if t_row and t_row['avg_test_score'] is not None:
        return round(float(t_row['avg_test_score']), 1)

    return 60.0


def evaluate_scholarship_eligibility(student, scholarship):
    """
    Deterministic evaluation of a single scholarship against student attributes.
    
    Attributes used:
    - Academic % (marks/test average)
    - Income bracket (income_category)
    - Social Category (category or default General)
    - Course / Class
    - Stream
    - Disability (ONLY if scholarship specifically designates disability_required)

    Attributes NOT used:
    - Attendance
    - Test performance trends
    - Academic support priority
    
    Returns dict with is_eligible, match_explanation, criteria_breakdown.
    """
    criteria_breakdown = []
    reasons_satisfied = []
    reasons_unmet = []

    st_class = student.get('class', 'Class 10')
    st_stream = student.get('stream', 'General')
    st_income_bracket = student.get('income_category', '<3L')
    st_income_val = INCOME_BRACKET_AMOUNTS.get(st_income_bracket, 300000.0)
    st_academic_pct = float(student.get('academic_percentage', 60.0))
    st_category = student.get('category', 'General')
    st_disability = student.get('disability_type', 'none')

    # 1. Class / Grade Eligibility
    sc_class = scholarship.get('eligible_class', 'All')
    if sc_class == 'All' or sc_class.lower() == st_class.lower():
        criteria_breakdown.append({
            'name': 'Grade Level',
            'required': sc_class,
            'student_value': st_class,
            'satisfied': True
        })
        reasons_satisfied.append(f"grade level ({st_class})")
    else:
        criteria_breakdown.append({
            'name': 'Grade Level',
            'required': sc_class,
            'student_value': st_class,
            'satisfied': False
        })
        reasons_unmet.append(f"requires {sc_class}")

    # 2. Stream / Course Eligibility
    sc_stream = scholarship.get('eligible_stream', 'All')
    if sc_stream == 'All' or sc_stream.lower() == st_stream.lower():
        criteria_breakdown.append({
            'name': 'Stream / Course',
            'required': sc_stream,
            'student_value': st_stream,
            'satisfied': True
        })
        if sc_stream != 'All':
            reasons_satisfied.append(f"stream ({st_stream})")
    else:
        criteria_breakdown.append({
            'name': 'Stream / Course',
            'required': sc_stream,
            'student_value': st_stream,
            'satisfied': False
        })
        reasons_unmet.append(f"requires {sc_stream} stream")

    # 3. Academic Percentage Requirement
    min_academic = float(scholarship.get('min_academic_percentage', 0.0))
    if min_academic <= 0.0 or st_academic_pct >= min_academic:
        criteria_breakdown.append({
            'name': 'Academic Percentage',
            'required': f'≥ {min_academic}%' if min_academic > 0 else 'No minimum requirement',
            'student_value': f'{st_academic_pct}%',
            'satisfied': True
        })
        if min_academic > 0:
            reasons_satisfied.append(f"academic percentage ({st_academic_pct}% meets the {min_academic}% requirement)")
    else:
        criteria_breakdown.append({
            'name': 'Academic Percentage',
            'required': f'≥ {min_academic}%',
            'student_value': f'{st_academic_pct}%',
            'satisfied': False
        })
        reasons_unmet.append(f"requires minimum {min_academic}% academic marks (current: {st_academic_pct}%)")

    # 4. Income Bracket Limit
    max_income = float(scholarship.get('max_income_limit', 0.0))
    if max_income <= 0.0 or st_income_val <= max_income:
        criteria_breakdown.append({
            'name': 'Family Income Limit',
            'required': f'Up to ₹{int(max_income):,}' if max_income > 0 else 'No income limit',
            'student_value': f'Bracket {st_income_bracket}',
            'satisfied': True
        })
        if max_income > 0:
            reasons_satisfied.append(f"family income bracket ({st_income_bracket} within ₹{int(max_income):,} limit)")
    else:
        criteria_breakdown.append({
            'name': 'Family Income Limit',
            'required': f'Up to ₹{int(max_income):,}',
            'student_value': f'Bracket {st_income_bracket}',
            'satisfied': False
        })
        reasons_unmet.append(f"family income exceeds ₹{int(max_income):,} threshold")

    # 5. Social Category Requirement
    cat_req = scholarship.get('category_requirement', 'All')
    if cat_req == 'All' or cat_req.lower() == st_category.lower() or (cat_req.lower() == 'disability' and st_disability != 'none'):
        criteria_breakdown.append({
            'name': 'Category',
            'required': cat_req,
            'student_value': st_category if cat_req != 'Disability' else f'Accessible ({st_disability})',
            'satisfied': True
        })
        if cat_req != 'All':
            reasons_satisfied.append(f"category ({cat_req})")
    else:
        criteria_breakdown.append({
            'name': 'Category',
            'required': cat_req,
            'student_value': st_category,
            'satisfied': False
        })
        reasons_unmet.append(f"designated for {cat_req} category")

    # 6. Disability Fellowship Criterion (Only if explicitly required by the fellowship)
    disability_req = bool(scholarship.get('disability_required', 0))
    if disability_req:
        if st_disability != 'none':
            criteria_breakdown.append({
                'name': 'Accessibility Fellowship',
                'required': 'Students with disabilities',
                'student_value': f'Verified {st_disability.capitalize()} Support',
                'satisfied': True
            })
            reasons_satisfied.append(f"accessibility fellowship criteria ({st_disability} profile)")
        else:
            criteria_breakdown.append({
                'name': 'Accessibility Fellowship',
                'required': 'Students with disabilities',
                'student_value': 'None reported',
                'satisfied': False
            })
            reasons_unmet.append("designated specifically for students with sensory or physical disabilities")

    # Determine overall eligibility: ALL criteria must be satisfied
    is_eligible = len(reasons_unmet) == 0

    # Build concise, transparent explanation
    if is_eligible:
        if len(reasons_satisfied) > 0:
            match_explanation = f"Matched because your {', '.join(reasons_satisfied)} meet the listed eligibility criteria."
        else:
            match_explanation = "Matched because you meet all listed eligibility criteria."
    else:
        match_explanation = "This scholarship currently does not match your listed eligibility criteria."

    return {
        'is_eligible': is_eligible,
        'match_explanation': match_explanation,
        'criteria_breakdown': criteria_breakdown,
        'reasons_satisfied': reasons_satisfied,
        'reasons_unmet': reasons_unmet
    }


def sort_scholarships(scholarships_list):
    """
    Sort scholarships for clear student scanning:
    1. Matched scholarships first.
    2. Active upcoming deadlines (ascending order: closest deadline first).
    3. Expired scholarships last.
    """
    def sort_key(s):
        is_matched = 0 if s.get('is_eligible', False) else 1
        is_expired = 1 if s.get('urgency', {}).get('is_expired', False) else 0
        days_remaining = s.get('urgency', {}).get('raw_days', 9999)
        return (is_matched, is_expired, days_remaining)

    return sorted(scholarships_list, key=sort_key)


def generate_voice_summary(matched_scholarships):
    """
    Create a concise, voice-readable summary from real student matches.
    """
    count = len(matched_scholarships)
    if count == 0:
        return (
            "Opening Scholarships. You currently have no matched scholarships. "
            "You can review all open opportunities on this page, or say Go to Dashboard."
        )

    top = matched_scholarships[0]
    urgency = top.get('urgency', {})
    days = urgency.get('days_remaining', 0)
    deadline = urgency.get('formatted_deadline', top.get('deadline', 'soon'))
    urgency_label = urgency.get('urgency_label', f'{days} days remaining')

    summary = (
        f"Opening Scholarships. You have {count} matched scholarship{'s' if count > 1 else ''}. "
        f"The first scholarship is {top.get('title')}, provided by {top.get('provider')}. "
        f"The application deadline is {deadline}. "
        f"There are {urgency_label}."
    )

    if count > 1:
        second = matched_scholarships[1]
        summary += f" Another matched opportunity is {second.get('title')}."

    summary += " You can say Read scholarships, Read this scholarship, or Go to Dashboard."
    return summary
