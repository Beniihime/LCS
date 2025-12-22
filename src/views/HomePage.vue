<template>
  <div class="layout">
    <MobileSpeedDial />
    <aside class="sidebar" :class="{ 'sidebar-collapsed': !isExpanded }">
      <SideBar v-if="isAuthenticated" :collapsed="!isExpanded" class="position-relative"/>
      <Button 
        class="expand" 
        :icon="isExpanded ? 'pi pi-angle-left' : 'pi pi-angle-right'" 
        @click="toggleSidebar"
      />
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
import MobileSpeedDial from '@/components/Utils/MobileSpeedDial.vue';
import { isAuthenticated } from '@/utils/auth';
import { useRoute } from 'vue-router';

const isExpanded = ref(true);
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
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  width: 280px;
  display: flex;
  flex-direction: column;
}

.sidebar-collapsed {
  width: 90px;
}

.content {
  flex-grow: 1;
  overflow: auto;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.expand {
  position: relative;
  height: 40px;
  width: 100%;
  border-radius: 0;
  z-index: 1000;
  border: none;
  background: var(--p-surface-100);
  color: var(--p-text-color);
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.expand:hover {
  background: var(--p-surface-200);
}

.p-dark .expand {
  background: var(--p-surface-800);
}

.p-dark .expand:hover {
  background: var(--p-surface-700);
}
</style>