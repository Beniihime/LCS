<template>
    <div class="app-layout">
      <SideBar v-if="isAuthenticated"/>
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
import { usePermissionStore } from '@/stores/permissions.js';
import axiosInstance from '@/utils/axios.js';

const toast = useToast();
const route = useRoute();

computed(() => isAuthenticated());

const permissionStore = usePermissionStore();

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
  fetchPermissions();
});

const fetchPermissions = async () => {
    try {
        const response = await axiosInstance.get('/api/users/me/permissions');
        const data = await response.data;
        permissionStore.setPermissions(data);
    } catch (error) {
        console.error('Error fetching permissions:', error);
    }
  };
</script>

<style scoped>
.app-layout {
  display: flex;
}
.content {
  flex-grow: 1;
}
</style>