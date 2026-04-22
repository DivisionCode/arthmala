<template>
  <div>
    <div class="toolbar">
      <div class="filters">
        <button
          v-for="f in filters"
          :key="f.value"
          :class="['chip', { active: statusFilter === f.value }]"
          @click="statusFilter = f.value"
        >
          {{ f.label }}
          <span v-if="f.value !== 'all'" class="chip-count">{{ countFor(f.value) }}</span>
        </button>
      </div>
      <div class="toolbar-actions">
        <div class="search">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <line x1="21" y1="21" x2="16.5" y2="16.5"/>
          </svg>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search name, email, message…"
            aria-label="Search inquiries"
          />
          <button
            v-if="searchQuery"
            class="clear-search"
            @click="searchQuery = ''"
            aria-label="Clear search"
            type="button"
          >✕</button>
        </div>
        <button
          class="export-btn"
          @click="exportCsv"
          :disabled="!filtered.length"
          :aria-label="`Download ${filtered.length} inquir${filtered.length === 1 ? 'y' : 'ies'} as CSV`"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>
    </div>

    <p
      v-if="searchQuery.trim() && statusFilter !== 'all'"
      class="search-scope"
    >
      Searching within <em>{{ statusFilter }}</em>
      <template v-if="hiddenMatchCount > 0">
        · <button type="button" class="scope-link" @click="statusFilter = 'all'">
          {{ hiddenMatchCount }} more match{{ hiddenMatchCount === 1 ? '' : 'es' }} in other statuses — search all
        </button>
      </template>
    </p>

    <p v-if="error" class="error-banner">{{ error }}</p>

    <div v-if="loading && !inquiries.length" class="empty">Loading…</div>
    <div v-else-if="!filtered.length" class="empty">No inquiries in this view.</div>

    <ul v-else class="list">
      <li v-for="inq in filtered" :key="inq._id" class="inq">
        <div class="inq-top">
          <div>
            <div class="inq-name">{{ inq.name }}</div>
            <div class="inq-meta">
              <a :href="`mailto:${inq.email}`">{{ inq.email }}</a>
              <button
                class="copy-btn"
                type="button"
                @click="copyToClipboard(inq.email, `email-${inq._id}`)"
                :aria-label="`Copy email ${inq.email}`"
                :title="copiedId === `email-${inq._id}` ? 'Copied!' : 'Copy email'"
              >
                <span v-if="copiedId === `email-${inq._id}`">✓</span>
                <svg v-else viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <template v-if="inq.phone">
                <span class="meta-sep"> · </span>
                <span>{{ inq.phone }}</span>
                <button
                  class="copy-btn"
                  type="button"
                  @click="copyToClipboard(inq.phone, `phone-${inq._id}`)"
                  :aria-label="`Copy phone ${inq.phone}`"
                  :title="copiedId === `phone-${inq._id}` ? 'Copied!' : 'Copy phone'"
                >
                  <span v-if="copiedId === `phone-${inq._id}`">✓</span>
                  <svg v-else viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
              </template>
              <template v-if="inq.whatsapp">
                <span class="meta-sep"> · </span>
                <span>WhatsApp: {{ inq.whatsapp }}</span>
              </template>
            </div>
            <div class="inq-time">{{ formatDate(inq.createdAt) }} · prefers {{ inq.preferredContact }}</div>
          </div>
          <select
            class="status-select"
            :value="inq.status"
            @change="onStatusChange(inq, $event)"
            :disabled="busyIds.has(inq._id)"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="quoted">Quoted</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <!-- Inline quote form: appears on "Quoted" transition, or when revising an existing quote -->
        <form
          v-if="quoteOpenFor === inq._id"
          class="quote-form"
          @submit.prevent="submitQuote(inq)"
        >
          <div class="quote-head">
            <span class="eyebrow">{{ isRevising ? 'Revise the proposal' : 'Send a proposal' }}</span>
            <button type="button" class="quote-close" @click="cancelQuote" aria-label="Cancel">✕</button>
          </div>
          <div class="quote-row">
            <label>
              <em>Quoted price (₹)</em>
              <input
                v-model.number="quoteDraft.price"
                type="number"
                min="0"
                step="1"
                required
                autofocus
              />
            </label>
          </div>
          <label class="quote-msg">
            <em>Optional note to customer</em>
            <textarea
              v-model="quoteDraft.message"
              rows="3"
              maxlength="2000"
              placeholder="Proposed palette, timeline, anything worth saying about this piece…"
            ></textarea>
          </label>
          <p class="quote-hint">
            <em>{{ isRevising ? `This will send a revised proposal email to ${inq.email}.` : `This will send a proposal email to ${inq.email}.` }}</em>
          </p>
          <div class="quote-actions">
            <button
              type="button"
              class="mini-btn ghost"
              @click="cancelQuote"
              :disabled="quoteSubmitting"
            >Cancel</button>
            <button
              type="submit"
              class="mini-btn primary"
              :disabled="!quoteDraft.price || quoteDraft.price < 0 || quoteSubmitting"
            >
              {{ quoteSubmitting ? 'Sending…' : isRevising ? 'Send revised proposal' : 'Send proposal' }}
            </button>
          </div>
        </form>

        <!-- Order tracking section — appears once a quote is set or an order status exists -->
        <section
          v-if="showOrderSection(inq) && quoteOpenFor !== inq._id"
          class="order-section"
        >
          <div class="order-head">
            <span class="eyebrow">Order tracking</span>
            <div v-if="inq.trackingToken" class="share">
              <span class="share-url" :title="trackingUrl(inq)">{{ trackingUrl(inq) }}</span>
              <button
                class="copy-btn"
                type="button"
                @click="copyToClipboard(trackingUrl(inq), `track-${inq._id}`)"
                :title="copiedId === `track-${inq._id}` ? 'Copied!' : 'Copy tracking link'"
                aria-label="Copy tracking link"
              >
                <span v-if="copiedId === `track-${inq._id}`">✓</span>
                <svg v-else viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <a :href="trackingUrl(inq)" target="_blank" rel="noopener" class="share-link" title="Open in new tab" aria-label="Open tracking page">↗</a>
            </div>
          </div>

          <div class="order-controls">
            <label class="order-field">
              <em>Status</em>
              <select
                :value="inq.orderStatus || ''"
                @change="updateOrderStatus(inq, $event.target.value)"
                :disabled="orderBusy.has(inq._id)"
              >
                <option value="" disabled>Choose…</option>
                <option value="received">Received</option>
                <option value="in_progress">In progress</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </label>
            <label class="order-field">
              <em>Expected delivery</em>
              <input
                type="date"
                :value="inq.orderETA ? new Date(inq.orderETA).toISOString().slice(0,10) : ''"
                @change="updateOrderETA(inq, $event.target.value)"
                :disabled="orderBusy.has(inq._id)"
              />
            </label>
          </div>

          <ol v-if="inq.orderTimeline?.length" class="timeline">
            <li v-for="t in inq.orderTimeline" :key="t._id">
              <span class="timeline-dot" aria-hidden="true"></span>
              <span class="timeline-label">{{ formatOrderStatus(t.status) }}</span>
              <span class="timeline-at">{{ formatDate(t.at) }}</span>
            </li>
          </ol>
        </section>

        <div
          v-if="inq.quotedPrice && inq.status !== 'new' && quoteOpenFor !== inq._id"
          class="quoted-summary"
        >
          <span class="eyebrow">Quoted</span>
          <span class="quoted-price">₹{{ Number(inq.quotedPrice).toLocaleString('en-IN') }}</span>
          <span v-if="inq.quotedAt" class="quoted-when">· {{ formatDate(inq.quotedAt) }}</span>
          <button
            v-if="inq.status === 'quoted'"
            type="button"
            class="revise-btn"
            @click="openRevise(inq)"
          >Revise</button>
        </div>

        <div v-if="inq.budget || inq.timeline" class="inq-line">
          <span v-if="inq.budget"><strong>Budget:</strong> {{ inq.budget }}</span>
          <span v-if="inq.timeline" class="sep"><strong>Timeline:</strong> {{ inq.timeline }}</span>
        </div>

        <blockquote v-if="inq.message" class="inq-msg">{{ inq.message }}</blockquote>

        <div v-if="inq.items?.length" class="inq-items">
          <div v-for="(item, idx) in inq.items" :key="idx" class="inq-item">
            <img v-if="item.image" :src="item.image" :alt="item.title" />
            <div class="inq-item-body">
              <div>
                <strong>{{ item.title }}</strong>
                <span class="cat"> · {{ item.category }}</span>
              </div>
              <div class="inq-item-sub">
                Qty {{ item.quantity }}
                <span v-if="item.price"> · ₹{{ item.price }}</span>
              </div>
              <div v-if="item.note" class="inq-item-note">“{{ item.note }}”</div>
            </div>
          </div>
        </div>

        <div class="inq-actions">
          <a class="mini-btn" :href="`mailto:${inq.email}?subject=${encodeURIComponent('Re: your inquiry — अर्थ Mala')}`">Reply via email</a>
          <a
            v-if="inq.whatsapp || inq.phone"
            class="mini-btn"
            :href="waLink(inq)"
            target="_blank"
            rel="noopener"
          >Reply on WhatsApp</a>
          <button
            class="mini-btn notes-toggle"
            :class="{ open: isNotesOpen(inq._id) }"
            @click="toggleNotes(inq._id)"
          >
            Notes
            <span v-if="inq.notes?.length" class="notes-pill">{{ inq.notes.length }}</span>
          </button>
        </div>

        <section v-if="isNotesOpen(inq._id)" class="notes-section">
          <ul v-if="inq.notes?.length" class="notes-list">
            <li v-for="note in inq.notes" :key="note._id" class="note">
              <div class="note-text">{{ note.text }}</div>
              <div class="note-foot">
                <span class="note-time">{{ formatDate(note.at || note.createdAt) }}</span>
                <button
                  class="note-del"
                  @click="removeNote(inq, note)"
                  :disabled="noteBusy.has(note._id)"
                  aria-label="Delete note"
                >
                  {{ noteBusy.has(note._id) ? '…' : '✕' }}
                </button>
              </div>
            </li>
          </ul>
          <p v-else class="notes-empty"><em>No notes yet. Write one below — only the studio will see these.</em></p>

          <form class="note-form" @submit.prevent="addNote(inq)">
            <textarea
              v-model="noteDrafts[inq._id]"
              rows="2"
              placeholder="Notes to self — budget hints, follow-up dates, agreed colours…"
              maxlength="2000"
              :disabled="noteSubmitting.has(inq._id)"
            ></textarea>
            <button
              type="submit"
              class="mini-btn"
              :disabled="!noteDrafts[inq._id]?.trim() || noteSubmitting.has(inq._id)"
            >
              {{ noteSubmitting.has(inq._id) ? 'Saving…' : 'Add note' }}
            </button>
          </form>
        </section>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';

