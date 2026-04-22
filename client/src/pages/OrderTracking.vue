<template>
  <DefaultProductPage>
    <div class="order-page">
      <div v-if="loading" class="status">Reading your order…</div>

      <div v-else-if="error" class="status error">
        <Ornament />
        <h1>We couldn't find that order.</h1>
        <p>
          The link may have expired or been mistyped. If you still have your inquiry email,
          the tracking link will be there — or reach out to the studio.
        </p>
        <router-link class="btn-primary" to="/">Return home</router-link>
      </div>

      <div v-else-if="order" class="order-content">
        <header class="head fade-up">
          <Ornament />
          <span class="eyebrow">Your commission</span>
          <h1>Dear {{ order.firstName }},</h1>
          <p class="lede">
            This is a quiet page just for you. Here is how your piece is coming along.
          </p>
        </header>

        <!-- Items -->
        <section v-if="order.items?.length" class="pieces fade-up" style="animation-delay: 0.1s">
          <div class="pieces-grid" :class="{ 'pieces-multi': order.items.length > 1 }">
            <article v-for="(item, idx) in order.items" :key="idx" class="piece">
              <div class="piece-frame">
                <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" />
              </div>
              <div class="piece-body">
                <div class="piece-cat">{{ item.category }}</div>
                <div class="piece-title">{{ item.title }}</div>
                <div v-if="item.quantity > 1" class="piece-qty">
                  <em>×{{ item.quantity }}</em>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- Status timeline -->
        <section class="timeline-section fade-up" style="animation-delay: 0.2s">
          <div class="eyebrow-line">
            <span class="eyebrow">Where your piece is now</span>
          </div>
          <ol class="order-timeline">
            <li
              v-for="(step, idx) in steps"
              :key="step.key"
              :class="{
                done: stepIndex >= idx,
                current: stepIndex === idx,
              }"
            >
              <span class="dot" aria-hidden="true"></span>
              <div class="step-body">
                <div class="step-title">{{ step.label }}</div>
                <div class="step-caption">{{ step.caption }}</div>
                <div v-if="stepIndex === idx && etaText" class="step-eta">
                  <em>Expected {{ etaText }}</em>
                </div>
              </div>
            </li>
          </ol>
        </section>

        <!-- Confirmed details -->
        <section class="details fade-up" style="animation-delay: 0.3s">
          <dl>
            <div v-if="order.quotedPrice">
              <dt>Total</dt>
              <dd>₹{{ Number(order.quotedPrice).toLocaleString('en-IN') }}</dd>
            </div>
            <div>
              <dt>Confirmed on</dt>
              <dd>{{ formatDate(order.confirmedAt) }}</dd>
            </div>
            <div v-if="order.orderETA">
              <dt>Expected delivery</dt>
              <dd>{{ formatDate(order.orderETA) }}</dd>
            </div>
          </dl>
        </section>

        <section class="cta-block fade-up" style="animation-delay: 0.4s">
          <p class="cta-lede">
            A question, a change of mind, a kind word —
            reach out any time and we'll answer ourselves.
          </p>
          <div class="cta-actions">
            <a
              v-if="waNumber"
              :href="waUrl"
              target="_blank"
              rel="noopener"
              class="btn-primary"
            >Message the studio</a>
            <router-link to="/" class="btn-ghost">Visit the shop</router-link>
          </div>
        </section>
      </div>
    </div>
  </DefaultProductPage>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import DefaultProductPage from '@/layouts/DefaultProductPage.vue';
import Ornament from '@/components/Ornament.vue';
import { usePageMeta } from '@/composables/usePageMeta';

const route = useRoute();
const order = ref(null);
const loading = ref(true);
const error = ref(null);

const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
const waUrl = computed(() => {
  const text = order.value
    ? `Hi! I'm checking in about my commission (${order.value.firstName}).`
    : 'Hi! I had a question about my order.';
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
});

usePageMeta(() => ({
  title: order.value ? `Your order — ${order.value.firstName}` : 'Your order',
  description: 'Track your अर्थ Mala commission as it moves from the artisan to your door.',
}));

