<template>
  <div>
    <Toast />
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import Toast from 'primevue/toast';
import { useRoute } from 'vue-router';

import { useGlobalNotifications } from '@/plugins/useGlobalNotifications'; 
const { addToast } = useGlobalNotifications();

const route = useRoute();

onMounted(() => {
  // Listen for toast messages from the app
  window.addEventListener('toast', (event) => {
    const { severity, summary, detail, userName } = event.detail;
    
    const page = event.detail.page || route.name;

    addToast({ severity, summary, detail, userName, page });
  });
});
</script>