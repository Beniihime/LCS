import { defineStore } from "pinia";

export const useUserStore = defineStore('user', {
    state: () => ({
        roles: [],
    }),
    actions: {
        setRoles(roles) {
            this.roles = roles;
        },
    },
    getters: {
        hasRole: (state) => (role) => {
            return state.roles.includes(role);
        }
    },
});