<template>
    <main class="dashboard">
        <section class="header">
            <h1>Добро пожаловать в ЛКС, {{ firstName }}!</h1>
        </section>
    </main>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import axiosInstance from '@/utils/axios.js';

const firstName = ref('');

onBeforeMount(async () => {
    try {
        const response = await axiosInstance.get('/api/users/me/info');
        firstName.value = response.data.firstName;
    } catch (error) {
        console.debug('Ошибка при получении информации о пользователе: ', error);
    }
});
</script>

<style scoped>
.dashboard {
    display: flex;
    flex-direction: column;
    padding: 2rem;
}
.header h1 {
    font-size: 2.5rem;
    color: var(--p-text-color);
}
</style>