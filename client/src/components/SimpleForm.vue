<script setup>
import { ref } from 'vue';

defineProps({
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
});
const emit = defineEmits(['submit']);

const value = ref('');

function handleSubmit() {
  if (value.value.trim()) emit('submit', value.value.trim());
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-3">
    <div>
      <label class="mb-1.5 block text-xs font-medium text-ink-300">{{ label }}</label>
      <input
        v-model="value"
        :placeholder="placeholder"
        autofocus
        class="w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-ink-100 focus:border-signal-blue"
      />
    </div>
    <button type="submit" class="w-full rounded-lg bg-signal-blue py-2.5 text-sm font-medium text-white">
      Simpan
    </button>
  </form>
</template>
