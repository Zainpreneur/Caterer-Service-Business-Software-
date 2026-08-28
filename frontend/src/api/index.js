import client from './client';

// ---- Auth ----
export const authApi = {
  login: (data) => client.post('/auth/login', data),
  register: (data) => client.post('/auth/register', data),
  me: () => client.get('/auth/me'),
};

// ---- Customers ----
export const customerApi = {
  list: (params) => client.get('/customers', { params }),
  get: (id) => client.get(`/customers/${id}`),
  create: (data) => client.post('/customers', data),
  update: (id, data) => client.put(`/customers/${id}`, data),
  remove: (id) => client.delete(`/customers/${id}`),
};

// ---- Menu ----
export const menuApi = {
  listCategories: () => client.get('/menu/categories'),
  createCategory: (data) => client.post('/menu/categories', data),
  updateCategory: (id, data) => client.put(`/menu/categories/${id}`, data),
  removeCategory: (id) => client.delete(`/menu/categories/${id}`),

  listItems: (params) => client.get('/menu/items', { params }),
  getItem: (id) => client.get(`/menu/items/${id}`),
  createItem: (data) => client.post('/menu/items', data),
  updateItem: (id, data) => client.put(`/menu/items/${id}`, data),
  removeItem: (id) => client.delete(`/menu/items/${id}`),
};

// ---- Events ----
export const eventApi = {
  list: (params) => client.get('/events', { params }),
  get: (id) => client.get(`/events/${id}`),
  create: (data) => client.post('/events', data),
  update: (id, data) => client.put(`/events/${id}`, data),
  remove: (id) => client.delete(`/events/${id}`),
  assignStaff: (id, data) => client.post(`/events/${id}/staff`, data),
  removeStaff: (id, staffId) => client.delete(`/events/${id}/staff/${staffId}`),
};

// ---- Staff ----
export const staffApi = {
  list: () => client.get('/staff'),
  get: (id) => client.get(`/staff/${id}`),
  create: (data) => client.post('/staff', data),
  update: (id, data) => client.put(`/staff/${id}`, data),
  remove: (id) => client.delete(`/staff/${id}`),
};

// ---- Inventory ----
export const inventoryApi = {
  list: (params) => client.get('/inventory', { params }),
  get: (id) => client.get(`/inventory/${id}`),
  create: (data) => client.post('/inventory', data),
  update: (id, data) => client.put(`/inventory/${id}`, data),
  remove: (id) => client.delete(`/inventory/${id}`),
  addTransaction: (id, data) => client.post(`/inventory/${id}/transactions`, data),
};

// ---- Invoices ----
export const invoiceApi = {
  list: (params) => client.get('/invoices', { params }),
  get: (id) => client.get(`/invoices/${id}`),
  createFromEvent: (data) => client.post('/invoices', data),
  update: (id, data) => client.put(`/invoices/${id}`, data),
  remove: (id) => client.delete(`/invoices/${id}`),
  addPayment: (id, data) => client.post(`/invoices/${id}/payments`, data),
  removePayment: (id, paymentId) => client.delete(`/invoices/${id}/payments/${paymentId}`),
};

// ---- Dashboard ----
export const dashboardApi = {
  summary: () => client.get('/dashboard/summary'),
};
