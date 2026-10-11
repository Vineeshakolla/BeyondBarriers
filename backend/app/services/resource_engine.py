"""
Resource Engine for Beyond Barriers.
Adapts educational resources to student profiles based on connectivity, device,
preferred format, and language. Provides deterministic suitability scoring
and plain-language explanations.
"""

def evaluate_resource_suitability(student, resource):
    """
    Evaluate how suitable an educational resource is for a specific student profile.
    
    Args:
        student: dict containing student profile fields (internet_access, device_access,
                 preferred_response_format, preferred_language, class, disability_type)
        resource: dict containing resource fields (access_requirement, is_downloadable,
                  format, language, class, estimated_size_mb, resource_type, title)
                  
    Returns:
        dict with:
            - suitability_score: int (0 to 100)
            - is_suitable: bool
            - explanation: str
            - connectivity_status: str ('optimal', 'acceptable', 'requires_internet', 'not_recommended')
            - format_match: bool
            - size_note: str
    """
    student_net = (student.get('internet_access') or 'full').lower()
    student_device = (student.get('device_access') or 'personal_laptop').lower()
    student_format = (student.get('preferred_response_format') or 'text').lower()
    student_lang = (student.get('preferred_language') or 'en').lower()
    student_class = str(student.get('class') or '10')
    student_disability = (student.get('disability_type') or 'none').lower()

    res_access = (resource.get('access_requirement') or 'offline_friendly').lower()
    is_downloadable = bool(resource.get('is_downloadable', 0))
    res_format = (resource.get('format') or 'text').lower()
    res_lang = (resource.get('language') or 'en').lower()
    res_class = str(resource.get('class') or 'All')
    size_mb = float(resource.get('estimated_size_mb') or 1.0)
    res_type = resource.get('resource_type', 'document')

    score = 0
    reasons = []
    connectivity_status = 'acceptable'

    # 1. Connectivity Scoring (Weight: 40 points)
    if student_net in ('none', 'offline'):
        if res_access == 'offline_friendly' and is_downloadable:
            score += 40
            connectivity_status = 'optimal'
            reasons.append("Fully downloadable for 100% offline study without requiring an active internet connection.")
        elif res_access == 'offline_friendly':
            score += 25
            connectivity_status = 'acceptable'
            reasons.append("Offline-friendly content with zero streaming requirements.")
        elif res_access == 'low_bandwidth':
            score += 15
            connectivity_status = 'requires_internet'
            reasons.append("Requires minimal data connection to download initially.")
        else: # high_speed
            score += 0
            connectivity_status = 'not_recommended'
            reasons.append("Requires high-speed streaming which is not supported by your offline profile. Wi-Fi or lab access required.")
    elif student_net == 'intermittent':
        if res_access in ('offline_friendly', 'low_bandwidth'):
            score += 40
            connectivity_status = 'optimal'
            reasons.append("Optimized for intermittent connectivity with low data usage and offline caching support.")
        elif is_downloadable:
            score += 30
            connectivity_status = 'acceptable'
            reasons.append("Can be pre-downloaded during periods of active connectivity.")
        else:
            score += 15
            connectivity_status = 'acceptable'
            reasons.append("May buffer on unstable connections. Downloadable or text alternatives recommended.")
    else: # full internet
        score += 35
        connectivity_status = 'optimal'
        if res_access == 'high_speed':
            score += 5
            reasons.append("Takes full advantage of your high-speed internet connection.")
        else:
            reasons.append("Fully accessible via your active internet connection.")

    # 2. Format & Accessibility Matching (Weight: 30 points)
    format_match = False
    if res_format == student_format:
        score += 30
        format_match = True
        if student_disability in ('visual', 'blindness', 'low_vision') and res_format == 'audio':
            reasons.append("Matches your preferred audio format. Highly accessible for screen-reader and auditory learning.")
        elif student_disability in ('hearing', 'deaf', 'hard_of_hearing') and res_format in ('visual', 'text'):
            reasons.append(f"Matches your preferred format ({student_format.capitalize()}). Captioned presentation accommodates hearing preferences.")
        else:
            reasons.append(f"Matches your preferred learning format ({student_format.capitalize()}).")
    elif student_disability in ('visual', 'blindness', 'low_vision') and res_format == 'audio':
        score += 30
        format_match = True
        reasons.append("Audio-narrated format is highly accessible for screen-reader and auditory learning.")
    elif student_disability in ('hearing', 'deaf', 'hard_of_hearing') and res_format in ('visual', 'text'):
        score += 30
        format_match = True
        reasons.append("Visual / text presentation with captions accommodates hearing preferences.")
    elif res_format == 'interactive' and student_format in ('visual', 'text'):
        score += 20
        reasons.append("Interactive hands-on learning format provides engaging visual feedback.")
    elif res_format in ('text', 'visual'):
        score += 15
        reasons.append("Standard readable content.")
    else:
        score += 10

    # 3. Class & Syllabus Alignment (Weight: 15 points)
    clean_st_class = student_class.replace('Class ', '').strip()
    clean_res_class = res_class.replace('Class ', '').strip()
    if res_class == 'All' or res_class == student_class or clean_res_class == clean_st_class:
        score += 15
        reasons.append(f"Aligned with Class {clean_st_class} curriculum.")
    else:
        score += 5

    # 4. Language Alignment (Weight: 15 points)
    if res_lang == student_lang:
        score += 15
        reasons.append(f"Available in your preferred language ({'Hindi' if res_lang == 'hi' else 'English'}).")
    elif res_lang == 'en':
        score += 10
    else:
        score += 5

    # Size & Device Analysis
    if size_mb < 2.0:
        size_note = f"Lightweight ({size_mb} MB) — minimal storage and data impact."
    elif size_mb <= 15.0:
        size_note = f"Moderate size ({size_mb} MB) — suitable for mobile storage."
    else:
        size_note = f"Heavy media ({size_mb} MB) — Wi-Fi download recommended."

    if student_device in ('shared_smartphone', 'none') and size_mb > 25.0:
        reasons.append("Note: Large file size may require device storage management.")

    # Cap score between 0 and 100
    suitability_score = min(100, max(0, score))
    is_suitable = suitability_score >= 50

    explanation = " ".join(reasons)

    return {
        "suitability_score": suitability_score,
        "is_suitable": is_suitable,
        "explanation": explanation,
        "connectivity_status": connectivity_status,
        "format_match": format_match,
        "size_note": size_note
    }


