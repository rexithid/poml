<script setup>
defineProps({
  products: { type: Array, required: true },
  activeId: { type: String, default: null },
  canManage: { type: Boolean, default: false },
});
defineEmits(['select', 'create', 'delete']);
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5 py-3">
    <button
      @click="$emit('select', null)"
      :class="[
        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
        activeId === null ? 'bg-signal-blue text-white' : 'bg-ink-800 text-ink-300 hover:bg-ink-700',
      ]"
    >
      Semua produk
    </button>
    <button
      v-for="p in products"
      :key="p._id"
      @click="$emit('select', p._id)"
      :class="[
        'group flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
        activeId === p._id ? 'bg-signal-blue text-white' : 'bg-ink-800 text-ink-300 hover:bg-ink-700',
      ]"
    >
      {{ p.name }}
      <span
        v-if="canManage"
        role="button"
        tabindex="0"
        @click.stop="$emit('delete', p._id)"
        class="hidden text-ink-500 hover:text-signal-red group-hover:inline"
        title="Hapus produk"
      >
        ×
      </span>
    </button>
    <button
      v-if="canManage"
      @click="$emit('create')"
      class="rounded-full border border-dashed border-ink-600 px-3 py-1 text-xs text-ink-400 hover:border-signal-blue hover:text-signal-blue"
    >
      + Produk
    </button>
  </div>
</template>
