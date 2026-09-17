<script setup>
import { useToast } from './stores/toast.js';

const { state } = useToast();
</script>

<template>
  <router-view />

  <div class="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
    <div
      v-for="t in state.toasts"
      :key="t.id"
      :class="[
        'pointer-events-auto rounded-lg border px-4 py-2.5 text-sm font-medium shadow-panel',
        t.tone === 'error'
          ? 'border-signal-red/40 bg-ink-900 text-signal-red'
          : 'border-signal-green/40 bg-ink-900 text-signal-green',
      ]"
    >
      {{ t.message }}
    </div>
  </div>
</template>
