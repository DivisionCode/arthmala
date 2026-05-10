import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useArtworkStore = defineStore('artworkStore', () => {
  const artworks = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function fetchArtworks({ force = false } = {}) {
    if (!force && artworks.value.length > 0) return;
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/artworks`);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      artworks.value = await res.json();
    } catch (err) {
      console.error('Failed to fetch artworks:', err);
      error.value = 'Unable to load artworks right now. Please try again.';
    } finally {
      loading.value = false;
    }
  }

  function setArtworks(next) {
    artworks.value = Array.isArray(next) ? next : [];
  }

  function upsertArtwork(artwork) {
    if (!artwork?._id) return;
    const idx = artworks.value.findIndex((item) => item._id === artwork._id);
    if (idx === -1) {
      artworks.value = [artwork, ...artworks.value];
      return;
    }
    const next = [...artworks.value];
    next[idx] = artwork;
    artworks.value = next;
  }

  function removeArtwork(id) {
    artworks.value = artworks.value.filter((item) => item._id !== id);
  }

  return {
    artworks,
    loading,
    error,
    fetchArtworks,
    setArtworks,
    upsertArtwork,
    removeArtwork,
  };
});
