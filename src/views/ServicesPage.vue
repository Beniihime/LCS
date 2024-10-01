<template>
    <main>
        <WelcomeScreen :visible="loading" />
        <div class="content-wrapper">
            <h1 class="mb-4">Микросервисы</h1>
            <div class="services-cards">
                <div class="card h-100">
                    <div class="row">
                        <div class="col">
                            <div class="card-body">
                                <div class="row mb-4">
                                    <div class="col">
                                        <div class="header">
                                            <h2>InfraManager</h2>
                                            <h5 class="card-text">Управление системой автоматизации ИТ-процессов</h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col">
                                        <InfraManagerCreate />
                                    </div>
                                    <div class="col">
                                        <Button label="Удалить связку" class="button"/>
                                    </div>
                                    <div class="col">
                                        <InfraManagerSearchUsers />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';

import Button from 'primevue/button';

import WelcomeScreen from '@/components/Utils/WelcomeScreen.vue';
import InfraManagerCreate from '@/components/InfraManager/InfraManagerCreate.vue';
import InfraManagerSearchUsers from '@/components/InfraManager/InfraManagerSearchUsers.vue'

const loading = ref(true);

onMounted(() => {
    setTimeout(() => {
        loading.value = false;
    }, 250);
});

</script>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}
.content-wrapper {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 20px;
    overflow: hidden;
    color: var(--p-text-color);
}
.infra-manager {
    background-color: var(--p-bg-color-2);
    padding: 20px;
    border-radius: 18px;
    border: 1px solid var(--p-grey-4);
    transition: all 0.5s ease;
}
.card-text {
    font-size: 1.2rem;
    font-family: 'SF Pro Rounded', sans-serif;
    color: var(--p-grey-1);
    margin-top: 20px;
}
.card {
    border-radius: 18px;
    transition: all 0.5s ease;
    background-color: var(--p-bg-color-2);
    color: var(--p-text-color);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    border: 2px solid var(--p-grey-4);
}
.card-body {
    padding: 28px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}
.button {
    width: 100%;
    border-radius: 12px;
    color: white;
    font-size: 1.2rem;
}
</style>