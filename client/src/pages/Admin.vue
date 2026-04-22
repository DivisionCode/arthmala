<template>
  <div class="admin">
    <!-- Gate -->
    <div v-if="!token" class="gate">
      <div class="gate-card">
        <div class="gate-ornament" aria-hidden="true">❁</div>
        <span class="gate-eyebrow">The Studio</span>
        <h1>
          <span class="dev">अर्थ</span>
          <span class="latin">Mala</span>
        </h1>
        <p>A small room with a key. Enter it to manage inquiries and artworks.</p>
        <form @submit.prevent="submitToken">
          <input
            v-model="pendingToken"
            type="password"
            placeholder="Studio key"
            autofocus
          />
          <button class="btn-primary" type="submit" :disabled="!pendingToken">Enter</button>
        </form>
        <p v-if="gateError" class="gate-error">{{ gateError }}</p>
      </div>
    </div>

    <!-- Dashboard -->
    <div v-else class="dashboard">
      <header class="dash-head">
        <div>
          <span class="dash-eyebrow">The Studio</span>
          <h1>
            <span class="dev">अर्थ</span>
            <span class="latin">Mala</span>
          </h1>
          <p class="sub"><em>Welcome back.</em> Today is {{ today }}.</p>
        </div>
        <button class="btn-ghost" @click="signOut">Sign out</button>
      </header>

      <nav class="tabs" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.id"
          :class="['tab', { active: activeTab === t.id }]"
          role="tab"
          :aria-selected="activeTab === t.id"
          @click="activeTab = t.id"
        >
          {{ t.label }}
        </button>
      </nav>

      <div class="tab-body">
        <AdminOverview
          v-if="activeTab === 'overview'"
          :token="token"
          @unauthorized="signOut"
        />
        <AdminInquiries
          v-else-if="activeTab === 'inquiries'"
          :token="token"
          @unauthorized="signOut"
        />
        <AdminProducts
          v-else-if="activeTab === 'products'"
          :token="token"
          @unauthorized="signOut"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AdminOverview from './admin/AdminOverview.vue';
import AdminInquiries from './admin/AdminInquiries.vue';
import AdminProducts from './admin/AdminProducts.vue';

const TOKEN_KEY = 'arthmala_admin_token';
const API = import.meta.env.VITE_API_URL;

const token = ref(localStorage.getItem(TOKEN_KEY) || '');
const pendingToken = ref('');
const gateError = ref('');

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'inquiries', label: 'Inquiries' },
  { id: 'products', label: 'Artworks' },
];
const activeTab = ref('overview');

const today = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

async function submitToken() {
  gateError.value = '';
  const t = pendingToken.value.trim();
  if (!t) return;
  try {
    const res = await fetch(`${API}/api/inquiries`, {
      headers: { 'x-admin-token': t },
    });
    if (res.status === 401) {
      gateError.value = 'Incorrect key.';
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      gateError.value = data.error || `Server responded ${res.status}`;
      return;
    }
    token.value = t;
    localStorage.setItem(TOKEN_KEY, t);
    pendingToken.value = '';
  } catch (err) {
    gateError.value = err.message || 'Network error.';
  }
}

function signOut() {
  token.value = '';
  localStorage.removeItem(TOKEN_KEY);
}
</script>

<style scoped>
.admin {
  min-height: 100vh;
  font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  color: #1f1a17;
}

