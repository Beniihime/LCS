<template>
    <transition name="fade" mode="out-in">
        <div v-if="visible" class="loading-overlay">
            <!-- <div class="loading-spinner"></div> -->
            <trinity-rings-spinner :animation-duration="1500" :size="66" color="#0d7cb8"/>
        </div>
    </transition>
</template>

<script setup>
import { TrinityRingsSpinner  } from 'epic-spinners';
import { toRefs } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  }
});

const { visible } = toRefs(props);
</script>

<style scoped>
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 9999;
    opacity: 1;
    transition: opacity 0.5s ease;
}

.loading-spinner {
    border: 12px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top: 16px solid #3498db;
    width: 80px;
    height: 80px;
    animation: spin 1.5s linear infinite;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter, .fade-leave-to {
    opacity: 0;
}
.fade-enter-to {
    opacity: 0;
}
</style>