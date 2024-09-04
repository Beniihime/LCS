// stores/roleStore.js
import { defineStore } from 'pinia';

export const useRoleStore = defineStore('role', {
    state: () => ({
        roleId: null,
        roleTitle: '',
        roleType: '',
        roleDescription: ''
    }),
    actions: {
        setRoleInfo({ roleId, roleTitle, roleType, roleDescription }) {
            this.roleId = roleId;
            this.roleTitle = roleTitle;
            this.roleType = roleType;
            this.roleDescription = roleDescription;
        }
    }
});