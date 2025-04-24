// stores/seasonStore.js

import { defineStore } from "pinia";
import { ref } from 'vue';

export const useSeasonStore = defineStore('season', () => {
    const selectedSeason = ref(null);
    return { selectedSeason };
});