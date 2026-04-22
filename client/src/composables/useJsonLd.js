import { onBeforeUnmount, watchEffect } from 'vue';

const ATTR = 'data-page-jsonld';

/**
 * useJsonLd — injects a <script type="application/ld+json"> for the current page.
 * Pass a reactive getter returning the JSON-LD graph (array or object).
 * The node is cleaned up on unmount.
 */
export function useJsonLd(source) {
  const resolve = () => (typeof source === 'function' ? source() : source);

  // Ensure there's at most one per page (in addition to the static one in index.html).
  function upsert(data) {
    if (typeof document === 'undefined') return;
    if (!data) return removeAll();

    let el = document.head.querySelector(`script[${ATTR}]`);
    if (!el) {
      el = document.createElement('script');
      el.setAttribute('type', 'application/ld+json');
      el.setAttribute(ATTR, 'true');
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }

  function removeAll() {
    document.head.querySelectorAll(`script[${ATTR}]`).forEach((el) => el.remove());
  }

  const stop = watchEffect(() => {
    try {
      upsert(resolve());
    } catch (err) {
      console.warn('useJsonLd: failed to apply schema', err);
    }
  });

  onBeforeUnmount(() => {
    stop();
    removeAll();
  });
}
