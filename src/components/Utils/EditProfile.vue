<template>
    <div class="d-flex justify-content-center">
        <Button icon="pi pi-ellipsis-h" size="large" class="edit-btn" severity="secondary" rounded @click="toggle"/>

        <Popover ref="op">
            <div class="row">
                <div class="col">
                    <Button label="Редактировать профиль" class="w-100 d-flex justify-content-between" text icon="pi pi-pencil" iconPos="right" @click="showEditDialog = true"/>
                </div>
            </div>
            <Divider class="my-1"/>
            <div class="row">
                <div class="col">
                    <Button label="Изменить обложку" class="w-100 d-flex justify-content-between" text icon="pi pi-image" iconPos="right"/>
                </div>
            </div>
        </Popover>

        <Dialog v-model:visible="showEditDialog" modal header="Редактировать профиль" :style="{ 'max-width': '30rem' }">
            <div class="row my-4">
                <div class="col">
                    <FloatLabel>
                        <InputText v-model="login" id="login" class="form-input" required />
                        <label for="login">Новый логин</label>
                    </FloatLabel>
                </div>
            </div>

            <div class="row mb-2">
                <div class="col d-flex align-items-center">
                    <Checkbox v-model="shouldChangePassword" binary />
                    <label for="shouldChangePassword" class="ms-2">Изменить пароль?</label>
                </div>
            </div>

            <div class="row mb-4">
                <div class="col d-flex align-items-center">
                    <Checkbox v-model="shouldChangeEmail" binary />
                    <label for="shouldChangeEmail" class="ms-2">Изменить E-mail?</label>
                </div>
            </div>

            <div v-if="shouldChangeEmail" class="row mb-4">
                <div class="col">
                    <FloatLabel>
                        <InputText v-model="newEmail" id="email" class="form-input" />
                        <label for="email">Новый Email</label>
                    </FloatLabel>
                </div>
            </div>

            <div v-if="shouldChangePassword" class="row mb-4">
                <div class="col">
                    <FloatLabel>
                        <Password 
                            v-model="newPassword"
                            class="form-input"
                            toggleMask
                        />
                        <label for="newPassword">Новый пароль</label>
                    </FloatLabel>
                </div>
            </div>
            <div v-if="shouldChangePassword" class="row mb-4">
                <div class="col">
                    <FloatLabel>
                        <Password 
                            v-model="oldPassword"
                            class="form-input"
                            toggleMask
                        />
                        <label for="oldPassword">Старый пароль</label>
                    </FloatLabel>
                </div>
            </div>

            <Button @click="updateProfile" icon="pi pi-check" label="Сохранить" class="save-btn w-100" />
        </Dialog>
        
    </div>
</template>

<script setup>
import { ref } from 'vue';
import axiosInstance from '@/utils/axios.js';

import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Popover from 'primevue/popover';
import Button from 'primevue/button';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Checkbox from 'primevue/checkbox'; 
import { useToast } from 'primevue/usetoast';

const op = ref();

const toggle = (event) => {
    op.value.toggle(event);
}

const toast = useToast();

const login = ref('');
const newPassword = ref('');
const oldPassword = ref('');
const newEmail = ref('');
const showEditDialog = ref(false);
const shouldChangePassword = ref(false);
const shouldChangeEmail = ref(false);

const props = defineProps({
    firstName: String,
    lastName: String
});

const updateProfile = async () => {
    try {
        const response = await axiosInstance.get('/api/users/checking/occupy-login', {
            params: { login: login.value }
        });
        
        if (response.data) {
            toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Логин уже занят', life: 3000 });
        } else {
            await axiosInstance.patch('/api/users/me/login', login.value);
            
            if (shouldChangePassword.value && newPassword.value && oldPassword.value) {
                const passwordResponse = await axiosInstance.patch('/api/users/me/password', {
                    newPassword: newPassword.value,
                    oldPassword: oldPassword.value
                });

                if (!passwordResponse.data) {
                    throw new Error("Ошибка при обновлении пароля");
                }
            }

            if (shouldChangeEmail.value && newEmail.value) {
                const emailResponse = await axiosInstance.get('/api/users/checking/occupy-email', {
                    params: { email: newEmail.value }
                });
                
                if (emailResponse.data) {
                    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Email уже занят', life: 3000 });
                } else {
                    await axiosInstance.patch('/api/users/me/email', newEmail.value);
                }
            }

            showEditDialog.value = false;
            window.dispatchEvent(new CustomEvent('toast', {
                detail: { 
                    severity: 'success', 
                    summary: 'Успех', 
                    detail: 'Данные успешно обновлены для',
                    userName: `${ props.firstName } ${ props.lastName }`
                }
            }));
        }
    } catch (error) {
        console.error('Ошибка при обновлении данных: ', error);
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
.edit-btn {
    font-size: 14pt;
    transition: all 0.5s;
    position: absolute;
    top:10px;
    right: 15px;
}
</style>