const props = defineProps({
  token: { type: String, required: true },
});
const emit = defineEmits(['unauthorized']);

const API = import.meta.env.VITE_API_URL;

const inquiries = ref([]);
const loading = ref(false);
const error = ref('');
const busyIds = ref(new Set());
const statusFilter = ref('all');
const searchQuery = ref('');

const openNotes = ref(new Set());
const noteDrafts = ref({});
const noteSubmitting = ref(new Set());
const noteBusy = ref(new Set());

// Quote workflow
const quoteOpenFor = ref(null);
const quoteDraft = ref({ price: null, message: '' });
const quoteSubmitting = ref(false);
const isRevising = ref(false);

// Order tracking
const orderBusy = ref(new Set());

function showOrderSection(inq) {
  // Surface once a quote is confirmed OR once any order tracking info exists.
  return (
    inq.status === 'closed' ||
    !!inq.orderStatus ||
    !!inq.trackingToken
  );
}

function trackingUrl(inq) {
  if (!inq.trackingToken) return '';
  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/orders/${inq.trackingToken}`;
}

function formatOrderStatus(s) {
  if (!s) return '';
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function patchOrder(inq, body) {
  const busy = new Set(orderBusy.value);
  busy.add(inq._id);
  orderBusy.value = busy;
  try {
    const res = await fetch(`${API}/api/inquiries/${inq._id}/order`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': props.token,
      },
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      emit('unauthorized');
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server responded ${res.status}`);
    const idx = inquiries.value.findIndex((i) => i._id === inq._id);
    if (idx !== -1) inquiries.value[idx] = data;
  } catch (err) {
    error.value = err.message || 'Failed to update order.';
  } finally {
    const next = new Set(orderBusy.value);
    next.delete(inq._id);
    orderBusy.value = next;
  }
}

