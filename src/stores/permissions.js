// stores/permissions.js
import { defineStore } from 'pinia';

export const usePermissionStore = defineStore('permissionStore', {
  state: () => ({
    permissions: []
  }),
  actions: {
    setPermissions(permissions) {
      this.permissions = permissions;
    },
    hasPermission(type, action) {
      return this.permissions.some(permission =>
        permission.type === type &&
        permission.permissions.some(p => p.type === action)
      );
    }
  }
});
