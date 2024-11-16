<template>
    <div class="d-flex justify-content-center">
        <Button icon="pi pi-user-edit" label="Изменить" size="large" class="edit-btn" severity="contrast" rounded @click="toggle"/>

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
            <div class="row mt-2 mb-4">
                <div class="col">
                    <FloatLabel variant="on">
                        <InputText v-model="login" id="login" name="login" class="form-input" required />
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
                        <InputText v-model="newEmail" id="newEmail" name="newEmail" class="form-input" />
                        <label for="newEmail">Новый Email</label>
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
                            autocomplete="off"
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
                            autocomplete="off"
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

        // Если логин и пароли не введены, показываем уведомление
        if (!login.value && !shouldChangePassword.value && !shouldChangeEmail.value) {
            toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Введите логин, пароль или email для изменения', life: 3000 });
            return;  // Прерываем выполнение, если не введены данные
        }

        // Проверяем, было ли введено значение для логина
        if (login.value) {
            const response = await axiosInstance.get('/api/users/checking/occupy-login', {
                params: { login: login.value }
            });
            
            if (response.data) {
                toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Логин уже занят', life: 3000 });
                return;  // Прерываем выполнение, если логин уже занят
            } else {
                await axiosInstance.patch('/api/users/me/login', login.value);
            }
        }
        
        // Если нужно изменить пароль и заполнены оба поля
        if (shouldChangePassword.value && newPassword.value && oldPassword.value) {
            const passwordResponse = await axiosInstance.patch('/api/users/me/password', {
                newPassword: newPassword.value,
                oldPassword: oldPassword.value
            });

            if (!passwordResponse.data) {
                throw new Error("Ошибка при обновлении пароля");
            }
        } else if (shouldChangePassword.value && (!newPassword.value || !oldPassword.value)) {
            toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Введите старый и новый пароль', life: 3000 });
            return;
        }

        // Если нужно изменить email и введен новый email
        if (shouldChangeEmail.value && newEmail.value) {
            const emailResponse = await axiosInstance.get('/api/users/checking/occupy-email', {
                params: { email: newEmail.value }
            });
            
            if (emailResponse.data) {
                toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Email уже занят', life: 3000 });
            } else {
                await axiosInstance.patch('/api/users/me/email', newEmail.value);
            }
        } else if (shouldChangeEmail.value && !newEmail.value) {
            toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Введите новый Email', life: 3000 });
            return;
        }

        // Закрываем диалог и показываем успешное уведомление
        showEditDialog.value = false;
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Успех', 
                detail: 'Данные успешно обновлены',
                userName: `${ props.firstName } ${ props.lastName }`
            }
        }));

    } catch (error) {
        console.debug('Ошибка при обновлении данных: ', error);
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
    transition: all 0.5s;
    border: 1px solid var(--p-grey-3);
}
</style>