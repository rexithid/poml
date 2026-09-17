<script setup>
defineProps({
  status: { type: String, required: true },
});

const STYLES = {
  antri: 'bg-ink-700 text-ink-300',
  proses: 'bg-signal-amber/15 text-signal-amber',
  done: 'bg-signal-green/15 text-signal-green',
  reffund: 'bg-signal-red/15 text-signal-red',
  'salah id': 'bg-signal-red/15 text-signal-red',
};

const LABELS = {
  antri: 'Antri',
  proses: 'Proses',
  done: 'Selesai',
  reffund: 'Reffund',
  'salah id': 'ID Salah',
};
</script>

<template>
  <span :class="`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${STYLES[status] || STYLES.antri}`">
    {{ LABELS[status] || status }}
  </span>
</template>
