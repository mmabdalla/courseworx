import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
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
  login: (email, password) => api.post('/auth/login', { email, password }),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (currentPassword, newPassword) => 
    api.put('/auth/change-password', { currentPassword, newPassword }),
  firstPasswordChange: (data) => api.put('/auth/first-password-change', data),
  register: (userData) => api.post('/auth/register', userData),
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

// Enrollments API
export const enrollmentsAPI = {
  create: (data) => api.post('/enrollments', data),
  getMy: (params) => api.get('/enrollments/my', { params }),
  getById: (id) => api.get(`/enrollments/${id}`),
  updateStatus: (id, data) => api.put(`/enrollments/${id}/status`, data),
  updatePayment: (id, data) => api.put(`/enrollments/${id}/payment`, data),
  cancel: (id) => api.delete(`/enrollments/${id}`),
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