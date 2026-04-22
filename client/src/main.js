import { createApp } from 'vue'
import './assets/main.css'
import App from './App.vue'
import { router } from './router';
import { createPinia } from 'pinia';
import { installAnalytics, trackPageView } from '@/composables/useAnalytics';

const app = createApp(App);

// Global error handler — catches anything the boundaries don't.
// If Sentry (or similar) is configured later, report here.
app.config.errorHandler = (err, instance, info) => {
  console.error('[vue] unhandled error:', err, 'info:', info);
  if (typeof window !== 'undefined' && typeof window.Sentry?.captureException === 'function') {
    window.Sentry.captureException(err, { extra: { vueInfo: info } });
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[window] unhandled rejection:', e.reason);
  });
}

app.use(createPinia());
app.use(router);

installAnalytics();
router.afterEach((to) => trackPageView(to.fullPath));

app.mount('#app');
