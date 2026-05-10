<template>
  <DefaultProductPage>
    <div class="product-page">
      <header class="page-head">
        <span class="eyebrow">The collection</span>
        <h1 class="heading">
          {{ route.query.category || 'Everything we make' }}
        </h1>
        <p class="sub" v-if="!store.loading && filteredArtworks.length">
          {{ filteredArtworks.length }} piece{{ filteredArtworks.length === 1 ? '' : 's' }} · handmade, to order
        </p>
      </header>

      <div
        v-if="!store.loading && filteredArtworks.length > 1"
        class="sort-bar"
      >
        <label for="sort-select" class="sort-label"><em>Sort</em></label>
        <select id="sort-select" v-model="sortBy" class="sort-select">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="price-asc">Price · low to high</option>
          <option value="price-desc">Price · high to low</option>
          <option value="title">By name</option>
        </select>
      </div>

      <!-- Shimmer skeletons while loading -->
      <div v-if="store.loading" class="gallery">
        <div v-for="n in 6" :key="n" class="card skeleton" aria-hidden="true">
          <div class="card-image">
            <div class="sk-img"></div>
          </div>
          <div class="card-body">
            <div class="sk-line sk-line-title"></div>
            <div class="sk-line sk-line-desc"></div>
            <div class="sk-line sk-line-desc short"></div>
            <div class="card-foot">
              <div class="sk-line sk-line-price"></div>
              <div class="sk-pill"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="store.error" class="status error">
        {{ store.error }}
        <button class="retry" @click="store.fetchArtworks()">Try again</button>
      </div>

      <div v-else-if="filteredArtworks.length === 0" class="status empty">
        <div class="empty-glyph" aria-hidden="true">❁</div>
        <p>Nothing in this category yet — but every piece here begins as an inquiry.</p>
        <button class="retry" @click="inquiry.openDrawer()">Open an inquiry</button>
      </div>

      <div v-else class="gallery">
        <article
          class="card"
          v-for="art in filteredArtworks"
          :key="art._id"
          @click="goToDetail(art._id)"
          tabindex="0"
          role="link"
          @keyup.enter="goToDetail(art._id)"
        >
          <div class="card-image">
            <img :src="art.image" :alt="art.title" loading="lazy" decoding="async" />
          </div>
          <div class="card-body">
            <h2>{{ art.title }}</h2>
            <p class="desc" v-if="art.description">{{ art.description }}</p>
            <div class="card-foot">
              <span class="price">₹{{ art.price }}</span>
              <button
                class="add-btn"
                :class="{ added: inquiry.hasItem(art._id) }"
                @click.stop="inquiry.addItem(art)"
              >
                {{ inquiry.hasItem(art._id) ? 'Added ✓' : 'Add to Inquiry' }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </DefaultProductPage>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DefaultProductPage from '@/layouts/DefaultProductPage.vue';
import { useArtworkStore } from '@/stores/artworkstore';
import { useInquiryStore } from '@/stores/inquirystore';
import { usePageMeta } from '@/composables/usePageMeta';

const route = useRoute();
const router = useRouter();
const store = useArtworkStore();
const inquiry = useInquiryStore();

usePageMeta(() => {
  const cat = route.query.category;
  return {
    title: cat ? `${cat} — handcrafted` : 'The Collection',
    description: cat
      ? `Browse our ${cat} pieces — handcrafted, made to order, rooted in tradition.`
      : 'Browse handcrafted Indian art. Each piece made by hand, on commission.',
  };
});

function goToDetail(id) {
  router.push({ name: 'ProductDetail', params: { id } });
}

const category = computed(() => route.query.category?.toLowerCase());

const SORT_KEY = 'arthmala_products_sort_v1';
const sortBy = ref(
  typeof localStorage !== 'undefined'
    ? localStorage.getItem(SORT_KEY) || 'newest'
    : 'newest'
);
watch(sortBy, (v) => {
  try {
    localStorage.setItem(SORT_KEY, v);
  } catch {
    /* quota/private mode — non-fatal */
  }
});

const filteredArtworks = computed(() => {
  if (!store.artworks) return [];
  const catLower = category.value;
  const base = catLower
    ? store.artworks.filter((a) => a.category?.toLowerCase() === catLower)
    : store.artworks;

  const arr = [...base];
  switch (sortBy.value) {
    case 'oldest':
      arr.sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      );
      break;
    case 'price-asc':
      arr.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case 'price-desc':
      arr.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case 'title':
      arr.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;
    default:
      // newest first
      arr.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
  }
  return arr;
});

onMounted(() => {
  if (!store.artworks.length) store.fetchArtworks();
});
</script>

<style lang="css" scoped>
.product-page {
  padding: 2rem 1.5rem 4rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
}

.page-head {
  text-align: center;
  margin-bottom: 3rem;
}
.eyebrow {
  display: inline-block;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.72rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: #c3592b;
  margin-bottom: 0.85rem;
}
.heading {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 144, 'SOFT' 30;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 300;
  letter-spacing: -0.01em;
  margin: 0;
  color: #1f1a17;
  text-transform: capitalize;
  line-height: 1.15;
}
.sub {
  margin: 0.75rem 0 0;
  font-style: italic;
  font-size: 0.92rem;
  color: #6b655c;
  letter-spacing: 0.05em;
}

.sort-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
}
.sort-label {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 0.78rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #c3592b;
}
.sort-label em {
  font-style: italic;
  font-variation-settings: 'opsz' 14;
}
.sort-select {
  padding: 0.5rem 2.2rem 0.5rem 0.85rem;
  border: 1px solid rgba(195, 89, 43, 0.22);
  border-radius: 2px;
  background-color: rgba(255, 255, 255, 0.7);
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c3592b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 0.6rem center;
  background-size: 14px;
  appearance: none;
  -webkit-appearance: none;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  font-size: 0.88rem;
  color: #1f1a17;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.25s ease;
}
.sort-select:hover,
.sort-select:focus {
  outline: none;
  border-color: #c3592b;
  box-shadow: 0 0 0 2px rgba(195, 89, 43, 0.15);
}

