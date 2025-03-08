import { defineStore } from 'pinia';

export const useGroupsStore = defineStore('groups', {
  state: () => ({
    groups: []
  }),
  actions: {
    setGroups(groups) {
      this.groups = groups;
    }
  }
});
