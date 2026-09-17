<script setup>
import Modal from './Modal.vue';

const props = defineProps({
  order: { type: Object, required: true },
});
defineEmits(['close']);

const WORKER_LABEL = { AR: 'Worker AR', DR: 'Worker DR', admin: 'Admin' };

function fmtFull(d) {
  return new Date(d).toLocaleString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const history = props.order.updateHistory || [];
</script>

<template>
  <Modal :title="`Riwayat update — ID ${order.customerId}`" @close="$emit('close')">
    <p v-if="history.length === 0" class="text-sm text-ink-400">
      Belum ada update yang tercatat untuk order ini.
    </p>
    <ol v-else class="space-y-3">
      <li
        v-for="(h, i) in history"
        :key="i"
        :class="[
          'flex gap-3 border-l-2 pl-3',
          h.fixed ? 'border-signal-blue/40' : h.salahId ? 'border-signal-red/40' : 'border-signal-blue/40',
        ]"
      >
        <div>
          <p class="text-sm font-medium text-ink-100">{{ WORKER_LABEL[h.by] || h.by }}</p>
          <p v-if="h.fixed" class="text-xs text-signal-blue">
            <span class="font-medium">ID / Server diperbaiki</span> · {{ fmtFull(h.at) }}
          </p>
          <p v-else-if="h.salahId" class="text-xs text-signal-red">
            <span class="font-medium">ID salah</span> · {{ fmtFull(h.at) }}
          </p>
          <p v-else class="text-xs text-ink-300">
            <span class="font-mono text-signal-blue">{{ h.done }}/{{ h.qty }}</span>
            {{ fmtFull(h.at) }}
            <span v-if="h.refund > 0" class="text-signal-red"> · {{ h.refund }} reffund</span>
          </p>
        </div>
      </li>
    </ol>
  </Modal>
</template>
