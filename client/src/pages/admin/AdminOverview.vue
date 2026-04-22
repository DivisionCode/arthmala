<template>
  <div class="overview">
    <p v-if="error" class="error-banner">{{ error }}</p>
    <div v-if="loading && !stats" class="empty">Loading…</div>

    <template v-else-if="stats">
      <!-- KPI cards -->
      <div class="kpis">
        <div class="kpi">
          <div class="kpi-label">Inquiries (all time)</div>
          <div class="kpi-value">{{ stats.totals.inquiries }}</div>
          <div class="kpi-foot">{{ stats.totals.artworks }} artworks in catalog</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Last 7 days</div>
          <div class="kpi-value">{{ stats.last7 }}</div>
          <div class="kpi-foot" :class="deltaClass">
            {{ deltaLabel }}
          </div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Awaiting reply</div>
          <div class="kpi-value">{{ stats.totals.new }}</div>
          <div class="kpi-foot">
            {{ stats.totals.contacted }} contacted ·
            {{ stats.totals.quoted }} quoted
          </div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Closed (won or declined)</div>
          <div class="kpi-value">{{ stats.totals.closed }}</div>
          <div class="kpi-foot">
            {{ closeRate }}% close rate
          </div>
        </div>
      </div>

      <!-- 30-day chart -->
      <section class="card">
        <div class="card-head">
          <h3>Inquiries — last 30 days</h3>
          <span class="muted">{{ totalInLastMonth }} total</span>
        </div>
        <div class="chart-wrap">
          <svg :viewBox="`0 0 ${chartW} ${chartH}`" preserveAspectRatio="none" class="chart">
            <!-- Soft grid lines -->
            <line v-for="y in 4" :key="'g'+y"
              :x1="0" :x2="chartW"
              :y1="(chartH - 20) * (y / 4)"
              :y2="(chartH - 20) * (y / 4)"
              stroke="#e9e1d4" stroke-width="1" />
            <!-- Area fill -->
            <path :d="areaPath" fill="url(#areaGradient)" opacity="0.35" />
            <!-- Line -->
            <path :d="linePath" fill="none" stroke="#c3592b" stroke-width="2" stroke-linejoin="round" />
            <!-- Points -->
            <g v-for="(p, i) in chartPoints" :key="i">
              <circle
                :cx="p.x" :cy="p.y" r="3"
                fill="#fff" stroke="#c3592b" stroke-width="1.5"
              />
              <title>{{ p.date }}: {{ p.count }} inquir{{ p.count === 1 ? 'y' : 'ies' }}</title>
            </g>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#c3592b" stop-opacity="0.4" />
                <stop offset="100%" stop-color="#c3592b" stop-opacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <div class="chart-axis">
            <span>{{ firstDayLabel }}</span>
            <span>Today</span>
          </div>
        </div>
      </section>

      <!-- Pipeline: quoted vs closed in the last 30 days -->
      <section v-if="stats.pipeline && stats.pipeline.quotedCount" class="card pipeline">
        <div class="card-head">
          <h3>Pipeline</h3>
          <span class="muted">last 30 days</span>
        </div>

        <div class="pipe-grid">
          <div class="pipe-cell">
            <div class="pipe-label">Quoted</div>
            <div class="pipe-amount">{{ inr(stats.pipeline.quotedAmount) }}</div>
            <div class="pipe-sub">
              {{ stats.pipeline.quotedCount }} proposal{{ stats.pipeline.quotedCount === 1 ? '' : 's' }} sent
            </div>
          </div>

          <div class="pipe-arrow" aria-hidden="true">→</div>

          <div class="pipe-cell">
            <div class="pipe-label">Closed</div>
            <div class="pipe-amount closed">{{ inr(stats.pipeline.closedAmount) }}</div>
            <div class="pipe-sub">
              {{ stats.pipeline.closedCount }} confirmed
            </div>
          </div>

          <div class="pipe-rate">
            <div class="pipe-rate-value">{{ stats.pipeline.conversionRate }}%</div>
            <div class="pipe-rate-label">conversion</div>
          </div>
        </div>

        <!-- Conversion progress bar -->
        <div class="pipe-bar" :style="{ '--pct': stats.pipeline.conversionRate + '%' }" aria-hidden="true">
          <div class="pipe-bar-fill"></div>
        </div>

        <!-- Per-craft breakdown -->
        <div v-if="stats.pipeline.byCategory?.length" class="pipe-cats">
          <div class="pipe-cats-head">
            <span class="pipe-cats-eyebrow">By craft</span>
            <span class="pipe-cats-col">Quoted</span>
            <span class="pipe-cats-col">Closed</span>
          </div>
          <ul class="pipe-cats-list">
            <li v-for="c in stats.pipeline.byCategory" :key="c.category">
              <span class="pipe-cat-name">{{ c.category }}</span>
              <span class="pipe-cat-qty">
                <span class="pipe-cat-amount">{{ inr(c.quotedAmount) }}</span>
                <span class="pipe-cat-sub">· {{ c.quotedCount }}</span>
              </span>
              <span class="pipe-cat-qty closed">
                <span class="pipe-cat-amount">{{ inr(c.closedAmount) }}</span>
                <span class="pipe-cat-sub">· {{ c.closedCount }}</span>
              </span>
              <div
                class="pipe-cat-bar"
                :style="{ '--pct': categoryPct(c) + '%' }"
                aria-hidden="true"
              >
                <div class="pipe-cat-bar-fill"></div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <!-- Aging inquiries — "new" older than 48h, worth nudging -->
      <section v-if="stats.aging?.length" class="card aging">
        <div class="card-head">
          <h3>These have been waiting</h3>
          <span class="muted">{{ stats.aging.length }} inquir{{ stats.aging.length === 1 ? 'y' : 'ies' }} · new for more than 48 hours</span>
        </div>
        <ul class="aging-list">
          <li v-for="inq in stats.aging" :key="inq._id">
            <div class="aging-body">
              <div class="aging-name">{{ inq.name }}</div>
              <div class="aging-meta">
                <a :href="`mailto:${inq.email}`">{{ inq.email }}</a>
                <span v-if="inq.items?.length"> · {{ inq.items.length }} piece{{ inq.items.length === 1 ? '' : 's' }}</span>
              </div>
            </div>
            <div class="aging-right">
              <span class="aging-age">{{ ageFrom(inq.createdAt) }}</span>
            </div>
          </li>
        </ul>
      </section>

      <!-- Two-column: top products + top categories -->
      <div class="two-col">
        <section class="card">
          <div class="card-head">
            <h3>Most inquired products</h3>
            <span class="muted">last 30 days</span>
          </div>
          <ul v-if="stats.topProducts.length" class="top-list">
            <li v-for="p in stats.topProducts" :key="p.artworkId">
              <img v-if="p.image" :src="p.image" :alt="p.title" loading="lazy" />
              <div class="top-body">
                <div class="top-title">{{ p.title }}</div>
                <div class="top-meta">{{ p.category }}</div>
              </div>
              <div class="top-right">
                <div class="top-count">{{ p.inquiries }}</div>
                <div class="top-sub">inquir{{ p.inquiries === 1 ? 'y' : 'ies' }}</div>
              </div>
            </li>
          </ul>
          <p v-else class="muted-block">No product data yet.</p>
        </section>

        <section class="card">
          <div class="card-head">
            <h3>Demand by craft</h3>
            <span class="muted">last 30 days</span>
          </div>
          <ul v-if="stats.topCategories.length" class="cat-list">
            <li v-for="c in stats.topCategories" :key="c.category">
              <div class="cat-row">
                <span class="cat-name">{{ c.category }}</span>
                <span class="cat-count">{{ c.count }}</span>
              </div>
              <div class="cat-bar">
                <div class="cat-bar-fill" :style="{ width: catWidth(c.count) + '%' }"></div>
              </div>
            </li>
          </ul>
          <p v-else class="muted-block">No category data yet.</p>
        </section>
      </div>

      <p class="generated">
        Snapshot · {{ formatTime(stats.generatedAt) }}
        <button class="link" @click="load">refresh</button>
      </p>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';

