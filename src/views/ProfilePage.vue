<template>
    <main>
        <WelcomeScreen :visible="loading" />

        <!-- Сайдбар перключения профилей -->
        <aside class="sidebar">
            <div class="button-group">
                <Button label="Профиль ЛКС" unstyled icon="pi pi-user me-3" @click="setActiveProfile('user')" :class="{ 'active-link': activeProfile === 'user' }" class="menu-item w-100 mb-3"/>
                <Button unstyled label="InfraManager" icon="pi pi-sitemap me-3" @click="setActiveProfile('infra')" :class="{ 'active-link': activeProfile === 'infra', 'disabled': !status }" class="menu-item w-100 mb-3"/>
                <Button unstyled label="Полномочия" icon="pi pi-lock me-3" @click="setActiveProfile('permiss')" :class="{ 'active-link': activeProfile === 'permiss' }" class="menu-item w-100 mb-3"/>
            </div>

            <!-- Изменить пароль -->
            <Button class="w-100 mb-3" label="Сменить пароль" icon="pi pi-key" outlined @click="visible = true" v-if="!isCurrentUser && hasPermission('User', 'Update')" />
            <Dialog v-model:visible="visible" modal header="Изменить пароль" :style="{ 'max-width': '30rem' }">
                <Form>
                    <FloatLabel class="mt-4">
                        <Password v-model="userPassword" inputId="userPassword" toggleMask class="form-input" @input="validatePassword" :feedback="false" :invalid="!passwordChecks.length || !passwordChecks.upperLower || !passwordChecks.number" />
                        <label for="userPassword">Пароль</label>
                    </FloatLabel>
                </Form>
                <div class="password-requirements my-3">
                    <p><i :class="passwordChecks.length ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Минимум 8 символов</p>
                    <p><i :class="passwordChecks.upperLower ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Верхний и нижний регистры</p>
                    <p><i :class="passwordChecks.number ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Минимум одна цифра</p>
                </div>
                <Button label="Сохранить" class="w-100 text-center" @click="changePassword"/>
            </Dialog>

            <!-- Изменить о себе -->
            <div v-if="isCurrentUser">
                <Button label="Сменить логин" text icon="pi pi-user" class="d-flex justify-content-between w-100" iconPos="right" @click="visibleLogin = true" />
                <Dialog v-model:visible="visibleLogin" modal header="Сменить логин" :style="{ 'max-width': '25rem' }">
                    <div>
                        <label for="newLogin" class="ms-2">Новый логин</label>
                        <InputText id="newLogin" v-model="newLogin" class="form-input w-100" />
                    </div>
                    <Button label="Сохранить" icon="pi pi-check" class="w-100 mt-4" @click="changeLogin"/>
                </Dialog>
                <Button label="Сменить пароль" text icon="pi pi-key" class="d-flex justify-content-between w-100" iconPos="right" @click="visiblePass = true" />
                <Dialog v-model:visible="visiblePass" modal header="Сменить пароль" :style="{ 'max-width': '25rem' }">
                    <Form>
                        <div class="">
                            <label for="oldPass" class="ms-2">Старый пароль</label>
                            <Password :inputProps="{ autocomplete: 'off' }" inputId="oldPass" name="oldPass" v-model="oldPass" class="form-input w-100" :feedback="false" toggleMask placeholder="Введите пароль" />
                        </div>
                        <div class="mt-2">
                            <label for="newPass" class="ms-2">Новый пароль</label>
                            <Password inputId="newPass" name="newPass" v-model="newPass" class="form-input w-100" :feedback="false" toggleMask @input="validateMePassword" :invalid="!passwordChecks.length || !passwordChecks.upperLower || !passwordChecks.number" autocomplete="off" placeholder="Введите новый пароль"/>
                        </div>
                        <div class="password-requirements my-3 mx-2">
                            <p><i :class="passwordChecks.length ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Минимум 8 символов</p>
                            <p><i :class="passwordChecks.upperLower ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Верхний и нижний регистры</p>
                            <p><i :class="passwordChecks.number ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Минимум одна цифра</p>
                        </div>
                        <div class="">
                            <label for="confirmPass" class="ms-2">Подтвердите новый пароль</label>
                            <Password inputId="confirmPass" name="confirmPass" v-model="confirmPass" class="form-input w-100" :feedback="false" toggleMask :invalid="newPass !== confirmPass && confirmPass" />
                        </div>
                        <Button label="Сохранить" icon="pi pi-check" class="w-100 mt-4" @click="changeMePass"/>
                    </Form>
                </Dialog>
                <Button label="Сменить email" text icon="pi pi-at" class="d-flex justify-content-between w-100" iconPos="right" @click="visibleEmail = true" />
                <Dialog v-model:visible="visibleEmail" modal header="Сменить e-mail" :style="{ 'max-width': '25rem' }">
                    <div class="">
                        <label for="newEmail" class="ms-2">Новый e-mail</label>
                        <InputText id="newEmail" name="newEmail" v-model="newEmail" class="form-input w-100" placeholder="Введите e-mail" />
                    </div>
                    <Button label="Сохранить" icon="pi pi-check" class="w-100 mt-4" @click="changeEmail"/>
                </Dialog>
            </div>
            
            
            <!-- Кнопка блокировки -->
            <Button 
                v-if="!isCurrentUser && hasPermission('User', 'Update')"
                :label="blockButtonLabel" 
                class="w-100 block-button" 
                :severity="blockButtonSeverity" 
                text 
                @click="toggleUserBlock"
            />
        </aside>
        

        <div class="content-wrap">
            <div v-if="activeProfile === 'user'">
                <div class="profile-card">
                    <!-- <div class="profile-header">
                        <img src="../assets/backgrounds/profBack.webp" alt="Profile Header" class="header-image"/>
                    </div> -->
                    <div class="row mx-0">
                        <div class="col-auto d-flex align-items-center justify-content-center">
                            <div class="avatar-wrapper">
                                <Avatar :image="srcAvatar" icon="pi pi-user fs-1" size="large" shape="circle" style="transition: all 0.5s;" />
                                <div class="avatar-overlay" @click="triggerFileUpload">
                                    <div class="upload-button pi pi-camera" />
                                    <input 
                                        ref="fileInput" 
                                        type="file" 
                                        style="display: none" 
                                        @change="onFileSelect"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="col d-flex align-items-center">
                            <div class="profile-body w-100">
                                <div class="row justify-content-between">
                                    <div class="col">
                                        <h2>{{ fullName }}</h2>
                                        <p class="profile-email">{{ email }}</p>
                                    </div>
                                    <div class="col-auto d-flex align-items-center">
                                        <UpdateUser v-if="!isCurrentUser && hasPermission('User', 'Update')" :userId="userId"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="profile-card" style="margin-top: 10px;">
                    <h2 class="mb-4">Информация о пользователе</h2>
                    <div class="profile-info-body">
                        <div>
                            <div class="field">Имя</div>
                            <div class="value">{{ firstName }}</div>
                        </div>
                        <div>
                            <div class="field">Фамилия</div>
                            <div class="value">{{ lastName }}</div>
                        </div>
                        <div>
                            <div class="field">Отчество</div>
                            <div class="value">{{ middleName || '-' }}</div>
                        </div>
                        <div>
                            <div class="field">Email</div>
                            <div class="value">{{ email }}</div>
                        </div>
                        <!-- <div>
                            <span class="field">Телефон</span>
                        </div> -->
                        <div>
                            <div class="field">Роль</div>
                            <Chip class="role-label">
                                <span class="roleType" :class="getRoleTypeClass()">
                                    {{ userRole?.type?.[0] }}
                                </span>
                                <span>{{ userRole.title }}</span>
                            </Chip>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Полномочия -->
            <div v-if="activeProfile === 'permiss'">
                <div class="profile-card">
                    <MePermissionsPage />
                </div>
            </div>
            
            <!-- Карточка профиля InfraManager -->
            <div v-if="activeProfile === 'infra'">
                <!-- <WelcomeScreen :visible="infraLoading" /> -->
                <div class="infra-profile-card" v-if="!infraLoading">
                    <h2>InfraManager</h2>
                    <Divider class="my-3"/>
                    <div class="infra-info">
                        <div class="row mb-3">
                            <div class="col-auto">
                                <i class="pi pi-user"></i>
                            </div>
                            <div class="col">
                                {{ infraFullName }}
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-auto">
                                <i class="pi pi-envelope"></i>
                            </div>
                            <div class="col">
                                {{ infraEmail }}
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-auto">
                                <i class="pi pi-sitemap"></i>
                            </div>
                            <div class="col">
                                {{ infraPosition }}
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-auto">
                                <i class="pi pi-map-marker"></i>
                            </div>
                            <div class="col">
                                {{ infraPlace }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Skeleton class="w-100" style="height: 250px; border-radius: 12px;" v-if="activeProfile === 'infra' && infraLoading"/>

            
            <!-- <InfraManagerServices v-if="infraManagerUser"/>
            <InfraManagerCallsMe v-if="infraManagerUser"/> -->
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import axiosInstance from '@/utils/axios.js';
import { usePermissionStore } from '@/stores/permissions.js';

import WelcomeScreen from '@/components/Utils/WelcomeScreen.vue';
import UpdateUser from '@/components/Users/UpdateUser.vue';
import InfraManagerCallsMe from '@/components/InfraManager/InfraManagerCallsMe.vue';
import InfraManagerServices from '@/components/InfraManager/InfraManagerServices.vue';
import MePermissionsPage from '@/views/MePermissionsPage.vue';

const currentUserId = localStorage.getItem('userId');
const permissionStore = usePermissionStore();

const hasPermission = (type, action) => permissionStore.hasPermission(type, action);

const isCurrentUser = computed(() => {
  return currentUserId === userId.value;
});

const route = useRoute();

const srcAvatar = ref(null);
const loading = ref(true);
const visible = ref(false);
const visibleLogin = ref(false);
const visiblePass = ref(false);
const visibleEmail = ref(false);
const fileInput = ref(null);
const sidebarVisible = ref(false);
const activeProfile = ref('user'); // Переключение профилей

const firstName = ref('');
const lastName = ref('');
const middleName = ref('');
const fullName = ref('');
const email = ref('');
const userRole = ref([]);
const login = ref('');

const newLogin = ref('');
const newEmail = ref('');
const oldPass = ref('');
const newPass = ref('');
const confirmPass = ref('');

const userPassword = ref(null);

const passwordChecks = ref({
    length: false,
    upperLower: false,
    number: false,
});

const validatePassword = () => {
    passwordChecks.value.length = userPassword.value.length >= 8;
    passwordChecks.value.upperLower = /[a-z]/.test(userPassword.value) && /[A-Z]/.test(userPassword.value);
    passwordChecks.value.number = /\d/.test(userPassword.value);
};

const validateMePassword = () => {
    passwordChecks.value.length = newPass.value.length >= 8;
    passwordChecks.value.upperLower = /[a-z]/.test(newPass.value) && /[A-Z]/.test(newPass.value);
    passwordChecks.value.number = /\d/.test(newPass.value);
};

const infraManagerUser = ref(null)
const infraFullName = ref('');
const infraEmail = ref('');
const infraPosition = ref('');
const infraPlace = ref('');
const infraLoading = ref(false);

const userId = ref(route.query.id || null);

const isBlocked = ref(null);

const blockButtonLabel = computed(() => (isBlocked.value ? 'Разблокировать' : 'Заблокировать'));
const blockButtonSeverity = computed(() => (isBlocked.value ? 'success' : 'danger'));

const toggleUserBlock = async () => {
    try {
        const endpoint = isBlocked.value ? 'unblock' : 'block';
        await axiosInstance.patch(`/api/users/${ userId.value }/${ endpoint }`);
        
        fetchUserProfile(userId.value);
    } catch (error) {
        console.debug(`Ошибка при ${ isBlocked.value ? 'разблокировке' : 'блокировке' } пользователя: `, error);
    }
}

// Классы для отображения ролей в зависимости от их типа
const getRoleTypeClass = () => {
    return userRole.value.type === 'Custom' ? 'custom-role-type' : 'default-role-type';
}

const setActiveProfile = async (profile) => {
    activeProfile.value = profile;
    sidebarVisible.value = false;

    if (profile === 'infra') {
        await fetchInfraManagerData();
    }
};

const triggerFileUpload = () => {
  fileInput.value.click();
}

const changePassword = async () => {
    try {
        await axiosInstance.patch(`/api/users/${ userId.value }/password`, userPassword.value.toString());
        visible.value = false;
    } catch (error) {
        console.debug('Ошибка при сохранении пароля: ', error);
    }
}

function onFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            srcAvatar.value = e.target.result; // Предпросмотр загруженного изображения
        };

        reader.readAsDataURL(file);
    }
}

