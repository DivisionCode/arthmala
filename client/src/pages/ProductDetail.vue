<template>
  <DefaultProductPage>
    <div class="detail-page">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <router-link to="/">Home</router-link>
        <span class="crumb-sep" aria-hidden="true">/</span>
        <router-link to="/products">Products</router-link>
        <template v-if="artwork?.category">
          <span class="crumb-sep" aria-hidden="true">/</span>
          <router-link :to="{ name: 'Products', query: { category: artwork.category } }">
            {{ artwork.category }}
          </router-link>
        </template>
        <template v-if="artwork?.title">
          <span class="crumb-sep" aria-hidden="true">/</span>
          <span class="crumb-current">{{ artwork.title }}</span>
        </template>
      </nav>

      <div v-if="loading" class="status">Loading…</div>

      <div v-else-if="error" class="status error">
        {{ error }}
        <button class="retry" @click="loadArtwork">Try again</button>
      </div>

      <div v-else-if="artwork" class="detail-grid">
        <div class="image-col">
          <div
            class="image-wrap"
            :class="{ zooming: isZooming }"
            @mousemove="onMove"
            @mouseenter="isZooming = true"
            @mouseleave="isZooming = false"
            @click="lightboxOpen = true"
          >
            <img
              :src="activeImage"
              :alt="artwork.title"
              decoding="async"
              :style="isZooming ? {
                transform: `scale(2)`,
                transformOrigin: `${zoom.x}% ${zoom.y}%`
              } : {}"
            />
            <span class="zoom-hint">Click to enlarge</span>
          </div>

          <div v-if="gallery.length > 1" class="thumbs" role="tablist">
            <button
              v-for="(src, idx) in gallery"
              :key="src + idx"
              :class="['thumb', { active: activeIdx === idx }]"
              @click="activeIdx = idx"
              :aria-label="`Show image ${idx + 1}`"
              :aria-selected="activeIdx === idx"
              role="tab"
            >
              <img :src="src" :alt="`${artwork.title} ${idx + 1}`" loading="lazy" decoding="async" />
            </button>
          </div>
        </div>

        <div class="info">
          <div class="category-badge">{{ artwork.category }}</div>
          <h1 class="title">{{ artwork.title }}</h1>
          <p class="price">₹{{ artwork.price }}</p>

          <div class="description">
            <p>{{ artwork.description || defaultStory }}</p>
          </div>

          <div class="meta">
            <div class="meta-row">
              <span class="meta-label">Craft</span>
              <span>{{ artwork.category }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Made by</span>
              <span>A traditional artisan · India</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Availability</span>
              <span>Made to order · ships in 7–14 days</span>
            </div>
          </div>

          <div class="actions">
            <button
              class="btn-primary"
              :class="{ added: inquiry.hasItem(artwork._id) }"
              @click="addAndOpen"
            >
              {{ inquiry.hasItem(artwork._id) ? 'In your inquiry ✓' : 'Add to Inquiry' }}
            </button>
            <a v-if="waUrl" class="btn-ghost" :href="waUrl" target="_blank" rel="noopener">
              Ask on WhatsApp
            </a>
          </div>

          <p class="small-note">
            Every piece here is a quiet conversation with tradition. We commission
            from artisans directly — your inquiry begins that dialogue.
          </p>
        </div>
      </div>

      <!-- Lightbox -->
      <teleport to="body">
        <div v-if="lightboxOpen && artwork" class="lightbox" @click="lightboxOpen = false" role="dialog" aria-modal="true">
          <button class="lightbox-close" aria-label="Close">✕</button>
          <img :src="activeImage" :alt="artwork.title" @click.stop />
        </div>
      </teleport>

      <section v-if="related.length" class="related">
        <h3 class="related-title">More from {{ artwork?.category }}</h3>
        <div class="related-grid">
          <router-link
            v-for="item in related"
            :key="item._id"
            :to="{ name: 'ProductDetail', params: { id: item._id } }"
            class="related-card"
          >
            <img :src="item.image" :alt="item.title" loading="lazy" decoding="async" />
            <div class="related-card-body">
              <div class="related-card-title">{{ item.title }}</div>
              <div class="related-card-price">₹{{ item.price }}</div>
            </div>
          </router-link>
        </div>
      </section>
    </div>
  </DefaultProductPage>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import DefaultProductPage from '@/layouts/DefaultProductPage.vue';
import { useArtworkStore } from '@/stores/artworkstore';
import { useInquiryStore } from '@/stores/inquirystore';
import { usePageMeta } from '@/composables/usePageMeta';
import { useJsonLd } from '@/composables/useJsonLd';

const route = useRoute();
const store = useArtworkStore();
const inquiry = useInquiryStore();

const artwork = ref(null);
const loading = ref(false);
const error = ref(null);

const isZooming = ref(false);
const zoom = ref({ x: 50, y: 50 });
const lightboxOpen = ref(false);
const activeIdx = ref(0);

const gallery = computed(() => {
  if (!artwork.value) return [];
  const extras = Array.isArray(artwork.value.images) ? artwork.value.images : [];
  return [artwork.value.image, ...extras.filter(Boolean)];
});

const activeImage = computed(() => gallery.value[activeIdx.value] || artwork.value?.image);

function onMove(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  zoom.value = {
    x: ((e.clientX - rect.left) / rect.width) * 100,
    y: ((e.clientY - rect.top) / rect.height) * 100,
  };
}

usePageMeta(() => {
  if (!artwork.value) return { title: 'Artwork' };
  const a = artwork.value;
  return {
    title: `${a.title} — ${a.category}`,
    description: a.description
      ? a.description.slice(0, 160)
      : `${a.title} — handcrafted ${a.category}. ₹${a.price}. Made to order.`,
    image: a.image,
    type: 'product',
  };
});

// JSON-LD: Product + BreadcrumbList — gives Google rich results for the artwork.
useJsonLd(() => {
  const a = artwork.value;
  if (!a) return null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${origin}/products/${a._id}`;
  const absImage =
    a.image && a.image.startsWith('http')
      ? a.image
      : `${origin}${a.image || ''}`;

  const productGallery = Array.isArray(gallery.value) ? gallery.value : [];
  const absGallery = productGallery.map((src) =>
    src.startsWith('http') ? src : `${origin}${src}`
  );

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${url}#product`,
      name: a.title,
      description:
        a.description ||
        `${a.title} — handcrafted ${a.category}. Made to order by a traditional Indian artisan.`,
      image: absGallery.length ? absGallery : [absImage],
      category: a.category,
      brand: {
        '@type': 'Brand',
        name: 'अर्थ Mala',
      },
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'INR',
        price: Number(a.price) || 0,
        availability: 'https://schema.org/MadeToOrder',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@type': 'Organization', name: 'अर्थ Mala' },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: 'Products', item: `${origin}/products` },
        {
          '@type': 'ListItem',
          position: 3,
          name: a.category,
          item: `${origin}/products?category=${encodeURIComponent(a.category)}`,
        },
        { '@type': 'ListItem', position: 4, name: a.title, item: url },
      ],
    },
  ];
});

