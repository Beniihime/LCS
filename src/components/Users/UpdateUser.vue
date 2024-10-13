<template>
    <div class="d-flex justify-content-center">
        <Button icon="pi pi-cog" outlined @click="fetchUserData" class="upd-btn"/>
        <Dialog v-model:visible="visible" modal header="Изменить информацию" :style="{ 'max-width': '30rem' }">
            <div class="row my-4">
                <div class="col">
                    <FloatLabel variant="on">
                        <InputText v-model="firstName" class="form-input"/>
                        <label for="firstName">Имя</label>
                    </FloatLabel>
                </div>
                <div class="col">
                    <FloatLabel variant="on">
                        <InputText v-model="lastName" class="form-input"/>
                        <label for="lastName">Фамилия</label>
                    </FloatLabel>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <FloatLabel variant="on">
                        <InputText id="middleName" v-model="middleName" class="form-input"/>
                        <label for="middleName">Отчество</label>
                    </FloatLabel>
                </div>
            </div>
            <Divider class="my-4 py-1"/>
            <div class="row mb-4">
                <div class="col">
                    <FloatLabel variant="on">
                        <InputText v-model="login" class="form-input"/>
                        <label for="login">Логин</label>
                    </FloatLabel>
                </div>
                <div class="col">
                    <FloatLabel variant="on">
                        <InputText id="email" v-model="email" class="form-input"/>
                        <label for="email">E-mail</label>
                    </FloatLabel>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <FloatLabel variant="on">
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
            <Button label="Сохранить" class="search w-100 mb-3" @click="updateUserData"/>
            <Button 
                :label="blockButtonLabel" 
                class="search w-100" 
                :severity="blockButtonSeverity" 
                outlined 
                @click="toggleUserBlock"
            />
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
    refreshTable: Function,
    filters: Object,
    isBlocked: Boolean
});

const visible = ref(false);
const selectedRoles = ref([]);
const roles = ref([]);
const userPriority = ref(null);

const firstName = ref('');
const lastName = ref('');
const middleName = ref('');
const login = ref('');
const email = ref('');

const originalLogin = ref('');
const originalEmail = ref('');


const fetchUserData = async () => {
    visible.value = true;

    try {
        const response = await axiosInstance.get(`/api/users/${ props.userId }`);
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
        console.error('Ошибка при получении данных: ', error);
    }
};

const updateRolesList = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles');
        const allRoles = response.data;

        // Фильтруем роли по приоритету
        roles.value = allRoles.filter(role => role.priority > userPriority.value);
    } catch (error) {
        console.error('Ошибка при получении ролей: ', error);
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

        await axiosInstance.put(`/api/users/${ props.userId }`, updatedUser);

        visible.value = false;
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Пользователи', 
                detail: 'Вы обновили данные пользователя',
                userName: `${ firstName.value} ${lastName.value }` 
            }
        }));

        props.refreshTable(props.filters);
    } catch (error) {
        console.error('Ошибка при обновлении данных пользователя: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'Пользователи',
                detail: 'Ошибка при обновлении данных пользователя',
                userName: `${ firstName.value} ${ lastName.value }`
            }
        }));
    }
};

const toggleUserBlock = async () => {
    try {
        const endpoint = props.isBlocked ? 'unblock' : 'block'
        await axiosInstance.patch(`/api/users/${ props.userId }/${ endpoint }`);
        props.refreshTable(props.filters);
    } catch (error) {
        console.error(`Ошибка при ${ props.isBlocked ? 'разблокировке' : 'блокировке' } пользователя: `, error);
    }
}

const blockButtonLabel = computed(() => (props.isBlocked ? 'Разблокировать' : 'Заблокировать'));
const blockButtonSeverity = computed(() => (props.isBlocked ? 'success' : 'danger'));

onMounted(async () => {
    await updateRolesList();
});


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
    transition: all 0.5s;
}
.upd-btn:hover {
    background-color: var(--p-blue-500) !important;
    color: white !important;
}
</style>