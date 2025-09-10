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
    position: absolute;
    inset: 0;
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