const defaultStory = computed(
  () =>
    'A handcrafted piece carrying forward a living tradition. Each curve and knot is placed by hand, not machine — meditation made visible.'
);

const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
const waUrl = computed(() => {
  if (!waNumber || !artwork.value) return null;
  const text = `Hi! I'm interested in "${artwork.value.title}" (${artwork.value.category}). Could you tell me more?`;
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
});

const related = computed(() => {
  if (!artwork.value) return [];
  return store.artworks
    .filter(
      (a) =>
        a._id !== artwork.value._id &&
        a.category?.toLowerCase() === artwork.value.category?.toLowerCase()
    )
    .slice(0, 4);
});

async function loadArtwork() {
  const id = route.params.id;
  if (!id) return;
  loading.value = true;
  error.value = null;
  activeIdx.value = 0;

  const cached = store.artworks.find((a) => a._id === id);
  if (cached) {
    artwork.value = cached;
    loading.value = false;
    if (!store.artworks.length) store.fetchArtworks();
    return;
  }

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/artworks/${id}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Server responded ${res.status}`);
    }
    artwork.value = await res.json();
    if (!store.artworks.length) store.fetchArtworks();
  } catch (err) {
    console.error(err);
    error.value = err.message || 'Unable to load this piece right now.';
  } finally {
    loading.value = false;
  }
}

function addAndOpen() {
  if (!artwork.value) return;
  inquiry.addItem(artwork.value);
}

function onEsc(e) {
  if (e.key === 'Escape' && lightboxOpen.value) lightboxOpen.value = false;
}

onMounted(() => {
  loadArtwork();
  window.addEventListener('keydown', onEsc);
});
onBeforeUnmount(() => window.removeEventListener('keydown', onEsc));
watch(() => route.params.id, loadArtwork);
</script>

<style scoped>
.detail-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 4rem;
}

.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  color: #6b655c;
  margin-bottom: 1.5rem;
  padding: 0.25rem 0;
}
.breadcrumb a {
  color: #6b655c;
  text-decoration: none;
  transition: color 0.2s ease;
  padding: 0.2rem 0;
  border-bottom: 1px solid transparent;
}
.breadcrumb a:hover {
  color: #c3592b;
  border-bottom-color: rgba(195, 89, 43, 0.35);
}
.crumb-sep {
  color: rgba(195, 89, 43, 0.35);
  font-size: 0.85em;
  font-style: normal;
}
.crumb-current {
  color: #1f1a17;
  font-style: normal;
  font-variation-settings: 'opsz' 36, 'SOFT' 30;
  font-weight: 400;
  max-width: 380px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status {
  text-align: center;
  padding: 4rem 1rem;
  color: #6b655c;
}
.status.error { color: #b3261e; }

.retry {
  margin-left: 0.75rem;
  background: transparent;
  color: #c3592b;
  border: 1px solid #c3592b;
  border-radius: 4px;
  padding: 0.35rem 0.9rem;
  cursor: pointer;
  font-family: inherit;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 3rem;
  align-items: start;
}

.image-col {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Passe-partout frame: cream matting + inset terracotta hairline — matches Home crafts */
.image-wrap {
  background: linear-gradient(135deg, #faf6f0, #efe3ce);
  border: 1px solid rgba(195, 89, 43, 0.18);
  border-radius: 6px;
  padding: 1.5rem;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.04),
    0 18px 42px rgba(195, 89, 43, 0.1);
  position: relative;
  overflow: hidden;
  cursor: zoom-in;
  transition: box-shadow 0.35s ease, border-color 0.35s ease;
}
.image-wrap::before {
  content: '';
  position: absolute;
  top: 1.25rem;
  left: 1.25rem;
  right: 1.25rem;
  bottom: 1.25rem;
  border: 1px solid rgba(195, 89, 43, 0.4);
  pointer-events: none;
  z-index: 2;
  transition: border-color 0.35s ease;
}
.image-wrap:hover {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.55),
    0 4px 8px rgba(0, 0, 0, 0.06),
    0 26px 60px rgba(195, 89, 43, 0.18);
  border-color: rgba(195, 89, 43, 0.35);
}
.image-wrap:hover::before {
  border-color: rgba(195, 89, 43, 0.6);
}

.thumbs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.thumb {
  width: 68px;
  height: 68px;
  padding: 3px;
  background: linear-gradient(135deg, #faf6f0, #efe3ce);
  border: 1px solid rgba(195, 89, 43, 0.18);
  border-radius: 3px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}
.thumb:hover {
  border-color: rgba(195, 89, 43, 0.5);
  transform: translateY(-1px);
}
.thumb:hover img {
  transform: scale(1.05);
}
.thumb.active {
  border-color: #c3592b;
  box-shadow: 0 0 0 2px rgba(195, 89, 43, 0.2);
}

.image-wrap img {
  width: 100%;
  height: auto;
  max-height: 640px;
  object-fit: contain;
  display: block;
  transition: transform 0.15s ease-out;
  position: relative;
  z-index: 1;
}

.zoom-hint {
  position: absolute;
  bottom: 1.75rem;
  right: 1.75rem;
  background: rgba(31, 26, 23, 0.78);
  color: #faf6f0;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 0.72rem;
  padding: 0.3rem 0.75rem;
  border-radius: 2px;
  letter-spacing: 0.1em;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 4;
}
.image-wrap:hover .zoom-hint {
  opacity: 1;
}

/* Lightbox */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(31, 26, 23, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 2rem;
  cursor: zoom-out;
}
.lightbox img {
  max-width: 95vw;
  max-height: 92vh;
  object-fit: contain;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.lightbox-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(250, 246, 240, 0.1);
  border: 1px solid rgba(250, 246, 240, 0.3);
  color: #faf6f0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s ease;
}
.lightbox-close:hover {
  background: rgba(250, 246, 240, 0.2);
}

/* Disable hover-zoom on touch devices — lightbox still works via click */
@media (hover: none) {
  .image-wrap img {
    transform: none !important;
  }
  .zoom-hint {
    display: none;
  }
}

.info {
  padding: 0.5rem 0;
  font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  color: #1f1a17;
}

.category-badge {
  display: inline-block;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.72rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #c3592b;
  border: 1px solid rgba(195, 89, 43, 0.55);
  padding: 0.3rem 0.85rem;
  border-radius: 2px;
  margin-bottom: 1.25rem;
}

.title {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 144, 'SOFT' 30;
  font-size: clamp(1.9rem, 3.6vw, 2.5rem);
  font-weight: 300;
  margin: 0 0 0.5rem;
  letter-spacing: -0.005em;
  line-height: 1.2;
}

.price {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 1.35rem;
  color: #c3592b;
  font-weight: 400;
  margin: 0 0 1.75rem;
  letter-spacing: 0.01em;
}

.description p {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  font-weight: 350;
  font-size: 1rem;
  line-height: 1.9;
  color: #3c3731;
  letter-spacing: 0.008em;
  margin: 0 0 2rem;
}

.meta {
  border-top: 1px solid #e9e1d4;
  border-bottom: 1px solid #e9e1d4;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;
  color: #3c3731;
}

.meta-label {
  color: #6b655c;
  letter-spacing: 0.05em;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-ghost {
  padding: 0.9rem 1.75rem;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  font-size: 0.95rem;
  letter-spacing: 0.12em;
  border-radius: 2px;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.25s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
.btn-primary.added {
  background: #1f1a17;
  border-color: #1f1a17;
  box-shadow: 0 4px 12px rgba(31, 26, 23, 0.2);
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

.small-note {
  font-size: 0.85rem;
  font-style: italic;
  color: #6b655c;
  line-height: 1.7;
  letter-spacing: 0.03em;
  margin: 0;
}

.related {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid #e9e1d4;
}

.related-title {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.8rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #c3592b;
  font-weight: 400;
  margin: 0 0 1.75rem;
  text-align: center;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.related-card {
  background: #fff;
  border: 1px solid #e9e1d4;
  border-radius: 6px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  display: block;
}

.related-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.related-card img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}

.related-card-body {
  padding: 0.75rem;
}

.related-card-title {
  font-size: 0.9rem;
  color: #1f1a17;
  margin-bottom: 0.25rem;
}

.related-card-price {
  font-size: 0.85rem;
  color: #c3592b;
}

@media (max-width: 840px) {
  .detail-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .title { font-size: 1.75rem; }
}
</style>
