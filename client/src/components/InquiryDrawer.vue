<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="store.drawerOpen"
        class="overlay"
        @click.self="store.closeDrawer()"
        @keydown.esc="store.closeDrawer()"
        tabindex="-1"
      ></div>
    </transition>

    <transition name="slide">
      <aside
        v-if="store.drawerOpen"
        class="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-title"
      >
        <header class="drawer-header">
          <div>
            <h2 id="inquiry-title" class="title">
              <strong>अर्थ</strong> Mala — Your Inquiry
            </h2>
            <p class="subtitle">Tell us what your heart pictures. We’ll reach out within 24 hours.</p>
          </div>
          <button class="close" @click="store.closeDrawer()" aria-label="Close inquiry">✕</button>
        </header>

        <div class="drawer-body">
          <!-- Success state -->
          <div v-if="store.lastSuccess" class="success-state">
            <svg class="success-mandala" viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
              <g fill="none" stroke="#c3592b" stroke-width="1.25" stroke-linecap="round">
                <circle cx="60" cy="60" r="52" class="ring ring-outer" />
                <circle cx="60" cy="60" r="36" class="ring ring-mid" />
                <!-- 8 petals -->
                <g class="petals">
                  <path d="M60 24 Q52 38 60 54 Q68 38 60 24" />
                  <path d="M60 96 Q52 82 60 66 Q68 82 60 96" />
                  <path d="M24 60 Q38 52 54 60 Q38 68 24 60" />
                  <path d="M96 60 Q82 52 66 60 Q82 68 96 60" />
                  <path d="M35 35 Q45 45 55 45 Q45 45 45 55 Q35 55 35 35" transform="rotate(0 60 60)" />
                  <path d="M85 35 Q75 45 65 45 Q75 45 75 55 Q85 55 85 35" transform="rotate(0 60 60)" />
                  <path d="M35 85 Q45 75 55 75 Q45 75 45 65 Q35 65 35 85" transform="rotate(0 60 60)" />
                  <path d="M85 85 Q75 75 65 75 Q75 75 75 65 Q85 65 85 85" transform="rotate(0 60 60)" />
                </g>
                <!-- Inner star -->
                <g class="inner">
                  <line x1="60" y1="48" x2="60" y2="72" />
                  <line x1="48" y1="60" x2="72" y2="60" />
                  <line x1="52" y1="52" x2="68" y2="68" />
                  <line x1="68" y1="52" x2="52" y2="68" />
                </g>
                <circle cx="60" cy="60" r="8" class="ring ring-center" />
                <circle cx="60" cy="60" r="2.5" fill="#c3592b" stroke="none" class="dot" />
              </g>
            </svg>

            <h3>Sent with gratitude.</h3>
            <p>{{ store.lastSuccess }}</p>
            <button class="btn-primary" @click="closeAndReset">Continue browsing</button>
          </div>

          <template v-else>
            <!-- Items -->
            <section class="section">
              <h3 class="section-title">Pieces you're considering</h3>

              <div v-if="store.isEmpty" class="empty">
                <p>No items yet. Add pieces from the catalog, or simply write what you're looking for below — a custom commission, perhaps.</p>
              </div>

              <ul v-else class="item-list">
                <li v-for="item in store.items" :key="item.artworkId" class="item">
                  <img :src="item.image" :alt="item.title" class="item-img" />
                  <div class="item-body">
                    <div class="item-top">
                      <div>
                        <div class="item-title">{{ item.title }}</div>
                        <div class="item-meta">{{ item.category }}<span v-if="item.price"> · ₹{{ item.price }}</span></div>
                      </div>
                      <button class="remove" @click="store.removeItem(item.artworkId)" aria-label="Remove item">✕</button>
                    </div>
                    <div class="item-controls">
                      <label class="qty">
                        Qty
                        <input
                          type="number"
                          min="1"
                          :value="item.quantity"
                          @input="store.updateQuantity(item.artworkId, $event.target.value)"
                        />
                      </label>
                      <input
                        class="note"
                        placeholder="Any note? (colour, size, finish…)"
                        :value="item.note"
                        @input="store.updateNote(item.artworkId, $event.target.value)"
                      />
                    </div>
                  </div>
                </li>
              </ul>
            </section>

            <!-- Form -->
            <section class="section">
              <h3 class="section-title">Your details</h3>
              <form class="form" @submit.prevent="onSubmit">
                <!-- Honeypot: hidden from humans, irresistible to bots -->
                <input
                  type="text"
                  name="website"
                  tabindex="-1"
                  autocomplete="off"
                  class="honeypot"
                  v-model="form.website"
                  aria-hidden="true"
                />

                <div class="row">
                  <label>
                    Name <span class="req">*</span>
                    <input v-model="form.name" required maxlength="120" autocomplete="name" />
                  </label>
                  <label>
                    Email <span class="req">*</span>
                    <input v-model="form.email" required type="email" maxlength="200" autocomplete="email" />
                  </label>
                </div>

                <div class="row">
                  <label>
                    Phone
                    <input v-model="form.phone" maxlength="40" autocomplete="tel" />
                  </label>
                  <label>
                    WhatsApp
                    <input v-model="form.whatsapp" maxlength="40" placeholder="Same as phone if blank" />
                  </label>
                </div>

                <div class="row">
                  <label>
                    Preferred contact
                    <select v-model="form.preferredContact">
                      <option value="any">Any</option>
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="phone">Phone</option>
                    </select>
                  </label>
                  <label>
                    Budget (optional)
                    <input v-model="form.budget" maxlength="80" placeholder="₹ range, ballpark" />
                  </label>
                </div>

                <label>
                  Timeline (optional)
                  <input v-model="form.timeline" maxlength="80" placeholder="e.g., in 3 weeks, no rush" />
                </label>

                <label>
                  Message
                  <textarea
                    v-model="form.message"
                    rows="4"
                    maxlength="2000"
                    placeholder="Describe the piece, the feeling, the space it will live in…"
                  ></textarea>
                </label>

                <p v-if="store.lastError" class="error">{{ store.lastError }}</p>

                <div class="actions">
                  <button
                    type="button"
                    class="btn-ghost"
                    @click="store.closeDrawer()"
                    :disabled="store.submitting"
                  >
                    Keep browsing
                  </button>
                  <button type="submit" class="btn-primary" :disabled="store.submitting">
                    {{ store.submitting ? 'Sending…' : 'Send inquiry' }}
                  </button>
                </div>
              </form>
            </section>
          </template>
        </div>
      </aside>
    </transition>
  </Teleport>
