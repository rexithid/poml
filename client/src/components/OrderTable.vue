<script setup>
import { ref } from 'vue';
import ProgressBar from './ProgressBar.vue';
import StatusBadge from './StatusBadge.vue';
import EyeIcon from './EyeIcon.vue';
import HistoryModal from './HistoryModal.vue';

defineProps({
  orders: { type: Array, required: true },
  productMap: { type: Object, required: true },
  onRowClick: { type: Function, default: null },
});

const historyOrder = ref(null);

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <div v-if="orders.length === 0" class="rounded-xl border border-dashed border-ink-700 py-16 text-center text-sm text-ink-500">
    Belum ada antrian di sini.
  </div>

  <template v-else>
    <!-- Kartu, cuma tampil di layar kecil (hp) — progress bar dibikin besar biar gampang dibaca -->
    <div class="grid gap-3 md:hidden">
      <div
        v-for="o in orders"
        :key="o.id"
        @click="onRowClick && onRowClick(o)"
        :class="[
          'rounded-xl border border-ink-700 bg-ink-900/60 p-4 shadow-panel',
          onRowClick ? 'cursor-pointer active:bg-ink-800/60' : '',
        ]"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-mono text-sm font-medium text-ink-100">{{ o.customerId }}</p>
            <p class="font-mono text-xs text-ink-400">Server {{ o.server }}</p>
          </div>
          <StatusBadge :status="o.status" />
        </div>

        <p class="mt-2 text-sm text-ink-200">{{ productMap[o.product] || '—' }}</p>

        <div class="mt-3">
          <ProgressBar
            :quantity="o.quantity"
            :done="o.progress.done"
            :refund="o.progress.refund"
            :salah-id="o.salahId"
            size="lg"
          />
        </div>

        <div class="mt-3 flex items-center justify-between text-xs text-ink-400">
          <div class="flex gap-3 font-mono">
            <span>AR {{ o.assignments.AR.done }}/{{ o.assignments.AR.qty }}</span>
            <span>DR {{ o.assignments.DR.done }}/{{ o.assignments.DR.qty }}</span>
          </div>
          <div class="flex items-center gap-1.5" @click.stop>
            <span>{{ fmtDate(o.lastUpdate) }}</span>
            <EyeIcon @click="historyOrder = o" />
          </div>
        </div>
      </div>
    </div>

    <!-- Tabel penuh, cuma tampil di layar medium ke atas (tablet/desktop) -->
    <div class="hidden overflow-x-auto rounded-xl border border-ink-700 bg-ink-900/60 shadow-panel md:block">
      <table class="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr class="border-b border-ink-700 text-xs uppercase tracking-wide text-ink-400">
            <th class="px-4 py-3 font-medium">No</th>
            <th class="px-4 py-3 font-medium">ID</th>
            <th class="px-4 py-3 font-medium">Server</th>
            <th class="px-4 py-3 font-medium">Produk</th>
            <th class="px-4 py-3 font-medium">Progres</th>
            <th class="px-4 py-3 font-medium">Worker AR</th>
            <th class="px-4 py-3 font-medium">Worker DR</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Update</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="o in orders"
            :key="o.id"
            @click="onRowClick && onRowClick(o)"
            :class="['border-b border-ink-800 last:border-0', onRowClick ? 'cursor-pointer hover:bg-ink-800/60' : '']"
          >
            <td class="px-4 py-3 font-mono text-ink-400">{{ o.no }}</td>
            <td class="px-4 py-3 font-mono text-ink-100">{{ o.customerId }}</td>
            <td class="px-4 py-3 font-mono text-ink-300">{{ o.server }}</td>
            <td class="px-4 py-3 text-ink-200">{{ productMap[o.product] || '—' }}</td>
            <td class="px-4 py-3">
              <ProgressBar :quantity="o.quantity" :done="o.progress.done" :refund="o.progress.refund" :salah-id="o.salahId" />
            </td>
            <td class="px-4 py-3 font-mono text-ink-300">{{ o.assignments.AR.done }}/{{ o.assignments.AR.qty }}</td>
            <td class="px-4 py-3 font-mono text-ink-300">{{ o.assignments.DR.done }}/{{ o.assignments.DR.qty }}</td>
            <td class="px-4 py-3">
              <StatusBadge :status="o.status" />
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-1.5" @click.stop>
                <span class="text-xs text-ink-500">{{ fmtDate(o.lastUpdate) }}</span>
                <EyeIcon @click="historyOrder = o" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <HistoryModal v-if="historyOrder" :order="historyOrder" @close="historyOrder = null" />
  </template>
</template>
