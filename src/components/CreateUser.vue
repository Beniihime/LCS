<template>
    <div class="d-flex justify-content-center">
        <Button class="search" icon="pi pi-plus" label="Пользователь" outlined @click="visible = true"/>
        <Dialog v-model:visible="visible" modal header="Новый пользователь" :style="{ 'max-width': '30rem' }">
            <div class="row my-3 mt-1">
                <div class="col">
                    <InputText v-model="firstName" id="firstName" class="form-input" placeholder="Имя"/>
                </div>
                <div class="col">
                    <InputText v-model="lastName" id="lastName" class="form-input" placeholder="Фамилия"/>            
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <InputText v-model="middleName" id="middleName" class="form-input" placeholder="Отчество"/>
                </div>
            </div>
            <Divider />
            <div class="row mb-3">
                <div class="col">
                    <InputText v-model="login" id="login" class="form-input" placeholder="Логин"/>
                </div>
                <div class="col">
                    <Password 
                        v-model="pass" 
                        class="form-input"
                        placeholder="Пароль" 
                        toggleMask
                    />
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <InputText v-model="email" id="email" class="form-input" placeholder="E-mail"/>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <MultiSelect 
                        v-model="selectedRoles" 
                        display="chip" 
                        :options="roles"
                        optionLabel="title" 
                        placeholder="Выберите роль"
                        :maxSelectedLabels="3"
                        class="form-input"
                    />
                </div>
            </div>
            <Button @click="createUser" icon="pi pi-check" label="Создать" class="search w-100"/>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axiosInstance from '@/utils/axios.js';

const pass = ref('');
const firstName = ref('');
const middleName = ref('');
const lastName = ref('');
const login = ref('');
const email = ref('');
const selectedRoles = ref([]);
const visible = ref(false);
const roles = ref([]);

onMounted(async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles');
        roles.value = response.data;
    } catch (error) {
        console.error('Ошибка при получении ролей: ', error);
    }
});

const createUser = async () => {
    try {
        const roleIds = selectedRoles.value.map(role => role.id);
        const payload = {
            login: login.value,
            password: pass.value,
            firstName: firstName.value,
            middleName: middleName.value,
            lastName: lastName.value,
            email: email.value,
            roleIds: roleIds
        };

        await axiosInstance.post('/api/users', payload);
        visible.value = false;
        alert('Пользователь создан');
    } catch (error) {
        console.error('Ошибка при создании: ', error);
        alert('Ошибка при создании')
    }
}
</script>

<script>
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Password from 'primevue/password';
import Divider from 'primevue/divider';
import MultiSelect from 'primevue/multiselect';

export default {
    components: {
        Dialog,
        InputText,
        Button,
        Password,
        Divider,
        MultiSelect
    }
}
</script>

<style scoped>
.form-input {
    font-size: 16px;
    width: 100%;
}
.search {
    border-radius: 12pt;
    font-size: 14pt;
    transition: all 0.5s ease-out;
}
</style>