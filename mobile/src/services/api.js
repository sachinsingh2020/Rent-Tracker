import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
export const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (isWeb ? 'http://localhost:5000/api' : 'http://192.168.1.55:5000/api');

let currentApiUrl = DEFAULT_API_URL;
let authToken = null;

export const setApiUrl = (url) => {
  currentApiUrl = (url || DEFAULT_API_URL).replace(/\/$/, '');
};

export const getApiUrl = () => currentApiUrl;

export const setAuthToken = (token) => {
  authToken = token;
};

const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${currentApiUrl}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Server request failed');
  }
  return data;
};

export const api = {
  // Auth
  sendOtp: (email) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtp: (payload) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  googleAuth: (googleData) => request('/auth/google', { method: 'POST', body: JSON.stringify(googleData) }),

  // Rooms
  getRooms: () => request('/rooms'),
  createRoom: (data) => request('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  deleteRoom: (id) => request(`/rooms/${id}`, { method: 'DELETE' }),

  // Tenants
  getTenants: () => request('/tenants'),
  getTenantById: (id) => request(`/tenants/${id}`),
  createTenant: (data) => request('/tenants', { method: 'POST', body: JSON.stringify(data) }),
  vacateTenant: (id) => request(`/tenants/${id}/vacate`, { method: 'POST' }),

  // Bills
  createBill: (data) => request('/bills', { method: 'POST', body: JSON.stringify(data) }),
  updatePaymentStatus: (id, data) => request(`/bills/${id}/payment`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Cloudinary upload
  uploadPhoto: async (uri) => {
    const formData = new FormData();
    formData.append('photo', {
      uri,
      type: 'image/jpeg',
      name: `meter_${Date.now()}.jpg`,
    });

    const res = await fetch(`${currentApiUrl}/upload`, {
      method: 'POST',
      body: formData,
    });
    return await res.json();
  },

  // Bulk Sync offline data to MongoDB
  syncOfflineData: (payload) => request('/sync', { method: 'POST', body: JSON.stringify(payload) }),
};
