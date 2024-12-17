<template>
    <SelectButton v-model="selectedTheme" optionValue="value" optionLabel="value" :options="themeOptions" class="mb-4" v-if="!isAuthPage && isSideBarCollapse === false">
        <template #option="slotProps">
            <i :class="slotProps.option.icon"></i>
            <span class="label">{{ slotProps.option.label }}</span>
        </template>
    </SelectButton>
    <div class="col-lg-auto" @click="themeToggle" v-if="isAuthPage">
        <div class="bt" optionValue="value">
            <i :class="`pi ${ iconClass }`" class="me-2 me-lg-0"></i>
            <span class="d-lg-none fs-6">{{ currentThemeLabel }}</span>
        </div>
    </div>
    <div class="col-lg-auto" @click="themeToggle" v-if="isSideBarCollapse">
        <div class="bt1" optionValue="value1" v-tooltip="'Сменить тему'">
            <i :class="`pi ${ iconClass }`"></i>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, computed, defineProps } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps({
    isSideBarCollapse: {
        type: Boolean,
        default: false
    }
});

const themeOptions = ref([
    { icon: 'pi pi-sun', label: 'Светлая', value: 'light' },
    { icon: 'pi pi-moon', label: 'Тёмная', value: 'dark' }    
]);

const savedTheme = localStorage.getItem('theme') || 'light';

const selectedTheme = ref(savedTheme);

const route = useRoute();
const isAuthPage = computed(() => route.path === '/auth' || route.path === '/noAccess' || route.path === '/notFound');

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
    position: absolute;
    top: 35px;
    right: 35px;
    width: 30px;
    height: 30px;
    padding: 22px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--p-bg-color-2);
    color: var(--p-text-color);
    cursor: pointer;
    z-index: 999;
    transition: all 0.5s;
}

.bt1 {
    position: absolute;
    bottom: 214px;
    left: 32px;
    width: 30px;
    height: 30px;
    padding: 22px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--p-grey-5);
    color: var(--p-text-color);
    cursor: pointer;
    z-index: 999;
    transition: all 0.5s;
}
.bt1:hover {
    background-color: var(--p-grey-3);
}
.bt:hover {
    background-color: var(--p-grey-3);
}

@media (max-width: 896px) {
    .bt {
        width: 22%;
        padding: 18px 50px;
    }
}
</style>