</template>

<script setup>
import { reactive, watch } from 'vue';
import { useInquiryStore } from '@/stores/inquirystore';

const store = useInquiryStore();

const formLoadedAt = Date.now();

const form = reactive({
  name: '',
  email: '',
  phone: '',
  whatsapp: '',
  preferredContact: 'any',
  budget: '',
  timeline: '',
  message: '',
  website: '', // honeypot — never filled by real users
});

async function onSubmit() {
  const ok = await store.submit({ ...form, _formLoadedAt: formLoadedAt });
  if (ok) {
    Object.assign(form, {
      name: '',
      email: '',
      phone: '',
      whatsapp: '',
      preferredContact: 'any',
      budget: '',
      timeline: '',
      message: '',
      website: '',
    });
  }
}

function closeAndReset() {
  store.lastSuccess = null;
  store.closeDrawer();
}

// Lock body scroll while drawer open
watch(
  () => store.drawerOpen,
  (open) => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = open ? 'hidden' : '';
  }
);
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(31, 26, 23, 0.45);
  z-index: 60;
  backdrop-filter: blur(2px);
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(480px, 100%);
  background: #faf6f0;
  color: #1f1a17;
  z-index: 70;
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 1.25rem;
  border-bottom: 1px solid rgba(195, 89, 43, 0.15);
  background:
    radial-gradient(circle at 20% 20%, rgba(195, 89, 43, 0.06), transparent 60%),
    #fff;
}

.title {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 36, 'SOFT' 30;
  font-size: 1.35rem;
  font-weight: 400;
  letter-spacing: -0.005em;
  margin: 0;
  color: #1f1a17;
}
.title strong {
  color: #c3592b;
  font-family: 'Tiro Devanagari Hindi', 'Fraunces', Georgia, serif;
  font-weight: 400;
}

.subtitle {
  margin: 0.3rem 0 0;
  font-size: 0.88rem;
  color: #6b655c;
  font-style: italic;
  font-variation-settings: 'opsz' 14, 'SOFT' 80;
  letter-spacing: 0.01em;
}

