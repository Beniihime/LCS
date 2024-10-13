<template>
    <main>
        <div class="access-denied-screen row align-items-center justify-content-center align-content-center">
            <div class="col">
                <div class="content">
                    <h1>Ооой! 403, доступ запрещен</h1>
                    <p>
                        Извините, но у вас нет прав для доступа к этой странице.
                    </p>
                    <Button class="button" label="Назад" @click="goHome"/>
                </div>
            </div>
            <div class="col position-static">
                <div class="ff">
                    <div class="image"></div>
                </div>                
            </div>
        </div>
    </main>
    <ThemeSwitcher />
</template>
  
<script setup>
import { useRouter } from 'vue-router';

import ThemeSwitcher from '@/components/Utils/ThemeSwitcher.vue';

const router = useRouter();
function goHome() {
    router.push('/'); // Переход на главную
}
</script>
  
<style scoped>
main {
    background-image: url('../../assets/Forbidden.png');
    background-position: center;
    background-repeat: no-repeat;
    height: 100vh;
}
.access-denied-screen {
    height: 100vh;
    padding: 80px;
    margin: 0;
}

.content {
    padding: 40px;
    border-radius: 16px;
}

h1 {
    font-size: 2.5rem;
    color: var(--p-text-color);
    margin-bottom: 16px;
}
p {
    font-size: 1.3rem;
    color: var(--p-grey-1);
    margin-bottom: 32px;
}

.button {
    width: 30%;
    border-radius: 12px;
    color: white;
    font-size: 1.2rem;
}
.ff {
    position: relative;
    width: 100%;
    height: 900px;
}
.image::before, .image::after {
   content: "";
   position: absolute;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   background-size: cover;
   background-position: center;
   transition: opacity 0.5s ease; /* Плавная смена */
   z-index: 0;
   opacity: 0;
}
.image::before {
   background-image: url('/src/assets/logo/block_light.svg'); /* Светлое изображение */
   opacity: 1; /* Показываем светлую картинку по умолчанию */
}

.image::after {
   background-image: url('/src/assets/logo/block_dark.svg'); /* Темное изображение */
}

/* Когда включена темная тема */
.p-dark .image::before {
   opacity: 0; /* Скрываем светлую картинку */
}

.p-dark .image::after {
   opacity: 1; /* Показываем темную картинку */
}

</style>
  