let statusInfra;
const status = ref(false);

const fetchUserProfile = async (id) => {
    try {
        let response;
        if (isCurrentUser.value) {
            response = await axiosInstance.get(`/api/users/me/info`);
        } else {
            response = await axiosInstance.get(`/api/users/${id}`);
        }

        login.value = response.data.login;
        firstName.value = response.data.firstName;
        lastName.value = response.data.lastName;
        middleName.value = response.data.middleName;
        email.value = response.data.email;
        userRole.value = response.data.roles[0];
        isBlocked.value = response.data.isBlocked;

        fullName.value = `${firstName.value} ${lastName.value}`.trim();
        statusInfra = await axiosInstance.get(`/api/infra-manager/db/users/${userId.value}/status`);
        if (statusInfra.data) {
            status.value = true;
        }
    } catch (error) {
        console.debug('Ошибка при получении информации о пользователе: ', error);
    }

    loading.value = false;
};

const fetchInfraManagerData = async () => {
    try {
        infraLoading.value = true;
        if (statusInfra.data) {
            let endpoint1;
            let endpoint2;
            infraManagerUser.value = statusInfra.data;
            if (isCurrentUser.value) {
                endpoint1 = '/api/infra-manager/users/me'
                endpoint2 = '/api/infra-manager/users/me/client/info' 
            } else {
                endpoint1 = `/api/infra-manager/users/${infraManagerUser.value.infraManagerUserId}`
                endpoint2 = `/api/infra-manager/users/${infraManagerUser.value.infraManagerUserId}/client/info`
            };
            const [infraInfo, clientInfo] = await Promise.all([
                axiosInstance.get(endpoint1),
                axiosInstance.get(endpoint2),
            ]);

            infraFullName.value = infraInfo.data.fullName;
            infraEmail.value = infraInfo.data.email;
            infraPosition.value = infraInfo.data.positionName;
            infraPlace.value = clientInfo.data.roomName;
        }
    } catch (error) {
        console.debug('Ошибка при получении данных InfraManager:', error);
    } finally {
        infraLoading.value = false;
    }
};

