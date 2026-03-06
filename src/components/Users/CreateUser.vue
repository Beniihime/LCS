<template>
    <div class="d-flex justify-content-center">
        <Button class="search" icon="pi pi-plus" @click="visible = true"/>
        <Dialog v-model:visible="visible" modal header="Новый пользователь" :style="{ 'max-width': '30rem', 'max-height': '60rem' }">
            <div class="row mb-2">
                <div class="col">
                    <label for="firstName" class="ms-2">Имя <span class="text-danger">*</span></label>
                    <InputText v-model="firstName" id="firstName" name="firstName" class="form-input" required placeholder="Введите имя"/>
                </div>
                
            </div>

            <div class="row mb-2">
                <div class="col">
                    <label for="lastName" class="ms-2">Фамилия <span class="text-danger">*</span></label>   
                    <InputText v-model="lastName" id="lastName" name="lastName" class="form-input" required placeholder="Введите фамилию"/> 
                </div>
            </div>

            <div class="row mb-2">
                <div class="col">
                    <label for="middleName" class="ms-2">Отчество</label>
                    <InputText v-model="middleName" id="middleName" name="middleName" class="form-input" placeholder="Введите отчество"/>
                </div>
            </div>

            <Divider class="my-2 py-1"/>

            <div class="row">
                <div class="col">
                    <label for="email" class="ms-2">E-mail <span class="text-danger">*</span></label>
                    <InputText v-model="email" id="email" name="email" class="form-input" required @blur="checkEmail" :invalid="isInvalid(email)" placeholder="Введите E-mail"/>
                    <Message v-if="emailMessage" :severity="emailSeverity" size="small">{{ emailMessage }}</Message>
                </div>
            </div>

            <div class="row mb-2">
                <div class="col">
                    <label for="pass" class="ms-2">Пароль <span class="text-danger">*</span></label>
                    <Password v-model="pass" id="pass" name="pass" toggleMask class="form-input" @input="validatePassword" :feedback="false" :invalid="!passwordChecks.length || !passwordChecks.upperLower || !passwordChecks.number" required placeholder="••••••••"/>
                    <div class="password-requirements mt-2">
                        <p>Пароль должен соответствовать следующим условиям</p>
                        <p><i :class="passwordChecks.length ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Должен состоять как минимум из 8 символов</p>
                        <p><i :class="passwordChecks.upperLower ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Должен содержать символы в верхнем и нижнем регистре</p>
                        <p><i :class="passwordChecks.number ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Должен содержать по крайней мере одну цифру</p>
                    </div>
                </div>
            </div>

            <div class="row mb-1">
                <div class="col">
                    <label for="confirmPass" class="ms-2">Подтвердите пароль <span class="text-danger">*</span></label>
                    <Password id="confirmPass" name="confirmPass" v-model="confirmPass" toggleMask class="form-input" required :feedback="false" :invalid="pass !== confirmPass && confirmPass" placeholder="••••••••"/>
                    <Message v-if="pass !== confirmPass && confirmPass" severity="error" size="small">Пароли не совпадают</Message>
                </div>
            </div>

            <div class="row mb-4">
                <div class="col">
                    <label for="selectedRoles" class="ms-2">Роли</label>
                    <MultiSelect 
                        v-model="selectedRoles" 
                        display="chip" 
                        :options="roles"
                        optionLabel="title" 
                        :maxSelectedLabels="3"
                        placeholder="Выберите роли"
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

const firstName = ref('');
const middleName = ref('');
const lastName = ref('');
const email = ref('');
const pass = ref('');
const confirmPass = ref('');
const emailMessage = ref('');
const emailSeverity = ref('');
const selectedRoles = ref([]);
const visible = ref(false);
const roles = ref([]);
const userPriority = ref(null);

const hasMiddleName = ref(true);

const passwordChecks = ref({
    length: false,
    upperLower: false,
    number: false,
});

const validatePassword = () => {
    passwordChecks.value.length = pass.value.length >= 8;
    passwordChecks.value.upperLower = /[a-z]/.test(pass.value) && /[A-Z]/.test(pass.value);
    passwordChecks.value.number = /\d/.test(pass.value);
};

const checkEmail = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        emailMessage.value = 'Неверный формат email';
        emailSeverity.value = 'error';
        return;
    }

    try {
        const response = await axiosInstance.get('/api/users/checking/occupy-email', { params: { email: email.value } });
        emailMessage.value = response.data ? 'Email уже занят' : 'Email доступен';
        emailSeverity.value = response.data ? 'error' : 'success';
    } catch {
        emailMessage.value = 'Ошибка проверки email';
        emailSeverity.value = 'error';
    }
};

const isInvalid = (value) => {
    return !value || (typeof value === 'string' && value.trim().length === 0);
};

const createUser = async () => {
    
    try {
        const roleIds = selectedRoles.value.map(role => role.id);
        const payload = {
            password: pass.value,
            firstName: firstName.value,
            middleName: middleName.value,
            lastName: lastName.value,
            email: email.value,
            roleIds: roleIds,
            
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
        console.debug('Ошибка при создании: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'Пользователи', 
                detail: 'Ошибка при добавлении пользователя' 
            }
        }));
    }
}

const fetchCurrentUserPriority = async () => {
    try {
        const response = await axiosInstance.get('/api/users/me/info');
        const userData = response.data;
        
        // Предполагаем, что приоритет определяется по первой роли
        userPriority.value = userData.roles[0]?.priority;
    } catch (error) {
        console.debug('Ошибка при получении приоритета пользователя: ', error);
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

onMounted(async () => {
    await fetchCurrentUserPriority();
    await updateRolesList();
});
</script>

<style scoped>
label {
    font-size: 14px;
}
.form-input {
    font-size: 14px;
    width: 100%;
}
.password-requirements p {
    display: flex;
    align-items: center;
    margin: 0.25rem 0.75rem;
    font-size: 14px;
}
.text-success {
    color: var(--p-green-500);
}
.text-danger {
    color: var(--p-red-500);
}
.search {
    transition: all 0.5s;
}
</style>