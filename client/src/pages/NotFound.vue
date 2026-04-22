<template>
  <DefaultProductPage>
    <div class="nf">
      <Ornament />

      <span class="eyebrow">Four-Oh-Four</span>
      <h1>This path is empty.</h1>
      <p>
        The page you sought seems to have drifted elsewhere —
        perhaps taken by the wind, like grains of a sand mandala.
      </p>
      <p class="small">Nothing is lost. Let us guide you back.</p>

      <div class="nf-actions">
        <router-link class="btn-primary" to="/">Return home</router-link>
        <router-link class="btn-ghost" to="/products">Browse the collection</router-link>
      </div>
    </div>
  </DefaultProductPage>
</template>

<script setup>
import DefaultProductPage from '@/layouts/DefaultProductPage.vue';
import Ornament from '@/components/Ornament.vue';
import { usePageMeta } from '@/composables/usePageMeta';

usePageMeta({ title: 'Page not found' });
</script>

<style scoped>
.nf {
  max-width: 540px;
  margin: 0 auto;
  padding: 5rem 1.5rem 4rem;
  text-align: center;
  font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
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
  font-size: clamp(1.85rem, 4vw, 2.5rem);
  font-weight: 300;
  margin: 0 0 1rem;
  letter-spacing: -0.005em;
  line-height: 1.2;
}

p {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 80;
  font-weight: 350;
  font-style: italic;
  color: #3c3731;
  line-height: 1.85;
  margin: 0 0 1rem;
  letter-spacing: 0.01em;
  font-size: 1rem;
}
p.small {
  color: #6b655c;
  font-size: 0.92rem;
  margin-bottom: 2rem;
}

.nf-actions {
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
