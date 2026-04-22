<template>
  <DefaultLayout>
    <!-- Scroll progress -->
    <div class="scroll-progress" :style="{ transform: `scaleX(${scrollProgress})` }" aria-hidden="true"></div>

    <!-- Back to top -->
    <transition name="to-top">
      <button
        v-if="showBackToTop"
        class="back-to-top"
        @click="backToTop"
        aria-label="Back to top"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" y1="19" x2="12" y2="5"/>
          <polyline points="5 12 12 5 19 12"/>
        </svg>
      </button>
    </transition>

    <!-- HERO -->
    <section class="hero fade-up">
      <div class="hero-masthead">
        <span class="hero-meta hero-meta-left" aria-hidden="true">
          <span class="dot"></span>
          <em>est. {{ year }}</em>
        </span>

        <div class="brand-logo">
          <strong>अर्थ</strong>
          <span class="brand-latin">Mala</span>
        </div>

        <span class="hero-meta hero-meta-right" aria-hidden="true">
          <em>boutique</em>
          <span class="dot"></span>
        </span>
      </div>

      <div class="brand-title">
        <span class="rule" aria-hidden="true"></span>
        <span>Art that Heals · Patterns that Speak</span>
        <span class="rule" aria-hidden="true"></span>
      </div>

      <p class="hero-lede">
        A boutique studio preserving four living Indian traditions —
        <span class="accent">Lipan</span>,
        <span class="accent">Mandala</span>,
        <span class="accent">Embroidery</span>, and
        <span class="accent">Crochet</span>.
        Every piece is made by hand, on commission,
        for one home at a time.
      </p>

      <div class="hero-cta">
        <a href="#crafts" class="btn-primary" @click.prevent="scrollTo('crafts')">
          See the work
        </a>
        <a
          v-if="waNumber"
          :href="waUrl"
          target="_blank"
          rel="noopener"
          class="btn-ghost"
        >
          Speak with us
        </a>
      </div>
    </section>

    <Ornament />

    <!-- STORY -->
    <section id="story" class="section story reveal">
      <div class="section-head">
        <span class="eyebrow">Our story</span>
        <h2>From the maker's hand,<br />into the quiet of your home.</h2>
      </div>
      <div class="story-grid">
        <p class="drop-cap">
          अर्थ Mala is not a shop. It is an invitation to slow down. In a world
          of machine-stamped uniformity, we keep the small inconsistencies —
          the faint tremor in a mandala line, the tug where an embroidery knot
          was pulled tight. These are not flaws. They are the maker, saying hello.
        </p>
        <p>
          Each commission becomes a conversation. You tell us the space, the
          feeling, perhaps a memory. An artisan takes seven to fourteen days to
          answer. We ship it wrapped in cotton and a handwritten note, because
          the thing that arrives at your door should feel a little sacred.
        </p>
      </div>
    </section>

    <Ornament />

    <!-- CRAFTS -->
    <section id="crafts" class="section crafts-section reveal">
      <div class="section-head">
        <span class="eyebrow">Four crafts · one vow</span>
        <h2>What we make.</h2>
      </div>

      <div class="art-gallery">
        <div
          v-for="(item, idx) in galleryItems"
          :key="item.label"
          class="gallery-item"
          :style="{ transitionDelay: `${idx * 80}ms` }"
          @click="goToCategory(item.label)"
          tabindex="0"
          role="link"
          @keyup.enter="goToCategory(item.label)"
        >
          <div class="gallery-frame">
            <img
              class="mandala-art"
              :src="item.src"
              :alt="item.label"
              loading="lazy"
              decoding="async"
            />
            <div class="gallery-overlay">
              <span class="gallery-explore">Explore →</span>
            </div>
          </div>
          <p class="gallery-label">{{ item.label }}</p>
        </div>
      </div>
    </section>

    <Ornament />

    <!-- LATEST PIECES (pulled from live inventory) -->
    <section
      v-if="latestPieces.length"
      id="latest"
      class="section latest-section reveal"
    >
      <div class="section-head">
        <span class="eyebrow">Fresh from the studio</span>
        <h2>Latest pieces.</h2>
      </div>

      <div class="latest-grid">
        <router-link
          v-for="p in latestPieces"
          :key="p._id"
          :to="{ name: 'ProductDetail', params: { id: p._id } }"
          class="latest-card"
        >
          <div class="latest-frame">
            <img :src="p.image" :alt="p.title" loading="lazy" decoding="async" />
          </div>
          <div class="latest-body">
            <div class="latest-title">{{ p.title }}</div>
            <div class="latest-meta">
              <span>{{ p.category }}</span>
              <span class="latest-price">₹{{ p.price }}</span>
            </div>
          </div>
        </router-link>
      </div>

      <div class="latest-more">
        <router-link class="text-link" to="/products">
          See every piece →
        </router-link>
      </div>
    </section>

    <Ornament v-if="latestPieces.length" />

    <!-- PROCESS -->
    <section id="process" class="section process reveal">
      <div class="section-head">
        <span class="eyebrow">How a piece is made</span>
        <h2>Four steps. Many days.</h2>
      </div>
      <ol class="steps">
        <li v-for="(s, i) in steps" :key="s.title">
          <span class="step-num" aria-hidden="true">{{ devanagariNumeral(i + 1) }}</span>
          <div class="step-body">
            <h4>{{ s.title }}</h4>
            <p>{{ s.body }}</p>
          </div>
        </li>
      </ol>
    </section>

    <Ornament />

    <!-- MEDITATION BLOCKQUOTE -->
    <section class="section meditation reveal">
      <article class="meditation-article">
        In spiritual practice, creating or visualizing a mandala is a form of
        moving meditation. The symmetry calms the mind and restores emotional
        balance. In <strong>Tibetan Buddhism</strong>, monks spend days or weeks
        creating sand mandalas, then ceremonially destroy them — reminding us of
        impermanence and mindfulness. Today, mandalas are used in art therapy
        to help reduce <strong>stress</strong> and
        <strong>reconnect</strong> with inner peace.
      </article>

      <figure class="pull-quote">
        <span class="quote-mark" aria-hidden="true">“</span>
        <blockquote>
          Inhale calm.<br />Exhale creation.
        </blockquote>
        <figcaption>
          — <strong>अर्थ</strong> Mala
        </figcaption>
      </figure>
    </section>

    <Ornament />

    <!-- MAKERS -->
    <section id="makers" class="section makers reveal">
      <div class="section-head">
        <span class="eyebrow">The hands behind it</span>
        <h2>Our artisans.</h2>
      </div>
      <p class="makers-lede">
        Every order supports a named artisan in the regions where these
        traditions were born. When you commission a piece, you meet the maker.
        That's the whole point.
      </p>
    </section>

    <!-- CTA -->
    <section id="contact" class="cta-section reveal">
      <div class="cta-ornament" aria-hidden="true">❁</div>
      <h2>Want a piece made for you?</h2>
      <p>Tell us the room, the colour, the feeling. We'll reply within a day.</p>
      <div class="cta-actions">
        <router-link to="/products" class="btn-primary">Start an inquiry</router-link>
        <a
          v-if="waNumber"
          :href="waUrl"
          target="_blank"
          rel="noopener"
          class="btn-ghost"
        >WhatsApp the studio</a>
      </div>
    </section>

  </DefaultLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import Ornament from '@/components/Ornament.vue';
