<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import api from '../api/client.js';
import TopNav from '../components/TopNav.vue';
import SessionTabs from '../components/SessionTabs.vue';
import ProductTabs from '../components/ProductTabs.vue';
import OrderTable from '../components/OrderTable.vue';
import Modal from '../components/Modal.vue';
import SimpleForm from '../components/SimpleForm.vue';
import HargaInput from '../components/HargaInput.vue';
import OrderForm from '../components/OrderForm.vue';
import PayoutPanel from '../components/PayoutPanel.vue';

const sessions = ref([]);
const activeSession = ref(null);
const products = ref([]);
const activeProduct = ref(null);
const summary = ref([]);
const orders = ref([]);

const showSessionModal = ref(false);
const showProductModal = ref(false);
const showOrderModal = ref(false);
const editingOrder = ref(null);

const payout = ref({
  AR: { items: [], total: 0, sentAt: null },
  DR: { items: [], total: 0, sentAt: null },
});
const payoutLoading = ref({ AR: false, DR: false });

async function refreshSessions() {
  const { data } = await api.get('/sessions');
  sessions.value = data;
  if (!activeSession.value && data.length > 0) activeSession.value = data[0]._id;
}

async function refreshProducts() {
  if (!activeSession.value) return;
  const { data } = await api.get(`/products/session/${activeSession.value}`);
  products.value = data;
}

async function refreshSummary() {
  if (!activeSession.value) return;
  const { data } = await api.get(`/sessions/${activeSession.value}/summary`);
  summary.value = data;
}

async function refreshOrders() {
  if (!activeSession.value) return;
  const { data } = await api.get(`/orders/session/${activeSession.value}`);
  orders.value = data;
}

async function refreshPayout(worker) {
  if (!activeSession.value) return;
  const { data } = await api.get(`/payout/session/${activeSession.value}/${worker}`);
  payout.value = { ...payout.value, [worker]: data };
}

onMounted(refreshSessions);

watch(activeSession, () => {
  activeProduct.value = null;
  refreshProducts();
  refreshSummary();
  refreshOrders();
  refreshPayout('AR');
  refreshPayout('DR');
});

const productMap = computed(() => Object.fromEntries(products.value.map((p) => [p._id, p.name])));
const filteredOrders = computed(() =>
  activeProduct.value ? orders.value.filter((o) => o.product === activeProduct.value) : orders.value
);

async function createSession(name) {
  await api.post('/sessions', { name });
  showSessionModal.value = false;
  refreshSessions();
}

async function deleteSession(id) {
  if (!confirm('Hapus sesi ini beserta seluruh produk & antriannya?')) return;
  await api.delete(`/sessions/${id}`);
  if (activeSession.value === id) activeSession.value = null;
  refreshSessions();
}

async function createProduct(name) {
  await api.post(`/products/session/${activeSession.value}`, { name });
  showProductModal.value = false;
  refreshProducts();
  refreshSummary();
}

async function deleteProduct(id) {
  if (!confirm('Hapus produk ini beserta seluruh antriannya?')) return;
  await api.delete(`/products/${id}`);
  refreshProducts();
  refreshSummary();
  refreshOrders();
}

async function updateHarga(id, harga) {
  await api.patch(`/products/${id}`, { harga });
  refreshProducts();
}

async function submitOrder(payload) {
  if (editingOrder.value) {
    await api.patch(`/orders/${editingOrder.value.id}`, payload);
  } else {
    await api.post(`/orders/session/${activeSession.value}`, payload);
  }
  showOrderModal.value = false;
  editingOrder.value = null;
  refreshOrders();
  refreshSummary();
}

async function deleteOrder(id) {
  if (!confirm('Hapus order ini?')) return;
  await api.delete(`/orders/${id}`);
  refreshOrders();
  refreshSummary();
}

async function handleCheckPayout(worker) {
  payoutLoading.value = { ...payoutLoading.value, [worker]: true };
  try {
    const { data } = await api.get(`/payout/session/${activeSession.value}/${worker}/compute`);
    payout.value = {
      ...payout.value,
      [worker]: { ...payout.value[worker], ...data, sentAt: payout.value[worker].sentAt },
    };
  } finally {
    payoutLoading.value = { ...payoutLoading.value, [worker]: false };
  }
}

