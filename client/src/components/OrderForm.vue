<script setup>
import { ref } from 'vue';

const props = defineProps({
  products: { type: Array, required: true },
  editingOrder: { type: Object, default: null },
  onDelete: { type: Function, default: null },
});
const emit = defineEmits(['submit']);

const productId = ref(props.editingOrder?.product || props.products[0]?._id || '');
const customerId = ref(props.editingOrder?.customerId || '');
const server = ref(props.editingOrder?.server || '');
const quantity = ref(props.editingOrder?.quantity || 1);
const assignAR = ref(props.editingOrder?.assignments?.AR?.qty || 0);
const assignDR = ref(props.editingOrder?.assignments?.DR?.qty || 0);
const error = ref('');

function handleSubmit() {
  const qty = Number(quantity.value);
  const ar = Number(assignAR.value);
  const dr = Number(assignDR.value);
  if (ar + dr > qty) {
    error.value = 'Total pembagian ke AR + DR tidak boleh melebihi kuantitas';
    return;
  }
  error.value = '';
  const payload = props.editingOrder
    ? { customerId: customerId.value, server: server.value, quantity: qty, assignAR: ar, assignDR: dr }
    : {
        productId: productId.value,
        customerId: customerId.value,
        server: server.value,
        quantity: qty,
        assignAR: ar,
        assignDR: dr,
      };
  emit('submit', payload);
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-3">
    <p
      v-if="editingOrder?.status === 'salah id'"
      class="rounded-lg border border-signal-amber/40 bg-signal-amber/10 px-3.5 py-2.5 text-xs text-signal-amber"
    >
      Order ini ditandai <strong>ID salah</strong> oleh worker. Simpan ID/Server yang benar di bawah untuk otomatis
      melepas status ID salah dan memberi tahu worker yang bersangkutan.
    </p>
    <div v-if="!editingOrder">
      <label class="mb-1.5 block text-xs font-medium text-ink-300">Produk</label>
      <select
        v-model="productId"
        class="w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-ink-100 focus:border-signal-blue"
      >
        <option v-for="p in products" :key="p._id" :value="p._id">{{ p.name }}</option>
      </select>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-300">ID</label>
        <input
          v-model="customerId"
          required
          class="w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-ink-100 focus:border-signal-blue"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-300">Server</label>
        <input
          v-model="server"
          required
          class="w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-ink-100 focus:border-signal-blue"
        />
      </div>
    </div>
    <div>
      <label class="mb-1.5 block text-xs font-medium text-ink-300">Kuantitas</label>
      <input
        type="number"
        min="1"
        v-model="quantity"
        required
        class="w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-ink-100 focus:border-signal-blue"
      />
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-300">Jatah Worker AR</label>
        <input
          type="number"
          min="0"
          v-model="assignAR"
          class="w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-ink-100 focus:border-signal-blue"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-300">Jatah Worker DR</label>
        <input
          type="number"
          min="0"
          v-model="assignDR"
          class="w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-ink-100 focus:border-signal-blue"
        />
      </div>
    </div>
    <p v-if="error" class="text-sm text-signal-red">{{ error }}</p>
    <div class="flex gap-2 pt-1">
      <button type="submit" class="flex-1 rounded-lg bg-signal-blue py-2.5 text-sm font-medium text-white">
        {{ editingOrder ? 'Simpan perubahan' : 'Tambah order' }}
      </button>
      <button
        v-if="onDelete"
        type="button"
        @click="onDelete"
        class="rounded-lg border border-signal-red/40 px-4 py-2.5 text-sm font-medium text-signal-red hover:bg-signal-red/10"
      >
        Hapus
      </button>
    </div>
  </form>
</template>
