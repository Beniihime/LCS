<template>
  <div class="layout">
      <SideBar v-if="isAuthenticated" />
      <div class="content">
          <router-view />
      </div>
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

.content {
  flex-grow: 1;
  overflow-y: auto; /* Скроллинг для основного контента */
}
</style>
