<template>
    <transition name="fade" mode="out-in">
      <div v-if="isLoading" class="login-loading-screen">
        <div class="gradient-circle"></div>
        <h1 class="loading-message">Добро пожаловать в ЛКС!</h1>
      </div>
    </transition>
  </template>

<script>
export default {
    name: 'WelcomeScreen',
    props: {
        isLoading: {
            type: Boolean,
            required: true
        },
    },
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
    background: radial-gradient(circle at center, #3498db, #9b59b6, #34495e);
    z-index: 9999;
    transition: opacity 1.5s ease;
    opacity: 1;
}

.gradient-circle {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: radial-gradient(circle at center, rgba(52, 152, 219, 0.9), rgba(155, 89, 182, 0.9), rgba(52, 73, 94, 0.9));
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 0.6;
    }
    50% {
        transform: scale(1.1);
        opacity: 1;
    }
    100% {
        transform: scale(1);
        opacity: 0.6;
    }
}

.fade-enter-active, .fade-leave-active {
    transition: opacity 1.5s ease; /* Плавность при входе и выходе */
}
.fade-enter, .fade-leave-to {
    opacity: 0;
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
  