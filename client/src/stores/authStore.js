import { defineStore } from 'pinia';
import { ref } from 'vue';

const API = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'arthmala_auth_token';

export const useAuthStore = defineStore('authStore', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem(TOKEN_KEY) || '');
  const loading = ref(false);
  const error = ref(null);

  async function requestOtp(identifier, type = 'email') {
    loading.value = true;
    error.value = null;
    try {
      const payload = type === 'email' ? { email: identifier } : { phone: identifier };
      const res = await fetch(`${API}/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function verifyOtp(identifier, otp, type = 'email') {
    loading.value = true;
    error.value = null;
    try {
      const payload = { otp };
      if (type === 'email') payload.email = identifier;
      else payload.phone = identifier;

      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      token.value = data.token;
      user.value = data.user;
      localStorage.setItem(TOKEN_KEY, data.token);
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProfile() {
    if (!token.value) return;
    loading.value = true;
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token.value}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }
      user.value = data;
    } catch (err) {
      console.warn('Could not fetch user profile, clearing token:', err);
      logout();
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  return {
    user,
    token,
    loading,
    error,
    requestOtp,
    verifyOtp,
    fetchProfile,
    logout,
  };
});