watch(() => route.query.id, async (newId) => {
    userId.value = newId;
    await fetchUserProfile(userId.value);
});

const changeLogin = async () => {
    try {
        await axiosInstance.patch('/api/users/me/login', newLogin.value.toString());
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Мой профиль', 
                detail: `Логин успешно изменен`,
            }
        }));
        fetchUserProfile(userId.value);
    } catch (error) {
        console.debug('Ошибка при обновлении логина: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'danger', 
                summary: 'Мой профиль', 
                detail: `Ошибка при обновлении логина`,
            }
        }));
    }
}
const changeEmail = async () => {
    try {
        await axiosInstance.patch('/api/users/me/email', newEmail.value.toString());
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Мой профиль', 
                detail: `Email успешно изменен`,
            }
        }));
        fetchUserProfile(userId.value);
    } catch (error) {
        console.debug('Ошибка при обновлении email: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'danger', 
                summary: 'Мой профиль', 
                detail: `Ошибка при обновлении Email`,
            }
        }));
    }
}
const changeMePass = async () => {
    try {
        await axiosInstance.patch('/api/users/me/password', {
            newPassword: newPass.value.toString(),
            oldPassword: oldPass.value.toString()        
        });
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Мой профиль', 
                detail: `Пароль успешно изменен`,
            }
        }));
        fetchUserProfile(userId.value);
    } catch (error) {
        console.debug('Ошибка при обновлении pass: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'danger', 
                summary: 'Мой профиль', 
                detail: `Ошибка при обновлении пароля`,
            }
        }));
    }
}


