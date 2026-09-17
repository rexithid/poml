<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../stores/auth.js';
import TopNav from '../components/TopNav.vue';

const { login } = useAuth();
const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);

async function handleSubmit() {
  error.value = '';
  busy.value = true;
  try {
    const data = await login(username.value, password.value);
    router.push(data.role === 'admin' ? '/admin' : '/worker');
  } catch (err) {
    error.value = err.response?.data?.message || 'Gagal login, coba lagi';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen">
    <TopNav />
    <main class="mx-auto flex max-w-sm flex-col justify-center px-4 pt-24">
      <h1 class="font-display text-xl font-semibold text-ink-100">Masuk</h1>
      <p class="mt-1 text-sm text-ink-400">Untuk admin dan worker pengerjaan pre order.</p>

      <form @submit.prevent="handleSubmit" class="mt-6 space-y-4">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-ink-300">Username</label>
          <input
            v-model="username"
            autofocus
            class="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-sm text-ink-100 focus:border-signal-blue"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-ink-300">Password</label>
          <input
            v-model="password"
            type="password"
            class="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-sm text-ink-100 focus:border-signal-blue"
          />
        </div>
        <p v-if="error" class="text-sm text-signal-red">{{ error }}</p>
        <button
          type="submit"
          :disabled="busy"
          class="w-full rounded-lg bg-signal-blue py-2.5 text-sm font-medium text-white transition-colors hover:bg-signal-blue/90 disabled:opacity-60"
        >
          {{ busy ? 'Memproses…' : 'Masuk' }}
        </button>
      </form>
    </main>
  </div>
</template>
