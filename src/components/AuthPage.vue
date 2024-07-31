<template>
    <main class="position-relative">
        <div class="p-5 d-flex justify-content-end position-absolute end-0">
            <!-- <LanguageSwitcher /> -->
        </div>
        <div class="row d-flex justify-content-center align-items-center">
            <form @submit.prevent="auth">
                <div class="card gap-3 px-4 pt-2 rounded-4 pt-md-5">
                    <LogoSvg />
                    <div class="title">Личный кабинет</div>
                    <InputGroup class="inpg">
                        <InputGroupAddon>
                            <i class="pi pi-user"></i>
                        </InputGroupAddon>
                        <InputText placeholder="Логин" v-model="login" id="login" required/>
                    </InputGroup>
                    <InputGroup class="inpg">
                        <InputGroupAddon>
                            <i class="pi pi-key"></i>
                        </InputGroupAddon>
                        <Password v-model="password" toggleMask :feedback="false" placeholder="Пароль" id="password" required/>
                    </InputGroup>
                    <Button class="but mt-3" type="submit" label="Войти" />
                    <Button label="Забыли пароль?" text/>
                </div>
            </form>
        </div> 
    </main>
</template>

<script>
import LanguageSwitcher from './LanguageSwitcher.vue'
import Button from 'primevue/button';
import InputGroup from 'primevue/inputgroup';
import InputText from 'primevue/inputtext';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Password from 'primevue/password';
import LogoSvg from '@/assets/logo.svg';
import { useToast } from 'primevue/usetoast';
import { scheduleTokenRefresh } from '@/utils/TokenService.js';

import axios from 'axios';

export default {
    name: "AuthPage",
    data() {
        return {
            login: "",
            password: "",
            errorMessage: ""
        }
    },
    setup() {
        const toast = useToast();
        return { toast };
    },
    components: {
        Button,
        LanguageSwitcher,
        InputGroup,
        InputGroupAddon,
        InputText,
        Password,
        LogoSvg
    },
    methods: {
        async auth() {
            try {
                const response = await axios.post('/api/auth/login', {
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

            const redirect = this.$route.query.redirect || '/';
            this.$router.push(redirect);
            console.log(response.data);    
            
            this.$router.push({ name: 'Home', query: { message: 'success', detail: 'Вы вошли в личный кабинет'} })
            } catch (error) {
                this.errorMessage = 'Login failed: ' + (error.response ? error.response.data.message : error.message);
                this.toast.add({ severity: 'error', summary: 'Error Message', detail: this.errorMessage, life: 3000 });
            }
        }
    },
};
</script>

<style scoped>
main {
    display: flex;
    place-content: center;
    place-self: center;
    min-height: 100dvh;
}
form {
    display: flex;
    place-items: center;
}
.card {
    display: flex;
    place-items: center;
    justify-content: center;
    width: 500px;
    height: 550px;
    box-shadow: 2px 2px 40px rgba(0, 0, 0, .25);
    @media (max-width: 896px) {
        width: 350px;
        height: 500px;
    }
}
.inpg {
    width: 350px;
    font-size: 1.5rem;
    @media (max-width: 896px)  {
        width: 250px;
        font-size: 1rem;
    }
}
.but {
    width: 300px;
    height: 50px;
    font-size: 1.25rem;
    border-radius: 10px;
}
.title {
    font-size: 1.5rem;
    @media (max-width: 896px)  {
        font-size: 1rem;
    }
}
</style> 