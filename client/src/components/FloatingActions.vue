<template>
  <div class="floating">
    <a
      v-if="waNumber"
      class="fab whatsapp"
      :href="whatsappUrl"
      target="_blank"
      rel="noopener"
      aria-label="Chat on WhatsApp"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
        <path d="M20.52 3.48A11.87 11.87 0 0 0 12.06 0C5.49 0 .18 5.3.18 11.86c0 2.09.55 4.13 1.59 5.93L0 24l6.37-1.67a11.82 11.82 0 0 0 5.69 1.45h.01c6.56 0 11.87-5.3 11.87-11.86 0-3.17-1.23-6.14-3.42-8.44ZM12.06 21.3h-.01a9.83 9.83 0 0 1-5.02-1.38l-.36-.21-3.78.99 1.01-3.69-.24-.38a9.85 9.85 0 1 1 18.28-5.28c0 5.43-4.43 9.95-9.88 9.95Zm5.42-7.41c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.95 1.17c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z"/>
      </svg>
    </a>

    <button
      class="fab inquiry"
      @click="store.toggleDrawer()"
      :aria-label="`Open inquiry (${store.count} items)`"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 6h16l-1.5 11a2 2 0 0 1-2 1.75h-9A2 2 0 0 1 5.5 17L4 6Z"/>
        <path d="M9 10V7a3 3 0 0 1 6 0v3"/>
      </svg>
      <span v-if="store.count > 0" class="badge">{{ store.count }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useInquiryStore } from '@/stores/inquirystore';

const store = useInquiryStore();
const route = useRoute();
const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER;

const whatsappUrl = computed(() => {
  const base = `https://wa.me/${waNumber}`;
  const context = route.query.category
    ? `Hi! I'm browsing ${route.query.category} on अर्थ Mala and I'd like to know more.`
    : 'Hi! I came across अर्थ Mala and would love to know more.';
  return `${base}?text=${encodeURIComponent(context)}`;
});
</script>

<style scoped>
.floating {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 50;
}

.fab {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.08),
    0 10px 24px rgba(0, 0, 0, 0.18);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  position: relative;
  text-decoration: none;
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.1),
    0 14px 32px rgba(0, 0, 0, 0.22);
}

.whatsapp {
  background: #25d366;
  color: #fff;
}

.inquiry {
  background: #c3592b;
  color: #fff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.08),
    0 10px 28px rgba(195, 89, 43, 0.35);
}
.inquiry:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.1),
    0 14px 34px rgba(195, 89, 43, 0.45);
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #1f1a17;
  color: #faf6f0;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  font-size: 0.72rem;
  font-weight: 400;
  min-width: 22px;
  height: 22px;
  border-radius: 11px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.02em;
  border: 2px solid #faf6f0;
}

@media (max-width: 520px) {
  .floating {
    right: 0.85rem;
    bottom: 0.85rem;
  }
  .fab {
    width: 50px;
    height: 50px;
  }
}
</style>
