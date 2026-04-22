import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useArtworkStore = defineStore('artworkStore', () => {
  const artworks = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function fetchArtworks() {
    if (artworks.value.length > 0) return;
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/artworks`);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      artworks.value = await res.json();
    } catch (err) {
      console.error('Failed to fetch artworks:', err);
      error.value = 'Unable to load artworks right now. Please try again.';
    } finally {
      loading.value = false;
    }
  }

  return { artworks, loading, error, fetchArtworks };
});
