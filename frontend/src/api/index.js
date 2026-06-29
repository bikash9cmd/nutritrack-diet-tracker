const BASE_URL = 'http://localhost:8000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }
  if (res.status === 204) return null;
  return res.json();
}

// Auth
export const auth = {
  register: (data) => request('/auth/register/', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login/', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/auth/logout/', { method: 'POST' }),
  profile: () => request('/auth/profile/'),
  updateProfile: (data) => request('/auth/profile/', { method: 'PATCH', body: JSON.stringify(data) }),
};

// Diet
export const diet = {
  searchFoods: (q) => request(`/diet/foods/?search=${encodeURIComponent(q)}`),
  addFood: (data) => request('/diet/foods/', { method: 'POST', body: JSON.stringify(data) }),
  getLogs: (date, meal_type) => {
    let url = `/diet/logs/?date=${date}`;
    if (meal_type) url += `&meal_type=${meal_type}`;
    return request(url);
  },
  addLog: (data) => request('/diet/logs/', { method: 'POST', body: JSON.stringify(data) }),
  deleteLog: (id) => request(`/diet/logs/${id}/`, { method: 'DELETE' }),
  getDailySummary: (date) => request(`/diet/summary/?date=${date}`),
  getWeekly: () => request('/diet/weekly/'),
  getWeightLogs: () => request('/diet/weight/'),
  addWeightLog: (data) => request('/diet/weight/', { method: 'POST', body: JSON.stringify(data) }),
};

// Chatbot
export const chatbot = {
  getSessions: () => request('/chatbot/sessions/'),
  sendMessage: (data) => request('/chatbot/chat/', { method: 'POST', body: JSON.stringify(data) }),
  getHistory: (sessionId) => request(`/chatbot/sessions/${sessionId}/history/`),
};
