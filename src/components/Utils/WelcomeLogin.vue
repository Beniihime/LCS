<template>
    <transition name="fade" mode="out-in">
      <div v-if="isLoading" :class="{'fade-out': isTransitioning}" class="login-loading-screen">
        <video 
            autoplay 
            muted 
            ref="videoRef"
            playsinline 
            @ended="handleVideoEnded"
            class="background-video"
        >
            <source src="../../assets/backgrounds/video.mp4" type="video/mp4" />
            Ваш браузер не поддерживает видео.
        </video>
      </div>
    </transition>
  </template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  isLoading: {
    type: Boolean,
    required: true
  }
});

const isTransitioning = ref(false);
const videoRef = ref(null);
const router = useRouter();

const handleVideoEnded = () => {
  // Плавное исчезновение видео после его завершения
  isTransitioning.value = true;
  router.push({
      name: 'HomePage', 
      query: { message: 'success', summary: 'Успешно', detail: 'Вы вошли в личный кабинет' }
    });
};
</script>
  
<style scoped>
.login-loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    /* background: black; */
    z-index: 9999;
    transition: opacity 1s ease;
    opacity: 1;
}
.background-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -1;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 1.5s ease;
}
.fade-enter, .fade-leave-to {
    opacity: 0;
}
.fade-enter-to {
    opacity: 0;
}
.fade-out {
  opacity: 0;
  transition: opacity 1s ease-in-out; /* Плавное исчезновение за 1 секунду */
}
.loading-message {
    position: absolute;
    font-size: 24px;
    color: white;
    font-weight: bold;
    text-align: center;
    top: 60%;
}
</style>
  