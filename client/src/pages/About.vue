<template>
  <DefaultLayout>
    <div class="about">
      <header class="about-head fade-up">
        <span class="eyebrow">About</span>
        <h1>
          <strong>अर्थ</strong> Mala
        </h1>
        <p class="tagline">Art that Heals. Patterns that Speak.</p>
      </header>

      <section class="section fade-up" style="animation-delay: 0.15s">
        <h2>Why we exist</h2>
        <p>
          अर्थ Mala began with a simple belief —
          <em>a handmade object carries a little of the maker's breath</em>.
          In a world of uniform things, we wanted to keep that breath alive;
          to find the artisans still practising old traditions of this land,
          and to help their work find its way into modern homes.
        </p>
      </section>

      <section class="section fade-up" style="animation-delay: 0.3s">
        <h2>The word</h2>
        <p>
          <strong>अर्थ (Arth)</strong> in Hindi means <em>meaning</em>, <em>essence</em>, <em>purpose</em>.
          <strong>Mala</strong> is a garland of beads used in meditation —
          each bead a pause, a breath, a return.
        </p>
        <p>
          Together, <strong>अर्थ Mala</strong> is a garland of meaning —
          a small chain of handmade things you can hold, look at, and live with.
        </p>
      </section>

      <section class="section fade-up" style="animation-delay: 0.45s">
        <h2>What we make</h2>
        <ul class="crafts-list">
          <li><strong>Lipan Art</strong> — mirror-and-mud work from Kutch, Gujarat.</li>
          <li><strong>Mandala</strong> — sacred geometry on canvas and paper.</li>
          <li><strong>Embroidery</strong> — colour and patience in thread.</li>
          <li><strong>Crochet Art</strong> — yarn turned into softness and play.</li>
        </ul>
      </section>

      <section class="section fade-up" style="animation-delay: 0.6s">
        <h2>How we work</h2>
        <p>
          Most of our pieces are <em>made to order</em>. You send an inquiry; an artisan sends a sketch; you agree on the piece, the price, and the time it will take. We believe a little slowness is a feature, not a flaw.
        </p>
        <p>
          Every order supports a named maker. When your package arrives, it comes with a handwritten note telling you whose hands touched it last.
        </p>
      </section>

      <section class="cta fade-up" style="animation-delay: 0.75s">
        <h2>Come closer.</h2>
        <p>Browse the work, or start an inquiry for something made for you.</p>
        <div class="cta-actions">
          <router-link to="/products" class="btn-primary">See the work</router-link>
          <router-link to="/#story" class="btn-ghost">Read our story</router-link>
        </div>
      </section>

    </div>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { usePageMeta } from '@/composables/usePageMeta';

usePageMeta({
  title: 'About us',
  description:
    'अर्थ Mala is a boutique studio working with Indian artisans to make Lipan Art, Mandala, Embroidery and Crochet pieces on commission.',
});

</script>

<style scoped>
.about {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  font-weight: 350;
  color: #1f1a17;
  line-height: 1.85;
  letter-spacing: 0.008em;
}

.fade-up {
  opacity: 0;
  transform: translateY(16px);
  animation: fadeUp 1s ease forwards;
}
@keyframes fadeUp {
  to { opacity: 1; transform: translateY(0); }
}

.about-head {
  text-align: center;
  margin-bottom: 3rem;
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
  margin-bottom: 0.75rem;
}
.about-head h1 {
  font-family: 'Tiro Devanagari Hindi', 'Fraunces', Georgia, serif;
  font-size: clamp(3rem, 8vw, 5rem);
  font-weight: 400;
  margin: 0;
  letter-spacing: -0.01em;
  color: rgba(195, 89, 43, 0.72);
  line-height: 1.1;
}
.about-head h1 strong {
  color: #c3592b;
  font-weight: 400;
}
.tagline {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 36, 'SOFT' 50;
  font-weight: 300;
  color: #6b655c;
  letter-spacing: 0.12em;
  margin-top: 0.75rem;
  font-size: 1.05rem;
}

.section {
  margin-bottom: 2.75rem;
  border-bottom: 1px solid rgba(195, 89, 43, 0.15);
  padding-bottom: 2.5rem;
}
.section:last-of-type { border-bottom: none; }

.section h2 {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #c3592b;
  margin: 0 0 1.25rem;
}

.section p {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: #3c3731;
  line-height: 1.9;
}
.section p:last-child { margin-bottom: 0; }
.section strong {
  color: #c3592b;
  font-family: 'Tiro Devanagari Hindi', 'Fraunces', Georgia, serif;
  font-weight: 400;
}
.section em {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14, 'SOFT' 80;
  color: #6b655c;
}

.crafts-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.crafts-list li {
  padding: 0.9rem 1.1rem;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(195, 89, 43, 0.12);
  border-left: 3px solid #c3592b;
  border-radius: 0 4px 4px 0;
  font-size: 0.98rem;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.crafts-list li:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 14px rgba(195, 89, 43, 0.08);
}

.cta {
  text-align: center;
  background:
    radial-gradient(circle at 30% 30%, rgba(195, 89, 43, 0.08), transparent 55%),
    radial-gradient(circle at 70% 70%, rgba(195, 89, 43, 0.06), transparent 55%),
    rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(195, 89, 43, 0.15);
  padding: 2.75rem 1.5rem;
  border-radius: 8px;
  margin-top: 3rem;
}
.cta h2 {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 72, 'SOFT' 30;
  font-size: clamp(1.4rem, 2.6vw, 1.85rem);
  font-weight: 300;
  letter-spacing: -0.005em;
  color: #1f1a17;
  text-transform: none;
  margin: 0 0 0.75rem;
}
.cta p {
  color: #6b655c;
  margin: 0 0 1.75rem;
  font-size: 1rem;
  line-height: 1.7;
}
.cta-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary, .btn-ghost {
  display: inline-block;
  padding: 0.85rem 1.75rem;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  font-size: 0.93rem;
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

</style>
