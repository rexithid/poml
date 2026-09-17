<script setup>
defineProps({
  title: { type: String, required: true },
});
defineEmits(['close']);
</script>

<template>
  <div class="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4" @click="$emit('close')">
    <div @click.stop class="w-full max-w-md rounded-xl border border-ink-700 bg-ink-900 p-5 shadow-panel">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-display text-base font-semibold text-ink-100">{{ title }}</h2>
        <button @click="$emit('close')" class="text-ink-500 hover:text-ink-200">×</button>
      </div>
      <slot />
    </div>
  </div>
</template>
