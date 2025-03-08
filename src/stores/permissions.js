// stores/permissions.js
import { defineStore } from 'pinia';
import axiosInstance from '@/utils/axios.js';

export const usePermissionStore = defineStore('permissions', {
  state: () => ({
    permissions: [],
    isLoaded: false,  // Новый флаг для отслеживания загрузки
  }),
  actions: {
    async fetchPermissions(retryCount = 3) {
      if (!this.isLoaded) {
        try {
          const response = await axiosInstance.get('/api/users/me/permissions');
          this.permissions = response.data;
          this.isLoaded = true;  // Помечаем, что полномочия загружены
        } catch (error) {
          console.debug('Ошибка при загрузке полномочий:', error);

          // Проверяем, если ошибка 502
          if (retryCount > 0 && error.response?.status === 502) {
            console.debug(`Повторная попытка загрузки полномочий. Осталось попыток: ${retryCount - 1}`);
            return this.fetchPermissions(retryCount - 1); // Повторная попытка
          }

          throw error;  // Если попытки исчерпаны или другая ошибка
        }
      }
    },
    clearPermissions() {
      this.permissions = []; // Очищаем разрешения
    },
    hasPermission(resourceType, actionType) {
      const resource = this.permissions.find(item => item.type === resourceType);

      if (!resource) {
        return false;
      }
      
      // Проверяем, есть ли нужное действие внутри полномочий данного ресурса
      const result = resource.permissions.some(permission => permission.type === actionType);

      return result;
    },
  },
});