/* ===== Gate ===== */
.gate {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.gate-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(195, 89, 43, 0.18);
  border-radius: 10px;
  padding: 3rem 2rem 2.5rem;
  max-width: 440px;
  width: 100%;
  text-align: center;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.55),
    0 18px 48px rgba(195, 89, 43, 0.12);
}
.gate-ornament {
  font-size: 1.5rem;
  color: #c3592b;
  opacity: 0.65;
  margin-bottom: 0.75rem;
}
.gate-eyebrow {
  display: inline-block;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.7rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: #c3592b;
  margin-bottom: 0.5rem;
}
.gate-card h1 {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin: 0 0 1rem;
  line-height: 1;
  gap: 0.1em;
}
.dev {
  font-family: 'Tiro Devanagari Hindi', 'Fraunces', Georgia, serif;
  font-size: 3rem;
  color: #c3592b;
  font-weight: 400;
  letter-spacing: -0.01em;
}
.latin {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 72, 'SOFT' 80, 'wght' 300;
  font-size: 1.15rem;
  color: rgba(195, 89, 43, 0.75);
  letter-spacing: 0.02em;
}
.gate-card p {
  color: #6b655c;
  margin: 0 0 1.5rem;
  font-size: 0.95rem;
  font-style: italic;
  font-variation-settings: 'opsz' 14, 'SOFT' 80;
  line-height: 1.7;
  letter-spacing: 0.01em;
}
.gate-card form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.gate-card input {
  padding: 0.8rem 1rem;
  font-size: 1rem;
  border: 1px solid rgba(195, 89, 43, 0.22);
  border-radius: 3px;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  background: #faf6f0;
  transition: all 0.25s ease;
}
.gate-card input:focus {
  outline: none;
  border-color: #c3592b;
  box-shadow: 0 0 0 2px rgba(195, 89, 43, 0.15);
  background: #fff;
}
.gate-card input::placeholder {
  color: #b3a99a;
  font-style: italic;
}
.gate-error {
  color: #b3261e;
  font-size: 0.85rem;
  margin: 0.75rem 0 0;
  font-style: italic;
}

/* ===== Dashboard ===== */
.dashboard {
  max-width: 920px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}

.dash-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(195, 89, 43, 0.15);
  flex-wrap: wrap;
}
.dash-eyebrow {
  display: inline-block;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.7rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: #c3592b;
  margin-bottom: 0.4rem;
}
.dash-head h1 {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  margin: 0 0 0.4rem;
  line-height: 1;
}
.dash-head .dev {
  font-size: 2.1rem;
}
.dash-head .latin {
  font-size: 1.15rem;
}
.sub {
  color: #6b655c;
  font-size: 0.9rem;
  margin: 0;
  letter-spacing: 0.02em;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
}
.sub em {
  font-style: italic;
  color: #c3592b;
  font-weight: 400;
}

.tabs {
  display: flex;
  gap: 2rem;
  border-bottom: 1px solid rgba(195, 89, 43, 0.15);
  margin-bottom: 2rem;
}
.tab {
  background: none;
  border: none;
  padding: 0.85rem 0;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  font-size: 1rem;
  letter-spacing: 0.08em;
  color: #6b655c;
  cursor: pointer;
  border-bottom: 1px solid transparent;
  margin-bottom: -1px;
  transition: all 0.25s ease;
  position: relative;
}
.tab:hover {
  color: #c3592b;
}
.tab.active {
  color: #c3592b;
  font-style: normal;
  font-weight: 400;
  border-bottom-color: #c3592b;
}

/* ===== Buttons ===== */
.btn-primary,
.btn-ghost {
  padding: 0.75rem 1.4rem;
  border-radius: 2px;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  font-size: 0.88rem;
  cursor: pointer;
  letter-spacing: 0.12em;
  transition: all 0.25s ease;
}
.btn-primary {
  background: #c3592b;
  color: #faf6f0;
  border: 1px solid #c3592b;
  box-shadow: 0 4px 14px rgba(195, 89, 43, 0.22);
}
.btn-primary:hover:not(:disabled) {
  background: #a54921;
  border-color: #a54921;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(195, 89, 43, 0.3);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
.btn-ghost {
  background: transparent;
  color: #6b655c;
  border: 1px solid rgba(31, 26, 23, 0.22);
}
.btn-ghost:hover:not(:disabled) {
  border-color: #c3592b;
  color: #c3592b;
  transform: translateY(-1px);
}
</style>