def recommend_resources(student_profile, resources_list, filter_format=None, filter_connectivity=None, search_query=None):
    """
    Enrich and rank resources for a student profile.
    
    Args:
        student_profile: dict with student profile information
        resources_list: list of resource dicts from database
        filter_format: optional format filter ('text', 'visual', 'audio', 'interactive')
        filter_connectivity: optional connectivity filter ('offline_friendly', 'low_bandwidth', 'high_speed')
        search_query: optional text search
        
    Returns:
        list of enriched and ranked resource dicts
    """
    enriched = []
    
    for res in resources_list:
        res_dict = dict(res)
        
        # Apply filters
        if filter_format and res_dict.get('format', '').lower() != filter_format.lower():
            continue
        if filter_connectivity and res_dict.get('access_requirement', '').lower() != filter_connectivity.lower():
            continue
        if search_query:
            query = search_query.lower()
            title = (res_dict.get('title') or '').lower()
            desc = (res_dict.get('description') or '').lower()
            if query not in title and query not in desc:
                continue

        eval_result = evaluate_resource_suitability(student_profile, res_dict)
        res_dict.update(eval_result)
        enriched.append(res_dict)

    # Sort descending by suitability_score, then downloadable first for offline students
    student_net = (student_profile.get('internet_access') or 'full').lower()
    if student_net in ('none', 'offline', 'intermittent'):
        enriched.sort(key=lambda x: (x['suitability_score'], x.get('is_downloadable', 0)), reverse=True)
    else:
        enriched.sort(key=lambda x: x['suitability_score'], reverse=True)

    return enriched


def generate_resource_voice_summary(student_profile, recommended_resources):
    """
    Generate screen-reader and voice agent speech summary for resources.
    """
    total = len(recommended_resources)
    if total == 0:
        return "No learning resources match your current filter criteria."

    net_access = (student_profile.get('internet_access') or 'full').lower()
    downloadable_count = sum(1 for r in recommended_resources if r.get('is_downloadable'))
    top_3 = recommended_resources[:3]
    top_titles = ", ".join([f"'{r.get('title')}'" for r in top_3])

    if net_access in ('none', 'offline'):
        spoken = (
            f"You have {total} resources available. With your offline profile, "
            f"{downloadable_count} resources are ready for offline study. Top recommendations include: {top_titles}. "
            f"Say 'Read this resource' or select a resource to view its details."
        )
    elif net_access == 'intermittent':
        spoken = (
            f"Found {total} learning resources. {downloadable_count} can be pre-downloaded for low-bandwidth access. "
            f"Top picks: {top_titles}. Say 'Read this resource' to hear the study notes."
        )
    else:
        spoken = (
            f"Showing {total} recommended resources tailored to your Class {student_profile.get('class', '10')} syllabus. "
            f"Featured resources: {top_titles}. Say 'Read this resource' or 'Open this resource' to begin."
        )

    return spoken


def generate_career_voice_summary(student_profile, career_role, roadmap_steps):
    """
    Generate natural spoken text summarizing career guidance and 4-stage roadmap.
    """
    if not career_role:
        return "Career guidance is not yet configured for your profile. Please select a career field to view the roadmap."

    role_title = career_role.get('title', 'Target Role')
    related = career_role.get('related_roles', '')
    steps = sorted(roadmap_steps, key=lambda s: s.get('stage_order', 1))

    stages_summary = []
    for s in steps:
        stages_summary.append(f"Stage {s.get('stage_order', 1)}: {s.get('title')}")

    stages_text = ". ".join(stages_summary)

    spoken = (
        f"Career guidance for {role_title}. "
        f"This career path includes four sequential stages: {stages_text}. "
        f"Say 'Read the next step' or 'Read the roadmap' to hear step-by-step details."
    )
    return spoken
