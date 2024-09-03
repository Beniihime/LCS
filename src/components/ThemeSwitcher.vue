<template>
    <SelectButton v-model="selectedTheme" optionValue="value" optionLabel="value" :options="themeOptions" class="mb-4" v-if="!isAuthPage">
        <template #option="slotProps">
            <i :class="slotProps.option.icon"></i>
            <span>{{ slotProps.option.label }}</span>
        </template>
    </SelectButton>
    <button class="bt" @click="themeToggle" v-if="isAuthPage">
        <i :class="`pi ${iconClass}`"></i>
    </button>
</template>

<script setup>

import { ref, watch, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

import SelectButton from 'primevue/selectbutton';
import Button from 'primevue/button';

const themeOptions = ref([
    { icon: 'pi pi-sun', label: 'Светлая', value: 'light' },
    { icon: 'pi pi-moon', label: 'Тёмная', value: 'dark' }    
]);

const savedTheme = localStorage.getItem('theme') || 'light';

const selectedTheme = ref(savedTheme);

const route = useRoute();
const isAuthPage = computed(() => route.path === '/auth');

const iconClass = computed(() => {
    return selectedTheme.value === 'dark' ? 'pi-moon' : 'pi-sun';
});

onMounted(() => {
    onThemeToggler(selectedTheme.value);
});

watch(selectedTheme, (newTheme) => {
    onThemeToggler(newTheme);
});

function onThemeToggler(theme) {
    const root = document.getElementsByTagName('html')[0];
    if (theme === 'dark') {
        root.classList.add('p-dark')
    } else {
        root.classList.remove('p-dark');
    }
    localStorage.setItem('theme', theme);
}

function themeToggle() {
    const newTheme = selectedTheme.value === 'dark' ? 'light' : 'dark';
    selectedTheme.value = newTheme;
    onThemeToggler(newTheme);
}
</script>

<style scoped>
.bt {
    width: 30px;
    height: 30px;
    padding: 22px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--p-grey-2);
    /* background-color: white; */
    box-shadow: 1pt 1pt 5pt rgba(0, 0, 0, 0.25);
}

@media (max-width: 896px) {
    .select-button {
        display: none;
    }

    .bt {
        display: block;
    }
}
</style>