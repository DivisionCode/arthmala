<template>
  <div class="ornament" :class="{ small: size === 'sm' }" aria-hidden="true">
    <svg viewBox="0 0 240 24" width="240" height="24" fill="none">
      <!-- left line -->
      <line x1="0" y1="12" x2="90" y2="12" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" />
      <!-- right line -->
      <line x1="150" y1="12" x2="240" y2="12" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" />

      <!-- center medallion -->
      <g transform="translate(120 12)">
        <!-- 8-petal lotus -->
        <g stroke="currentColor" stroke-width="0.9" stroke-linecap="round">
          <line x1="0" y1="-9" x2="0" y2="9" />
          <line x1="-9" y1="0" x2="9" y2="0" />
          <line x1="-6.4" y1="-6.4" x2="6.4" y2="6.4" />
          <line x1="-6.4" y1="6.4" x2="6.4" y2="-6.4" />
        </g>
        <circle r="6" fill="none" stroke="currentColor" stroke-width="0.9" />
        <circle r="2.5" fill="currentColor" />
      </g>

      <!-- tiny dots flanking the medallion -->
      <circle cx="95" cy="12" r="1" fill="currentColor" />
      <circle cx="145" cy="12" r="1" fill="currentColor" />
    </svg>
  </div>
</template>

<script setup>
defineProps({
  size: { type: String, default: 'md' },
});
</script>

<style scoped>
.ornament {
  display: flex;
  justify-content: center;
  color: #c3592b;
  opacity: 0.7;
  margin: 2rem auto;
}
.ornament.small svg {
  width: 160px;
  height: 16px;
}
.ornament svg {
  overflow: visible;
}
</style>
