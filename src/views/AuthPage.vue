<template>
    <main>
        <div class="login-page">
            <div class="logoUp"></div>
            <div class="logoDownContainer"></div>
            <ThemeSwitcher />
            <div class="login-container">
                <div class="login-box">
                    <div class="brand">
                        <h2>Вход в ЛКС</h2>
                    </div>
                    <form @submit.prevent="auth">
                        <InputGroup class="my-2">
                            <InputGroupAddon>
                                <i class="pi pi-user"></i>
                            </InputGroupAddon>
                            <InputText placeholder="Логин" id="login" name="login" v-model="login" required/>
                        </InputGroup>
                        <InputGroup class="my-2">
                            <InputGroupAddon>
                                <i class="pi pi-key"></i>
                            </InputGroupAddon>
                            <Password v-model="password" id="password" name="password" toggleMask :feedback="false" placeholder="Пароль" required />
                        </InputGroup>
                        <div>
                            <Button label="Забыли пароль?" text class="forgot-password" />
                        </div>
                        <Button class="but my-2 mb-0" type="submit" label="Войти" />
                        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
                    </form>
                </div>
                
            </div>
        </div>
        <WelcomeLogin v-if="isLoading" :isLoading="isLoading" @videoEnded="handleVideoEnded" />
    </main>
</template>

<script setup>
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { startTokenWorker } from "@/utils/TokenService";
import axiosInstance from '@/utils/axios.js';

import ThemeSwitcher from '@/components/Utils/ThemeSwitcher.vue';
import WelcomeLogin from '@/components/Utils/WelcomeLogin.vue';

const login = ref('');
const password = ref('');
const errorMessage = ref('');
const toast = useToast();

const isLoading = ref(false);

const auth = async () => {
    errorMessage.value = '';

    try {
        const response = await axiosInstance.post('/api/auth/login', {
            login: login.value,
            password: password.value
        }, {
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            }
        });

        // Пытаемся получить время жизни accessToken с сервера, иначе считаем сами
        let accessTokenExpired;
        if (response.data.accessTokenExpiresIn) {
            accessTokenExpired = Math.floor(Date.now() / 1000) + response.data.accessTokenExpiresIn;
        } else if (response.data.accessTokenExpired) {
            accessTokenExpired = response.data.accessTokenExpired;
        } else {
            accessTokenExpired = Math.floor(Date.now() / 1000) + 15 * 60; // Запасной вариант (15 мин)
        }
        
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshTokenValue);
        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('refreshTokenExpired', response.data.refreshTokenExpired);
        localStorage.setItem('accessTokenExpired', accessTokenExpired);

        startTokenWorker();

        isLoading.value = true;

    } catch (error) {
        errorMessage.value = error.response?.data?.message || 'Неверный логин или пароль';
        // toast.add({ severity: 'error', summary: 'Ошибка', detail: errorMessage.value, life: 3000 });
    }
};

const handleVideoEnded = () => {
    isLoading.value = false; // Сброс флага загрузки при окончании видео
};
</script>


<style scoped>
.logoUp {
    position: absolute;
    top: 35px;
    left: 35px;
    width: 100%;
    height: 40px;
    background-repeat: no-repeat;
    z-index: 1;
    background-image: url('/src/assets/logo/logoUp.svg');
    @media (max-width: 896px) {
        height: 20px;
    }
}
.logoDownContainer {
    position: absolute;
    bottom: 0;
    z-index: 1;
    width: 70%;
    left: 30px;
    height: 30%; /* Задаем высоту контейнера */
    transition: background-image 0.5s ease; /* Плавная смена фона */
    @media (max-width: 896px) {
        height: 10%;
    }
}

.logoDownContainer::before, .logoDownContainer::after {
   content: "";
   position: absolute;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   background-size: contain;
   background-position: center;
   background-repeat: no-repeat;
   transition: opacity 0.5s ease; /* Плавная смена */
   z-index: 0;
   opacity: 0;
}

.logoDownContainer::before {
   background-image: url('/src/assets/logo/sibadi.png'); /* Светлое изображение */
   opacity: 1; /* Показываем светлую картинку по умолчанию */
}

.logoDownContainer::after {
   background-image: url('/src/assets/logo/sibadi_dark.png'); /* Темное изображение */
}

/* Когда включена темная тема */
.p-dark .logoDownContainer::before {
   opacity: 0; /* Скрываем светлую картинку */
}

.p-dark .logoDownContainer::after {
   opacity: 1; /* Показываем темную картинку */
}
.but {
    width: 100%;
    height: 50px;
    font-size: 1.25rem;
    border-radius: 12px;
}
main {
    margin: 0;
    padding: 0;
}
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100dvh;
  width: 100vw;
  position: relative;
  overflow: hidden;
}
.error-message {
    color: var(--p-red-500);
    font-size: 14px;
    margin-top: 8px;
    margin-bottom: 0;
    text-align: center;
}

.login-page::before, .login-page::after {
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

.login-page::before {
   background-image: url('/src/assets/backgrounds/lp_bg_light.png'); /* Светлое изображение */
   opacity: 1; /* Показываем светлую картинку по умолчанию */
}

.login-page::after {
   background-image: url('/src/assets/backgrounds/lp_bg_dark.png'); /* Темное изображение */
}

/* Когда включена темная тема */
.p-dark .login-page::before {
   opacity: 0; /* Скрываем светлую картинку */
}

.p-dark .login-page::after {
   opacity: 1; /* Показываем темную картинку */
}

.login-container {
    background: var(--p-bg-color-1);
    padding: 28px 40px;
    border-radius: 12px;
    transition: background 0.5s ease;
    z-index: 1;
}

.login-box {
    max-width: 300px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
form {
    display: flex;
    flex-direction: column;
    place-items: center;
}

.brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
}

.brand h2 {
    color: var(--p-text-color);
    font-weight: 800;
    transition: all 0.5s;
}

.forgot-password {
    font-size: 16px;
    color: var(--p-grey-1);
}

@media (max-width: 768px) {
    .border-wrap {
        background: none;
        padding: 0;
    }
    .but {
        font-size: 18px;
        font-weight: 400;
    }
    .forgot-password {
        font-size: 16px;
    }
}
</style>

