<template>
  <div class="layout">
      <aside class="sidebar">
          <SideBar v-if="isAuthenticated && isExpanded" class="position-relative"/>
          <SideBarCompact v-if="isAuthenticated && isExpanded === false" class="position-relative"/>
          <Button class="expand" :icon="isExpanded ? 'pi pi-angle-left' : 'pi pi-angle-right'" @click="toggleSidebar" />
      </aside>
      <main class="content">
          <router-view />
      </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import SideBar from '@/components/SideBar.vue';
import SideBarCompact from '@/components/SideBarCompact.vue';
import { isAuthenticated } from '@/utils/auth';
import { useRoute } from 'vue-router';

const isExpanded = ref(true); // Переменная для отслеживания состояния боковой панели
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

// Функция для переключения состояния боковой панели
const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value;
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
  flex-grow: 1;
  overflow: auto; /* Скроллинг для основного контента */
}

.expand {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 25px;
  width: 100%;
  border-radius: 0;
}
</style>