import { usePageMeta } from '@/composables/usePageMeta';
import { useArtworkStore } from '@/stores/artworkstore';
import lippanArt from '/images/lippanart.webp';
import mandalaArt from '/images/mirrorart.webp';
import embroideryArt from '/images/stitchingart.webp';
import crochetArt from '/images/crochetart.webp';

usePageMeta({
  description:
    'अर्थ Mala — Art that Heals. Patterns that Speak. A boutique studio of Indian handcraft: Lipan Art, Mandala, Embroidery and Crochet, each piece made to order.',
});

const router = useRouter();
const artworkStore = useArtworkStore();
const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
const year = new Date().getFullYear();

// Latest 4 artworks, sorted by creation date desc
const latestPieces = computed(() => {
  if (!artworkStore.artworks?.length) return [];
  return [...artworkStore.artworks]
    .sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    })
    .slice(0, 4);
});

const waUrl = computed(
  () =>
    `https://wa.me/${waNumber}?text=${encodeURIComponent(
      "Hi! I came across अर्थ Mala and would love to know more."
    )}`
);

const galleryItems = [
  { label: 'Lipan Art', src: lippanArt },
  { label: 'Mandala', src: mandalaArt },
  { label: 'Embroidery', src: embroideryArt },
  { label: 'Crochet Art', src: crochetArt },
];