function updateOrderStatus(inq, status) {
  if (!status || status === inq.orderStatus) return;
  patchOrder(inq, { orderStatus: status });
}

function updateOrderETA(inq, dateStr) {
  const body = dateStr ? { orderETA: dateStr } : { orderETA: null };
  patchOrder(inq, body);
}

// Copy-to-clipboard
const copiedId = ref('');
let copyTimer = null;
async function copyToClipboard(value, key) {
  if (!value) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      // Fallback for insecure contexts
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    copiedId.value = key;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copiedId.value = '';
    }, 1600);
  } catch (err) {
    console.warn('clipboard failed', err);
  }
}

function onStatusChange(inq, event) {
  const next = event.target.value;
  if (next === inq.status) return;

  // "Quoted" opens an inline form. Keep the dropdown showing the current status
  // until the designer submits or cancels.
  if (next === 'quoted' && inq.status !== 'quoted') {
    quoteOpenFor.value = inq._id;
    isRevising.value = false;
    quoteDraft.value = {
      price: inq.quotedPrice ?? null,
      message: inq.quotedMessage ?? '',
    };
    // Revert the select visually — the form drives the actual transition.
    event.target.value = inq.status;
    return;
  }

  updateStatus(inq, next);
}

function openRevise(inq) {
  quoteOpenFor.value = inq._id;
  isRevising.value = true;
  quoteDraft.value = {
    price: inq.quotedPrice ?? null,
    message: inq.quotedMessage ?? '',
  };
}

