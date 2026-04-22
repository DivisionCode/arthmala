<template>
  <div v-if="error" class="error-fallback" role="alert">
    <Ornament />
    <span class="eyebrow">Something went wrong</span>
    <h1>A small tangle in the weave.</h1>
    <p>
      This moment did not unfold as it should.
      Nothing is lost — you can try again, or return home and begin afresh.
    </p>
    <p v-if="errorDetail" class="detail">{{ errorDetail }}</p>

    <div class="actions">
      <button class="btn-primary" @click="retry">Try again</button>
      <router-link class="btn-ghost" to="/">Return home</router-link>
    </div>
  </div>
  <slot v-else />
</template>

<script setup>
import { onErrorCaptured, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Ornament from './Ornament.vue';

const error = ref(null);
const errorDetail = ref('');
const route = useRoute();

onErrorCaptured((err, _instance, info) => {
  console.error('[ErrorBoundary] caught:', err, 'info:', info);
  error.value = err;
  errorDetail.value = import.meta.env.DEV
    ? `${err?.name || 'Error'}: ${err?.message || String(err)}`
    : '';
  // Prevent the error from propagating further so the whole app doesn't unmount.
  return false;
});

function retry() {
  error.value = null;
  errorDetail.value = '';
}

// Clear on route change so we don't show a stale error after navigating away.
watch(() => route.fullPath, retry);
</script>

<style scoped>
.error-fallback {
  max-width: 560px;
  margin: 4rem auto;
  padding: 3rem 1.5rem;
  text-align: center;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  color: #1f1a17;
}

.eyebrow {
  display: inline-block;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.72rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: #c3592b;
  margin: 1rem 0 0.75rem;
}

h1 {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 144, 'SOFT' 30;
  font-size: clamp(1.6rem, 3.6vw, 2.2rem);
  font-weight: 300;
  margin: 0 0 1rem;
  letter-spacing: -0.005em;
  line-height: 1.25;
}

p {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 350;
  font-style: italic;
  font-variation-settings: 'opsz' 14, 'SOFT' 80;
  color: #3c3731;
  line-height: 1.85;
  margin: 0 0 1rem;
  letter-spacing: 0.01em;
}

.detail {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  font-style: normal;
  color: #9b8e7a;
  background: rgba(195, 89, 43, 0.06);
  border: 1px solid rgba(195, 89, 43, 0.15);
  border-radius: 3px;
  padding: 0.6rem 0.9rem;
  letter-spacing: 0;
  display: inline-block;
  max-width: 100%;
  overflow-wrap: anywhere;
  margin-bottom: 1.5rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.btn-primary,
.btn-ghost {
  display: inline-block;
  padding: 0.85rem 1.75rem;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  font-size: 0.93rem;
  letter-spacing: 0.12em;
  border-radius: 2px;
  text-decoration: none;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.25s ease;
}
.btn-primary {
  background: #c3592b;
  color: #faf6f0;
  border-color: #c3592b;
  box-shadow: 0 6px 18px rgba(195, 89, 43, 0.22);
}
.btn-primary:hover {
  background: #a54921;
  border-color: #a54921;
  transform: translateY(-1px);
}
.btn-ghost {
  background: transparent;
  color: #1f1a17;
  border-color: rgba(31, 26, 23, 0.25);
}
.btn-ghost:hover {
  border-color: #c3592b;
  color: #c3592b;
  transform: translateY(-1px);
}
</style>