const steps = [
  { title: 'You describe it', body: 'Tell us the piece, the space, or just the feeling. We read every word.' },
  { title: 'We sketch', body: 'Within a day, an artisan sends a sketch, palette choices, and a price. You approve, edit, or dream bigger.' },
  { title: 'It is made, slowly', body: 'Seven to fourteen days of hand-work. Progress photos arrive so you can watch your piece come alive.' },
  { title: 'It arrives at your door', body: 'Wrapped in cotton, with a handwritten note naming the maker. You open it, and something settles.' },
];

const DEV_NUMS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
function devanagariNumeral(n) {
  return '०' + DEV_NUMS[n];
}

function goToCategory(category) {
  router.push({ name: 'Products', query: { category } });
}

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Scroll progress bar + back-to-top visibility
const scrollProgress = ref(0);
const showBackToTop = ref(false);
function onScroll() {
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  scrollProgress.value = max > 0 ? Math.min(1, h.scrollTop / max) : 0;
  showBackToTop.value = h.scrollTop > 500;
}

function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Scroll-reveal for sections
let observer = null;
onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Fetch live inventory for the Latest Pieces section (cached in store)
  if (!artworkStore.artworks.length) artworkStore.fetchArtworks();
  if (typeof IntersectionObserver === 'undefined') return;
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          observer.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  observer?.disconnect();
});
</script>

<style lang="css" scoped>
/* ========= Variables scoped inside page ========= */
:deep(html) { scroll-behavior: smooth; }

/* ========= Scroll progress ========= */
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #c3592b, #e8a06c);
  transform-origin: left;
  transform: scaleX(0);
  z-index: 90;
  transition: transform 0.1s linear;
}

/* ========= Back to top ========= */
.back-to-top {
  position: fixed;
  bottom: 5.5rem; /* sit above the floating actions */
  right: 1.25rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #c3592b;
  border: 1px solid rgba(195, 89, 43, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.06),
    0 10px 24px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(6px);
  transition: all 0.25s ease;
  z-index: 45;
}
.back-to-top:hover {
  background: #c3592b;
  color: #faf6f0;
  border-color: #c3592b;
  transform: translateY(-2px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.08),
    0 14px 32px rgba(195, 89, 43, 0.32);
}

.to-top-enter-active,
.to-top-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.to-top-enter-from,
.to-top-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (max-width: 640px) {
  .back-to-top {
    bottom: 5rem;
    right: 0.85rem;
    width: 40px;
    height: 40px;
  }
}

/* ========= Entrance ========= */
.fade-up {
  opacity: 0;
  transform: translateY(16px);
  animation: fadeUp 1.1s ease forwards;
}
@keyframes fadeUp {
  to { opacity: 1; transform: translateY(0); }
}

.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.9s ease, transform 0.9s ease;
}
.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* ========= HERO ========= */
.hero {
  position: relative;
  text-align: center;
  padding: 2.5rem 1.5rem 3rem;
  max-width: 900px;
  margin: 0 auto;
}

.hero-masthead {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #c3592b;
  opacity: 0.65;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 0.8rem;
  letter-spacing: 0.25em;
  text-transform: lowercase;
}
.hero-meta-left { justify-content: flex-end; }
.hero-meta-right { justify-content: flex-start; }
.hero-meta .dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  display: inline-block;
}

.brand-logo {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  gap: 0.05em;
}

.brand-logo strong {
  font-family: 'Tiro Devanagari Hindi', 'Fraunces', Georgia, serif;
  font-size: clamp(4.5rem, 13vw, 9.5rem);
  font-weight: 400;
  color: #c3592b;
  letter-spacing: -0.01em;
  line-height: 1;
}
.brand-latin {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 144, 'SOFT' 80, 'wght' 300;
  font-size: clamp(2rem, 5vw, 3.5rem);
  color: rgba(195, 89, 43, 0.78);
  letter-spacing: 0.02em;
  line-height: 1;
  margin-top: -0.05em;
}

