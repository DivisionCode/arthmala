import { onBeforeUnmount, watchEffect } from 'vue';

const BASE_TITLE = 'अर्थ Mala — Art that Heals. Patterns that Speak.';
const BASE_DESC =
  'A boutique studio preserving four living Indian crafts — Lipan Art, Mandala, Embroidery and Crochet. Every piece made by hand, on commission.';

function ensureMeta(selector, attr, name) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  return el;
}

function setMeta(name, content) {
  if (!content) return;
  const el = ensureMeta(`meta[name="${name}"]`, 'name', name);
  el.setAttribute('content', content);
}

function setProperty(property, content) {
  if (!content) return;
  const el = ensureMeta(
    `meta[property="${property}"]`,
    'property',
    property
  );
  el.setAttribute('content', content);
}

function setCanonical(href) {
  if (!href) return;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/**
 * usePageMeta — reactively update document <title> and meta tags per route.
 * Pass an object or a reactive getter. Falls back to brand defaults.
 *
 * Accepted keys: title, description, image, url, type
 */
export function usePageMeta(source) {
  const resolve = () => (typeof source === 'function' ? source() : source);

  const stop = watchEffect(() => {
    const data = resolve() || {};
    const title = data.title
      ? `${data.title} · अर्थ Mala`
      : BASE_TITLE;
    const description = data.description || BASE_DESC;
    const image = data.image || '/og-card.svg';
    const url =
      data.url || (typeof window !== 'undefined' ? window.location.href : '');
    const type = data.type || 'website';

    document.title = title;
    setMeta('description', description);

    setProperty('og:title', title);
    setProperty('og:description', description);
    setProperty('og:image', image);
    setProperty('og:url', url);
    setProperty('og:type', type);

    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);

    setCanonical(url);
  });

  onBeforeUnmount(stop);
}