onMounted(async () => {
    if (userId.value) {
        await fetchUserProfile(userId.value);
    }
});

</script>

<style scoped>
main {
    display: flex;
    height: 100%;
    padding: 10px;
}
.menu-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    height: 45px;
    background-color: transparent;
    border-radius: 12px;
    transition: all 0.5s;
    text-decoration: none;
    color: var(--p-text-color);
    border: 2px solid transparent;
}
.menu-item:hover {
    background-color: var(--p-blue-500-low-op);
    color: var(--p-color-icon-menu);
    border: 2px solid transparent;
}
.active-link {
    color: var(--p-color-icon-menu);
    background-color: var(--p-blue-500-low-op);
}
.disabled {
    pointer-events: none;
    color: var(--p-grey-2);
}
.sidebar {
    position: fixed;
    width: 210px;
    background-color: var(--p-grey-7);
    border: 2px solid var(--p-grey-4);
    border-radius: 12px;
    padding: 15px;
    height: calc(100vh - 20px);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    transition: all 0.5s;
}
.button-group {
    flex-grow: 1;
}
.p-chip {
    background: transparent;
}
.block-button {
    margin-top: auto;
}
.avatar-wrapper {
    position: relative;
    border-radius: 50%;
    justify-content: center;
    align-items: center;
    display: flex;
    transition: all 0.5s;
}
.avatar-overlay {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: opacity 0.5s ease;
}
.avatar-wrapper:hover .avatar-overlay {
    opacity: 1;
    cursor: pointer;
}
.upload-button {
    color: white;
    border: none;
    background: transparent;
    margin: 0;
    font-size: 1.5rem;
}
.content-wrap {
    flex: 1;
    width: 100%;
    margin-left: 210px;
    padding-inline: 10px;
    overflow-y: auto;
    color: var(--p-text-color);
}
.profile-card {
    background-color: var(--p-grey-7);
    border-radius: 12px;
    border: 2px solid var(--p-grey-4);
    transition: all 0.5s;
    width: 100%;
    padding: 15px;
    /* position: relative; */
}
.infra-profile-card {
    background-color: var(--p-grey-7);
    border-radius: 12px;
    border: 2px solid var(--p-grey-4);
    padding: 20px;
    transition: all 0.5s;
}
.profile-info-body {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
    padding: 0px;
    overflow: hidden;
}
.header-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px 10px 0 0;
}
h2 {
    margin-bottom: 5px;
    font-size: 24px;
    font-weight: bold;
}
p {
    margin-bottom: 10px;
}
.profile-email {
    color: var(--p-grey-2);
    font-size: 16px;
    margin: 0;
}
.pi {
    font-size: 1.5rem;
}
.field {
    color: var(--p-grey-2);
    font-size: 1rem;
}
.value {
    color: var(--p-text-color);
    font-weight: bold;
    font-size: 1.15rem;
}
.password-requirements p {
    display: flex;
    align-items: center;
    margin: 0.25rem 0;
    .pi {
        font-size: 1rem;
    }
}
.roleType {
    background-color: var(--p-blue-500);
    border-radius: 50%;
    font-size: 20px;
    color: white;
    width: 30px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
}
.custom-role-type {
    background-color: var(--p-purple-500);
}
</style>