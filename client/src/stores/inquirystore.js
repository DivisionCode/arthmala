import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

const STORAGE_KEY = 'arthmala_inquiry_v1';

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const useInquiryStore = defineStore('inquiryStore', () => {
  const items = ref(loadInitial());
  const drawerOpen = ref(false);
  const submitting = ref(false);
  const lastError = ref(null);
  const lastSuccess = ref(null);

  watch(
    items,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
      } catch {
        /* quota exceeded or private mode — non-fatal */
      }
    },
    { deep: true }
  );

  const count = computed(() =>
    items.value.reduce((n, i) => n + (Number(i.quantity) || 1), 0)
  );
  const isEmpty = computed(() => items.value.length === 0);

  function openDrawer() {
    drawerOpen.value = true;
  }
  function closeDrawer() {
    drawerOpen.value = false;
  }
  function toggleDrawer() {
    drawerOpen.value = !drawerOpen.value;
  }

  function addItem(art) {
    const id = art._id || art.id;
    const existing = items.value.find((i) => i.artworkId === id);
    if (existing) {
      existing.quantity = (Number(existing.quantity) || 1) + 1;
    } else {
      items.value.push({
        artworkId: id,
        title: art.title,
        image: art.image,
        category: art.category,
        price: art.price,
        quantity: 1,
        note: '',
      });
    }
    drawerOpen.value = true;
  }

  function removeItem(artworkId) {
    items.value = items.value.filter((i) => i.artworkId !== artworkId);
  }

  function updateQuantity(artworkId, quantity) {
    const q = Math.max(1, Number(quantity) || 1);
    const item = items.value.find((i) => i.artworkId === artworkId);
    if (item) item.quantity = q;
  }

  function updateNote(artworkId, note) {
    const item = items.value.find((i) => i.artworkId === artworkId);
    if (item) item.note = note;
  }

  function clear() {
    items.value = [];
  }

  function hasItem(artworkId) {
    return items.value.some((i) => i.artworkId === artworkId);
  }

  async function submit(contact) {
    submitting.value = true;
    lastError.value = null;
    lastSuccess.value = null;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contact, items: items.value }),
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Please wait a moment before trying again.');
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Server responded ${res.status}`);
      }
      lastSuccess.value = data.message || 'Inquiry sent.';
      clear();
      return true;
    } catch (err) {
      console.error('Inquiry submit failed:', err);
      lastError.value = err.message || 'Something went wrong. Please try again.';
      return false;
    } finally {
      submitting.value = false;
    }
  }

  return {
    items,
    drawerOpen,
    submitting,
    lastError,
    lastSuccess,
    count,
    isEmpty,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    addItem,
    removeItem,
    updateQuantity,
    updateNote,
    clear,
    hasItem,
    submit,
  };
});
