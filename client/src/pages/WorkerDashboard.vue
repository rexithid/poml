<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import api from '../api/client.js';
import { useAuth } from '../stores/auth.js';
import { useToast } from '../stores/toast.js';
import TopNav from '../components/TopNav.vue';
import SessionTabs from '../components/SessionTabs.vue';
import WorkerOrderRow from '../components/WorkerOrderRow.vue';

const { state: authState } = useAuth();
const worker = authState.auth.role; // 'AR' | 'DR'
const { showToast } = useToast();

const sessions = ref([]);
const activeSession = ref(null);
const products = ref([]);
const summary = ref([]);
const orders = ref([]);
const payout = ref({ items: [], total: 0, sentAt: null });

let pollTimer = null;

function fmtRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    n || 0
  );
}

async function refreshSessions() {
  const { data } = await api.get('/sessions');
  sessions.value = data;
  if (!activeSession.value && data.length > 0) activeSession.value = data[0]._id;
}

async function refreshAll() {
  if (!activeSession.value) return;
  const [p, s, o, pay] = await Promise.all([
    api.get(`/products/session/${activeSession.value}`),
    api.get(`/sessions/${activeSession.value}/summary`, { params: { role: worker } }),
    api.get(`/orders/session/${activeSession.value}/worker/${worker}`),
    api.get(`/payout/session/${activeSession.value}/${worker}`),
  ]);
  products.value = p.data;
  summary.value = s.data;

  // Kalau ada order yang baru pertama kali punya notice (belum ada sebelumnya), munculkan toast
  // biar worker langsung sadar meski nggak lagi lihat baris itu.
  const prevOrders = orders.value;
  for (const next of o.data) {
    if (!next.notice) continue;
    const prev = prevOrders.find((x) => x.id === next.id);
    if (!prev?.notice) {
      showToast(`ID ${next.customerId} sudah diperbaiki admin — cek order-nya.`);
    }
  }
  orders.value = o.data;
  payout.value = pay.data;
}