.brand-title {
  display: inline-flex;
  align-items: center;
  gap: 0.85rem;
  margin-top: 1.25rem;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 36, 'SOFT' 50;
  font-size: clamp(0.9rem, 1.35vw, 1.1rem);
  font-weight: 300;
  color: #6b655c;
  letter-spacing: 0.15em;
}
.brand-title .rule {
  width: 36px;
  height: 1px;
  background: #c3592b;
  opacity: 0.45;
  display: inline-block;
}

.hero-lede {
  max-width: 640px;
  margin: 2rem auto 2.5rem;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  font-size: 1.08rem;
  font-weight: 350;
  line-height: 1.85;
  color: #3c3731;
  letter-spacing: 0.01em;
}
.accent { color: #c3592b; font-style: italic; }

.hero-cta {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* ========= Section shell ========= */
.section {
  max-width: 900px;
  margin: 0 auto;
  padding: 3.5rem 1.5rem;
}

.section-head {
  text-align: center;
  margin-bottom: 2.75rem;
}
.eyebrow {
  display: inline-block;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.72rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: #c3592b;
  margin-bottom: 1rem;
}
.section-head h2 {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 144, 'SOFT' 30;
  font-size: clamp(1.65rem, 3.4vw, 2.4rem);
  font-weight: 300;
  margin: 0;
  line-height: 1.25;
  letter-spacing: -0.005em;
  color: #1f1a17;
}

/* ========= Story ========= */
.story-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.75rem;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
}
.story-grid p {
  font-size: 1rem;
  font-weight: 350;
  line-height: 1.95;
  color: #3c3731;
  letter-spacing: 0.008em;
  margin: 0;
}
.drop-cap::first-letter {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 144, 'SOFT' 100;
  font-weight: 300;
  float: left;
  font-size: 3.6em;
  line-height: 0.85;
  padding: 0.15em 0.12em 0 0;
  color: #c3592b;
}

/* ========= Crafts ========= */
.crafts-section { max-width: 1100px; }

.art-gallery {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.gallery-item {
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  outline: none;
  text-align: center;
  transition: transform 0.35s ease;
}
.gallery-item:hover,
.gallery-item:focus-visible {
  transform: translateY(-4px);
}

/* Passe-partout frame: outer cream matting, inner terracotta hairline, inset image */
.gallery-frame {
  position: relative;
  padding: 1.25rem 1.25rem 1.25rem;
  background:
    linear-gradient(135deg, #faf6f0, #efe3ce);
  border: 1px solid rgba(195, 89, 43, 0.18);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.5),
    0 1px 2px rgba(0, 0, 0, 0.05),
    0 14px 34px rgba(195, 89, 43, 0.09);
  overflow: hidden;
  transition: box-shadow 0.35s ease, border-color 0.35s ease, transform 0.35s ease;
}
.gallery-frame::before {
  /* inner terracotta hairline border — the "window" of the mat */
  content: '';
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  bottom: 1rem;
  border: 1px solid rgba(195, 89, 43, 0.35);
  pointer-events: none;
  z-index: 2;
  transition: border-color 0.35s ease;
}
.gallery-item:hover .gallery-frame,
.gallery-item:focus-visible .gallery-frame {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.55),
    0 2px 6px rgba(0, 0, 0, 0.08),
    0 22px 56px rgba(195, 89, 43, 0.22);
  border-color: rgba(195, 89, 43, 0.35);
}
.gallery-item:hover .gallery-frame::before,
.gallery-item:focus-visible .gallery-frame::before {
  border-color: rgba(195, 89, 43, 0.6);
}
.gallery-item:focus-visible .gallery-frame {
  outline: 2px solid #c3592b;
  outline-offset: 4px;
}

.mandala-art {
  display: block;
  width: 100%;
  height: 28em;
  object-fit: cover;
  transition: transform 0.7s ease;
  position: relative;
  z-index: 1;
}
.gallery-item:hover .mandala-art {
  transform: scale(1.035);
}

.gallery-overlay {
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  bottom: 1rem;
  background: linear-gradient(
    to top,
    rgba(31, 26, 23, 0.58),
    rgba(31, 26, 23, 0) 45%
  );
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 1rem;
  opacity: 0;
  transition: opacity 0.35s ease;
  z-index: 3;
}
.gallery-item:hover .gallery-overlay,
.gallery-item:focus-visible .gallery-overlay {
  opacity: 1;
}

.gallery-explore {
  color: #faf6f0;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 0.9rem;
  letter-spacing: 0.15em;
  transform: translateY(6px);
  transition: transform 0.35s ease;
}
.gallery-item:hover .gallery-explore,
.gallery-item:focus-visible .gallery-explore {
  transform: translateY(0);
}

.gallery-label {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 20;
  font-weight: 300;
  font-size: 1rem;
  letter-spacing: 0.15em;
  margin: 1rem 0 0;
  color: #1f1a17;
}

/* ========= Latest Pieces ========= */
.latest-section { max-width: 1100px; }

.latest-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}

