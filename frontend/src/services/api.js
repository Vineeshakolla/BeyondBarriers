/**
 * Beyond Barriers - Frontend API Service Layer
 * Centralized communication layer connecting React frontend to Flask REST API.
 * Includes token-based authentication header injection and error handling.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export function getStoredToken() {
  return localStorage.getItem('bb_auth_token') || '';
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('bb_auth_token', token);
  } else {
    localStorage.removeItem('bb_auth_token');
  }
}

/**
 * Generic request helper with error handling and Authorization header injection
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getStoredToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data.error || `HTTP error ${response.status}`,
        data
      };
    }

    return {
      ok: true,
      status: response.status,
      data,
      error: null
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err.message || 'Failed to connect to backend server',
      data: null
    };
  }
}

// Health check service
export async function getHealthStatus() {
  return await request('/health');
}

// Authentication API Services
export async function apiRegister(name, username, password, role = 'student') {
  return await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, username, password, role })
  });
}

export async function apiLogin(username, password) {
  return await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function apiLogout() {
  return await request('/auth/logout', {
    method: 'POST'
  });
}

export async function apiGetMe() {
  return await request('/auth/me', {
    method: 'GET'
  });
}

// Security & RBAC Test Endpoints
export async function apiTestRole(role) {
  return await request(`/auth/test/${role}`, { method: 'GET' });
}

export async function apiTestStudentScope(studentId) {
  return await request(`/auth/test/student-data/${studentId}`, { method: 'GET' });
}

export async function apiTestMentorScope(rollNumber) {
  return await request(`/auth/test/mentor-student/${rollNumber}`, { method: 'GET' });
}

export async function apiTestParentScope(studentId) {
  return await request(`/auth/test/parent-child/${studentId}`, { method: 'GET' });
}

export async function apiTestAdminPrivacy() {
  return await request('/auth/test/admin-private-data', { method: 'GET' });
}

// Student Profile & Onboarding APIs (Step 4)
export async function apiGetProfile() {
  return await request('/student/profile', { method: 'GET' });
}

export async function apiUpdateProfile(profileData) {
  return await request('/student/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
}

export async function apiGetProfileOptions() {
  return await request('/student/options', { method: 'GET' });
}

export async function apiGetSubjects(studentClass, studentStream) {
  const params = new URLSearchParams();
  if (studentClass) params.append('class', studentClass);
  if (studentStream) params.append('stream', studentStream);
  return await request(`/student/subjects?${params.toString()}`, { method: 'GET' });
}

// Student Learning, Modules & Tests APIs (Step 5)
export async function apiGetLearningSubjects() {
  return await request('/student/learning/subjects', { method: 'GET' });
}

export async function apiGetSubjectModules(subjectId) {
  return await request(`/student/learning/subjects/${subjectId}/modules`, { method: 'GET' });
}

export async function apiGetModuleContent(moduleId) {
  return await request(`/student/learning/modules/${moduleId}`, { method: 'GET' });
}

export async function apiGetAILessonPlan(moduleId) {
  return await request(`/student/learning/modules/${moduleId}/lesson-plan`, { method: 'GET' });
}

export async function apiGetModuleTest(moduleId) {
  return await request(`/student/learning/modules/${moduleId}/test`, { method: 'GET' });
}

export async function apiSubmitTestAttempt(testId, answers) {
  return await request(`/student/learning/tests/${testId}/attempt`, {
    method: 'POST',
    body: JSON.stringify({ answers })
  });
}

export async function apiGetModuleAttempts(moduleId) {
  return await request(`/student/learning/modules/${moduleId}/attempts`, { method: 'GET' });
}

export async function apiAskModuleDoubt(moduleId, question, history = []) {
  return await request(`/student/learning/modules/${moduleId}/doubt`, {
    method: 'POST',
    body: JSON.stringify({ question, history })
  });
}

export async function apiGetLearningProgress() {
  return await request('/student/learning/progress', { method: 'GET' });
}

// Student Attendance, Scholarships, Career & Accessibility APIs (Step 6)
export async function apiGetAttendance() {
  return await request('/student/attendance', { method: 'GET' });
}

export async function apiGetScholarships() {
  return await request('/student/scholarships', { method: 'GET' });
}

export async function apiGetScholarshipDetail(id) {
  return await request(`/student/scholarships/${id}`, { method: 'GET' });
}

// Administrator Scholarship Management APIs (Step 8)
export async function apiGetAdminScholarships() {
  return await request('/admin/scholarships', { method: 'GET' });
}

export async function apiCreateAdminScholarship(data) {
  return await request('/admin/scholarships', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiGetAdminScholarshipDetail(id) {
  return await request(`/admin/scholarships/${id}`, { method: 'GET' });
}

export async function apiUpdateAdminScholarship(id, data) {
  return await request(`/admin/scholarships/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function apiToggleScholarshipStatus(id, isActive) {
  return await request(`/admin/scholarships/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive })
  });
}

export async function apiDeleteAdminScholarship(id) {
  return await request(`/admin/scholarships/${id}`, { method: 'DELETE' });
}

export async function apiGetCareer(roleId = null) {
  const query = roleId ? `?role_id=${roleId}` : '';
  return await request(`/student/career${query}`, { method: 'GET' });
}

export async function apiGetCareerFields() {
  return await request('/student/career/fields', { method: 'GET' });
}

export async function apiGetCareerRoleDetail(roleId) {
  return await request(`/student/career/roles/${roleId}`, { method: 'GET' });
}

export async function apiGetAccessibility() {
  return await request('/student/accessibility', { method: 'GET' });
}

export async function apiUpdateAccessibility(data) {
  return await request('/student/accessibility', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function apiGetResources(params = {}) {
  const query = new URLSearchParams();
  if (params.format) query.append('format', params.format);
  if (params.connectivity) query.append('connectivity', params.connectivity);
  if (params.downloadable) query.append('downloadable', params.downloadable);
  if (params.search) query.append('search', params.search);
  const qStr = query.toString();
  return await request(`/student/resources${qStr ? '?' + qStr : ''}`, { method: 'GET' });
}

export async function apiGetResourceDetail(id) {
  return await request(`/student/resources/${id}`, { method: 'GET' });
}

export async function apiGetRecommendedResources() {
  return await request('/student/resources/recommended', { method: 'GET' });
}

export async function apiGetSupportPriority() {
  return await request('/student/support-priority', { method: 'GET' });
}

export async function apiGetAcademicSummary() {
  return await request('/student/academic-summary', { method: 'GET' });
}

export async function apiGetMentorStudentsPriority() {
  return await request('/mentor/students-priority', { method: 'GET' });
}

export async function apiGetMentorStudentAcademicSupport(studentId) {
  return await request(`/mentor/student/${studentId}/academic-support`, { method: 'GET' });
}

// STEP 10: MENTOR DASHBOARD APIS
export async function apiGetMentorDashboard() {
  return await request('/mentor/dashboard', { method: 'GET' });
}

export async function apiGetMentorStudents() {
  return await request('/mentor/students', { method: 'GET' });
}

export async function apiGetMentorStudentDetail(studentId) {
  return await request(`/mentor/students/${studentId}`, { method: 'GET' });
}

export async function apiGetMentorStudentNotes(studentId) {
  return await request(`/mentor/students/${studentId}/notes`, { method: 'GET' });
}

export async function apiCreateMentorNote(studentId, noteData) {
  return await request(`/mentor/students/${studentId}/notes`, {
    method: 'POST',
    body: JSON.stringify(noteData)
  });
}

export async function apiUpdateMentorNote(noteId, noteData) {
  return await request(`/mentor/notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify(noteData)
  });
}

// STEP 10: PARENT DASHBOARD APIS
export async function apiGetParentDashboard() {
  return await request('/parent/dashboard', { method: 'GET' });
}

export async function apiGetParentChild() {
  return await request('/parent/child', { method: 'GET' });
}

export async function apiGetParentChildAttendance() {
  return await request('/parent/child/attendance', { method: 'GET' });
}

export async function apiGetParentChildMarks() {
  return await request('/parent/child/marks', { method: 'GET' });
}

export async function apiGetParentChildProgress() {
  return await request('/parent/child/progress', { method: 'GET' });
}

export async function apiGetParentChildSupport() {
  return await request('/parent/child/support', { method: 'GET' });
}

export async function apiGetParentChildSharedNotes() {
  return await request('/parent/child/shared-notes', { method: 'GET' });
}

// STEP 10: ADMIN DASHBOARD APIS
export async function apiGetAdminDashboard() {
  return await request('/admin/dashboard', { method: 'GET' });
}

export async function apiGetStudentRecommendations() {
  return request('/student/recommendations');
}

export default {
  getStoredToken,
  setStoredToken,
  getHealthStatus,
  apiRegister,
  apiLogin,
  apiLogout,
  apiGetMe,
  apiTestRole,
  apiTestStudentScope,
  apiTestMentorScope,
  apiTestParentScope,
  apiTestAdminPrivacy,
  apiGetProfile,
  apiUpdateProfile,
  apiGetProfileOptions,
  apiGetSubjects,
  apiGetLearningSubjects,
  apiGetSubjectModules,
  apiGetModuleContent,
  apiGetModuleTest,
  apiSubmitTestAttempt,
  apiGetModuleAttempts,
  apiGetLearningProgress,
  apiGetAttendance,
  apiGetScholarships,
  apiGetScholarshipDetail,
  apiGetAdminScholarships,
  apiCreateAdminScholarship,
  apiGetAdminScholarshipDetail,
  apiUpdateAdminScholarship,
  apiToggleScholarshipStatus,
  apiDeleteAdminScholarship,
  apiGetCareer,
  apiGetCareerFields,
  apiGetCareerRoleDetail,
  apiGetAccessibility,
  apiUpdateAccessibility,
  apiGetResources,
  apiGetResourceDetail,
  apiGetRecommendedResources,
  apiGetSupportPriority,
  apiGetAcademicSummary,
  apiGetStudentRecommendations,
  apiGetMentorStudentsPriority,
  apiGetMentorStudentAcademicSupport,
  apiGetMentorDashboard,
  apiGetMentorStudents,
  apiGetMentorStudentDetail,
  apiGetMentorStudentNotes,
  apiCreateMentorNote,
  apiUpdateMentorNote,
  apiGetParentDashboard,
  apiGetParentChild,
  apiGetParentChildAttendance,
  apiGetParentChildMarks,
  apiGetParentChildProgress,
  apiGetParentChildSupport,
  apiGetParentChildSharedNotes,
  apiGetAdminDashboard,
  request
};
