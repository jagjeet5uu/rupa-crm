import axios from 'axios';
import { API_BASE } from '../constants';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken: refresh });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Users
export const userApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, password) => api.put(`/users/${id}/reset-password`, { password }),
  roles: () => api.get('/users/roles'),
};

// Clients
export const clientApi = {
  list: (params) => api.get('/clients', { params }),
  get: (id) => api.get(`/clients/${id}`),
  profile: (id) => api.get(`/clients/${id}/profile`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  export: (params) => api.get('/clients/export', { params, responseType: 'blob' }),
  import: (formData) => api.post('/clients/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Visits
export const visitApi = {
  list: (params) => api.get('/visits', { params }),
  get: (id) => api.get(`/visits/${id}`),
  create: (data) => api.post('/visits', data),
  update: (id, data) => api.put(`/visits/${id}`, data),
  approve: (id, data) => api.patch(`/visits/${id}/approve`, data),
  upload: (id, formData) => api.post(`/visits/${id}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  export: (params) => api.get('/visits/export', { params, responseType: 'blob' }),
};

// Follow-ups
export const followupApi = {
  list: (params) => api.get('/followups', { params }),
  today: () => api.get('/followups/today'),
  overdue: () => api.get('/followups/overdue'),
  create: (data) => api.post('/followups', data),
  update: (id, data) => api.put(`/followups/${id}`, data),
  complete: (id, notes) => api.patch(`/followups/${id}/complete`, { completion_notes: notes }),
};

// Opportunities
export const opportunityApi = {
  list: (params) => api.get('/opportunities', { params }),
  get: (id) => api.get(`/opportunities/${id}`),
  create: (data) => api.post('/opportunities', data),
  update: (id, data) => api.put(`/opportunities/${id}`, data),
  changeStage: (id, data) => api.patch(`/opportunities/${id}/stage`, data),
  addComment: (id, comment) => api.post(`/opportunities/${id}/comments`, { comment }),
  pipeline: (params) => api.get('/opportunities/pipeline', { params }),
};

// Master data
export const masterApi = {
  brands: (params) => api.get('/master/brands', { params }),
  createBrand: (data) => api.post('/master/brands', data),
  updateBrand: (id, data) => api.put(`/master/brands/${id}`, data),
  categories: (params) => api.get('/master/categories', { params }),
  createCategory: (data) => api.post('/master/categories', data),
  updateCategory: (id, data) => api.put(`/master/categories/${id}`, data),
  products: (params) => api.get('/master/products', { params }),
  createProduct: (data) => api.post('/master/products', data),
};

// Quotations
export const quotationApi = {
  list: (params) => api.get('/quotations', { params }),
  create: (formData) => api.post('/quotations', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/quotations/${id}`, data),
};

// Purchase Orders
export const poApi = {
  list: (params) => api.get('/purchase-orders', { params }),
  create: (formData) => api.post('/purchase-orders', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateStatus: (id, status) => api.patch(`/purchase-orders/${id}/status`, { order_status: status }),
};

// Billing
export const billingApi = {
  imports: () => api.get('/billing/imports'),
  import: (formData) => api.post('/billing/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  unmatched: () => api.get('/billing/unmatched'),
  map: (id, data) => api.patch(`/billing/records/${id}/map`, data),
};

// Dashboard
export const dashboardApi = { get: () => api.get('/dashboard') };

// Reports
export const reportApi = {
  visits: (params) => api.get('/reports/visits', { params }),
  opportunities: (params) => api.get('/reports/opportunities', { params }),
  followups: (params) => api.get('/reports/followups', { params }),
  billing: (params) => api.get('/reports/billing', { params }),
  brand: (params) => api.get('/reports/brand', { params }),
  mom: (params) => api.get('/reports/mom', { params }),
  products: (params) => api.get('/reports/products', { params }),
  export: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
};

// Notifications
export const notificationApi = {
  list: () => api.get('/notifications'),
  read: (id) => api.patch(`/notifications/${id}/read`),
  readAll: () => api.patch('/notifications/read-all'),
};
