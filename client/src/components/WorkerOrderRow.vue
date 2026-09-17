<script setup>
import { ref, computed } from 'vue';
import ProgressBar from './ProgressBar.vue';
import StatusBadge from './StatusBadge.vue';
import EyeIcon from './EyeIcon.vue';
import HistoryModal from './HistoryModal.vue';
import { useToast } from '../stores/toast.js';

const props = defineProps({
  order: { type: Object, required: true },
  productName: { type: String, required: true },
  worker: { type: String, required: true },
  onAction: { type: Function, required: true },
});

const { showToast } = useToast();
const showHistory = ref(false);

const mine = computed(() => props.order.myAssignment);
const finished = computed(() => mine.value.done + mine.value.refund >= mine.value.qty);
const myLastEntry = computed(
  () => (props.order.updateHistory || []).find((h) => h.by === props.worker && !h.fixed)
);

function fmtShort(d) {
  if (!d) return null;
  return new Date(d).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function handleUpdateClick() {
  const ok = window.confirm(
    `Tandai ID ${props.order.customerId} sudah diupdate sekarang?\n\nIni akan tercatat dengan tanggal & jam saat ini di riwayat order.`
  );
  if (!ok) return;
  try {
    await props.onAction('mark-update');
    showToast('Berhasil ditandai update — sudah tercatat di riwayat.');
  } catch {
    showToast('Gagal menandai update, coba lagi.', 'error');
  }
}

async function handleAckNotice() {
  try {
    await props.onAction('ack-notice');
  } catch {
    showToast('Gagal menutup notifikasi, coba lagi.', 'error');
  }
}
</script>

<template>
  <tr v-if="order.notice" class="border-b border-ink-800">
    <td colspan="8" class="px-4 py-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-signal-blue/40 bg-signal-blue/10 px-3.5 py-2">
        <p class="text-xs text-signal-blue">
          <span class="font-medium">ID {{ order.customerId }}</span> — server/ID sudah diperbaiki admin, silakan
          lanjut kerjakan.
        </p>
        <button
          @click="handleAckNotice"
          class="rounded-md bg-signal-blue px-2.5 py-1 text-xs font-medium text-white hover:bg-signal-blue/90"
        >
          Oke, mengerti
        </button>
      </div>
    </td>
  </tr>

  <tr class="border-b border-ink-800 last:border-0">
    <td class="px-4 py-3 font-mono text-ink-400">{{ order.no }}</td>
    <td class="px-4 py-3 font-mono text-ink-100">{{ order.customerId }}</td>
    <td class="px-4 py-3 font-mono text-ink-300">{{ order.server }}</td>
    <td class="px-4 py-3 text-ink-200">{{ productName }}</td>
    <td class="px-4 py-3">
      <ProgressBar :quantity="mine.qty" :done="mine.done" :refund="mine.refund" :salah-id="order.salahId" />
    </td>
    <td class="px-4 py-3">
      <StatusBadge :status="order.status" />
    </td>
    <td class="px-4 py-3">
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          @click="onAction('done')"
          :disabled="finished || order.salahId"
          class="rounded-md bg-signal-green/15 px-2.5 py-1 text-xs font-medium text-signal-green hover:bg-signal-green/25 disabled:opacity-40"
        >
          +1 Done
        </button>
        <button
          @click="onAction('refund')"
          :disabled="finished || order.salahId"
          class="rounded-md bg-signal-red/15 px-2.5 py-1 text-xs font-medium text-signal-red hover:bg-signal-red/25 disabled:opacity-40"
        >
          +1 Reffund
        </button>
        <button
          @click="onAction('undo-done')"
          :disabled="mine.done === 0"
          class="rounded-md border border-ink-600 px-2 py-1 text-xs text-ink-400 hover:text-ink-200 disabled:opacity-30"
          title="Batalkan +1 done terakhir"
        >
          ↺D
        </button>
        <button
          @click="onAction('undo-refund')"
          :disabled="mine.refund === 0"
          class="rounded-md border border-ink-600 px-2 py-1 text-xs text-ink-400 hover:text-ink-200 disabled:opacity-30"
          title="Batalkan +1 reffund terakhir"
        >
          ↺R
        </button>
        <button
          @click="onAction('salah-id')"
          :class="[
            'rounded-md border px-2.5 py-1 text-xs font-medium',
            order.salahId
              ? 'border-signal-red bg-signal-red/20 text-signal-red'
              : 'border-ink-600 text-ink-400 hover:text-signal-red',
          ]"
        >
          ID Salah
        </button>
      </div>
    </td>
    <td class="px-4 py-3">
      <div class="flex items-center gap-1.5">
        <div>
          <button
            @click="handleUpdateClick"
            class="rounded-md border border-signal-blue/40 px-2.5 py-1 text-xs font-medium text-signal-blue hover:bg-signal-blue/10"
          >
            Update
          </button>
          <p v-if="myLastEntry && myLastEntry.salahId" class="mt-1 text-[11px] text-signal-red">
            ID salah · {{ fmtShort(myLastEntry.at) }}
          </p>
          <p v-else-if="myLastEntry" class="mt-1 text-[11px] text-ink-500">
            <span class="font-mono text-signal-blue">{{ myLastEntry.done }}/{{ myLastEntry.qty }}</span>
            {{ fmtShort(myLastEntry.at) }}
          </p>
        </div>
        <EyeIcon @click="showHistory = true" />
      </div>
    </td>
  </tr>

  <HistoryModal v-if="showHistory" :order="order" @close="showHistory = false" />
</template>
