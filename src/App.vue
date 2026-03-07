<template>
  <div>
    <Toast />
    <router-view />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import Toast from 'primevue/toast';
import { useRoute, useRouter } from 'vue-router';

import { useGlobalNotifications } from '@/plugins/useGlobalNotifications'; 
import { isHiddenAdminUnlocked, unlockHiddenAdmin } from '@/mocks/config';
const { addToast } = useGlobalNotifications();

const route = useRoute();
const router = useRouter();
const keyBuffer = ref([]);
const SECRET_SEQUENCE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const IS_DEV = import.meta.env.DEV;

const normalizeKey = (event) => {
  if (event.code === 'ArrowUp' || event.code === 'ArrowDown' || event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
    return event.code;
  }
  if (event.code === 'KeyB') return 'b';
  if (event.code === 'KeyA') return 'a';
  if (event.key.length === 1) return event.key.toLowerCase();
  return event.key;
};

const isTypingTarget = (target) => {
  const tag = target?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target?.isContentEditable;
};

const showToast = (severity, detail) => {
  addToast({
    severity,
    summary: 'Control Room',
    detail,
    page: route.name
  });
};

const openHiddenPanel = async () => {
  if (!IS_DEV) return;

  if (isHiddenAdminUnlocked()) {
    await router.push('/_ops/control-room');
    return;
  }

  const providedCode = window.prompt('Введите dev unlock-код для Control Room');
  if (!providedCode) return;

  const unlocked = unlockHiddenAdmin(providedCode);
  if (!unlocked) {
    showToast('error', 'Неверный unlock-код');
    return;
  }

  showToast('success', 'Доступ к Control Room открыт');
  await router.push('/_ops/control-room');
};

const onGlobalKeydown = (event) => {
  if (!IS_DEV) return;
  if (isTypingTarget(event.target)) return;
  const key = normalizeKey(event);
  const next = [...keyBuffer.value, key].slice(-SECRET_SEQUENCE.length);
  keyBuffer.value = next;

  if (next.join('|') === SECRET_SEQUENCE.join('|')) {
    keyBuffer.value = [];
    openHiddenPanel();
  }
};

const onToastEvent = (event) => {
  const { severity, summary, detail, userName } = event.detail;
  const page = event.detail.page || route.name;
  addToast({ severity, summary, detail, userName, page });
};

onMounted(() => {
  window.addEventListener('toast', onToastEvent);
  if (IS_DEV) {
    window.addEventListener('keydown', onGlobalKeydown);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('toast', onToastEvent);
  if (IS_DEV) {
    window.removeEventListener('keydown', onGlobalKeydown);
  }
});
</script>