.latest-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
  transition: transform 0.35s ease;
}
.latest-card:hover {
  transform: translateY(-4px);
}

.latest-frame {
  position: relative;
  padding: 0.75rem;
  background: linear-gradient(135deg, #faf6f0, #efe3ce);
  border: 1px solid rgba(195, 89, 43, 0.16);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.55),
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 12px 28px rgba(195, 89, 43, 0.08);
  overflow: hidden;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}
.latest-frame::before {
  content: '';
  position: absolute;
  top: 0.55rem;
  left: 0.55rem;
  right: 0.55rem;
  bottom: 0.55rem;
  border: 1px solid rgba(195, 89, 43, 0.32);
  pointer-events: none;
  z-index: 2;
  transition: border-color 0.3s ease;
}
.latest-card:hover .latest-frame {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.6),
    0 2px 5px rgba(0, 0, 0, 0.06),
    0 18px 44px rgba(195, 89, 43, 0.18);
  border-color: rgba(195, 89, 43, 0.35);
}
.latest-card:hover .latest-frame::before {
  border-color: rgba(195, 89, 43, 0.55);
}
.latest-frame img {
  display: block;
  width: 100%;
  height: 18em;
  object-fit: cover;
  transition: transform 0.7s ease;
  position: relative;
  z-index: 1;
}
.latest-card:hover .latest-frame img {
  transform: scale(1.035);
}

.latest-body { padding: 0 0.25rem; }
.latest-title {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 36, 'SOFT' 30;
  font-size: 1.02rem;
  font-weight: 400;
  color: #1f1a17;
  letter-spacing: -0.005em;
  margin-bottom: 0.3rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.latest-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.82rem;
  color: #6b655c;
  font-style: italic;
  letter-spacing: 0.02em;
}
.latest-price {
  color: #c3592b;
  font-style: normal;
  font-weight: 400;
  font-size: 0.95rem;
}

.latest-more {
  text-align: center;
  margin-top: 2.5rem;
}
.text-link {
  color: #c3592b;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.95rem;
  letter-spacing: 0.12em;
  text-decoration: none;
  padding: 0.3rem 0;
  border-bottom: 1px solid rgba(195, 89, 43, 0.35);
  transition: border-color 0.2s ease;
}
.text-link:hover { border-bottom-color: #c3592b; }

/* ========= Process ========= */
.steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}
.steps li {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  padding-bottom: 1.75rem;
  border-bottom: 1px solid rgba(195, 89, 43, 0.15);
  position: relative;
}
.steps li:last-child { border-bottom: none; }

.step-num {
  position: relative;
  font-family: 'Tiro Devanagari Hindi', 'Fraunces', Georgia, serif;
  font-size: 3.5rem;
  font-weight: 400;
  color: #c3592b;
  flex-shrink: 0;
  min-width: 4.5rem;
  line-height: 0.9;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35em 0.2em;
}
.step-num::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    rgba(195, 89, 43, 0.12),
    transparent 70%
  );
  z-index: -1;
}
.step-body {
  padding-top: 0.6rem;
}

.step-body h4 {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 36, 'SOFT' 30;
  font-size: 1.15rem;
  font-weight: 400;
  margin: 0 0 0.5rem;
  letter-spacing: -0.005em;
  color: #1f1a17;
}
.step-body p {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  font-weight: 350;
  margin: 0;
  color: #3c3731;
  line-height: 1.8;
  font-size: 0.97rem;
}

/* ========= Meditation + blockquote ========= */
.meditation {
  max-width: 720px;
}
.meditation-article {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  font-weight: 350;
  font-size: 1rem;
  line-height: 2;
  letter-spacing: 0.01em;
  color: #3c3731;
  text-align: center;
}
.meditation-article strong {
  color: #c3592b;
  font-weight: 400;
}