const props = defineProps({
  token: { type: String, required: true },
});
const emit = defineEmits(['unauthorized']);

const API = import.meta.env.VITE_API_URL;
const stats = ref(null);
const loading = ref(false);
const error = ref('');

const chartW = 600;
const chartH = 180;

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch(`${API}/api/stats`, {
      headers: { 'x-admin-token': props.token },
    });
    if (res.status === 401) {
      emit('unauthorized');
      return;
    }
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    stats.value = await res.json();
  } catch (err) {
    error.value = err.message || 'Failed to load.';
  } finally {
    loading.value = false;
  }
}

const chartPoints = computed(() => {
  if (!stats.value?.daily?.length) return [];
  const data = stats.value.daily;
  const maxY = Math.max(1, ...data.map((d) => d.count));
  const padX = 20;
  const innerW = chartW - padX * 2;
  const usableH = chartH - 40;
  return data.map((d, i) => ({
    x: padX + (innerW * i) / Math.max(1, data.length - 1),
    y: 20 + usableH - (d.count / maxY) * usableH,
    count: d.count,
    date: d.date,
  }));
});

const linePath = computed(() => {
  const pts = chartPoints.value;
  if (!pts.length) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
});

const areaPath = computed(() => {
  const pts = chartPoints.value;
  if (!pts.length) return '';
  const base = chartH - 20;
  const top = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${top} L ${last.x.toFixed(1)} ${base} L ${first.x.toFixed(1)} ${base} Z`;
});

const totalInLastMonth = computed(() =>
  (stats.value?.daily || []).reduce((n, d) => n + d.count, 0)
);

const firstDayLabel = computed(() => {
  const d = stats.value?.daily?.[0]?.date;
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
});

const closeRate = computed(() => {
  const total = stats.value?.totals?.inquiries || 0;
  if (!total) return 0;
  return Math.round((stats.value.totals.closed / total) * 100);
});

const deltaClass = computed(() => {
  if (!stats.value) return '';
  const delta = stats.value.last7 - stats.value.prior7;
  return delta > 0 ? 'up' : delta < 0 ? 'down' : '';
});

const deltaLabel = computed(() => {
  if (!stats.value) return '';
  const prior = stats.value.prior7;
  const cur = stats.value.last7;
  if (prior === 0 && cur === 0) return 'No change';
  if (prior === 0) return `+${cur} vs prior week`;
  const pct = Math.round(((cur - prior) / prior) * 100);
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct}% vs prior week`;
});

