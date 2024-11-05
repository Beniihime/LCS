<template>
  <div class="layout">
      <aside class="sidebar">
          <SideBar v-if="isAuthenticated" />
      </aside>
      <main class="content">
          <router-view />
      </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import SideBar from '@/components/SideBar.vue';
import { isAuthenticated } from '@/utils/auth';
import { useRoute } from 'vue-router';

const toast = useToast();
const route = useRoute();

computed(() => isAuthenticated());

const showMessage = (message, summary, detail) => {
if (message === 'success') {
  toast.add({ severity: 'success', summary, detail, life: 3000 });
} else if (message === 'error') {
  toast.add({ severity: 'error', summary, detail, life: 3000 });
}
};

onMounted(() => {
const query = route.query;
if (query.message) {
  showMessage(query.message, query.summary, query.detail);
}
});
</script>

<style scoped>
.layout {
  display: flex;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh; /* Высота на весь экран для фиксированного положения */
  overflow-y: auto; /* Скроллинг для боковой панели, если она длиннее экрана */
  flex-shrink: 0; /* Предотвращает изменение ширины боковой панели */
}

.content {
  flex: 1;
  padding-left: 1rem;
  overflow-y: auto; /* Скроллинг для основного контента */
}
</style>
