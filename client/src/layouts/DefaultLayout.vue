<template>
  <div class="background-image-blur">
    <img class="blurred-img" src="/images/bg.webp" alt="" decoding="async" fetchpriority="high">
  </div>
  <div class="main">
    <nav :class="{ 'nav-open': mobileOpen, 'is-scrolled': scrolled, 'is-home': isHome }">
      <RouterLink
        class="nav-mark"
        to="/"
        :aria-label="'अर्थ Mala home'"
        @click="mobileOpen = false"
      >
        <span class="nav-mark-dev">अ</span>
        <span class="nav-mark-latin">Mala</span>
      </RouterLink>

      <!-- Mobile hamburger toggle -->
      <button
        class="hamburger"
        :aria-expanded="mobileOpen"
        aria-label="Toggle navigation menu"
        @click="mobileOpen = !mobileOpen"
      >
        <span :class="{ open: mobileOpen }"></span>
        <span :class="{ open: mobileOpen }"></span>
        <span :class="{ open: mobileOpen }"></span>
      </button>

      <transition name="fade">
        <div
          v-if="mobileOpen"
          class="nav-backdrop"
          @click="mobileOpen = false"
          aria-hidden="true"
        ></div>
      </transition>

      <div class="nav-links" :class="{ open: mobileOpen }">
        <RouterLink class="routerLink" to="/" @click="mobileOpen = false">Home</RouterLink>
        <RouterLink class="routerLink" to="/products" @click="mobileOpen = false">Products</RouterLink>
        <RouterLink class="routerLink" to="/about" @click="mobileOpen = false">About</RouterLink>
        <RouterLink 
          class="routerLink" 
          to="/login" 
          @click="mobileOpen = false"
        >
          {{ authStore.token ? 'Account' : 'Login' }}
        </RouterLink>
      </div>
    </nav>
    <main class="p-6">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { RouterLink } from 'vue-router';
import SiteFooter from '@/components/SiteFooter.vue';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
const mobileOpen = ref(false);
const scrolled = ref(false);
const route = useRoute();

const isHome = computed(() => route.name === 'Home');

// Close mobile menu on route change (safety — the @click on links also handles this)
watch(() => route.fullPath, () => (mobileOpen.value = false));

function onScroll() {
  scrolled.value = window.scrollY > 40;
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
</script>

<style lang="css" scoped>
.background-image-blur {
 position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: -1;
  overflow: hidden;
}
.blurred-img {
  width: 700px;
  height: auto;
  filter: blur(1.5px);
  object-fit: contain;
  opacity: 0.6;
}

nav {
   position: sticky;
   top: 0;
   z-index: 40;
   display: grid;
   grid-template-columns: 1fr auto 1fr;
   align-items: center;
   padding: 0.85rem 1.5rem;
   gap: 1rem;
   background: transparent;
   transition: background 0.3s ease, box-shadow 0.3s ease,
               backdrop-filter 0.3s ease, -webkit-backdrop-filter 0.3s ease,
               padding 0.3s ease;
}

nav.is-scrolled {
   background: rgba(250, 246, 240, 0.82);
   backdrop-filter: saturate(140%) blur(10px);
   -webkit-backdrop-filter: saturate(140%) blur(10px);
   box-shadow:
     0 1px 0 rgba(195, 89, 43, 0.1),
     0 8px 24px rgba(0, 0, 0, 0.05);
   padding: 0.6rem 1.5rem;
}

.nav-mark {
  grid-column: 1;
  justify-self: start;
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  text-decoration: none;
  transition: opacity 0.3s ease, transform 0.3s ease;
  opacity: 0.9;
}
.nav-mark:hover {
  opacity: 1;
}

/* On Home, the huge hero mark owns the page — hide nav mark until user scrolls */
nav.is-home .nav-mark {
  opacity: 0;
  transform: translateY(-4px);
  pointer-events: none;
}
nav.is-home.is-scrolled .nav-mark {
  opacity: 0.9;
  transform: translateY(0);
  pointer-events: auto;
}
.nav-mark-dev {
  font-family: 'Tiro Devanagari Hindi', 'Fraunces', Georgia, serif;
  font-size: 1.75rem;
  color: #c3592b;
  line-height: 1;
  font-weight: 400;
}
.nav-mark-latin {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 36, 'SOFT' 50;
  font-size: 1.05rem;
  color: rgba(195, 89, 43, 0.75);
  letter-spacing: 0.03em;
  line-height: 1;
}

.nav-links {
   grid-column: 2;
   justify-self: center;
   display: flex;
   flex-direction: row;
   justify-content: center;
   align-items: center;
   gap: 3rem;
   padding: 0.4em 0;
}

.routerLink {
  font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
  font-style: italic;
  font-weight: 350;
  text-decoration: none;
  font-size: 1.05rem;
  color: #3c3731;
  position: relative;
  padding: 0.35rem 0;
  letter-spacing: 0.08em;
  transition: color 0.25s ease;
}
.routerLink:hover {
  cursor: pointer;
  color: #c3592b;
}
.routerLink::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  bottom: 0;
  width: 20px;
  height: 1px;
  background: #c3592b;
  transition: transform 0.3s ease;
  transform-origin: center;
}
.routerLink:hover::after {
  transform: translateX(-50%) scaleX(0.6);
}
.routerLink.router-link-active {
  color: #c3592b;
  font-style: normal;
  font-weight: 400;
}
.routerLink.router-link-active::after {
  transform: translateX(-50%) scaleX(1);
}

/* Hamburger button — hidden on desktop */
.hamburger {
  display: none;
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  flex-direction: column;
  justify-content: space-between;
  z-index: 30;
}
.hamburger span {
  display: block;
  height: 2px;
  width: 100%;
  background: #1f1a17;
  border-radius: 1px;
  transition: transform 0.25s ease, opacity 0.25s ease;
  transform-origin: center;
}
.hamburger span.open:nth-child(1) {
  transform: translateY(9px) rotate(45deg);
}
.hamburger span.open:nth-child(2) {
  opacity: 0;
}
.hamburger span.open:nth-child(3) {
  transform: translateY(-9px) rotate(-45deg);
}

.nav-backdrop {
  display: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  nav {
    grid-template-columns: 1fr auto;
    padding: 0.85rem 1rem;
  }
  .nav-mark {
    grid-column: 1;
  }
  .nav-mark-dev { font-size: 1.55rem; }
  .nav-mark-latin { font-size: 0.95rem; }

  .nav-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(31, 26, 23, 0.35);
    z-index: 20;
  }

   .blurred-img {
    width: 90vw;
    filter: blur(1px);
  }

  .hamburger {
    display: flex;
  }

  /* Brand-mark slot on mobile nav (optional future use) */
  nav {
    padding: 0.75rem 1rem;
    justify-content: flex-start;
  }

  .nav-links {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 320px;
    background: #faf6f0;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    gap: 0;
    padding: 5rem 1.5rem 2rem;
    box-shadow: -6px 0 24px rgba(0, 0, 0, 0.12);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 25;
  }

  .nav-links.open {
    transform: translateX(0);
  }

  .nav-links .routerLink {
    margin: 0;
    padding: 1.1rem 0.25rem;
    font-size: 1.2rem;
    letter-spacing: 0.08em;
    border-bottom: 1px solid rgba(195, 89, 43, 0.12);
    text-align: left;
  }

  .nav-links .routerLink::after {
    display: none;
  }

  .nav-links .routerLink.router-link-active {
    color: #c3592b;
  }
}
</style>