function catWidth(count) {
  if (!stats.value?.topCategories?.length) return 0;
  const max = Math.max(1, ...stats.value.topCategories.map((c) => c.count));
  return Math.max(4, (count / max) * 100);
}

function formatTime(s) {
  try {
    return new Date(s).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function inr(n) {
  const v = Number(n) || 0;
  return '₹' + v.toLocaleString('en-IN');
}

function categoryPct(c) {
  if (!c?.quotedAmount) return 0;
  return Math.round((c.closedAmount / c.quotedAmount) * 100);
}

function ageFrom(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return '';
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 72) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

defineExpose({ load });
onMounted(load);
</script>

<style scoped>
.overview {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 14, 'SOFT' 50;
}

.error-banner {
  background: #fff3f0;
  border: 1px solid #f3c8bf;
  color: #b3261e;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  margin: 0;
}

.empty {
  text-align: center;
  padding: 4rem 1rem;
  color: #6b655c;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.85rem;
}
.kpi {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(195, 89, 43, 0.12);
  border-radius: 6px;
  padding: 1.1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.55),
    0 1px 2px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.25s ease, border-color 0.25s ease;
}
.kpi:hover {
  border-color: rgba(195, 89, 43, 0.25);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.6),
    0 6px 20px rgba(195, 89, 43, 0.08);
}
.kpi-label {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #c3592b;
}
.kpi-value {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 144, 'SOFT' 30;
  font-size: 2.25rem;
  font-weight: 300;
  color: #1f1a17;
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin-top: 0.1rem;
}
.kpi-foot {
  font-size: 0.78rem;
  color: #6b655c;
  font-style: italic;
  letter-spacing: 0.01em;
  margin-top: 0.15rem;
}
.kpi-foot.up { color: #2c7a4d; font-style: normal; }
.kpi-foot.down { color: #b3261e; font-style: normal; }

.card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(195, 89, 43, 0.12);
  border-radius: 6px;
  padding: 1.25rem 1.4rem 1.4rem;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.55),
    0 1px 2px rgba(0, 0, 0, 0.03);
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(195, 89, 43, 0.1);
}
.card-head h3 {
  margin: 0;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 36, 'SOFT' 30;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: -0.005em;
  color: #1f1a17;
}
.muted {
  font-style: italic;
  font-size: 0.78rem;
  color: #9b8e7a;
  letter-spacing: 0.02em;
}
.muted-block {
  text-align: center;
  padding: 2rem 0;
  color: #9b8e7a;
  margin: 0;
  font-style: italic;
}

