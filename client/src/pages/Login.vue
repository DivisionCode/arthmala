<template>
  <div class="login-page">
    <div class="login-card">
      <div class="card-header">
        <span class="eyebrow">Welcome</span>
        <h1>Sign In to Arth Mala</h1>
        <p>No passwords required. We'll send you a secure code to log in.</p>
      </div>

      <div class="form-container">
        <!-- Step 1: Request OTP -->
        <form v-if="!otpSent" @submit.prevent="handleRequestOtp" class="auth-form">
          <div class="tabs">
            <button 
              type="button" 
              :class="{ active: authType === 'email' }" 
              @click="authType = 'email'"
            >
              Email
            </button>
            <button 
              type="button" 
              :class="{ active: authType === 'phone' }" 
              @click="authType = 'phone'"
            >
              WhatsApp
            </button>
          </div>

          <label class="field-label">
            {{ authType === 'email' ? 'Email Address' : 'WhatsApp Number' }}
            <input 
              v-if="authType === 'email'"
              v-model="identifier" 
              type="email" 
              placeholder="you@example.com" 
              required 
            />
            <input 
              v-else
              v-model="identifier" 
              type="tel" 
              placeholder="e.g. +91 9876543210" 
              required 
            />
          </label>

          <p v-if="authStore.error" class="error-msg">{{ authStore.error }}</p>

          <button type="submit" class="btn-primary" :disabled="authStore.loading || !identifier">
            {{ authStore.loading ? 'Sending Code...' : 'Get Login Code' }}
          </button>
        </form>

        <!-- Step 2: Verify OTP -->
        <form v-else @submit.prevent="handleVerifyOtp" class="auth-form">
          <button type="button" class="back-btn" @click="goBack">← Back</button>
          <label class="field-label">
            Enter the 6-digit code sent to {{ identifier }}
            <input 
              v-model="otpCode" 
              type="text" 
              inputmode="numeric" 
              pattern="[0-9]*" 
              maxlength="6" 
              placeholder="• • • • • •" 
              required 
              class="otp-input"
            />
          </label>

          <p v-if="authStore.error" class="error-msg">{{ authStore.error }}</p>

          <button type="submit" class="btn-primary" :disabled="authStore.loading || otpCode.length !== 6">
            {{ authStore.loading ? 'Verifying...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const authType = ref('email');
const identifier = ref('');
const otpSent = ref(false);
const otpCode = ref('');

async function handleRequestOtp() {
  const success = await authStore.requestOtp(identifier.value, authType.value);
  if (success) {
    otpSent.value = true;
    otpCode.value = '';
  }
}

async function handleVerifyOtp() {
  const success = await authStore.verifyOtp(identifier.value, otpCode.value, authType.value);
  if (success) {
    // Redirect back to where they came from or home
    const redirect = route.query.redirect || '/';
    router.push(redirect);
  }
}

function goBack() {
  otpSent.value = false;
  otpCode.value = '';
  authStore.error = null;
}
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 120px);
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
  background: radial-gradient(circle at top right, rgba(195, 89, 43, 0.05), transparent 40%),
              radial-gradient(circle at bottom left, rgba(250, 246, 240, 1), transparent 40%);
  font-family: 'Fraunces', Georgia, serif;
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(195, 89, 43, 0.15);
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(86, 55, 34, 0.08);
  padding: 2.5rem 2rem;
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;
}

.eyebrow {
  display: block;
  color: #c3592b;
  font-size: 0.72rem;
  font-style: italic;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

h1 {
  margin: 0 0 0.5rem;
  color: #1f1a17;
  font-size: 1.8rem;
  font-weight: 350;
  line-height: 1.2;
}

.card-header p {
  color: #6b655c;
  font-size: 0.9rem;
  margin: 0;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: rgba(242, 236, 225, 0.5);
  padding: 0.35rem;
  border-radius: 8px;
}

.tabs button {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.65rem;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.85rem;
  color: #6b655c;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tabs button.active {
  background: #fff;
  color: #c3592b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field-label {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-size: 0.85rem;
  color: #1f1a17;
}

.field-label input {
  padding: 0.85rem 1rem;
  border: 1px solid rgba(195, 89, 43, 0.2);
  border-radius: 6px;
  background: #fff;
  font-family: inherit;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field-label input:focus {
  outline: none;
  border-color: #c3592b;
  box-shadow: 0 0 0 3px rgba(195, 89, 43, 0.1);
}

.otp-input {
  letter-spacing: 0.25em;
  text-align: center;
  font-size: 1.25rem;
}

.btn-primary {
  background: #c3592b;
  color: #fff;
  border: none;
  padding: 0.9rem;
  border-radius: 6px;
  font-family: inherit;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-top: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  background: #a54921;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-btn {
  background: none;
  border: none;
  color: #6b655c;
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  align-self: flex-start;
  padding: 0;
  margin-bottom: -0.5rem;
}

.back-btn:hover {
  color: #c3592b;
}

.error-msg {
  color: #b3261e;
  font-size: 0.85rem;
  margin: 0;
  text-align: center;
}
</style>
