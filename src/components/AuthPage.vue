<template>
    <main class="position-relative">
        <div class="p-5 d-flex justify-content-end position-absolute end-0">
            <LanguageSwitcher />
        </div>
        <div class="row-auto d-flex justify-content-center align-items-center">
            <form @submit.prevent="auth">
                <div class="card flex-column d-flex gap-5 p-5 rounded-4">
                    <LogoSvg />
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
                        <Password v-model="password" toggleMask  placeholder="Пароль" id="password" required/>
                    </InputGroup>
                    <Button class="but" type="submit" label="Войти" />
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
import FloatLabel from 'primevue/floatlabel';
import LogoSvg from '@/assets/logo.svg';

import axios from 'axios';

export default {
    name: "AuthPage",
    data() {
        return {
            login: "",
            password: ""
        }
    },
    components: {
        Button,
        LanguageSwitcher,
        InputGroup,
        InputGroupAddon,
        InputText,
        Password,
        FloatLabel,
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
                console.log('Login succesful:', response.data);
            } catch (error) {
                console.error('Error during login:', error);
            }
        }
    },
};
</script>

<style scoped>
main {
    background: rgb(214, 236, 253);
    display: flex;
    place-content: center;
    place-self: center;
    min-height: 100vh;
}
form {
    display: flex;
    place-items: center;
}
.card {
    display: flex;
    place-items: center;
    width: 500px;
    height: 550px;
    border: none;
    box-shadow: 2px 2px 40px rgba(0, 0, 0, .25);
}
.inpg {
    width: 350px;
    font-size: 1.5rem;
}
.but {
    width: 300px;
    height: 50px;
    font-size: 1.25rem;
    border-radius: 10px;
}
</style> 