.chart-wrap { width: 100%; }
.chart {
  width: 100%;
  height: 180px;
  display: block;
}
.chart-axis {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: #9b8e7a;
  margin-top: 0.35rem;
  padding: 0 0.3rem;
}

/* ===== Pipeline card ===== */
.pipeline {
  border-left: 3px solid rgba(195, 89, 43, 0.45);
}
.pipe-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  align-items: center;
  gap: 1rem;
  margin: 0.5rem 0 1.25rem;
}
.pipe-cell {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}
.pipe-label {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.7rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #c3592b;
}
.pipe-amount {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 144, 'SOFT' 30;
  font-size: 1.85rem;
  font-weight: 300;
  color: #1f1a17;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.pipe-amount.closed { color: #c3592b; }
.pipe-sub {
  font-size: 0.76rem;
  color: #9b8e7a;
  font-style: italic;
  letter-spacing: 0.02em;
}

.pipe-arrow {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 1.4rem;
  color: rgba(195, 89, 43, 0.4);
  padding: 0 0.4rem;
}

.pipe-rate {
  text-align: right;
  justify-self: end;
  padding-left: 0.5rem;
  border-left: 1px solid rgba(195, 89, 43, 0.2);
  padding-left: 1rem;
}
.pipe-rate-value {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 72, 'SOFT' 30;
  font-size: 1.75rem;
  color: #c3592b;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.01em;
}
.pipe-rate-label {
  font-size: 0.72rem;
  font-style: italic;
  color: #9b8e7a;
  letter-spacing: 0.08em;
  margin-top: 3px;
}

.pipe-bar {
  height: 4px;
  background: rgba(195, 89, 43, 0.1);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}
.pipe-bar-fill {
  position: absolute;
  inset: 0;
  width: var(--pct, 0%);
  background: linear-gradient(90deg, #e8a06c, #c3592b);
  transition: width 0.6s ease;
  border-radius: 2px;
}

/* By-craft sub-table */
.pipe-cats {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px dashed rgba(195, 89, 43, 0.18);
}
.pipe-cats-head {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr;
  gap: 0.75rem;
  align-items: baseline;
  padding: 0 0.1rem 0.4rem;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 14;
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #9b8e7a;
}
.pipe-cats-eyebrow { color: #c3592b; }
.pipe-cats-col { text-align: right; }

.pipe-cats-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.pipe-cats-list li {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr;
  gap: 0.75rem;
  align-items: baseline;
  padding: 0.55rem 0.1rem 0.45rem;
  border-bottom: 1px solid rgba(195, 89, 43, 0.08);
  position: relative;
}
.pipe-cats-list li:last-child {
  border-bottom: none;
}
.pipe-cat-name {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 20;
  font-size: 0.93rem;
  color: #1f1a17;
  letter-spacing: 0.01em;
}
.pipe-cat-qty {
  text-align: right;
  display: inline-flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 0.3rem;
  color: #1f1a17;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 20;
  font-size: 0.93rem;
}
.pipe-cat-qty.closed { color: #c3592b; }
.pipe-cat-sub {
  font-size: 0.72rem;
  font-style: italic;
  color: #9b8e7a;
  letter-spacing: 0;
}

/* Per-row mini bar (category conversion ratio) */
.pipe-cat-bar {
  grid-column: 1 / -1;
  height: 2px;
  background: rgba(195, 89, 43, 0.08);
  border-radius: 1px;
  margin-top: 0.25rem;
  overflow: hidden;
  position: relative;
}
.pipe-cat-bar-fill {
  position: absolute;
  inset: 0;
  width: var(--pct, 0%);
  background: rgba(195, 89, 43, 0.55);
  transition: width 0.6s ease;
}

@media (max-width: 600px) {
  .pipe-cats-head,
  .pipe-cats-list li {
    grid-template-columns: 1.2fr 1fr 1fr;
    gap: 0.5rem;
  }
  .pipe-cat-name,
  .pipe-cat-qty {
    font-size: 0.85rem;
  }
}

@media (max-width: 600px) {
  .pipe-grid {
    grid-template-columns: 1fr auto 1fr;
    gap: 0.75rem;
  }
  .pipe-rate {
    grid-column: 1 / -1;
    border-left: none;
    border-top: 1px solid rgba(195, 89, 43, 0.15);
    padding: 0.75rem 0 0 0;
    text-align: left;
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }
}

.aging {
  border-left: 3px solid rgba(195, 89, 43, 0.55);
}
.aging-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.aging-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: rgba(250, 246, 240, 0.7);
  border: 1px solid rgba(195, 89, 43, 0.1);
  border-radius: 4px;
}
.aging-body { min-width: 0; }
.aging-name {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 20;
  font-size: 0.93rem;
  color: #1f1a17;
  font-weight: 400;
}
.aging-meta {
  font-size: 0.78rem;
  font-style: italic;
  color: #6b655c;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.aging-meta a {
  color: #6b655c;
  text-decoration: none;
}
.aging-meta a:hover {
  color: #c3592b;
  text-decoration: underline;
}
.aging-right { flex-shrink: 0; }
.aging-age {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 0.82rem;
  color: #c3592b;
  letter-spacing: 0.02em;
  padding: 0.2rem 0.55rem;
  border: 1px solid rgba(195, 89, 43, 0.3);
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.7);
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.top-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.top-list li {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.55rem 0.65rem;
  background: rgba(250, 246, 240, 0.7);
  border: 1px solid rgba(195, 89, 43, 0.08);
  border-radius: 4px;
  transition: border-color 0.25s ease, transform 0.25s ease;
}
.top-list li:hover {
  border-color: rgba(195, 89, 43, 0.25);
  transform: translateX(2px);
}
.top-list img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}
.top-body {
  flex: 1;
  min-width: 0;
}
.top-title {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 20;
  font-size: 0.92rem;
  font-weight: 400;
  color: #1f1a17;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.top-meta {
  font-size: 0.74rem;
  font-style: italic;
  color: #6b655c;
  margin-top: 2px;
}
.top-right {
  text-align: right;
  flex-shrink: 0;
}
.top-count {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 72, 'SOFT' 30;
  font-size: 1.4rem;
  color: #c3592b;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.01em;
}
.top-sub {
  font-size: 0.68rem;
  font-style: italic;
  color: #9b8e7a;
  letter-spacing: 0.05em;
  margin-top: 2px;
}

.cat-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.cat-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.92rem;
  color: #1f1a17;
  margin-bottom: 0.4rem;
}
.cat-name {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 20;
  letter-spacing: 0.02em;
}
.cat-count {
  color: #c3592b;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 20;
  font-weight: 400;
  font-size: 1.05rem;
}
.cat-bar {
  height: 6px;
  background: #f2ece1;
  border-radius: 3px;
  overflow: hidden;
}
.cat-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #e8a06c, #c3592b);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.generated {
  text-align: center;
  font-size: 0.78rem;
  font-style: italic;
  color: #9b8e7a;
  margin: 1rem 0 0;
  letter-spacing: 0.04em;
}
.link {
  background: none;
  border: none;
  color: #c3592b;
  cursor: pointer;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: inherit;
  text-decoration: none;
  border-bottom: 1px solid rgba(195, 89, 43, 0.3);
  padding: 0;
  margin-left: 0.4rem;
  transition: border-color 0.2s ease;
}
.link:hover {
  border-bottom-color: #c3592b;
}

@media (max-width: 720px) {
  .two-col { grid-template-columns: 1fr; }
}
</style>