function cancelQuote() {
  quoteOpenFor.value = null;
  isRevising.value = false;
  quoteDraft.value = { price: null, message: '' };
}

async function submitQuote(inq) {
  const price = Number(quoteDraft.value.price);
  if (!Number.isFinite(price) || price < 0) return;
  quoteSubmitting.value = true;
  try {
    const res = await fetch(`${API}/api/inquiries/${inq._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': props.token,
      },
      body: JSON.stringify({
        status: 'quoted',
        quotedPrice: price,
        quotedMessage: quoteDraft.value.message || '',
        revise: isRevising.value,
      }),
    });
    if (res.status === 401) {
      emit('unauthorized');
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server responded ${res.status}`);
    const idx = inquiries.value.findIndex((i) => i._id === inq._id);
    if (idx !== -1) inquiries.value[idx] = data;
    cancelQuote();
  } catch (err) {
    error.value = err.message || 'Failed to send quote.';
  } finally {
    quoteSubmitting.value = false;
  }
}

function isNotesOpen(id) {
  return openNotes.value.has(id);
}
function toggleNotes(id) {
  const next = new Set(openNotes.value);
  next.has(id) ? next.delete(id) : next.add(id);
  openNotes.value = next;
}

async function addNote(inq) {
  const text = (noteDrafts.value[inq._id] || '').trim();
  if (!text) return;
  const busy = new Set(noteSubmitting.value);
  busy.add(inq._id);
  noteSubmitting.value = busy;
  try {
    const res = await fetch(`${API}/api/inquiries/${inq._id}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': props.token,
      },
      body: JSON.stringify({ text }),
    });
    if (res.status === 401) {
      emit('unauthorized');
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server responded ${res.status}`);
    const idx = inquiries.value.findIndex((i) => i._id === inq._id);
    if (idx !== -1) inquiries.value[idx] = data;
    noteDrafts.value = { ...noteDrafts.value, [inq._id]: '' };
  } catch (err) {
    error.value = err.message || 'Failed to add note.';
  } finally {
    const next = new Set(noteSubmitting.value);
    next.delete(inq._id);
    noteSubmitting.value = next;
  }
}

