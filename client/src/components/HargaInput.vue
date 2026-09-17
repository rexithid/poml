<script setup>
import { ref } from 'vue';

const props = defineProps({
  initial: { type: Number, default: 0 },
});
const emit = defineEmits(['save']);

const value = ref(props.initial ?? 0);
const dirty = ref(false);

function handleInput() {
  dirty.value = true;
}

function handleSave() {
  emit('save', Number(value.value) || 0);
  dirty.value = false;
}
</script>

<template>
  <div class="flex items-center gap-1.5">
    <input
      type="number"
      min="0"
      v-model="value"
      @input="handleInput"
      class="w-24 rounded-md border border-ink-700 bg-ink-950 px-2 py-1 text-right font-mono text-xs text-ink-100 focus:border-signal-blue"
    />
    <button
      v-if="dirty"
      @click="handleSave"
      class="rounded-md bg-signal-blue/15 px-2 py-1 text-xs font-medium text-signal-blue hover:bg-signal-blue/25"
    >
      Simpan
    </button>
  </div>
</template>
