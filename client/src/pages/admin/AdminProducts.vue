<template>
  <div class="products-tab">
    <section class="catalog-hero">
      <div>
        <span class="section-kicker">Catalog studio</span>
        <h2>Artworks, pricing, and gallery images.</h2>
        <p>
          Add new pieces, update product stories, and keep the public collection
          ready for customers.
        </p>
      </div>
      <div class="hero-actions">
        <button class="btn-primary" @click="openNew">
          <span aria-hidden="true">+</span>
          New artwork
        </button>
        <button class="btn-ghost" @click="load" :disabled="loading">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>
    </section>

    <div class="stats-strip" aria-label="Catalog summary">
      <div class="stat">
        <span class="stat-value">{{ items.length }}</span>
        <span class="stat-label">Artworks</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ categories.length }}</span>
        <span class="stat-label">Crafts</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ totalGalleryImages }}</span>
        <span class="stat-label">Gallery images</span>
      </div>
    </div>

    <div class="catalog-tools">
      <label class="search-field">
        <span>Search</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Title, category, description..."
        />
      </label>
      <label class="filter-field">
        <span>Craft</span>
        <select v-model="categoryFilter">
          <option value="all">All crafts</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>
    </div>

    <p v-if="error" class="error-banner">{{ error }}</p>

    <div v-if="loading && !items.length" class="empty">Loading…</div>
    <div v-else-if="!filteredItems.length" class="empty-state">
      <div class="empty-mark" aria-hidden="true">अ</div>
      <h3>{{ items.length ? 'No matching artworks' : 'No artworks yet' }}</h3>
      <p>
        {{
          items.length
            ? 'Try another search or show all crafts.'
            : 'Create the first catalog piece with images, price, craft, and story.'
        }}
      </p>
      <button v-if="!items.length" class="btn-primary" @click="openNew">Add artwork</button>
    </div>

    <ul v-else class="prod-grid">
      <li v-for="item in filteredItems" :key="item._id" class="prod-card">
        <div class="prod-media">
          <img :src="item.image" :alt="item.title" />
          <span v-if="item.images?.length" class="image-count">
            {{ item.images.length + 1 }} images
          </span>
        </div>
        <div class="prod-content">
          <div class="prod-topline">
            <span class="craft-pill">{{ item.category }}</span>
            <span class="prod-price">₹{{ Number(item.price || 0).toLocaleString('en-IN') }}</span>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description || 'No product story added yet.' }}</p>
          <div class="prod-actions">
            <router-link
              class="mini-btn quiet"
              :to="{ name: 'ProductDetail', params: { id: item._id } }"
            >
              View
            </router-link>
            <button class="mini-btn" @click="openEdit(item)">Edit</button>
            <button class="mini-btn danger" @click="remove(item)" :disabled="busy === item._id">
              {{ busy === item._id ? '...' : 'Delete' }}
            </button>
          </div>
        </div>
      </li>
    </ul>

    <!-- Modal -->
    <teleport to="body">
      <div v-if="formOpen" class="overlay" @click.self="closeForm">
        <div class="modal" role="dialog" aria-modal="true">
          <header class="modal-head">
            <div>
              <span class="section-kicker">{{ editing ? 'Catalog edit' : 'New catalog piece' }}</span>
              <h3>{{ editing ? 'Update artwork' : 'Add artwork' }}</h3>
            </div>
            <button class="close" @click="closeForm" aria-label="Close">✕</button>
          </header>

          <form @submit.prevent="save" class="form">
            <div class="form-grid">
              <section class="image-panel">
                <div
                  class="primary-drop"
                  :class="{ filled: form.image, invalid: primaryError }"
                  @dragover.prevent
                  @drop.prevent="onPrimaryDrop"
                >
                  <img
                    v-if="form.image"
                    :src="form.image"
                    alt="Primary artwork preview"
                    @error="primaryError = true"
                    @load="primaryError = false"
                  />
                  <div v-else class="drop-empty">
                    <span class="drop-icon" aria-hidden="true">+</span>
                    <strong>Primary image</strong>
                    <em>Drop an image here or upload a file.</em>
                  </div>
                  <span v-if="primaryError" class="preview-err">Image could not load.</span>
                </div>

                <div class="upload-row">
                  <button
                    type="button"
                    class="mini-upload"
                    @click="primaryFile?.click()"
                    :disabled="uploadingPrimary"
                  >
                    {{ uploadingPrimary ? 'Uploading...' : 'Upload primary' }}
                  </button>
                  <button
                    v-if="form.image"
                    type="button"
                    class="mini-btn quiet"
                    @click="form.image = ''"
                  >
                    Remove
                  </button>
                </div>

                <input
                  ref="primaryFile"
                  type="file"
                  accept="image/*"
                  class="hidden-file"
                  @change="onPrimaryFile"
                />
                <label class="field-label">
                  Image URL <span class="req">*</span>
                  <input
                    v-model="form.image"
                    placeholder="https://..."
                    class="url-input"
                    required
                  />
                </label>

                <div class="field">
                  <div class="field-head">
                    <label class="field-label">Gallery images</label>
                    <span class="field-note">{{ form.images.length }} added</span>
                  </div>
                  <button
                    type="button"
                    class="mini-upload"
                    @click="extraFile?.click()"
                    :disabled="uploadingExtra"
                  >
                    {{ uploadingExtra ? 'Uploading...' : 'Add gallery images' }}
                  </button>

                  <input
                    ref="extraFile"
                    type="file"
                    accept="image/*"
                    class="hidden-file"
                    multiple
                    @change="onExtraFiles"
                  />
                  <div class="extras-grid" v-if="form.images.length">
                    <div v-for="(src, idx) in form.images" :key="idx" class="extra">
                      <img :src="src" alt="Gallery artwork preview" />
                      <button type="button" class="extra-remove" @click="removeExtra(idx)" aria-label="Remove image">✕</button>
                    </div>
                  </div>
                  <p v-else class="extras-empty">Secondary images appear as thumbnails on the product page.</p>
                </div>
              </section>

              <section class="details-panel">
                <label class="field-label">
                  Title <span class="req">*</span>
                  <input v-model="form.title" required maxlength="200" placeholder="Mandala mirror panel" />
                </label>

                <div class="row">
                  <label class="field-label">
                    Category <span class="req">*</span>
                    <select v-model="form.category" required>
                      <option disabled value="">Select...</option>
                      <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </label>

                  <label class="field-label">
                    Price (₹) <span class="req">*</span>
                    <input
                      type="number"
                      v-model.number="form.price"
                      min="0"
                      step="1"
                      required
                    />
                  </label>
                </div>

                <label class="field-label">
                  Description
                  <textarea
                    v-model="form.description"
                    rows="8"
                    placeholder="Materials, technique, dimensions, customisation notes, and the story behind this piece."
                  ></textarea>
                </label>
              </section>
            </div>

            <p v-if="formError" class="form-error">{{ formError }}</p>

            <div class="modal-actions">
              <button type="button" class="btn-ghost" @click="closeForm" :disabled="submitting">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="submitting || uploadingPrimary || uploadingExtra">
                {{ submitting ? 'Saving...' : editing ? 'Save changes' : 'Add artwork' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useArtworkStore } from '@/stores/artworkstore';

const props = defineProps({
  token: { type: String, required: true },
});
const emit = defineEmits(['unauthorized']);

const API = import.meta.env.VITE_API_URL || '';
const artworkStore = useArtworkStore();

const items = ref([]);
const categories = ref([]);
const loading = ref(false);
const error = ref('');
const busy = ref(null);
const searchQuery = ref('');
const categoryFilter = ref('all');

const formOpen = ref(false);
const editing = ref(null);
const submitting = ref(false);
const formError = ref('');
const primaryError = ref(false);
const uploadingPrimary = ref(false);
const uploadingExtra = ref(false);

const primaryFile = ref(null);
const extraFile = ref(null);

const form = reactive({
  title: '',
  image: '',
  images: [],
  category: '',
  price: 0,
  description: '',
});

const totalGalleryImages = computed(() =>
  items.value.reduce((sum, item) => sum + 1 + (item.images?.length || 0), 0)
);

const filteredItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return items.value.filter((item) => {
    const matchesCategory =
      categoryFilter.value === 'all' || item.category === categoryFilter.value;
    const haystack = [
      item.title,
      item.category,
      item.description,
      item.price,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return matchesCategory && (!q || haystack.includes(q));
  });
});

