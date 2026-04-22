<template>
  <div class="products-tab">
    <div class="tab-head">
      <button class="btn-primary" @click="openNew">+ New artwork</button>
      <button class="btn-ghost" @click="load" :disabled="loading">
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="error" class="error-banner">{{ error }}</p>

    <div v-if="loading && !items.length" class="empty">Loading…</div>
    <div v-else-if="!items.length" class="empty">
      No artworks yet. Click <strong>+ New artwork</strong> to add one.
    </div>

    <ul v-else class="prod-list">
      <li v-for="item in items" :key="item._id" class="prod">
        <img :src="item.image" :alt="item.title" class="prod-img" />
        <div class="prod-body">
          <div class="prod-title">
            {{ item.title }}
            <span v-if="item.images?.length" class="extra-count">
              +{{ item.images.length }} more
            </span>
          </div>
          <div class="prod-meta">{{ item.category }} · ₹{{ item.price }}</div>
          <div class="prod-desc" v-if="item.description">{{ item.description }}</div>
        </div>
        <div class="prod-actions">
          <button class="mini-btn" @click="openEdit(item)">Edit</button>
          <button class="mini-btn danger" @click="remove(item)" :disabled="busy === item._id">
            {{ busy === item._id ? '…' : 'Delete' }}
          </button>
        </div>
      </li>
    </ul>

    <!-- Modal -->
    <teleport to="body">
      <div v-if="formOpen" class="overlay" @click.self="closeForm">
        <div class="modal" role="dialog" aria-modal="true">
          <header>
            <h3>{{ editing ? 'Edit artwork' : 'Add new artwork' }}</h3>
            <button class="close" @click="closeForm" aria-label="Close">✕</button>
          </header>

          <form @submit.prevent="save" class="form">
            <label>
              Title <span class="req">*</span>
              <input v-model="form.title" required maxlength="200" />
            </label>

            <!-- Primary image -->
            <div class="field">
              <div class="field-head">
                <label class="field-label">Primary image <span class="req">*</span></label>
                <div class="upload-buttons">
                  <button
                    type="button"
                    class="mini-upload"
                    @click="primaryFile?.click()"
                    :disabled="uploadingPrimary"
                  >
                    {{ uploadingPrimary ? 'Uploading…' : 'Upload file' }}
                  </button>
                </div>
              </div>
              <input
                ref="primaryFile"
                type="file"
                accept="image/*"
                class="hidden-file"
                @change="onPrimaryFile"
              />
              <input
                v-model="form.image"
                placeholder="…or paste an image URL"
                class="url-input"
              />
              <div v-if="form.image" class="preview-row">
                <img :src="form.image" alt="preview" class="preview-img" @error="primaryError = true" @load="primaryError = false" />
                <span v-if="primaryError" class="preview-err">Could not load this URL.</span>
                <button type="button" class="preview-clear" @click="form.image = ''">Remove</button>
              </div>
            </div>

            <!-- Additional images -->
            <div class="field">
              <div class="field-head">
                <label class="field-label">More images (optional)</label>
                <div class="upload-buttons">
                  <button
                    type="button"
                    class="mini-upload"
                    @click="extraFile?.click()"
                    :disabled="uploadingExtra"
                  >
                    {{ uploadingExtra ? 'Uploading…' : '+ Add image' }}
                  </button>
                </div>
              </div>
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
                  <img :src="src" alt="extra image" />
                  <button type="button" class="extra-remove" @click="removeExtra(idx)" aria-label="Remove image">✕</button>
                </div>
              </div>
              <p v-else class="extras-empty">No additional images yet. These show as thumbnails on the product page.</p>
            </div>

            <div class="row">
              <label>
                Category <span class="req">*</span>
                <select v-model="form.category" required>
                  <option disabled value="">Select…</option>
                  <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
                </select>
              </label>

              <label>
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

            <label>
              Description
              <textarea
                v-model="form.description"
                rows="4"
                placeholder="The story behind this piece — tradition, process, meaning."
              ></textarea>
            </label>

            <p v-if="formError" class="form-error">{{ formError }}</p>

            <div class="modal-actions">
              <button type="button" class="btn-ghost" @click="closeForm" :disabled="submitting">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="submitting || uploadingPrimary || uploadingExtra">
                {{ submitting ? 'Saving…' : editing ? 'Save changes' : 'Add artwork' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';

const props = defineProps({
  token: { type: String, required: true },
});
const emit = defineEmits(['unauthorized']);

const API = import.meta.env.VITE_API_URL;

const items = ref([]);
const categories = ref([]);
const loading = ref(false);
const error = ref('');
const busy = ref(null);

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

async function onPrimaryFile(e) {
  const file = e.target.files?.[0];
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
    items.value = await artsRes.json();
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
  gap: 1.25rem;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
}
.tab-head { display: flex; gap: 0.6rem; align-items: center; }

.error-banner {
  background: #fff3f0;
  border: 1px solid #f3c8bf;
  color: #b3261e;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.empty { text-align: center; padding: 4rem 1rem; color: #6b655c; }

.prod-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
.prod {
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(195, 89, 43, 0.12);
  border-radius: 6px;
  padding: 0.9rem 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.prod:hover {
  border-color: rgba(195, 89, 43, 0.25);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.6),
    0 4px 12px rgba(195, 89, 43, 0.06);
}
.prod-img { width: 72px; height: 72px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
.prod-body { flex: 1; min-width: 0; }
.prod-title {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 36, 'SOFT' 30;
  font-weight: 400;
  letter-spacing: -0.005em;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1rem;
}
.extra-count {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 0.7rem;
  color: #c3592b;
  background: rgba(195, 89, 43, 0.08);
  border: 1px solid rgba(195, 89, 43, 0.2);
  padding: 0.12rem 0.55rem;
  border-radius: 100px;
  font-weight: 400;
  letter-spacing: 0.02em;
}
.prod-meta { font-size: 0.8rem; color: #6b655c; margin-top: 2px; }
.prod-desc {
  font-size: 0.8rem; color: #6b655c; margin-top: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 480px;
}
.prod-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }

.mini-btn {
  padding: 0.45rem 1rem;
  background: transparent;
  color: #c3592b;
  border: 1px solid #c3592b;
  border-radius: 2px;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  letter-spacing: 0.1em;
  transition: all 0.25s ease;
}
.mini-btn:hover:not(:disabled) {
  background: #c3592b;
  color: #faf6f0;
  box-shadow: 0 4px 12px rgba(195, 89, 43, 0.25);
}
.mini-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mini-btn.danger { color: #b3261e; border-color: #e0b8b2; }
.mini-btn.danger:hover:not(:disabled) {
  background: #b3261e; border-color: #b3261e; color: #fff;
}

/* Modal */
.overlay {
  position: fixed; inset: 0;
  background: rgba(31, 26, 23, 0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 80; padding: 1rem;
}
.modal {
  background: #faf6f0;
  border-radius: 8px;
  width: 100%;
  max-width: 580px;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}
.modal header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9e1d4;
  background: #fff;
  position: sticky;
  top: 0;
}
.modal h3 {
  margin: 0; font-weight: 400; font-size: 1.15rem; letter-spacing: 0.03em;
}
.close {
  background: none; border: none; cursor: pointer;
  font-size: 1.2rem; color: #6b655c;
}
.close:hover { color: #c3592b; }

.form {
  padding: 1.25rem 1.5rem 1.5rem;
  display: flex; flex-direction: column; gap: 0.85rem;
}

.form > label {
  display: flex; flex-direction: column; gap: 0.3rem;
  font-size: 0.8rem; color: #6b655c; letter-spacing: 0.05em;
}

.form input[type="text"],
.form input:not([type]),
.form input[type="number"],
.form input[type="email"],
.form select,
.form textarea,
.url-input {
  padding: 0.55rem 0.75rem;
  border: 1px solid #d6cdbd;
  border-radius: 4px;
  background: #fff;
  font-size: 0.95rem;
  color: #1f1a17;
  font-family: inherit;
}
.form input:focus,
.form select:focus,
.form textarea:focus,
.url-input:focus {
  outline: none;
  border-color: #c3592b;
  box-shadow: 0 0 0 2px rgba(195, 89, 43, 0.15);
}
.form textarea { resize: vertical; min-height: 90px; }

.field { display: flex; flex-direction: column; gap: 0.4rem; }
.field-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.field-label {
  font-size: 0.8rem;
  color: #6b655c;
  letter-spacing: 0.05em;
}

.upload-buttons { display: flex; gap: 0.4rem; }

.mini-upload {
  padding: 0.35rem 0.8rem;
  background: #1f1a17;
  color: #faf6f0;
  border: 1px solid #1f1a17;
  border-radius: 4px;
  font-size: 0.78rem;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: 0.02em;
  transition: all 0.2s ease;
}
.mini-upload:hover:not(:disabled) { background: #3c3731; border-color: #3c3731; }
.mini-upload:disabled { opacity: 0.5; cursor: not-allowed; }

.hidden-file { display: none; }

.preview-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.3rem;
}
.preview-img {
  width: 72px; height: 72px;
  object-fit: cover; border-radius: 4px;
  border: 1px solid #e9e1d4;
}
.preview-err {
  color: #b3261e;
  font-size: 0.78rem;
  flex: 1;
}
.preview-clear {
  background: transparent;
  border: 1px solid #e0b8b2;
  color: #b3261e;
  padding: 0.3rem 0.7rem;
  font-size: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  margin-left: auto;
}
.preview-clear:hover {
  background: #b3261e;
  color: #fff;
  border-color: #b3261e;
}

.extras-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 0.5rem;
  margin-top: 0.3rem;
}
.extra { position: relative; }
.extra img {
  width: 100%;
  height: 84px;
  object-fit: cover;
  border-radius: 4px;
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
  padding: 0.75rem;
  background: #fff;
  border: 1px dashed #d6cdbd;
  border-radius: 4px;
  color: #9b8e7a;
  font-size: 0.8rem;
  text-align: center;
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
  display: flex; justify-content: flex-end; gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e9e1d4;
}

.btn-primary, .btn-ghost {
  padding: 0.65rem 1.15rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: 0.03em;
  transition: all 0.2s ease;
}
.btn-primary { background: #c3592b; color: #fff; border: 1px solid #c3592b; }
.btn-primary:hover:not(:disabled) { background: #a54921; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-ghost { background: transparent; color: #6b655c; border: 1px solid #d6cdbd; }
.btn-ghost:hover:not(:disabled) { border-color: #c3592b; color: #c3592b; }

@media (max-width: 520px) {
  .row { grid-template-columns: 1fr; }
  .prod-desc { max-width: 100%; }
}
</style>