.pull-quote {
  position: relative;
  margin: 3rem auto 0;
  text-align: center;
  max-width: 520px;
}
.quote-mark {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 144, 'SOFT' 100;
  font-size: 7rem;
  line-height: 1;
  color: rgba(195, 89, 43, 0.28);
  font-weight: 300;
}
.pull-quote blockquote {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 72, 'SOFT' 80;
  font-size: clamp(1.4rem, 2.6vw, 1.85rem);
  font-weight: 300;
  line-height: 1.5;
  color: #1f1a17;
  margin: 0 0 1rem;
  letter-spacing: -0.005em;
}
.pull-quote figcaption {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  color: #9b8e7a;
}
.pull-quote figcaption strong {
  color: #c3592b;
  font-family: 'Tiro Devanagari Hindi', 'Fraunces', Georgia, serif;
  font-style: normal;
  font-weight: 400;
}

/* ========= Makers ========= */
.makers-lede {
  text-align: center;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  font-weight: 350;
  font-size: 1.08rem;
  line-height: 1.9;
  color: #3c3731;
  letter-spacing: 0.015em;
  max-width: 640px;
  margin: 0 auto;
}

/* ========= CTA ========= */
.cta-section {
  position: relative;
  text-align: center;
  background:
    radial-gradient(circle at 20% 20%, rgba(195, 89, 43, 0.08), transparent 55%),
    radial-gradient(circle at 80% 80%, rgba(195, 89, 43, 0.06), transparent 55%),
    linear-gradient(135deg, #fff, #f5ebdd);
  border: 1px solid rgba(195, 89, 43, 0.15);
  border-radius: 12px;
  padding: 4rem 2rem;
  max-width: 860px;
  margin: 3rem auto;
}
.cta-ornament {
  font-size: 1.35rem;
  color: #c3592b;
  opacity: 0.55;
  margin-bottom: 1rem;
}
.cta-section h2 {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 72, 'SOFT' 30;
  font-weight: 300;
  font-size: clamp(1.5rem, 3vw, 2.15rem);
  margin: 0 0 0.85rem;
  color: #1f1a17;
  letter-spacing: -0.005em;
}
.cta-section p {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  font-weight: 350;
  color: #6b655c;
  margin: 0 0 2rem;
  font-size: 1.05rem;
  line-height: 1.75;
}
.cta-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* ========= Buttons ========= */
.btn-primary,
.btn-ghost {
  display: inline-block;
  padding: 0.9rem 1.85rem;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  font-size: 0.95rem;
  letter-spacing: 0.12em;
  border-radius: 2px;
  border: 1px solid;
  text-decoration: none;
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
  box-shadow: 0 8px 22px rgba(195, 89, 43, 0.3);
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

/* ========= Responsive ========= */
@media (max-width: 900px) {
  .art-gallery { grid-template-columns: repeat(2, 1fr); }
  .mandala-art { height: 26em; }
  .latest-grid { grid-template-columns: repeat(2, 1fr); }
  .latest-frame img { height: 16em; }
}

@media (max-width: 640px) {
  .hero { padding-top: 1.5rem; }
  .hero-masthead { grid-template-columns: 1fr; }
  .hero-meta { display: none; }
  .brand-title .rule { width: 24px; }
  .brand-title { gap: 0.5rem; font-size: 0.8rem; letter-spacing: 0.1em; }
  .section { padding: 2.5rem 1.25rem; }
  .story-grid { grid-template-columns: 1fr; gap: 1.5rem; }
  .art-gallery {
    grid-template-columns: 1fr;
    max-width: 340px;
    margin: 0 auto;
  }
  .mandala-art { height: 22em; }
  .latest-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.85rem;
  }
  .latest-frame img { height: 12em; }
  .latest-title { font-size: 0.92rem; }
  .latest-meta { font-size: 0.75rem; }
  .steps li { flex-direction: column; gap: 0.5rem; padding-bottom: 1.5rem; }
  .step-num { font-size: 3rem; }
  .pull-quote { margin-top: 2.5rem; }
  .quote-mark { font-size: 5rem; top: -28px; }
}
</style>