async function removeNote(inq, note) {
  if (!confirm('Delete this note?')) return;
  const busy = new Set(noteBusy.value);
  busy.add(note._id);
  noteBusy.value = busy;
  try {
    const res = await fetch(
      `${API}/api/inquiries/${inq._id}/notes/${note._id}`,
      {
        method: 'DELETE',
        headers: { 'x-admin-token': props.token },
      }
    );
    if (res.status === 401) {
      emit('unauthorized');
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Server responded ${res.status}`);
    }
    const data = await res.json();
    const idx = inquiries.value.findIndex((i) => i._id === inq._id);
    if (idx !== -1) inquiries.value[idx] = data;
  } catch (err) {
    error.value = err.message || 'Failed to delete note.';
  } finally {
    const next = new Set(noteBusy.value);
    next.delete(note._id);
    noteBusy.value = next;
  }
}

const filters = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'closed', label: 'Closed' },
];

function matchesQuery(inq, q) {
  const haystack = [
    inq.name,
    inq.email,
    inq.phone,
    inq.whatsapp,
    inq.message,
    ...(Array.isArray(inq.items)
      ? inq.items.map((it) => `${it.title || ''} ${it.category || ''} ${it.note || ''}`)
      : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

const filtered = computed(() => {
  const byStatus =
    statusFilter.value === 'all'
      ? inquiries.value
      : inquiries.value.filter((i) => i.status === statusFilter.value);

  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return byStatus;
  return byStatus.filter((inq) => matchesQuery(inq, q));
});

// Number of matches in OTHER statuses — hinted to the designer
const hiddenMatchCount = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q || statusFilter.value === 'all') return 0;
  return inquiries.value.filter(
    (i) => i.status !== statusFilter.value && matchesQuery(i, q)
  ).length;
});

function countFor(status) {
  return inquiries.value.filter((i) => i.status === status).length;
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch(`${API}/api/inquiries`, {
      headers: { 'x-admin-token': props.token },
    });
    if (res.status === 401) {
      emit('unauthorized');
      return;
    }
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    inquiries.value = await res.json();
  } catch (err) {
    error.value = err.message || 'Failed to load.';
  } finally {
    loading.value = false;
  }
}

async function updateStatus(inq, status) {
  busyIds.value.add(inq._id);
  try {
    const res = await fetch(`${API}/api/inquiries/${inq._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': props.token,
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    const updated = await res.json();
    const idx = inquiries.value.findIndex((i) => i._id === inq._id);
    if (idx !== -1) inquiries.value[idx] = updated;
  } catch (err) {
    error.value = err.message || 'Failed to update status.';
  } finally {
    busyIds.value.delete(inq._id);
  }
}

function formatDate(s) {
  try {
    return new Date(s).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return s;
  }
}

function waLink(inq) {
  const num = (inq.whatsapp || inq.phone || '').replace(/[^0-9]/g, '');
  const text = `Hi ${inq.name}, thanks for your inquiry with अर्थ Mala.`;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

// ===== CSV export =====
function csvCell(val) {
  if (val === null || val === undefined) return '';
  const s = String(val).replace(/"/g, '""');
  return /[",\n\r]/.test(s) ? `"${s}"` : s;
}

function summariseItems(items = []) {
  if (!Array.isArray(items) || !items.length) return '';
  return items
    .map((i) => {
      const parts = [i.title || ''];
      if (i.quantity && Number(i.quantity) !== 1) parts.push(`×${i.quantity}`);
      if (i.price) parts.push(`₹${i.price}`);
      if (i.note) parts.push(`note: ${i.note}`);
      return parts.join(' ');
    })
    .join(' | ');
}

function exportCsv() {
  const rows = filtered.value;
  if (!rows.length) return;

  const header = [
    'Received',
    'Name',
    'Email',
    'Phone',
    'WhatsApp',
    'Prefers',
    'Budget',
    'Timeline',
    'Status',
    'Message',
    'Items',
  ];

  const lines = [header.map(csvCell).join(',')];
  for (const inq of rows) {
    lines.push(
      [
        new Date(inq.createdAt).toISOString(),
        inq.name,
        inq.email,
        inq.phone || '',
        inq.whatsapp || '',
        inq.preferredContact || '',
        inq.budget || '',
        inq.timeline || '',
        inq.status || '',
        inq.message || '',
        summariseItems(inq.items),
      ]
        .map(csvCell)
        .join(',')
    );
  }

  // UTF-8 BOM for Excel
  const csv = '﻿' + lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const filename = `arthmala-inquiries-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

defineExpose({ load });
onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.search {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.8rem;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(195, 89, 43, 0.22);
  border-radius: 3px;
  color: #6b655c;
  transition: all 0.25s ease;
  min-width: 220px;
}
.search:focus-within {
  border-color: #c3592b;
  box-shadow: 0 0 0 2px rgba(195, 89, 43, 0.12);
  color: #c3592b;
}
.search input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  font-size: 0.85rem;
  color: #1f1a17;
  min-width: 0;
  letter-spacing: 0.01em;
}
.search input::placeholder {
  color: #9b8e7a;
  font-style: italic;
}
.search input::-webkit-search-cancel-button {
  display: none;
}
.clear-search {
  background: none;
  border: none;
  color: #9b8e7a;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0 0.15rem;
  transition: color 0.2s ease;
}
.clear-search:hover {
  color: #c3592b;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.1rem;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(195, 89, 43, 0.22);
  border-radius: 3px;
  color: #6b655c;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.25s ease;
}
.export-btn:hover:not(:disabled) {
  color: #c3592b;
  border-color: rgba(195, 89, 43, 0.4);
  transform: translateY(-1px);
}
.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.chip {
  padding: 0.45rem 1rem;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(195, 89, 43, 0.18);
  border-radius: 100px;
  cursor: pointer;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  font-size: 0.85rem;
  color: #6b655c;
  letter-spacing: 0.05em;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}
.chip:hover {
  border-color: rgba(195, 89, 43, 0.4);
  color: #c3592b;
}
.chip.active {
  background: #c3592b;
  color: #faf6f0;
  border-color: #c3592b;
  font-style: normal;
  box-shadow: 0 4px 12px rgba(195, 89, 43, 0.22);
}
.chip-count {
  font-size: 0.72rem;
  background: rgba(255, 255, 255, 0.3);
  padding: 0.1rem 0.45rem;
  border-radius: 8px;
  font-style: normal;
}
.chip:not(.active) .chip-count {
  background: rgba(195, 89, 43, 0.08);
  color: #c3592b;
}

.search-scope {
  margin: -0.5rem 0 1rem;
  padding: 0.55rem 0.85rem;
  background: rgba(195, 89, 43, 0.05);
  border: 1px solid rgba(195, 89, 43, 0.15);
  border-radius: 3px;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 0.82rem;
  color: #6b655c;
  letter-spacing: 0.02em;
}
.search-scope em {
  font-style: italic;
  color: #c3592b;
  text-transform: capitalize;
}
.scope-link {
  background: none;
  border: none;
  padding: 0;
  margin-left: 0.15rem;
  color: #c3592b;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: inherit;
  letter-spacing: 0.02em;
  cursor: pointer;
  border-bottom: 1px solid rgba(195, 89, 43, 0.35);
  transition: border-color 0.2s ease;
}
.scope-link:hover {
  border-bottom-color: #c3592b;
}

.error-banner {
  background: #fff3f0;
  border: 1px solid #f3c8bf;
  color: #b3261e;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.empty {
  text-align: center;
  padding: 4rem 1rem;
  color: #6b655c;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.inq {
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(195, 89, 43, 0.12);
  border-radius: 6px;
  padding: 1.25rem 1.4rem;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.55),
    0 1px 2px rgba(0, 0, 0, 0.03);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
}
.inq:hover {
  border-color: rgba(195, 89, 43, 0.25);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.6),
    0 4px 14px rgba(195, 89, 43, 0.06);
}
.inq-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.inq-name {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 36, 'SOFT' 30;
  font-weight: 400;
  font-size: 1.1rem;
  letter-spacing: -0.005em;
  color: #1f1a17;
}
.inq-meta {
  font-size: 0.85rem;
  color: #6b655c;
  margin-top: 3px;
  font-style: italic;
}
.inq-meta a {
  color: #c3592b;
  text-decoration: none;
}
.inq-meta a:hover { text-decoration: underline; }

.meta-sep { color: #9b8e7a; }

.copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: #9b8e7a;
  cursor: pointer;
  padding: 0;
  margin: 0 0.15rem 0 0.35rem;
  border-radius: 2px;
  vertical-align: middle;
  transition: color 0.2s ease, background 0.2s ease;
}
.copy-btn:hover {
  color: #c3592b;
  background: rgba(195, 89, 43, 0.08);
}
.inq-time {
  font-size: 0.75rem;
  color: #9b8e7a;
  margin-top: 2px;
}
.status-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(195, 89, 43, 0.22);
  border-radius: 3px;
  background: #faf6f0;
  font-size: 0.82rem;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  font-style: italic;
  color: #1f1a17;
  cursor: pointer;
  letter-spacing: 0.05em;
  transition: all 0.25s ease;
}
.status-select:hover,
.status-select:focus {
  outline: none;
  border-color: #c3592b;
  box-shadow: 0 0 0 2px rgba(195, 89, 43, 0.12);
}
.inq-line {
  font-size: 0.85rem;
  color: #3c3731;
  margin: 0.5rem 0;
}

/* ===== Quote form ===== */
.quote-form {
  margin-top: 1rem;
  padding: 1.1rem 1.15rem;
  background: linear-gradient(135deg, #fff, #f5ebdd);
  border: 1px solid rgba(195, 89, 43, 0.25);
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.quote-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.quote-head .eyebrow {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.72rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #c3592b;
}
.quote-close {
  background: none;
  border: none;
  font-size: 0.95rem;
  color: #9b8e7a;
  cursor: pointer;
  padding: 0 0.3rem;
  transition: color 0.2s ease;
}
.quote-close:hover { color: #c3592b; }

.quote-row {
  display: flex;
  gap: 0.75rem;
}
.quote-form label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 0.78rem;
  color: #6b655c;
}
.quote-form label em {
  font-style: italic;
  letter-spacing: 0.08em;
  color: #6b655c;
}
.quote-form input,
.quote-form textarea {
  padding: 0.55rem 0.75rem;
  border: 1px solid rgba(195, 89, 43, 0.22);
  border-radius: 3px;
  background: #fff;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  font-size: 0.95rem;
  color: #1f1a17;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.quote-form input:focus,
.quote-form textarea:focus {
  outline: none;
  border-color: #c3592b;
  box-shadow: 0 0 0 2px rgba(195, 89, 43, 0.15);
}
.quote-form textarea {
  resize: vertical;
  min-height: 72px;
}
.quote-form textarea::placeholder {
  color: #b3a99a;
  font-style: italic;
}
.quote-msg {
  width: 100%;
}
.quote-hint {
  margin: 0;
  font-size: 0.78rem;
  color: #9b8e7a;
}
.quote-hint em {
  font-style: italic;
}
.quote-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
}
.mini-btn.primary {
  background: #c3592b;
  color: #faf6f0;
  border-color: #c3592b;
  box-shadow: 0 3px 10px rgba(195, 89, 43, 0.25);
}
.mini-btn.primary:hover:not(:disabled) {
  background: #a54921;
  border-color: #a54921;
  color: #faf6f0;
  box-shadow: 0 5px 14px rgba(195, 89, 43, 0.32);
}
.mini-btn.ghost {
  background: transparent;
  color: #6b655c;
  border-color: rgba(31, 26, 23, 0.22);
}
.mini-btn.ghost:hover:not(:disabled) {
  background: transparent;
  color: #c3592b;
  border-color: #c3592b;
  box-shadow: none;
}

/* ===== Quoted summary chip ===== */
.quoted-summary {
  display: inline-flex;
  align-items: baseline;
  gap: 0.55rem;
  margin-top: 0.75rem;
  padding: 0.45rem 0.85rem;
  background: rgba(195, 89, 43, 0.08);
  border: 1px solid rgba(195, 89, 43, 0.25);
  border-radius: 100px;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 0.9rem;
}
.quoted-summary .eyebrow {
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #c3592b;
}
.quoted-price {
  color: #c3592b;
  font-weight: 400;
}
.quoted-when {
  color: #9b8e7a;
  font-style: italic;
  font-size: 0.78rem;
}

.revise-btn {
  margin-left: 0.5rem;
  background: transparent;
  border: 1px solid rgba(195, 89, 43, 0.4);
  color: #c3592b;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  padding: 0.2rem 0.6rem;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.revise-btn:hover {
  background: #c3592b;
  color: #faf6f0;
  border-color: #c3592b;
}

/* ===== Order tracking section ===== */
.order-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed rgba(195, 89, 43, 0.2);
}
.order-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}
.order-head .eyebrow {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.7rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #c3592b;
}
.share {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.5rem 0.25rem 0.75rem;
  background: rgba(195, 89, 43, 0.06);
  border: 1px solid rgba(195, 89, 43, 0.18);
  border-radius: 3px;
  max-width: 100%;
  min-width: 0;
}
.share-url {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.74rem;
  color: #6b655c;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl; /* keep the end of the URL visible */
  text-align: left;
}
.share-link {
  color: #c3592b;
  text-decoration: none;
  padding: 0 0.2rem;
  font-size: 0.95rem;
  line-height: 1;
  transition: color 0.2s ease;
}
.share-link:hover { color: #a54921; }

.order-controls {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
}
.order-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 0.78rem;
  color: #6b655c;
  flex: 1 1 180px;
  min-width: 180px;
}
.order-field em {
  font-style: italic;
  letter-spacing: 0.08em;
}
.order-field select,
.order-field input[type='date'] {
  padding: 0.5rem 0.7rem;
  border: 1px solid rgba(195, 89, 43, 0.22);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.7);
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  font-size: 0.9rem;
  color: #1f1a17;
  transition: all 0.25s ease;
}
.order-field select:focus,
.order-field input[type='date']:focus {
  outline: none;
  border-color: #c3592b;
  box-shadow: 0 0 0 2px rgba(195, 89, 43, 0.12);
  background: #fff;
}
.order-field select:disabled,
.order-field input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Timeline */
.timeline {
  list-style: none;
  padding: 0 0 0 0.25rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border-left: 1px solid rgba(195, 89, 43, 0.2);
  padding-left: 1.1rem;
  position: relative;
}
.timeline li {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 0.85rem;
}
.timeline-dot {
  position: absolute;
  left: -1.45rem;
  top: 0.4rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #faf6f0;
  border: 2px solid #c3592b;
}
.timeline-label {
  color: #1f1a17;
  font-variation-settings: 'opsz' 20;
}
.timeline-at {
  color: #9b8e7a;
  font-style: italic;
  font-size: 0.78rem;
  margin-left: auto;
}
.inq-line .sep { margin-left: 1rem; }
.inq-msg {
  border-left: 3px solid #c3592b;
  background: #faf6f0;
  padding: 0.75rem 1rem;
  margin: 0.75rem 0;
  font-style: italic;
  color: #3c3731;
  line-height: 1.6;
  font-size: 0.9rem;
}
.inq-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0.75rem 0;
}
.inq-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem;
  background: #faf6f0;
  border-radius: 6px;
}
.inq-item img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 4px;
}
.inq-item-body { flex: 1; font-size: 0.85rem; }
.inq-item-sub { color: #6b655c; font-size: 0.78rem; margin-top: 2px; }
.cat { color: #6b655c; }
.inq-item-note { font-style: italic; color: #3c3731; font-size: 0.82rem; margin-top: 4px; }
.inq-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
.mini-btn {
  padding: 0.45rem 1rem;
  background: transparent;
  color: #c3592b;
  border: 1px solid #c3592b;
  border-radius: 2px;
  text-decoration: none;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  transition: all 0.25s ease;
}
.mini-btn:hover:not(:disabled) {
  background: #c3592b;
  color: #faf6f0;
  box-shadow: 0 4px 12px rgba(195, 89, 43, 0.25);
}
.mini-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notes-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.notes-toggle.open {
  background: rgba(195, 89, 43, 0.08);
}
.notes-pill {
  font-family: 'Fraunces', Georgia, serif;
  font-style: normal;
  font-size: 0.7rem;
  background: rgba(195, 89, 43, 0.15);
  color: #c3592b;
  padding: 0.08rem 0.4rem;
  border-radius: 8px;
  letter-spacing: 0;
}
.notes-toggle:hover:not(:disabled) .notes-pill,
.notes-toggle.open:hover:not(:disabled) .notes-pill {
  background: rgba(250, 246, 240, 0.25);
  color: #faf6f0;
}

/* Notes section */
.notes-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed rgba(195, 89, 43, 0.2);
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
}

.notes-list {
  list-style: none;
  padding: 0;
  margin: 0 0 0.75rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.note {
  background: rgba(250, 246, 240, 0.85);
  border-left: 2px solid rgba(195, 89, 43, 0.5);
  border-radius: 0 4px 4px 0;
  padding: 0.65rem 0.85rem;
  font-size: 0.9rem;
  line-height: 1.65;
  color: #3c3731;
}
.note-text {
  white-space: pre-wrap;
  margin-bottom: 0.3rem;
}
.note-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
  color: #9b8e7a;
  letter-spacing: 0.04em;
}
.note-time {
  font-style: italic;
}
.note-del {
  background: none;
  border: none;
  color: #b3a99a;
  cursor: pointer;
  padding: 0 0.3rem;
  font-size: 0.75rem;
  transition: color 0.2s ease;
}
.note-del:hover:not(:disabled) {
  color: #b3261e;
}
.note-del:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notes-empty {
  margin: 0 0 0.75rem 0;
  padding: 0.75rem 0.9rem;
  font-size: 0.85rem;
  color: #6b655c;
  background: rgba(255, 255, 255, 0.5);
  border: 1px dashed rgba(195, 89, 43, 0.2);
  border-radius: 3px;
}

.note-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}
.note-form textarea {
  width: 100%;
  padding: 0.6rem 0.85rem;
  border: 1px solid rgba(195, 89, 43, 0.22);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.7);
  color: #1f1a17;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14;
  font-size: 0.88rem;
  line-height: 1.55;
  resize: vertical;
  min-height: 60px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}
.note-form textarea::placeholder {
  color: #b3a99a;
  font-style: italic;
}
.note-form textarea:focus {
  outline: none;
  border-color: #c3592b;
  box-shadow: 0 0 0 2px rgba(195, 89, 43, 0.12);
  background: #fff;
}
</style>
