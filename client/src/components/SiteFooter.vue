<template>
  <footer class="site-footer">
    <div class="ornament-wrap">
      <img class="border-line" src="/images/border.webp" alt="" loading="lazy" />
    </div>

    <div class="brand-block">
      <div class="foot-mark">
        <span class="foot-mark-dev">अर्थ</span>
        <span class="foot-mark-latin">Mala</span>
      </div>
      <p class="foot-tagline">
        Art that Heals · Patterns that Speak
      </p>
    </div>

    <nav class="foot-links" aria-label="Footer navigation">
      <router-link to="/">Home</router-link>
      <span class="sep" aria-hidden="true">·</span>
      <router-link to="/products">Products</router-link>
      <span class="sep" aria-hidden="true">·</span>
      <router-link to="/about">About</router-link>
    </nav>

    <div class="socials" aria-label="Connect with us">
      <a
        v-if="waNumber"
        :href="waUrl"
        target="_blank"
        rel="noopener"
        class="social"
        aria-label="Chat on WhatsApp"
        title="WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M20.52 3.48A11.87 11.87 0 0 0 12.06 0C5.49 0 .18 5.3.18 11.86c0 2.09.55 4.13 1.59 5.93L0 24l6.37-1.67a11.82 11.82 0 0 0 5.69 1.45h.01c6.56 0 11.87-5.3 11.87-11.86 0-3.17-1.23-6.14-3.42-8.44Zm-8.46 18.29h-.01a9.83 9.83 0 0 1-5.02-1.38l-.36-.21-3.78.99 1.01-3.69-.24-.38a9.85 9.85 0 1 1 18.28-5.28c0 5.43-4.43 9.95-9.88 9.95Zm5.42-7.41c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.95 1.17c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z"/>
        </svg>
      </a>
      <a
        href="https://instagram.com/arthmala"
        target="_blank"
        rel="noopener"
        class="social"
        aria-label="Follow on Instagram"
        title="Instagram"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      </a>
      <a
        href="mailto:hello@arthmala.com"
        class="social"
        aria-label="Email us"
        title="Email"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </a>
    </div>

    <p class="copy">
      <strong>अर्थ</strong>&nbsp;Mala<sup>®</sup> &middot; &copy; {{ year }} &middot; <em>Handcrafted in India</em>
    </p>
  </footer>
</template>

<script setup>
import { computed } from 'vue';

const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
const year = new Date().getFullYear();
const waUrl = computed(
  () =>
    `https://wa.me/${waNumber}?text=${encodeURIComponent(
      "Hi! I came across अर्थ Mala and would love to know more."
    )}`
);
</script>

<style scoped>
.site-footer {
  padding: 3rem 1.5rem;
  text-align: center;
  font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
  color: #6b655c;
  border-top: 1px solid rgba(195, 89, 43, 0.08);
}

.ornament-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}
.border-line {
  height: 7em;
  width: 13em;
  opacity: 0.85;
}

.brand-block {
  margin-bottom: 1.5rem;
}

.foot-mark {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  line-height: 1;
  margin-bottom: 0.5rem;
}
.foot-mark-dev {
  font-family: 'Tiro Devanagari Hindi', 'Fraunces', Georgia, serif;
  font-size: 1.9rem;
  color: #c3592b;
  font-weight: 400;
}
.foot-mark-latin {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 36, 'SOFT' 50;
  font-size: 1.15rem;
  color: rgba(195, 89, 43, 0.75);
  letter-spacing: 0.02em;
}

.foot-tagline {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 36, 'SOFT' 50;
  font-size: 0.88rem;
  letter-spacing: 0.1em;
  color: rgba(107, 101, 92, 0.85);
  margin: 0;
}

.foot-links {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-style: italic;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  margin-bottom: 1.25rem;
}
.foot-links a {
  color: #6b655c;
  text-decoration: none;
  transition: color 0.2s ease;
  padding: 0.15rem 0;
  border-bottom: 1px solid transparent;
}
.foot-links a:hover {
  color: #c3592b;
  border-bottom-color: rgba(195, 89, 43, 0.4);
}
.sep {
  color: rgba(195, 89, 43, 0.5);
  font-size: 0.85em;
}

.socials {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 1.75rem;
}
.social {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid rgba(195, 89, 43, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6b655c;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.5);
}
.social:hover {
  color: #faf6f0;
  background: #c3592b;
  border-color: #c3592b;
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(195, 89, 43, 0.25);
}

.copy {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-weight: 350;
  letter-spacing: 0.08em;
  font-size: 0.82rem;
  color: rgba(107, 101, 92, 0.8);
  margin: 0;
}
.copy strong {
  color: #c3592b;
  font-family: 'Tiro Devanagari Hindi', 'Fraunces', Georgia, serif;
  font-style: normal;
  font-weight: 400;
}
.copy em {
  font-style: italic;
  font-variation-settings: 'opsz' 14, 'SOFT' 80;
  color: #6b655c;
}

@media (max-width: 640px) {
  .site-footer { padding: 2.5rem 1rem; }
  .border-line { height: 6em; width: 11em; }
  .foot-mark-dev { font-size: 1.65rem; }
  .foot-mark-latin { font-size: 1rem; }
  .foot-links { font-size: 0.85rem; gap: 0.5rem; }
}
</style>
