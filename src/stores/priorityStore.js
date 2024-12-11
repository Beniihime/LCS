import { defineStore } from "pinia";

export const usePriorityStore = defineStore('priority', {
    state: () => ({
        selectedPriority: null,
        selectedPriorityId: null,
        selectedUrgencyId: null,
        selecetedInfluenceId: null
    }),
    actions: {
        setSelectedPriority(priority, priorityId, urgencyId, influenceId) {
            this.selectedPriority = priority;
            this.selectedPriorityId = priorityId;
            this.selectedUrgencyId = urgencyId;
            this.selecetedInfluenceId = influenceId;
        }
    }
});