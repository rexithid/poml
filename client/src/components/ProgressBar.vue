<script setup>
import { computed } from 'vue';

const props = defineProps({
  quantity: { type: Number, required: true },
  done: { type: Number, required: true },
  refund: { type: Number, required: true },
  salahId: { type: Boolean, default: false },
  size: { type: String, default: 'sm' },
});

const SIZES = {
  sm: { bar: 'h-2', label: 'text-xs w-12' },
  lg: { bar: 'h-3.5', label: 'text-sm w-14 font-semibold' },
};

const s = computed(() => SIZES[props.size]);
const pending = computed(() => Math.max(props.quantity - props.done - props.refund, 0));
const pct = (n) => (props.quantity > 0 ? (n / props.quantity) * 100 : 0);
</script>

<template>
  <div v-if="salahId" class="flex items-center gap-2">
    <div :class="`${s.bar} flex-1 rounded-full bg-signal-red/90`" />
    <span :class="`${s.label} shrink-0 font-mono text-signal-red`">ID salah</span>
  </div>

  <div v-else class="flex items-center gap-2">
    <div :class="`flex ${s.bar} flex-1 overflow-hidden rounded-full bg-ink-700`">
      <div v-if="done > 0" class="h-full bg-signal-green" :style="{ width: `${pct(done)}%` }" />
      <div v-if="refund > 0" class="h-full bg-signal-red" :style="{ width: `${pct(refund)}%` }" />
      <div v-if="pending > 0" class="h-full bg-signal-amber" :style="{ width: `${pct(pending)}%` }" />
    </div>
    <span :class="`${s.label} shrink-0 font-mono text-ink-300`">{{ done + refund }}/{{ quantity }}</span>
  </div>
</template>
