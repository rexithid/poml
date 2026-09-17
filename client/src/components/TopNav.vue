<script setup>
import { useAuth } from '../stores/auth.js';

const { state, logout } = useAuth();
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-ink-800 bg-ink-950/90 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
      <router-link to="/" class="flex items-center gap-2.5">
        <span
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-blue/15 font-display text-sm font-bold text-signal-blue"
        >
          ◆
        </span>
        <span class="font-display text-base font-semibold tracking-tight text-ink-100">Preorder MLBB</span>
      </router-link>

      <div class="flex items-center gap-3 text-sm">
        <template v-if="state.auth">
          <router-link
            :to="state.auth.role === 'admin' ? '/admin' : '/worker'"
            class="rounded-lg px-3 py-1.5 text-ink-300 hover:bg-ink-800 hover:text-ink-100"
          >
            {{ state.auth.role === 'admin' ? 'Dashboard Admin' : `Kerjaan ${state.auth.role}` }}
          </router-link>
          <span class="hidden text-ink-500 sm:inline">·</span>
          <span class="hidden text-ink-400 sm:inline">{{ state.auth.username }}</span>
          <button
            @click="logout"
            class="rounded-lg border border-ink-700 px-3 py-1.5 text-ink-300 hover:border-signal-red/50 hover:text-signal-red"
          >
            Keluar
          </button>
        </template>
        <router-link
          v-else
          to="/login"
          class="rounded-lg bg-signal-blue px-3.5 py-1.5 font-medium text-white hover:bg-signal-blue/90"
        >
          Login
        </router-link>
      </div>
    </div>
  </header>
</template>
