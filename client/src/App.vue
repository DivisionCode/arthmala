<template>
  <div class="main">
    <ErrorBoundary>
      <router-view />
    </ErrorBoundary>
    <template v-if="showPublicChrome">
      <InquiryDrawer />
      <FloatingActions />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import InquiryDrawer from '@/components/InquiryDrawer.vue';
import FloatingActions from '@/components/FloatingActions.vue';
import ErrorBoundary from '@/components/ErrorBoundary.vue';

const route = useRoute();
const showPublicChrome = computed(() => route.name !== 'Admin');
</script>
