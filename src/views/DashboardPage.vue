<template>
    <main class="dashboard">
        <section class="header">
            <h1>Добро пожаловать в ЛКС, {{ firstName }}!</h1>
        </section>
    </main>
</template>

<script setup>
import { onMounted } from 'vue';

const firstName = localStorage.getItem('firstName');

onMounted(() => {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
});
</script>

<style scoped>
.dashboard {
    display: flex;
    flex-direction: column;
    padding: 20px 8rem;
}
.header h1 {
    font-size: 2rem;
    color: var(--p-text-color);
}
</style>