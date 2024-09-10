<template>
    <div class="d-flex justify-content-center">
        <Button class="search" icon="pi pi-plus" label="Пользователь" @click="visible = true"/>
        <Dialog v-model:visible="visible" modal header="Новый пользователь" :style="{ 'max-width': '30rem' }">
            <div class="row my-4">
                <div class="col">
                    <FloatLabel>
                        <InputText v-model="firstName" id="firstName" class="form-input" required/>
                        <label for="firstName">Имя</label>
                    </FloatLabel>
                </div>
                <div class="col">
                    <FloatLabel>
                        <InputText v-model="lastName" id="lastName" class="form-input" required/> 
                        <label for="lastName">Фамилия</label>
                    </FloatLabel>      
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <FloatLabel>
                        <InputText v-model="middleName" id="middleName" class="form-input"/> 
                        <label for="middleName">Отчество</label>
                    </FloatLabel> 
                </div>
            </div>
            <Divider class="my-4 py-1"/>
            <div class="row mb-4">
                <div class="col">
                    <FloatLabel>
                        <InputText v-model="login" id="login" class="form-input" required/> 
                        <label for="login">Логин</label>
                    </FloatLabel> 
                </div>
                <div class="col">
                    
                    <FloatLabel>
                        <Password 
                            v-model="pass" 
                            class="form-input"
                            toggleMask
                            required
                        />
                        <label for="pass">Пароль</label>
                    </FloatLabel> 
                </div>
            </div>
            <div class="row mb-4">
                <div class="col">
                    <FloatLabel>
                        <InputText v-model="email" id="email" class="form-input" required/> 
                        <label for="email">E-mail</label>
                    </FloatLabel> 
                </div>
            </div>
            <div class="row mb-4">
                <div class="col">
                    <FloatLabel>
                        <MultiSelect 
                            v-model="selectedRoles" 
                            display="chip" 
                            :options="roles"
                            optionLabel="title" 
                            :maxSelectedLabels="3"
                            class="form-input"
                        />
                        <label for="selectedRoles">Роли</label>
                    </FloatLabel>
                    
                </div>
            </div>
            <Button @click="createUser" icon="pi pi-check" label="Создать" class="search w-100"/>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axiosInstance from '@/utils/axios.js';

import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Password from 'primevue/password';
import Divider from 'primevue/divider';
import MultiSelect from 'primevue/multiselect';
import FloatLabel from 'primevue/floatlabel';
import { useToast } from 'primevue/usetoast';

const pass = ref('');
const firstName = ref('');
const middleName = ref('');
const lastName = ref('');
const login = ref('');
const email = ref('');
const selectedRoles = ref([]);
const visible = ref(false);
const roles = ref([]);

const toast = useToast();

onMounted(async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles');
        roles.value = response.data;
    } catch (error) {
        console.error('Ошибка при получении ролей: ', error);
    }
});

const checkLoginAndEmail = async () => {
    const isLoginOccupied = await axiosInstance.get('/api/users/checking/occupy-login', {
        params: { login: login.value }
    });
    const isEmailOccupied = await axiosInstance.get('/api/users/checking/occupy-email', {
        params: { email: email.value }
    });

    if (isLoginOccupied.data === true) {
        toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Логин уже занят', life: 3000 });
        return false;
    }

    if (isEmailOccupied.data === true) {
        toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Email уже занят', life: 3000 });
        return false;
    }

    return true;
};

const createUser = async () => {
    const isAvailable = await checkLoginAndEmail();
    if (!isAvailable) return;
    
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
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Пользователи', 
                detail: 'Вы добавили пользователя',
                userName: `${ firstName.value } ${ lastName.value }`
            }
        }));
    } catch (error) {
        console.error('Ошибка при создании: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'Пользователи', 
                detail: 'Ошибка при добавлении пользователя' 
            }
        }));
    }
}
</script>

<style scoped>
label {
    font-size: 16px;
}
.form-input {
    font-size: 16px;
    width: 100%;
}
.search {
    border-radius: 12pt;
    font-size: 14pt;
    transition: all 0.5s ease;
}
</style>