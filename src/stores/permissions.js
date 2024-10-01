// stores/permissions.js
import { defineStore } from 'pinia';
import axiosInstance from '@/utils/axios.js';

export const usePermissionStore = defineStore('permissions', {
  state: () => ({
    permissions: [],
    isLoaded: false,  // Новый флаг для отслеживания загрузки
  }),
  actions: {
    async fetchPermissions() {
      if (!this.isLoaded) {
        try {
          const response = await axiosInstance.get('/api/users/me/permissions');
          this.permissions = response.data;
          this.isLoaded = true;  // Помечаем, что полномочия загружены
        } catch (error) {
          console.error('Ошибка при загрузке полномочий:', error);
          throw error;  // Пробрасываем ошибку, чтобы обработать её в роутере
        }
      }
    },
    hasPermission(resourceType, actionType) {
      const resource = this.permissions.find(item => item.type === resourceType);

      if (!resource) {
        console.log(`Ресурс с типом ${resourceType} не найден`);
        return false;
      }
      
      // Проверяем, есть ли нужное действие внутри полномочий данного ресурса
      const result = resource.permissions.some(permission => permission.type === actionType);

      return result;
    },
  },
});

