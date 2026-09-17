import { reactive } from 'vue';
import api from '../api/client.js';

function loadInitialAuth() {
  const token = localStorage.getItem('pmlbb_token');
  const role = localStorage.getItem('pmlbb_role');
  const username = localStorage.getItem('pmlbb_username');
  return token ? { token, role, username } : null;
}

// State reaktif tunggal (singleton) — dipakai di seluruh app, menggantikan AuthContext React.
const state = reactive({
  auth: loadInitialAuth(),
});

async function login(username, password) {
  const { data } = await api.post('/auth/login', { username, password });
  localStorage.setItem('pmlbb_token', data.token);
  localStorage.setItem('pmlbb_role', data.role);
  localStorage.setItem('pmlbb_username', data.username);
  state.auth = { token: data.token, role: data.role, username: data.username };
  return data;
}

function logout() {
  localStorage.removeItem('pmlbb_token');
  localStorage.removeItem('pmlbb_role');
  localStorage.removeItem('pmlbb_username');
  state.auth = null;
}

export function useAuth() {
  return { state, login, logout };
}
