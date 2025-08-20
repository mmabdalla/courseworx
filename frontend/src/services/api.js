import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
  importUsers: (data) => api.post('users/import', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
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
  uploadCourseImage: (courseName, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/courses/${courseName}/image`, formData, {
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
    const formData = new FormData();
    formData.append('file', file);
    if (contentId) formData.append('contentId', contentId);
    return api.post(`/course-content/${courseId}/content/${contentType}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  addQuizQuestions: (courseId, contentId, questions) => 
    api.post(`/course-content/${courseId}/content/${contentId}/questions`, { questions }),
  submitQuiz: (courseId, contentId, data) => 
    api.post(`/course-content/${courseId}/content/${contentId}/submit`, data),
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
  getAvailableTrainees: (params) => api.get('/enrollments/available-trainees', { params }).then(res => res.data)
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

export default api; 