async function handleSendPayout(worker) {
  payoutLoading.value = { ...payoutLoading.value, [worker]: true };
  try {
    const { data } = await api.post(`/payout/session/${activeSession.value}/${worker}/send`);
    payout.value = { ...payout.value, [worker]: data };
  } finally {
    payoutLoading.value = { ...payoutLoading.value, [worker]: false };
  }
}

function openCreateOrder() {
  editingOrder.value = null;
  showOrderModal.value = true;
}

function openEditOrder(o) {
  editingOrder.value = o;
  showOrderModal.value = true;
}

function closeOrderModal() {
  showOrderModal.value = false;
  editingOrder.value = null;
}
</script>

<template>
  <div class="min-h-screen">
    <TopNav />
    <main class="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="font-display text-2xl font-semibold text-ink-100">Dashboard Admin</h1>
          <p class="mt-1 text-sm text-ink-400">Kelola sesi, produk, antrian, dan pembayaran worker.</p>
        </div>
        <button
          v-if="activeSession"
          @click="openCreateOrder"
          class="rounded-lg bg-signal-blue px-4 py-2 text-sm font-medium text-white hover:bg-signal-blue/90"
        >
          + Tambah order
        </button>
      </div>

      <button
        v-if="sessions.length === 0"
        @click="showSessionModal = true"
        class="w-full rounded-xl border border-dashed border-ink-700 py-16 text-center text-sm text-ink-400 hover:border-signal-blue hover:text-signal-blue"
      >
        Belum ada sesi. Klik untuk buat sesi pertama.
      </button>
      <template v-else>
        <SessionTabs
          :sessions="sessions"
          :active-id="activeSession"
          :summary="summary"
          can-manage
          @select="activeSession = $event"
          @create="showSessionModal = true"
          @delete="deleteSession"
        />

        <ProductTabs
          :products="products"
          :active-id="activeProduct"
          can-manage
          @select="activeProduct = $event"
          @create="showProductModal = true"
          @delete="deleteProduct"
        />

        <OrderTable :orders="filteredOrders" :product-map="productMap" :on-row-click="openEditOrder" />

        <!-- Harga produk, dipakai kalkulator payout. Tidak terlihat oleh worker. -->
        <section v-if="products.length > 0" class="mt-10">
          <h2 class="font-display text-base font-semibold text-ink-100">Harga satuan produk</h2>
          <p class="mt-1 text-xs text-ink-500">
            Dipakai untuk menghitung pembayaran ke worker. Worker tidak melihat harga ini.
          </p>
          <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="p in products"
              :key="p._id"
              class="flex items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900/60 px-3.5 py-2.5"
            >
              <span class="text-sm text-ink-200">{{ p.name }}</span>
              <HargaInput :initial="p.harga" @save="(v) => updateHarga(p._id, v)" />
            </div>
          </div>
        </section>

        <section class="mt-10">
          <h2 class="font-display text-base font-semibold text-ink-100">Pembayaran worker</h2>
          <p class="mt-1 text-xs text-ink-500">
            Klik "Cek" untuk hitung totalan terbaru, lalu "Kirim ke worker" agar muncul di halaman kerja mereka.
          </p>
          <div class="mt-3 grid gap-4 lg:grid-cols-2">
            <PayoutPanel
              v-for="worker in ['AR', 'DR']"
              :key="worker"
              :worker="worker"
              :data="payout[worker]"
              :loading="payoutLoading[worker]"
              @check="handleCheckPayout(worker)"
              @send="handleSendPayout(worker)"
            />
          </div>
        </section>
      </template>
    </main>

    <Modal v-if="showSessionModal" title="Sesi baru" @close="showSessionModal = false">
      <SimpleForm label="Nama sesi" placeholder="mis. Batch 12 September" @submit="createSession" />
    </Modal>

    <Modal v-if="showProductModal" title="Produk baru" @close="showProductModal = false">
      <SimpleForm label="Nama produk" placeholder="mis. 59 Diamond" @submit="createProduct" />
    </Modal>

    <Modal
      v-if="showOrderModal"
      :title="editingOrder ? `Edit order #${editingOrder.no}` : 'Tambah order'"
      @close="closeOrderModal"
    >
      <OrderForm
        :products="products"
        :editing-order="editingOrder"
        :on-delete="editingOrder ? () => deleteOrder(editingOrder.id) : null"
        @submit="submitOrder"
      />
    </Modal>
  </div>
</template>