onMounted(async () => {
  await refreshSessions();
  await refreshAll();
  pollTimer = setInterval(refreshAll, 10000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

watch(activeSession, refreshAll);

const productMap = computed(() => Object.fromEntries(products.value.map((p) => [p._id, p.name])));

// Ringkasan DONE/REFFUND per produk, untuk dicocokkan worker dengan payout dari admin.
const productTotals = computed(() => {
  const map = {};
  for (const p of products.value) map[p._id] = { name: p.name, done: 0, refund: 0, target: 0 };
  for (const o of orders.value) {
    const entry = map[o.product];
    if (!entry) continue;
    entry.done += o.myAssignment.done;
    entry.refund += o.myAssignment.refund;
    entry.target += o.myAssignment.qty;
  }
  return Object.values(map);
});

async function handleAction(order, action) {
  if (action === 'salah-id') {
    await api.patch(`/orders/${order.id}/salah-id`, { worker });
  } else if (action === 'mark-update') {
    await api.patch(`/orders/${order.id}/mark-update`);
  } else if (action === 'ack-notice') {
    await api.patch(`/orders/${order.id}/notice/ack`);
  } else {
    await api.patch(`/orders/${order.id}/progress`, { worker, action });
  }
  refreshAll();
}
</script>

<template>
  <div class="min-h-screen">
    <TopNav />
    <main class="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <div class="mb-6">
        <h1 class="font-display text-2xl font-semibold text-ink-100">Kerjaan Worker {{ worker }}</h1>
        <p class="mt-1 text-sm text-ink-400">Ini cuma jatah kamu — kerjakan lalu tandai progresnya.</p>
      </div>

      <div
        v-if="sessions.length === 0"
        class="rounded-xl border border-dashed border-ink-700 py-16 text-center text-sm text-ink-500"
      >
        Belum ada sesi.
      </div>
      <template v-else>
        <SessionTabs
          :sessions="sessions"
          :active-id="activeSession"
          :summary="summary"
          :can-manage="false"
          @select="activeSession = $event"
        />

        <div class="mt-4 overflow-x-auto rounded-xl border border-ink-700 bg-ink-900/60 shadow-panel">
          <table class="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr class="border-b border-ink-700 text-xs uppercase tracking-wide text-ink-400">
                <th class="px-4 py-3 font-medium">No</th>
                <th class="px-4 py-3 font-medium">ID</th>
                <th class="px-4 py-3 font-medium">Server</th>
                <th class="px-4 py-3 font-medium">Produk</th>
                <th class="px-4 py-3 font-medium">Progres saya</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Aksi</th>
                <th class="px-4 py-3 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="orders.length === 0">
                <td colspan="8" class="px-4 py-12 text-center text-sm text-ink-500">
                  Belum ada jatah untukmu di sesi ini.
                </td>
              </tr>
              <WorkerOrderRow
                v-for="o in orders"
                :key="o.id"
                :order="o"
                :product-name="productMap[o.product] || '—'"
                :worker="worker"
                :on-action="(action) => handleAction(o, action)"
              />
            </tbody>
          </table>
        </div>

        <section class="mt-10 grid gap-4 lg:grid-cols-2">
          <div class="rounded-xl border border-ink-700 bg-ink-900/60 p-4 shadow-panel">
            <h2 class="font-display text-sm font-semibold text-ink-100">Ringkasan pekerjaanku</h2>
            <table class="mt-3 w-full text-xs">
              <thead class="text-ink-500">
                <tr>
                  <th class="pb-1.5 text-left font-medium">Produk</th>
                  <th class="pb-1.5 text-right font-medium">Total Order</th>
                  <th class="pb-1.5 text-right font-medium">Done</th>
                  <th class="pb-1.5 text-right font-medium">Reffund</th>
                  <th class="pb-1.5 text-right font-medium">Sisa</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in productTotals" :key="t.name" class="border-t border-ink-800">
                  <td class="py-1.5 text-ink-200">{{ t.name }}</td>
                  <td class="py-1.5 text-right font-mono text-ink-400">{{ t.target }}</td>
                  <td class="py-1.5 text-right font-mono text-signal-green">{{ t.done }}</td>
                  <td class="py-1.5 text-right font-mono text-signal-red">{{ t.refund }}</td>
                  <td class="py-1.5 text-right font-mono text-signal-amber">
                    {{ Math.max(t.target - t.done - t.refund, 0) }}
                  </td>
                </tr>
                <tr class="border-t border-ink-700 font-medium">
                  <td class="py-1.5 text-ink-300">Total keseluruhan</td>
                  <td class="py-1.5 text-right font-mono text-ink-300">
                    {{ productTotals.reduce((s, t) => s + t.target, 0) }}
                  </td>
                  <td class="py-1.5 text-right font-mono text-signal-green">
                    {{ productTotals.reduce((s, t) => s + t.done, 0) }}
                  </td>
                  <td class="py-1.5 text-right font-mono text-signal-red">
                    {{ productTotals.reduce((s, t) => s + t.refund, 0) }}
                  </td>
                  <td class="py-1.5 text-right font-mono text-signal-amber">
                    {{ productTotals.reduce((s, t) => s + Math.max(t.target - t.done - t.refund, 0), 0) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="rounded-xl border border-ink-700 bg-ink-900/60 p-4 shadow-panel">
            <h2 class="font-display text-sm font-semibold text-ink-100">Pembayaran dari admin</h2>
            <p v-if="payout.items.length === 0" class="mt-3 text-xs text-ink-500">
              Admin belum mengirim totalan untuk sesi ini.
            </p>
            <template v-else>
              <table class="mt-3 w-full text-xs">
                <thead class="text-ink-500">
                  <tr>
                    <th class="pb-1.5 text-left font-medium">Produk</th>
                    <th class="pb-1.5 text-right font-medium">Done</th>
                    <th class="pb-1.5 text-right font-medium">Harga</th>
                    <th class="pb-1.5 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="it in payout.items" :key="it.product" class="border-t border-ink-800">
                    <td class="py-1.5 text-ink-200">{{ it.productName }}</td>
                    <td class="py-1.5 text-right font-mono text-signal-green">{{ it.doneCount }}</td>
                    <td class="py-1.5 text-right font-mono text-ink-400">{{ fmtRupiah(it.harga) }}</td>
                    <td class="py-1.5 text-right font-mono text-ink-100">{{ fmtRupiah(it.subtotal) }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="mt-3 flex items-center justify-between border-t border-ink-700 pt-3">
                <span class="text-xs text-ink-400">
                  {{ payout.sentAt ? `Dikirim ${new Date(payout.sentAt).toLocaleString('id-ID')}` : '' }}
                </span>
                <span class="font-display text-base font-semibold text-signal-green">{{ fmtRupiah(payout.total) }}</span>
              </div>
            </template>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>
