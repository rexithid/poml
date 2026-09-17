<script setup>
defineProps({
  worker: { type: String, required: true },
  data: { type: Object, required: true },
  loading: { type: Boolean, default: false },
});
defineEmits(['check', 'send']);

function fmtRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    n || 0
  );
}
</script>

<template>
  <div class="rounded-xl border border-ink-700 bg-ink-900/60 p-4 shadow-panel">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="font-display text-sm font-semibold text-ink-100">Worker {{ worker }}</h3>
      <div class="flex gap-2">
        <button
          @click="$emit('check')"
          :disabled="loading"
          class="rounded-md border border-ink-600 px-3 py-1.5 text-xs font-medium text-ink-200 hover:border-signal-blue hover:text-signal-blue disabled:opacity-50"
        >
          Cek
        </button>
        <button
          @click="$emit('send')"
          :disabled="loading"
          class="rounded-md bg-signal-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-signal-blue/90 disabled:opacity-50"
        >
          Kirim ke worker
        </button>
      </div>
    </div>

    <p v-if="data.items.length === 0" class="text-xs text-ink-500">Belum ada data. Klik "Cek" untuk hitung.</p>
    <template v-else>
      <table class="w-full text-xs">
        <thead class="text-ink-500">
          <tr>
            <th class="pb-1.5 text-left font-medium">Produk</th>
            <th class="pb-1.5 text-right font-medium">Total Order</th>
            <th class="pb-1.5 text-right font-medium">Done</th>
            <th class="pb-1.5 text-right font-medium">Reffund</th>
            <th class="pb-1.5 text-right font-medium">Harga</th>
            <th class="pb-1.5 text-right font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="it in data.items" :key="it.product" class="border-t border-ink-800">
            <td class="py-1.5 text-ink-200">{{ it.productName }}</td>
            <td class="py-1.5 text-right font-mono text-ink-400">{{ it.totalOrder }}</td>
            <td class="py-1.5 text-right font-mono text-signal-green">{{ it.doneCount }}</td>
            <td class="py-1.5 text-right font-mono text-signal-red">{{ it.refundCount }}</td>
            <td class="py-1.5 text-right font-mono text-ink-400">{{ fmtRupiah(it.harga) }}</td>
            <td class="py-1.5 text-right font-mono text-ink-100">{{ fmtRupiah(it.subtotal) }}</td>
          </tr>
          <tr class="border-t border-ink-700 font-medium">
            <td class="py-1.5 text-ink-300">Total keseluruhan</td>
            <td class="py-1.5 text-right font-mono text-ink-300">
              {{ data.items.reduce((s, it) => s + it.totalOrder, 0) }}
            </td>
            <td class="py-1.5 text-right font-mono text-signal-green">
              {{ data.items.reduce((s, it) => s + it.doneCount, 0) }}
            </td>
            <td class="py-1.5 text-right font-mono text-signal-red">
              {{ data.items.reduce((s, it) => s + it.refundCount, 0) }}
            </td>
            <td class="py-1.5"></td>
            <td class="py-1.5 text-right font-mono text-ink-100">{{ fmtRupiah(data.total) }}</td>
          </tr>
        </tbody>
      </table>
      <div class="mt-3 flex items-center justify-between border-t border-ink-700 pt-3">
        <span class="text-xs text-ink-400">
          {{ data.sentAt ? `Terkirim ${new Date(data.sentAt).toLocaleString('id-ID')}` : 'Belum dikirim' }}
        </span>
        <span class="font-display text-base font-semibold text-signal-green">{{ fmtRupiah(data.total) }}</span>
      </div>
    </template>
  </div>
</template>
