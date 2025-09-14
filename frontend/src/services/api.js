import axios from 'axios';

// Function to dynamically determine API base URL
const getApiBaseUrl = () => {
  // Get the current hostname
  const { hostname } = window.location;
  
  // If we're on localhost, use localhost for backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // If we're on a network IP (like 10.0.0.96), use the same IP for backend
  // Extract the IP address from the current location
  const networkIP = hostname;
  return `http://${networkIP}:5000/api`;
};

// Create axios instance with dynamic base URL
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Log the API base URL for debugging
console.log('API Base URL:', getApiBaseUrl());
console.log('Current location:', window.location.href);
console.log('Hostname:', window.location.hostname);

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    console.log('📡 Full URL:', config.baseURL + config.url);
    console.log('📋 Request data:', config.data);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.statusText);
    console.error('❌ Error details:', error.response?.data);
    console.error('❌ Request URL:', error.config?.url);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (identifier, password) => api.post('/auth/login', { identifier, password }),
  traineeLogin: (credentials) => api.post('/auth/trainee-login', credentials),
  checkEnrollment: () => api.post('/auth/check-enrollment'),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyToken: () => api.get('/auth/verify'),
  setupStatus: () => api.get('/auth/setup-status'),
  setup: (userData) => api.post('/auth/setup', userData)
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('users', { params }),
  getById: (id) => api.get(`users/${id}`),
  update: (id, data) => api.put(`users/${id}`, data),
  delete: (id) => api.delete(`users/${id}`),
  changePassword: (id, password) => api.put(`users/${id}/password`, { password }),
  getStats: () => api.get('users/stats/overview'),
  importUsers: (data) => {
    const formData = new FormData();
    if (data instanceof FormData) {
      // If data is already FormData, use it directly
      return api.post('users/import', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // If data is an object, convert to FormData
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      return api.post('users/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
  },
  uploadSliderImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('users/slider/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Courses API
export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }).then(res => res.data),
  getById: (id) => api.get(`/courses/${id}`).then(res => res.data),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  publish: (id, isPublished) => api.put(`/courses/${id}/publish`, { isPublished }),
  assignTrainer: (id, trainerId) => api.put(`/courses/${id}/assign-trainer`, { trainerId }),
  getAvailableTrainers: () => api.get('/courses/trainers/available').then(res => res.data),
  getCategories: () => api.get('/courses/categories/all'),
  getStats: () => api.get('/courses/stats/overview'),
  // New trainer-specific endpoints
  getTrainerCourses: (trainerId, params) => api.get(`/courses/trainer/${trainerId}`, { params }).then(res => res.data),
  uploadCourseImage: (courseName, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/courses/${courseName}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadCourseThumbnail: (courseId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/courses/${courseId}/thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Course Content API
export const courseContentAPI = {
  getAll: (courseId, params) => api.get(`/course-content/${courseId}/content`, { params }).then(res => res.data),
  getById: (courseId, contentId) => api.get(`/course-content/${courseId}/content/${contentId}`).then(res => res.data),
  create: (courseId, data) => api.post(`/course-content/${courseId}/content`, data),
  update: (courseId, contentId, data) => api.put(`/course-content/${courseId}/content/${contentId}`, data),
  delete: (courseId, contentId) => api.delete(`/course-content/${courseId}/content/${contentId}`),
  uploadFile: (courseId, contentType, file, contentId = null) => {
    console.log('🚀 API uploadFile called with:', {
      courseId,
      contentType,
      fileName: file.name,
      fileSize: file.size,
      contentId
    });
    
    const formData = new FormData();
    formData.append('file', file);
    if (contentId) {
      formData.append('contentId', contentId);
      console.log('✅ contentId added to formData:', contentId);
    } else {
      console.log('⚠️ No contentId provided to uploadFile');
    }
    
    return api.post(`/course-content/${courseId}/content/${contentType}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  addQuizQuestions: (courseId, contentId, questions) => 
    api.post(`/course-content/${courseId}/content/${contentId}/questions`, { questions }),
  submitQuiz: (courseId, contentId, data) => 
    api.post(`/course-content/${courseId}/content/${contentId}/submit`, data),
};

// Course Sections API
export const courseSectionAPI = {
  getAll: (courseId) => api.get(`/course-sections/${courseId}`).then(res => res.data),
  create: (courseId, data) => api.post(`/course-sections/${courseId}`, data),
  update: (sectionId, data) => api.put(`/course-sections/${sectionId}`, data),
  delete: (sectionId) => api.delete(`/course-sections/${sectionId}`),
  reorder: (sectionId, newOrder) => api.put(`/course-sections/${sectionId}/reorder`, { newOrder }),
};

// Enrollments API
export const enrollmentsAPI = {
  getAll: (params) => api.get('/enrollments', { params }).then(res => res.data),
  getMy: (params) => api.get('/enrollments/my', { params }).then(res => res.data),
  getById: (id) => api.get(`/enrollments/${id}`).then(res => res.data),
  create: (data) => api.post('/enrollments', data),
  update: (id, data) => api.put(`/enrollments/${id}`, data),
  delete: (id) => api.delete(`/enrollments/${id}`),
  updateStatus: (id, status, notes) => api.put(`/enrollments/${id}/status`, { status, notes }),
  getStats: () => api.get('/enrollments/stats/overview'),
  // New enrollment management endpoints
  bulkEnroll: (data) => api.post('/enrollments/bulk', data),
  assignTrainee: (data) => api.post('/enrollments/assign', data),
  getCourseTrainees: (courseId, params) => api.get(`/enrollments/course/${courseId}/trainees`, { params }).then(res => res.data),
  getAvailableTrainees: (params) => api.get('/enrollments/available-trainees', { params }).then(res => res.data),
  // New trainer-specific endpoints
  getTrainerEnrollments: (trainerId, params) => api.get(`/enrollments/trainer/${trainerId}`, { params }).then(res => res.data),
  // Enrollment management endpoints
  removeEnrollment: (enrollmentId) => api.delete(`/enrollments/${enrollmentId}`).then(res => res.data),
  bulkRemoveEnrollments: (enrollmentIds) => api.delete('/enrollments/bulk/remove', { data: { enrollmentIds } }).then(res => res.data),
  // Trainee details
  getTraineeDetails: (courseId, traineeId) => api.get(`/enrollments/course/${courseId}/trainee/${traineeId}`).then(res => res.data),
};

// Attendance API
export const attendanceAPI = {
  signIn: (data) => api.post('/attendance/sign-in', data),
  signOut: (data) => api.post('/attendance/sign-out', data),
  getMy: (params) => api.get('/attendance/my', { params }),
  getByCourse: (courseId, params) => api.get(`/attendance/course/${courseId}`, { params }),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  getStats: (params) => api.get('/attendance/stats/my', { params }),
};

// Assignments API
export const assignmentsAPI = {
  create: (data) => api.post('/assignments', data),
  getByCourse: (courseId, params) => api.get(`/assignments/course/${courseId}`, { params }),
  getById: (id) => api.get(`/assignments/${id}`),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
  publish: (id, isPublished) => api.put(`/assignments/${id}/publish`, { isPublished }),
  getMy: (params) => api.get('/assignments/my', { params }),
};

// Lesson Completion API
export const lessonCompletionAPI = {
  getProgress: (courseId) => api.get(`/lesson-completion/${courseId}/progress`).then(res => res.data),
  getLessonProgress: (courseId, contentId) => api.get(`/lesson-completion/${courseId}/${contentId}`).then(res => res.data),
  updateProgress: (courseId, contentId, data) => api.post(`/lesson-completion/${courseId}/${contentId}`, data).then(res => res.data),
};

// Course Statistics API
export const courseStatsAPI = {
  getByCourseId: (courseId) => api.get(`/course-stats/${courseId}`),
  update: (courseId, data) => api.put(`/course-stats/${courseId}`, data),
  create: (courseId, data) => api.post(`/course-stats/${courseId}`, data)
};

// User Notes API
export const userNotesAPI = {
  getByCourseId: (courseId, userId = null) => {
    const params = userId ? { userId } : {};
    return api.get(`/user-notes/${courseId}`, { params });
  },
  getByContentId: (courseId, contentId, userId = null) => {
    const params = userId ? { userId } : {};
    return api.get(`/user-notes/${courseId}/content/${contentId}`, { params });
  },
  create: (courseId, data) => api.post(`/user-notes/${courseId}`, data),
  update: (noteId, data) => api.put(`/user-notes/${noteId}`, data),
  delete: (noteId) => api.delete(`/user-notes/${noteId}`),
  // Trainee notes
  getTraineeNotes: (courseId, traineeId) => api.get(`/trainee-notes/${courseId}/${traineeId}`).then(res => res.data),
};

// Trainee Progress API
export const traineeProgressAPI = {
  getTraineeProgress: (courseId, traineeId) => api.get(`/trainee-progress/${courseId}/${traineeId}`).then(res => res.data),
};

// Trainee Attendance API
export const traineeAttendanceAPI = {
  getTraineeAttendance: (courseId, traineeId) => api.get(`/trainee-attendance/${courseId}/${traineeId}`).then(res => res.data),
};

// Trainee Assignments API
export const traineeAssignmentsAPI = {
  getTraineeAssignments: (courseId, traineeId) => api.get(`/trainee-assignments/${courseId}/${traineeId}`).then(res => res.data),
};

export default api; 