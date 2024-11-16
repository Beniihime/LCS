<template>
    <div class="d-flex justify-content-center">
        <Button icon="pi pi-user-edit" label="Изменить" class="edit-btn" severity="contrast" rounded @click="fetchUserData"/>
        <Dialog v-model:visible="visible" modal header="Изменить информацию" :style="{ 'max-width': '30rem' }">
            <div class="row mt-4 mb-5">
                <div class="col">
                    <FloatLabel>
                        <InputText id="firstName" name="firstName" v-model="firstName" class="form-input" />
                        <label for="firstName">Имя</label>
                    </FloatLabel>
                </div>
                <div class="col">
                    <FloatLabel>
                        <InputText id="lastName" name="lastName" v-model="lastName" class="form-input" />
                        <label for="lastName">Фамилия</label>
                    </FloatLabel>
                </div>
            </div>
            <div class="row">
                <div class="col">
                    <FloatLabel>
                        <InputText id="middleName" name="middleName" v-model="middleName" class="form-input" />
                        <label for="middleName">Отчество</label>
                    </FloatLabel>
                </div>
            </div>

            <Divider class="my-5 py-1"/>

            <div class="row mb-5">
                <div class="col">
                    <FloatLabel>
                        <InputText id="login" name="login" v-model="login" class="form-input" />
                        <label for="login">Логин</label>
                    </FloatLabel>
                </div>
                <div class="col">
                    <FloatLabel>
                        <InputText id="email" name="email" v-model="email" class="form-input" />
                        <label for="email">E-mail</label>
                    </FloatLabel>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <FloatLabel>
                        <MultiSelect 
                            v-model="selectedRoles" 
                            display="chip" 
                            :options="roles"
                            optionLabel="title"
                            optionValue="id" 
                            :maxSelectedLabels="3"
                            class="form-input"
                        />
                        <label for="selectedRoles">Роли</label>
                    </FloatLabel>
                </div>
            </div>
            <Button label="Сохранить" class="search w-100 mb-2" @click="updateUserData"/>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axiosInstance from '@/utils/axios.js';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const props = defineProps({
    userId: String,
    isBlocked: Boolean
});

const visible = ref(false);
const selectedRoles = ref([]);
const roles = ref([]);
const userPriority = ref(null);

const Iduser = ref('');
const firstName = ref('');
const lastName = ref('');
const middleName = ref('');
const login = ref('');
const email = ref('');

const originalLogin = ref('');
const originalEmail = ref('');


const fetchUserData = async () => {
    visible.value = true;
    Iduser.value = props.userId;
    try {
        const response = await axiosInstance.get(`/api/users/${ Iduser.value }`);
        const userData = response.data;
        
        firstName.value = userData.firstName;
        lastName.value = userData.lastName;
        middleName.value = userData.middleName;
        login.value = userData.login;
        email.value = userData.email;
        
        selectedRoles.value = userData.roles.map(role => role.id);
        originalLogin.value = userData.login;
        originalEmail.value = userData.email;

        userPriority.value = userData.roles[0]?.priority;
    } catch (error) {
        console.debug('Ошибка при получении данных: ', error);
    }
};

const updateRolesList = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles');
        const allRoles = response.data;

        // Фильтруем роли по приоритету
        roles.value = allRoles.filter(role => role.priority > userPriority.value);
    } catch (error) {
        console.debug('Ошибка при получении ролей: ', error);
    }
};

const checkLoginAndEmail = async () => {
    let isLoginOccupied = false;
    let isEmailOccupied = false;

    if (login.value !== originalLogin.value) {
        const loginResponse = await axiosInstance.get('/api/users/checking/occupy-login', {
            params: { login: login.value }
        });
        isLoginOccupied = loginResponse.data === true;
        if (isLoginOccupied) {
            toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Логин уже занят', life: 3000 });
        }
    }

    if (email.value !== originalEmail.value) {
        const emailResponse = await axiosInstance.get('/api/users/checking/occupy-email', {
            params: { email: email.value }
        });
        isEmailOccupied = emailResponse.data === true;
        if (isEmailOccupied) {
            toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Email уже занят', life: 3000 });
        }
    }

    return !isLoginOccupied && !isEmailOccupied;
}

const updateUserData = async () => {
    const isAvailable = await checkLoginAndEmail();
    if (!isAvailable) return;
    
    try {
        const updatedUser = {
            firstName: firstName.value,
            lastName: lastName.value,
            middleName: middleName.value,
            login: login.value,
            email: email.value,
            roleIds: selectedRoles.value
        };

        await axiosInstance.put(`/api/users/${ Iduser.value }`, updatedUser);

        visible.value = false;
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Пользователи', 
                detail: 'Вы обновили данные пользователя',
                userName: `${ firstName.value } ${ lastName.value }` 
            }
        }));

        props.refreshTable(props.filters);
    } catch (error) {
        console.debug('Ошибка при обновлении данных пользователя: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'Пользователи',
                detail: 'Ошибка при обновлении данных пользователя',
                userName: `${ firstName.value } ${ lastName.value }`
            }
        }));
    }
};

onMounted(async () => {
    await updateRolesList();
});

defineExpose({ fetchUserData });

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
    border-radius: 12px;
    font-size: 14pt;
    transition: all 0.5s;
}
.upd-btn:hover {
    background-color: var(--p-blue-500) !important;
    color: white !important;
}
</style>