const steps = [
  {
    key: 'received',
    label: 'Received',
    caption: 'Your order has arrived at the studio and been assigned to an artisan.',
  },
  {
    key: 'in_progress',
    label: 'In progress',
    caption: 'The artisan is making your piece by hand. This is the slowest part — and the point.',
  },
  {
    key: 'shipped',
    label: 'Shipped',
    caption: 'Wrapped in cotton and on its way, with a handwritten note from the maker.',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    caption: 'Your piece has arrived. We hope it settles gently into its new home.',
  },
];

const stepIndex = computed(() => {
  if (!order.value?.orderStatus) return -1;
  return steps.findIndex((s) => s.key === order.value.orderStatus);
});

const etaText = computed(() => {
  if (!order.value?.orderETA) return '';
  const eta = new Date(order.value.orderETA);
  const now = new Date();
  const days = Math.ceil((eta - now) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'any day now';
  if (days === 1) return 'tomorrow';
  if (days < 14) return `in ${days} days`;
  return `around ${eta.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`;
});

function formatDate(s) {
  if (!s) return '';
  try {
    return new Date(s).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

async function load() {
  const token = route.params.token;
  if (!token) {
    error.value = 'missing';
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/orders/${encodeURIComponent(token)}`
    );
    if (res.status === 404) {
      error.value = 'notfound';
      return;
    }
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    order.value = await res.json();
  } catch (err) {
    console.error(err);
    error.value = err.message || 'Something went wrong.';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => route.params.token, load);
</script>

<style scoped>
.order-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 4rem;
  font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  color: #1f1a17;
}

.fade-up {
  opacity: 0;
  transform: translateY(16px);
  animation: fadeUp 0.9s ease forwards;
}
@keyframes fadeUp {
  to { opacity: 1; transform: translateY(0); }
}

.status {
  text-align: center;
  padding: 4rem 1rem;
  color: #6b655c;
  font-style: italic;
  letter-spacing: 0.03em;
}
.status.error {
  font-style: normal;
  max-width: 540px;
  margin: 0 auto;
}
.status.error h1 {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 144, 'SOFT' 30;
  font-weight: 300;
  font-size: 1.9rem;
  margin: 1rem 0 1rem;
  color: #1f1a17;
  letter-spacing: -0.005em;
}
.status.error p {
  color: #3c3731;
  line-height: 1.85;
  margin-bottom: 1.75rem;
  font-style: italic;
}

/* Head */
.head {
  text-align: center;
  margin-bottom: 2.5rem;
}
.eyebrow {
  display: inline-block;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.72rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: #c3592b;
  margin: 0.5rem 0 0.75rem;
}
.head h1 {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 144, 'SOFT' 30;
  font-size: clamp(1.9rem, 4vw, 2.5rem);
  font-weight: 300;
  letter-spacing: -0.005em;
  margin: 0 0 0.75rem;
  color: #1f1a17;
  line-height: 1.2;
}
.lede {
  color: #3c3731;
  line-height: 1.85;
  font-style: italic;
  letter-spacing: 0.01em;
  margin: 0;
}

/* Pieces */
.pieces { margin-bottom: 3rem; }
.pieces-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  max-width: 420px;
  margin: 0 auto;
}
.pieces-multi {
  grid-template-columns: repeat(2, 1fr);
  max-width: 640px;
}
.piece {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.piece-frame {
  position: relative;
  padding: 0.9rem;
  background: linear-gradient(135deg, #faf6f0, #efe3ce);
  border: 1px solid rgba(195, 89, 43, 0.18);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.55),
    0 2px 4px rgba(0, 0, 0, 0.04),
    0 14px 34px rgba(195, 89, 43, 0.09);
  overflow: hidden;
}
.piece-frame::before {
  content: '';
  position: absolute;
  top: 0.7rem;
  left: 0.7rem;
  right: 0.7rem;
  bottom: 0.7rem;
  border: 1px solid rgba(195, 89, 43, 0.35);
  pointer-events: none;
}
.piece-frame img {
  display: block;
  width: 100%;
  height: 22em;
  object-fit: cover;
  position: relative;
  z-index: 1;
}
.pieces-multi .piece-frame img { height: 14em; }

.piece-body { text-align: center; }
.piece-cat {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 0.72rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #c3592b;
  margin-bottom: 0.3rem;
}
.piece-title {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 36, 'SOFT' 30;
  font-size: 1.15rem;
  color: #1f1a17;
  letter-spacing: -0.005em;
}
.piece-qty { font-size: 0.82rem; color: #6b655c; margin-top: 4px; }

/* Timeline */
.timeline-section { margin-bottom: 3rem; }
.eyebrow-line {
  text-align: center;
  margin-bottom: 1.75rem;
}

.order-timeline {
  list-style: none;
  padding: 0;
  margin: 0;
  position: relative;
  max-width: 560px;
  margin: 0 auto;
}

.order-timeline li {
  position: relative;
  padding: 0 0 2rem 2.75rem;
  min-height: 3.5rem;
}
.order-timeline li:last-child { padding-bottom: 0; }

/* Vertical line connecting dots */
.order-timeline li::before {
  content: '';
  position: absolute;
  left: 0.9rem;
  top: 1.5rem;
  bottom: -0.5rem;
  width: 1px;
  background: rgba(195, 89, 43, 0.2);
}
.order-timeline li:last-child::before { display: none; }
.order-timeline li.done::before {
  background: rgba(195, 89, 43, 0.5);
}

.dot {
  position: absolute;
  left: 0.3rem;
  top: 0.25rem;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: #faf6f0;
  border: 2px solid rgba(195, 89, 43, 0.35);
  transition: all 0.4s ease;
}
.order-timeline li.done .dot {
  background: #c3592b;
  border-color: #c3592b;
  box-shadow: 0 0 0 4px rgba(195, 89, 43, 0.12);
}
.order-timeline li.current .dot {
  border-color: #c3592b;
  background: #c3592b;
  box-shadow: 0 0 0 6px rgba(195, 89, 43, 0.18);
  animation: pulse 2.4s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 6px rgba(195, 89, 43, 0.18); }
  50% { box-shadow: 0 0 0 10px rgba(195, 89, 43, 0.08); }
}

.step-title {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 36, 'SOFT' 30;
  font-size: 1.1rem;
  font-weight: 400;
  color: #9b8e7a;
  letter-spacing: -0.005em;
  margin-bottom: 0.3rem;
}
.step-caption {
  color: #9b8e7a;
  font-size: 0.92rem;
  line-height: 1.7;
  font-style: italic;
  letter-spacing: 0.01em;
}
.order-timeline li.done .step-title {
  color: #1f1a17;
}
.order-timeline li.done .step-caption {
  color: #3c3731;
  font-style: normal;
}
.order-timeline li.current .step-title { color: #c3592b; }

.step-eta {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #c3592b;
  font-style: italic;
}

/* Details */
.details {
  margin-bottom: 3rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(195, 89, 43, 0.15);
  border-radius: 8px;
}
.details dl {
  margin: 0;
  display: grid;
  gap: 0.6rem;
}
.details dl > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 1px dashed rgba(195, 89, 43, 0.12);
  padding-bottom: 0.5rem;
}
.details dl > div:last-child { border-bottom: none; padding-bottom: 0; }
.details dt {
  font-style: italic;
  color: #6b655c;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
  text-transform: uppercase;
}
.details dd {
  margin: 0;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 20;
  color: #1f1a17;
  font-size: 1rem;
  text-align: right;
}

/* CTA */
.cta-block {
  text-align: center;
  padding: 2.25rem 1.5rem;
  background: radial-gradient(circle at 30% 30%, rgba(195, 89, 43, 0.08), transparent 55%),
    linear-gradient(135deg, #fff, #f5ebdd);
  border: 1px solid rgba(195, 89, 43, 0.15);
  border-radius: 10px;
}
.cta-lede {
  color: #3c3731;
  line-height: 1.8;
  font-style: italic;
  margin: 0 0 1.5rem;
}
.cta-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
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
  transition: all 0.25s ease;
  cursor: pointer;
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
