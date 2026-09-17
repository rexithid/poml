<script setup>
defineProps({
  sessions: { type: Array, required: true },
  activeId: { type: String, default: null },
  summary: { type: Array, default: () => [] },
  canManage: { type: Boolean, default: false },
});
defineEmits(['select', 'create', 'delete']);
</script>

<template>
  <div class="border-b border-ink-700">
    <div class="flex flex-wrap items-center gap-1.5">
      <button
        v-for="s in sessions"
        :key="s._id"
        @click="$emit('select', s._id)"
        :class="[
          'group relative flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors',
          s._id === activeId ? 'bg-ink-800 text-ink-100' : 'text-ink-400 hover:bg-ink-900 hover:text-ink-200',
        ]"
      >
        {{ s.name }}
        <span
          v-if="s._id === activeId"
          class="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-signal-blue"
        />
        <span
          v-if="canManage"
          role="button"
          tabindex="0"
          @click.stop="$emit('delete', s._id)"
          class="ml-1 hidden rounded px-1 text-ink-500 hover:text-signal-red group-hover:inline"
          title="Hapus sesi"
        >
          ×
        </span>
      </button>
      <button
        v-if="canManage"
        @click="$emit('create')"
        class="ml-1 rounded-t-lg px-3 py-2.5 text-sm text-ink-500 hover:bg-ink-900 hover:text-signal-blue"
      >
        + Sesi
      </button>
    </div>
    <div
      v-if="summary && summary.length > 0"
      class="flex flex-wrap gap-x-6 gap-y-1 bg-ink-800 px-4 py-2.5 text-xs text-ink-300"
    >
      <span v-for="item in summary" :key="item.productId" class="font-mono">
        <span class="text-ink-100">{{ item.name.toUpperCase() }}</span>
        <span class="text-ink-500"> : </span>
        <span class="text-signal-blue">{{ item.total }} PCS</span>
      </span>
    </div>
  </div>
</template>
