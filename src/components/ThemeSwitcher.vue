<template>
    <SelectButton v-model="selectedTheme" optionValue="value" optionLabel="value" :options="themeOptions" class="mb-4" v-if="!isAuthPage">
        <template #option="slotProps">
            <i :class="slotProps.option.icon"></i>
            <span>{{ slotProps.option.label }}</span>
        </template>
    </SelectButton>
    <div class="col-lg-auto" @click="themeToggle" v-if="isAuthPage">
        <div class="bt" optionValue="value">
            <i :class="`pi ${ iconClass }`" class="me-2 me-lg-0"></i>
            <span class="d-lg-none fs-5">{{ currentThemeLabel }}</span>
        </div>
    </div>
</template>

<script setup>

import { ref, watch, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

import SelectButton from 'primevue/selectbutton';

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

const currentThemeLabel = computed(() => {
    const theme = themeOptions.value.find(option => option.value === selectedTheme.value);
    return theme ? theme.label : '';
})

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
    background-color: var(--p-bg-color-3);
    box-shadow: 1px 1px 5pt rgba(0, 0, 0, 0.2);
    color: var(--p-text-color);
    cursor: pointer;
}

@media (max-width: 896px) {
    .bt {
        width: 100%;
    }
}
</style>