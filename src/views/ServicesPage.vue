<template>
    <main>
        <WelcomeScreen :visible="loading" />
        <div class="content-wrapper">
            <h2 class="mb-4">Микросервисы</h2>
            <div v-if="!loading" class="services-cards">
                <InfraManagerMicroService />
                <RatingService />
            </div>
            <div v-else class="services-cards">
                <Skeleton width="100%" height="110px" />
                <Skeleton width="100%" height="110px" />
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import WelcomeScreen from '@/components/Utils/WelcomeScreen.vue';
import InfraManagerMicroService from "@/components/Microservice/InfraManager/InfraManagerMicroService.vue";
import RatingService from "@/components/Microservice/Rating/RatingMicroService.vue";

const loading = ref(true);

onMounted(() => {
    setInterval(() => {
        loading.value = false;
    }, 400);
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
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 20px 8rem;
    overflow: hidden;
    color: var(--p-text-color);
}
.services-cards {
    display: grid;
    gap: 20px;
}
@media (max-width: 768px) {
    .content-wrapper {
        padding: 20px;
    }
    .card-text {
        font-size: 0.74rem;
        font-family: 'SF Pro Rounded', sans-serif;
        color: var(--p-grey-1);
        text-wrap: wrap;
    }
    h2 {
        font-size: 18px;
    }
   
}
</style>