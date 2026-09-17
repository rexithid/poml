<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import api from '../api/client.js';
import TopNav from '../components/TopNav.vue';
import SessionTabs from '../components/SessionTabs.vue';
import ProductTabs from '../components/ProductTabs.vue';
import OrderTable from '../components/OrderTable.vue';

const sessions = ref([]);
const activeSession = ref(null);
const products = ref([]);
const activeProduct = ref(null);
const summary = ref([]);
const orders = ref([]);
const q = ref('');
const loading = ref(true);

let pollTimer = null;

onMounted(async () => {
  const { data } = await api.get('/sessions');
  sessions.value = data;
  if (data.length > 0) activeSession.value = data[0]._id;
  loading.value = false;

  pollTimer = setInterval(loadOrders, 8000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

watch(activeSession, async (val) => {
  if (!val) return;
  activeProduct.value = null;
  const [p, s] = await Promise.all([
    api.get(`/products/session/${val}`),
    api.get(`/sessions/${val}/summary`),
  ]);
  products.value = p.data;
  summary.value = s.data;
  loadOrders();
});

function loadOrders() {
  if (!activeSession.value) return;
  api.get(`/orders/session/${activeSession.value}`, { params: { q: q.value } }).then(({ data }) => {
    orders.value = data;
  });
}

watch(q, loadOrders);

const productMap = computed(() => Object.fromEntries(products.value.map((p) => [p._id, p.name])));

const filteredOrders = computed(() =>
  activeProduct.value ? orders.value.filter((o) => o.product === activeProduct.value) : orders.value
);
</script>

<template>
  <div class="min-h-screen">
    <TopNav />
    <main class="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div class="mb-6">
        <h1 class="font-display text-2xl font-semibold text-ink-100 sm:text-3xl">Pantau progres pesananmu</h1>
        <p class="mt-1 text-sm text-ink-400">
          Pilih sesi, cari pakai ID atau server, lalu lihat progres pengerjaan secara langsung.
        </p>
      </div>

      <div v-if="loading" class="py-24 text-center text-sm text-ink-500">Memuat sesi…</div>
      <div
        v-else-if="sessions.length === 0"
        class="rounded-xl border border-dashed border-ink-700 py-24 text-center text-sm text-ink-500"
      >
        Belum ada sesi yang dibuka.
      </div>
      <template v-else>
        <SessionTabs
          :sessions="sessions"
          :active-id="activeSession"
          :summary="summary"
          :can-manage="false"
          @select="activeSession = $event"
        />

        <div class="flex flex-col gap-3 pb-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <ProductTabs
            :products="products"
            :active-id="activeProduct"
            :can-manage="false"
            @select="activeProduct = $event"
          />
          <input
            v-model="q"
            placeholder="Cari ID atau server…"
            class="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:border-signal-blue sm:w-64"
          />
        </div>

        <OrderTable :orders="filteredOrders" :product-map="productMap" />
      </template>
    </main>
  </div>
</template>