function resetForm() {
  form.title = '';
  form.image = '';
  form.images = [];
  form.category = '';
  form.price = 0;
  form.description = '';
  formError.value = '';
  primaryError.value = false;
}

function openNew() {
  editing.value = null;
  resetForm();
  formOpen.value = true;
}

function openEdit(item) {
  editing.value = item;
  form.title = item.title ?? '';
  form.image = item.image ?? '';
  form.images = Array.isArray(item.images) ? [...item.images] : [];
  form.category = item.category ?? '';
  form.price = item.price ?? 0;
  form.description = item.description ?? '';
  formError.value = '';
  primaryError.value = false;
  formOpen.value = true;
}

function closeForm() {
  formOpen.value = false;
}

async function uploadOne(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API}/api/uploads`, {
    method: 'POST',
    headers: { 'x-admin-token': props.token },
    body: fd,
  });
  if (res.status === 401) {
    emit('unauthorized');
    throw new Error('Unauthorized.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data.url;
}

async function uploadPrimaryFile(file) {
  if (!file) return;
  uploadingPrimary.value = true;
  formError.value = '';
  try {
    form.image = await uploadOne(file);
  } catch (err) {
    formError.value = err.message;
  } finally {
    uploadingPrimary.value = false;
    if (primaryFile.value) primaryFile.value.value = '';
  }
}

function onPrimaryFile(e) {
  uploadPrimaryFile(e.target.files?.[0]);
}

function onPrimaryDrop(e) {
  uploadPrimaryFile(e.dataTransfer.files?.[0]);
}

async function onExtraFiles(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  uploadingExtra.value = true;
  formError.value = '';
  try {
    for (const file of files) {
      const url = await uploadOne(file);
      form.images.push(url);
    }
  } catch (err) {
    formError.value = err.message;
  } finally {
    uploadingExtra.value = false;
    if (extraFile.value) extraFile.value.value = '';
  }
}

function removeExtra(idx) {
  form.images.splice(idx, 1);
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [artsRes, catsRes] = await Promise.all([
      fetch(`${API}/api/artworks`),
      fetch(`${API}/api/artworks/categories`),
    ]);
    if (!artsRes.ok) throw new Error(`Server responded ${artsRes.status}`);
    const artworks = await artsRes.json();
    items.value = artworks;
    artworkStore.setArtworks(artworks);
    if (catsRes.ok) categories.value = await catsRes.json();
  } catch (err) {
    error.value = err.message || 'Failed to load.';
  } finally {
    loading.value = false;
  }
}

async function save() {
  submitting.value = true;
  formError.value = '';
  try {
    const url = editing.value
      ? `${API}/api/artworks/${editing.value._id}`
      : `${API}/api/artworks`;
    const method = editing.value ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': props.token,
      },
      body: JSON.stringify({
        title: form.title.trim(),
        image: form.image.trim(),
        images: form.images.filter(Boolean),
        category: form.category,
        price: Number(form.price),
        description: form.description.trim(),
      }),
    });
    if (res.status === 401) {
      emit('unauthorized');
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      formError.value = data.error || `Server responded ${res.status}`;
      return;
    }
    if (editing.value) {
      const idx = items.value.findIndex((i) => i._id === editing.value._id);
      if (idx !== -1) items.value[idx] = data;
    } else {
      items.value.unshift(data);
    }
    artworkStore.upsertArtwork(data);
    closeForm();
  } catch (err) {
    formError.value = err.message || 'Network error.';
  } finally {
    submitting.value = false;
  }
}

async function remove(item) {
  if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
  busy.value = item._id;
  error.value = '';
  try {
    const res = await fetch(`${API}/api/artworks/${item._id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': props.token },
    });
    if (res.status === 401) {
      emit('unauthorized');
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Server responded ${res.status}`);
    }
    items.value = items.value.filter((i) => i._id !== item._id);
    artworkStore.removeArtwork(item._id);
  } catch (err) {
    error.value = err.message || 'Failed to delete.';
  } finally {
    busy.value = null;
  }
}

defineExpose({ load });
onMounted(load);
</script>

<style scoped>
.products-tab {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
}

.catalog-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.3rem;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(250, 246, 240, 0.72)),
    radial-gradient(circle at 90% 15%, rgba(195, 89, 43, 0.12), transparent 40%);
  border: 1px solid rgba(195, 89, 43, 0.14);
  border-radius: 8px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.65),
    0 10px 28px rgba(86, 55, 34, 0.07);
}
.section-kicker {
  display: inline-block;
  color: #c3592b;
  font-size: 0.68rem;
  font-style: italic;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}
.catalog-hero h2 {
  margin: 0.35rem 0 0;
  color: #1f1a17;
  font-size: clamp(1.45rem, 3vw, 2rem);
  font-weight: 350;
  line-height: 1.15;
}
.catalog-hero p {
  max-width: 520px;
  margin: 0.55rem 0 0;
  color: #6b655c;
  font-size: 0.92rem;
  line-height: 1.65;
}
.hero-actions {
  display: flex;
  gap: 0.65rem;
  flex-shrink: 0;
}

.stats-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}
.stat {
  padding: 0.9rem 1rem;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(195, 89, 43, 0.12);
  border-radius: 7px;
}
.stat-value {
  display: block;
  color: #1f1a17;
  font-size: 1.35rem;
  line-height: 1;
}
.stat-label {
  display: block;
  margin-top: 0.35rem;
  color: #6b655c;
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.catalog-tools {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(160px, 220px);
  gap: 0.75rem;
}
.search-field,
.filter-field,
.field-label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: #6b655c;
  font-size: 0.74rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.search-field input,
.filter-field select,
.field-label input,
.field-label select,
.field-label textarea,
.url-input {
  width: 100%;
  min-height: 42px;
  padding: 0.65rem 0.8rem;
  border: 1px solid rgba(111, 91, 73, 0.25);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.84);
  color: #1f1a17;
  font-family: inherit;
  font-size: 0.95rem;
  letter-spacing: 0;
  text-transform: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.search-field input:focus,
.filter-field select:focus,
.field-label input:focus,
.field-label select:focus,
.field-label textarea:focus,
.url-input:focus {
  outline: none;
  background: #fff;
  border-color: rgba(195, 89, 43, 0.7);
  box-shadow: 0 0 0 3px rgba(195, 89, 43, 0.12);
}
.field-label textarea {
  min-height: 170px;
  resize: vertical;
  line-height: 1.55;
}

.error-banner {
  background: #fff3f0;
  border: 1px solid #f3c8bf;
  color: #b3261e;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.empty { text-align: center; padding: 4rem 1rem; color: #6b655c; }

.empty-state {
  padding: 3rem 1.5rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.72);
  border: 1px dashed rgba(195, 89, 43, 0.24);
  border-radius: 8px;
}
.empty-mark {
  width: 48px;
  height: 48px;
  margin: 0 auto 0.8rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #c3592b;
  background: rgba(195, 89, 43, 0.08);
  font-family: 'Tiro Devanagari Hindi', Georgia, serif;
  font-size: 1.6rem;
}
.empty-state h3 {
  margin: 0;
  color: #1f1a17;
  font-weight: 400;
}
.empty-state p {
  max-width: 420px;
  margin: 0.6rem auto 1.2rem;
  color: #6b655c;
  line-height: 1.6;
}

.prod-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.9rem;
}
.prod-card {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(195, 89, 43, 0.12);
  border-radius: 8px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.62),
    0 8px 22px rgba(75, 48, 30, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.prod-card:hover {
  transform: translateY(-2px);
  border-color: rgba(195, 89, 43, 0.26);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.72),
    0 14px 32px rgba(75, 48, 30, 0.08);
}
.prod-media {
  position: relative;
  aspect-ratio: 4 / 3;
  background: #efe3ce;
}
.prod-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.image-count {
  position: absolute;
  right: 0.65rem;
  bottom: 0.65rem;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: rgba(31, 26, 23, 0.78);
  color: #fff;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}
.prod-content {
  padding: 0.95rem;
}
.prod-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
}
.craft-pill {
  color: #c3592b;
  font-size: 0.7rem;
  font-style: italic;
  letter-spacing: 0.12em;
}
.prod-price {
  color: #1f1a17;
  font-size: 0.9rem;
  white-space: nowrap;
}
.prod-content h3 {
  margin: 0;
  color: #1f1a17;
  font-weight: 400;
  font-size: 1.05rem;
  line-height: 1.25;
}
.prod-content p {
  min-height: 3.8em;
  margin: 0.45rem 0 0.9rem;
  color: #6b655c;
  font-size: 0.82rem;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.prod-actions { display: flex; gap: 0.45rem; flex-wrap: wrap; }

.mini-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0.45rem 0.85rem;
  background: transparent;
  color: #c3592b;
  border: 1px solid #c3592b;
  border-radius: 5px;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  letter-spacing: 0.06em;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.mini-btn:hover:not(:disabled) {
  background: #c3592b;
  color: #faf6f0;
}
.mini-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mini-btn.quiet {
  color: #6b655c;
  border-color: rgba(111, 91, 73, 0.24);
}
.mini-btn.quiet:hover:not(:disabled) {
  color: #1f1a17;
  background: #fff;
  border-color: rgba(111, 91, 73, 0.38);
}
.mini-btn.danger { color: #b3261e; border-color: #e0b8b2; }
.mini-btn.danger:hover:not(:disabled) {
  background: #b3261e; border-color: #b3261e; color: #fff;
}

/* Modal */
.overlay {
  position: fixed; inset: 0;
  background: rgba(31, 26, 23, 0.52);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 80; padding: 1rem;
}
.modal {
  background: #faf6f0;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  width: 100%;
  max-width: 920px;
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.26);
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.4rem;
  border-bottom: 1px solid rgba(195, 89, 43, 0.12);
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 1;
}
.modal h3 {
  margin: 0.2rem 0 0;
  font-weight: 400;
  font-size: 1.25rem;
  letter-spacing: 0;
}
.close {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  color: #6b655c;
}
.close:hover {
  color: #c3592b;
  border-color: rgba(195, 89, 43, 0.18);
  background: rgba(195, 89, 43, 0.06);
}

.form {
  padding: 1.25rem;
  display: flex; flex-direction: column; gap: 0.85rem;
}
.form-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(320px, 1.1fr);
  gap: 1rem;
}
.image-panel,
.details-panel {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.primary-drop {
  position: relative;
  min-height: 330px;
  overflow: hidden;
  display: grid;
  place-items: center;
  border: 1px dashed rgba(195, 89, 43, 0.32);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.64), rgba(242, 236, 225, 0.72));
}
.primary-drop.filled {
  border-style: solid;
  background: #1f1a17;
}
.primary-drop.invalid {
  border-color: #b3261e;
}
.primary-drop img {
  width: 100%;
  height: 100%;
  min-height: 330px;
  object-fit: cover;
  display: block;
}
.drop-empty {
  max-width: 220px;
  text-align: center;
  color: #6b655c;
}
.drop-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  margin: 0 auto 0.75rem;
  border-radius: 50%;
  background: #c3592b;
  color: #fff;
  font-size: 1.45rem;
  line-height: 1;
}
.drop-empty strong {
  display: block;
  color: #1f1a17;
  font-size: 1.05rem;
  font-weight: 400;
}
.drop-empty em {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.85rem;
  line-height: 1.55;
}
.upload-row {
  display: flex;
  gap: 0.55rem;
}
.field { display: flex; flex-direction: column; gap: 0.55rem; }
.field-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.field-note {
  color: #9b8e7a;
  font-size: 0.72rem;
}

.mini-upload {
  min-height: 38px;
  padding: 0.5rem 0.85rem;
  background: #1f1a17;
  color: #faf6f0;
  border: 1px solid #1f1a17;
  border-radius: 5px;
  font-size: 0.78rem;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: 0.06em;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.mini-upload:hover:not(:disabled) { background: #3c3731; border-color: #3c3731; }
.mini-upload:disabled { opacity: 0.5; cursor: not-allowed; }

.hidden-file { display: none; }

.preview-err {
  position: absolute;
  left: 0.65rem;
  right: 0.65rem;
  bottom: 0.65rem;
  padding: 0.45rem 0.6rem;
  border-radius: 5px;
  background: rgba(255, 243, 240, 0.94);
  color: #b3261e;
  font-size: 0.78rem;
}

.extras-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 0.5rem;
  margin-top: 0.3rem;
}
.extra {
  position: relative;
  aspect-ratio: 1;
}
.extra img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e9e1d4;
}
.extra-remove {
  position: absolute;
  top: 4px; right: 4px;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: rgba(31, 26, 23, 0.8);
  color: #faf6f0;
  border: none;
  cursor: pointer;
  font-size: 0.72rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.extra-remove:hover { background: #b3261e; }

.extras-empty {
  margin: 0;
  padding: 0.85rem;
  background: rgba(255, 255, 255, 0.68);
  border: 1px dashed rgba(111, 91, 73, 0.24);
  border-radius: 6px;
  color: #9b8e7a;
  font-size: 0.8rem;
  text-align: center;
  line-height: 1.45;
}

.row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.req { color: #c3592b; }

.form-error {
  color: #b3261e;
  background: #fff3f0;
  border: 1px solid #f3c8bf;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  margin: 0;
  font-size: 0.85rem;
}

.modal-actions {
  position: sticky;
  bottom: -1.25rem;
  z-index: 1;
  display: flex; justify-content: flex-end; gap: 0.5rem;
  margin-top: 0.25rem;
  padding: 1rem 0 0.2rem;
  border-top: 1px solid rgba(195, 89, 43, 0.12);
  background: linear-gradient(180deg, rgba(250, 246, 240, 0.88), #faf6f0 34%);
}

.btn-primary, .btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 42px;
  padding: 0.65rem 1.15rem;
  border-radius: 5px;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: 0.06em;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
.btn-primary { background: #c3592b; color: #fff; border: 1px solid #c3592b; }
.btn-primary:hover:not(:disabled) { background: #a54921; transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-ghost { background: transparent; color: #6b655c; border: 1px solid #d6cdbd; }
.btn-ghost:hover:not(:disabled) { border-color: #c3592b; color: #c3592b; }

@media (max-width: 820px) {
  .catalog-hero {
    align-items: stretch;
    flex-direction: column;
  }
  .hero-actions,
  .catalog-tools,
  .form-grid {
    grid-template-columns: 1fr;
  }
  .hero-actions {
    flex-wrap: wrap;
  }
  .stats-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .row { grid-template-columns: 1fr; }
  .prod-grid { grid-template-columns: 1fr; }
  .modal-actions {
    flex-direction: column-reverse;
  }
  .modal-actions .btn-primary,
  .modal-actions .btn-ghost {
    width: 100%;
  }
  .primary-drop,
  .primary-drop img {
    min-height: 240px;
  }
  .stat {
    padding: 0.75rem 0.65rem;
  }
  .stat-value {
    font-size: 1.15rem;
  }
  .stat-label {
    font-size: 0.58rem;
    letter-spacing: 0.12em;
  }
  .modal {
    max-height: calc(100dvh - 1rem);
  }
}
</style>
