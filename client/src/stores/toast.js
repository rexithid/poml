import { reactive } from 'vue';

// State reaktif tunggal (singleton) — dipakai di seluruh app, menggantikan ToastContext React.
const state = reactive({
  toasts: [],
});

function showToast(message, tone = 'success') {
  const id = Math.random().toString(36).slice(2);
  state.toasts.push({ id, message, tone });
  setTimeout(() => {
    state.toasts = state.toasts.filter((t) => t.id !== id);
  }, 3000);
}

export function useToast() {
  return { state, showToast };
}
