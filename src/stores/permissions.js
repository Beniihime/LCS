// stores/permissions.js
import { defineStore } from 'pinia';
import axiosInstance from '@/utils/axios.js';
import { isSessionExpiredFlag } from '../utils/TokenService';

export const usePermissionStore = defineStore('permissions', {
  state: () => ({
    permissions: [],
    isLoaded: false,
  }),

  actions: {
    async fetchPermissions() {
      if (this.isLoaded) return;
      if (isSessionExpiredFlag()) return;

      try {
        const { data } = await axiosInstance.get('/api/users/me/permissions');
        this.permissions = data;
        this.isLoaded = true;
      } catch (error) {
        console.debug('Ошибка при загрузке полномочий:', error);
        throw error; // одна попытка — сразу наружу
      }
    },

    clearPermissions() {
      this.permissions = [];
      this.isLoaded = false;
    },

    hasPermission(resourceType, actionType) {
      const resource = this.permissions.find(
        item => item.type === resourceType
      );

      if (!resource) return false;

      return resource.permissions.some(
        permission => permission.type === actionType
      );
    },
  },
});
