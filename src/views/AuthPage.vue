<template>
    <div class="login-page">
        <div class="border-wrap">
            <div class="row login-container">
                <div class="col login-box">
                    <div class="brand">
                        <img src="../assets/logo.svg" alt="" style="max-width: 10rem;" />
                        <h2 class="mt-4">Личный кабинет</h2>
                    </div>
                    <form @submit.prevent="auth">
                        <InputGroup class="my-2">
                            <InputGroupAddon>
                                <i class="pi pi-user"></i>
                            </InputGroupAddon>
                            <InputText placeholder="Логин" v-model="login" required />
                        </InputGroup>
                        <InputGroup class="my-2">
                            <InputGroupAddon>
                                <i class="pi pi-key"></i>
                            </InputGroupAddon>
                            <Password v-model="password" toggleMask :feedback="false" placeholder="Пароль" required />
                        </InputGroup>
                        <div>
                            <Button label="Забыли пароль?" text class="forgot-password" />
                        </div>
                        <Button class="but my-2" type="submit" label="Войти" />
                    </form>
                </div>
                <div class="col d-none d-md-block">
                    <img src="@/assets/illustration.png" class="img-fluid" alt="Login Illustration" />
                </div>
                <ThemeSwitcher />
            </div>
        </div>
    </div>
</template>

<script>
import Button from 'primevue/button';
import InputGroup from 'primevue/inputgroup';
import InputText from 'primevue/inputtext';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Password from 'primevue/password';
import { useToast } from 'primevue/usetoast';
import { scheduleTokenRefresh } from '@/utils/TokenService.js';
import axiosInstance from '@/utils/axios.js';

import WelcomeScreen from '@/components/WelcomeScreen.vue';
import ThemeSwitcher from '@/components/ThemeSwitcher.vue';

export default {
    name: "AuthPage",
    data() {
        return {
            login: "",
            password: "",
            loading: false,
            errorMessage: ""
        }
    },
    setup() {
        const toast = useToast();
        return { toast };
    },
    components: {
        Button,
        InputGroup,
        InputGroupAddon,
        InputText,
        Password,
        WelcomeScreen,
        ThemeSwitcher
    },
    methods: {
        async auth() {
            this.loading = true;
            try {
                const response = await axiosInstance.post('/api/auth/login', {
                    login: this.login,
                    password: this.password
                },
                {
                    headers: {
                        'accept': 'text/plain',
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshTokenValue);
            localStorage.setItem('userId', response.data.userId);
            
            scheduleTokenRefresh(response.data.refreshTokenExpired);
            
            const redirect = this.$route.query.redirect || { name: 'HomePage', query: { message: 'success', detail: 'Вы вошли в личный кабинет'} };
            this.$router.push(redirect);
            
            } catch (error) {
                this.errorMessage = 'Login failed: ' + (error.response ? error.response.data.message : error.message);
                this.toast.add({ severity: 'error', summary: 'Ошибка', detail: this.errorMessage, life: 3000 });
            } finally {
                this.loading = false;
            }
        }
    },
};
</script>


<style scoped>
.switcher {
    position: absolute;
    top: 20px;
    right: 20px;
}
.border-wrap{
    background: linear-gradient(.25turn, var(--p-blue-500), var(--p-blue-300));
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 4px;
    border-radius: 22px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}
.but {
    width: 100%;
    height: 50px;
    font-size: 1.25rem;
    border-radius: 10px;
}
.login-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100dvw;
    background: var(--p-bg-color-2);
    transition: background 0.5s ease;
}

.login-container {
    background: var(--p-bg-color-1);
    padding: 30px;
    border-radius: 18px;
    max-width: 1000px;
    width: 100%;
    transition: background 0.5s ease;
}

.login-box {
    max-width: 400px;
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
    transition: color 0.5s ease;
}

.forgot-password {
    font-size: 16px;
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