.status {
  text-align: center;
  padding: 4rem 1rem;
  color: #6b655c;
  font-size: 1rem;
  font-style: italic;
  letter-spacing: 0.03em;
}
.status.error { color: #b3261e; }

.status.empty {
  padding: 4rem 1.5rem;
  background:
    radial-gradient(circle at 30% 30%, rgba(195, 89, 43, 0.06), transparent 55%),
    rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(195, 89, 43, 0.15);
  border-radius: 10px;
  max-width: 520px;
  margin: 0 auto;
}
.empty-glyph {
  font-size: 2.25rem;
  color: #c3592b;
  opacity: 0.6;
  margin-bottom: 0.75rem;
}
.status.empty p {
  font-style: normal;
  line-height: 1.75;
  margin: 0 0 1.5rem;
}

.retry {
  display: inline-block;
  margin-left: 0;
  background: transparent;
  color: #c3592b;
  border: 1px solid #c3592b;
  border-radius: 2px;
  padding: 0.6rem 1.25rem;
  cursor: pointer;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  font-size: 0.88rem;
  letter-spacing: 0.1em;
  transition: all 0.25s ease;
}
.status:not(.empty) .retry {
  margin-left: 0.75rem;
}
.retry:hover {
  background: #c3592b;
  color: #faf6f0;
  box-shadow: 0 6px 18px rgba(195, 89, 43, 0.22);
}

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 1.5rem;
}

.card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(195, 89, 43, 0.12);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
  cursor: pointer;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.5),
    0 1px 2px rgba(0, 0, 0, 0.04);
}

.card:hover,
.card:focus-visible {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.6),
    0 14px 36px rgba(195, 89, 43, 0.15);
  border-color: rgba(195, 89, 43, 0.3);
  transform: translateY(-3px);
  outline: none;
}

.card-image {
  position: relative;
  overflow: hidden;
  background: #faf6f0;
}

.card-image img {
  width: 100%;
  height: 280px;
  object-fit: cover;
  display: block;
  transition: transform 0.7s ease;
}
.card:hover .card-image img,
.card:focus-visible .card-image img {
  transform: scale(1.04);
}

.card-body {
  padding: 1.1rem 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.card h2 {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 36, 'SOFT' 30;
  font-size: 1.15rem;
  font-weight: 400;
  margin: 0;
  color: #1f1a17;
  letter-spacing: -0.005em;
  line-height: 1.3;
}

.desc {
  font-size: 0.88rem;
  font-weight: 350;
  color: #6b655c;
  line-height: 1.65;
  margin: 0;
  flex: 1;
  letter-spacing: 0.005em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(195, 89, 43, 0.1);
}

.price {
  color: #c3592b;
  font-weight: 400;
  font-size: 1.05rem;
  letter-spacing: 0.01em;
}

.add-btn {
  background: transparent;
  color: #c3592b;
  border: 1px solid #c3592b;
  padding: 0.5rem 0.95rem;
  border-radius: 2px;
  font-size: 0.78rem;
  cursor: pointer;
  letter-spacing: 0.12em;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  transition: all 0.25s ease;
}
.add-btn:hover {
  background: #c3592b;
  color: #faf6f0;
  box-shadow: 0 4px 14px rgba(195, 89, 43, 0.25);
}
.add-btn.added {
  background: #1f1a17;
  color: #faf6f0;
  border-color: #1f1a17;
  box-shadow: 0 2px 8px rgba(31, 26, 23, 0.15);
}

/* ===== Skeleton shimmer ===== */
.card.skeleton {
  cursor: default;
  pointer-events: none;
  background: #fff;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.5),
    0 1px 2px rgba(0, 0, 0, 0.03);
}
.card.skeleton:hover {
  transform: none;
  border-color: rgba(195, 89, 43, 0.12);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.5),
    0 1px 2px rgba(0, 0, 0, 0.03);
}

@keyframes shimmer {
  0% { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}

.sk-img,
.sk-line,
.sk-pill {
  background:
    linear-gradient(
      90deg,
      rgba(195, 89, 43, 0.08) 0%,
      rgba(195, 89, 43, 0.18) 50%,
      rgba(195, 89, 43, 0.08) 100%
    );
  background-size: 1200px 100%;
  animation: shimmer 1.8s infinite linear;
  border-radius: 3px;
}
.sk-img {
  width: 100%;
  height: 280px;
  border-radius: 0;
}
.sk-line {
  height: 12px;
  width: 80%;
}
.sk-line-title {
  height: 18px;
  width: 60%;
  margin-bottom: 0.5rem;
}
.sk-line-desc { width: 100%; }
.sk-line-desc.short { width: 65%; }
.sk-line-price {
  width: 60px;
  height: 14px;
}
.sk-pill {
  width: 95px;
  height: 30px;
  border-radius: 2px;
}

@media (max-width: 640px) {
  .product-page {
    padding: 1.25rem 1rem 3rem;
  }
  .page-head {
    margin-bottom: 1.75rem;
  }
  .sort-bar {
    justify-content: stretch;
    align-items: stretch;
    flex-direction: column;
    gap: 0.4rem;
  }
  .sort-select {
    width: 100%;
  }
  .gallery {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .card-image img,
  .card-image .sk-img {
    height: auto;
    min-height: 220px;
    max-height: 320px;
  }
  .card-foot {
    align-items: stretch;
    flex-direction: column;
  }
  .add-btn {
    width: 100%;
  }
}
</style>