.close {
  background: none;
  border: 1px solid transparent;
  font-size: 1rem;
  cursor: pointer;
  color: #6b655c;
  padding: 0.25rem 0.55rem;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.close:hover {
  color: #c3592b;
  border-color: rgba(195, 89, 43, 0.3);
  background: rgba(195, 89, 43, 0.06);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem 2rem;
}

.section {
  margin-bottom: 1.75rem;
}

.section-title {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #c3592b;
  margin: 0 0 1rem;
}

.empty {
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.55);
  border: 1px dashed rgba(195, 89, 43, 0.3);
  border-radius: 6px;
  color: #6b655c;
  font-size: 0.92rem;
  line-height: 1.75;
  font-style: italic;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item {
  display: flex;
  gap: 0.85rem;
  padding: 0.85rem;
  background: #fff;
  border: 1px solid rgba(195, 89, 43, 0.12);
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.25s ease, border-color 0.25s ease;
}
.item:hover {
  border-color: rgba(195, 89, 43, 0.25);
  box-shadow: 0 4px 12px rgba(195, 89, 43, 0.06);
}

.item-img {
  width: 68px;
  height: 68px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
  border: 1px solid rgba(195, 89, 43, 0.15);
}

.item-body {
  flex: 1;
  min-width: 0;
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.item-title {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 36, 'SOFT' 30;
  font-weight: 400;
  font-size: 1rem;
  letter-spacing: -0.005em;
  color: #1f1a17;
}

.item-meta {
  font-size: 0.78rem;
  font-style: italic;
  color: #6b655c;
  margin-top: 3px;
  letter-spacing: 0.02em;
}

.remove {
  background: none;
  border: none;
  color: #9b8e7a;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0 0.25rem;
}
.remove:hover {
  color: #c3592b;
}

.item-controls {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  align-items: center;
}

.qty {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #6b655c;
}

.qty input {
  width: 56px;
  padding: 0.4rem 0.55rem;
  font-size: 0.85rem;
  border: 1px solid rgba(195, 89, 43, 0.2);
  border-radius: 3px;
  background: #faf6f0;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.qty input:focus {
  outline: none;
  border-color: #c3592b;
  box-shadow: 0 0 0 2px rgba(195, 89, 43, 0.15);
}

.note {
  flex: 1;
  padding: 0.45rem 0.7rem;
  font-size: 0.85rem;
  border: 1px solid rgba(195, 89, 43, 0.2);
  border-radius: 3px;
  background: #faf6f0;
  font-family: inherit;
  font-style: italic;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.note:focus {
  outline: none;
  border-color: #c3592b;
  box-shadow: 0 0 0 2px rgba(195, 89, 43, 0.15);
  font-style: normal;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Honeypot — invisible but present in DOM for bots to fill */
.honeypot {
  position: absolute !important;
  left: -9999px !important;
  opacity: 0 !important;
  height: 0 !important;
  width: 0 !important;
  pointer-events: none !important;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form label {
  display: flex;
  flex-direction: column;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.78rem;
  color: #6b655c;
  letter-spacing: 0.08em;
  gap: 0.4rem;
}

.form input,
.form textarea,
.form select {
  padding: 0.65rem 0.85rem;
  border: 1px solid rgba(195, 89, 43, 0.2);
  border-radius: 3px;
  background: #fff;
  font-size: 0.95rem;
  color: #1f1a17;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 30;
  font-style: normal;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.form input:focus,
.form textarea:focus,
.form select:focus {
  outline: none;
  border-color: #c3592b;
  box-shadow: 0 0 0 2px rgba(195, 89, 43, 0.15);
  background: #faf6f0;
}
.form input::placeholder,
.form textarea::placeholder {
  color: #b3a99a;
  font-style: italic;
}

.form textarea {
  resize: vertical;
  min-height: 90px;
}

.req {
  color: #c3592b;
}

.error {
  color: #b3261e;
  font-size: 0.85rem;
  background: #fff3f0;
  border: 1px solid #f3c8bf;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.75rem;
}

.btn-primary,
.btn-ghost {
  padding: 0.75rem 1.4rem;
  border-radius: 2px;
  font-size: 0.88rem;
  cursor: pointer;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
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
  opacity: 0.55;
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

.success-state {
  text-align: center;
  padding: 3rem 1rem;
  font-family: 'Fraunces', Georgia, serif;
}

/* Animated mandala — each element draws itself in sequence */
.success-mandala {
  margin-bottom: 1.5rem;
  overflow: visible;
}
.success-mandala .ring,
.success-mandala .petals path,
.success-mandala .inner line {
  stroke-dasharray: 400;
  stroke-dashoffset: 400;
  animation: draw 2.4s ease-out forwards;
}
.success-mandala .ring-outer { animation-delay: 0s; }
.success-mandala .ring-mid   { animation-delay: 0.3s; }
.success-mandala .petals path:nth-child(1) { animation-delay: 0.6s; }
.success-mandala .petals path:nth-child(2) { animation-delay: 0.7s; }
.success-mandala .petals path:nth-child(3) { animation-delay: 0.8s; }
.success-mandala .petals path:nth-child(4) { animation-delay: 0.9s; }
.success-mandala .petals path:nth-child(5) { animation-delay: 1.0s; }
.success-mandala .petals path:nth-child(6) { animation-delay: 1.1s; }
.success-mandala .petals path:nth-child(7) { animation-delay: 1.2s; }
.success-mandala .petals path:nth-child(8) { animation-delay: 1.3s; }
.success-mandala .inner line:nth-child(1) { animation-delay: 1.5s; }
.success-mandala .inner line:nth-child(2) { animation-delay: 1.55s; }
.success-mandala .inner line:nth-child(3) { animation-delay: 1.6s; }
.success-mandala .inner line:nth-child(4) { animation-delay: 1.65s; }
.success-mandala .ring-center { animation-delay: 1.8s; }
.success-mandala .dot {
  opacity: 0;
  animation: fadeIn 0.6s ease 2.0s forwards;
}

@keyframes draw {
  to { stroke-dashoffset: 0; }
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.3); transform-origin: 60px 60px; }
  to   { opacity: 1; transform: scale(1); transform-origin: 60px 60px; }
}
.success-state h3 {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 72, 'SOFT' 30;
  font-size: 1.6rem;
  font-weight: 300;
  margin: 0 0 0.75rem;
  letter-spacing: -0.005em;
  color: #1f1a17;
}
.success-state p {
  color: #6b655c;
  margin-bottom: 2rem;
  font-style: italic;
  font-variation-settings: 'opsz' 14, 'SOFT' 80;
  line-height: 1.7;
  letter-spacing: 0.01em;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

@media (max-width: 520px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
