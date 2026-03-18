<template>
    <main>

        <!-- Сайдбар перключения профилей -->
        <aside class="sidebar">
            <div class="button-group">
                <Button label="Профиль ЛКС" unstyled icon="pi pi-user me-3" @click="setActiveProfile('user')" :class="{ 'active-link': activeProfile === 'user' }" class="menu-item w-100 mb-3"/>
                <Button unstyled label="Полномочия" icon="pi pi-lock me-3" @click="setActiveProfile('permiss')" :class="{ 'active-link': activeProfile === 'permiss' }" class="menu-item w-100 mb-3"/>

                <Divider />
                <div class="external-systems-title">Внешние системы</div>
                <div class="external-systems-list">
                    <Button
                        v-for="account in externalAccounts"
                        :key="account.id"
                        unstyled
                        icon="pi pi-external-link me-3"
                        :label="getSystemTypeLabel(account.systemType)"
                        @click="openExternalAccount(account)"
                        :class="{ 'active-link': activeProfile === 'external' && selectedExternalAccount?.id === account.id }"
                        class="menu-item w-100 mb-2"
                    />
                    <Button
                        v-if="isAdmin"
                        icon="pi pi-plus"
                        severity="secondary"
                        outlined
                        class="w-100 mt-2"
                        @click="openAddExternalDialog"
                    />
                </div>
            </div>

            <GetOtpButton 
                v-if="hasPermission('User', 'Update')"
                :userId="userId"
                :buttonLabel="'Получить OTP'"
                :showLabel="true"
                :buttonSeverity="'help'"
                class="w-100 mb-3"
            />

            <!-- Изменить пароль -->
            <Button class="w-100 mb-3" label="Сменить пароль" icon="pi pi-key" outlined @click="visible = true" v-if="!isCurrentUser && hasPermission('User', 'Update')" />
            <Dialog v-model:visible="visible" modal header="Изменить пароль" :style="{ 'max-width': '30rem' }">
                <form>
                    <FloatLabel class="mt-4">
                        <Password v-model="userPassword" inputId="userPassword" toggleMask class="form-input" @input="validatePassword" :feedback="false" :invalid="!passwordChecks.length || !passwordChecks.upperLower || !passwordChecks.number" />
                        <label for="userPassword">Пароль</label>
                    </FloatLabel>
                </form>
                <div class="password-requirements my-3">
                    <p><i :class="passwordChecks.length ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Минимум 8 символов</p>
                    <p><i :class="passwordChecks.upperLower ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Верхний и нижний регистры</p>
                    <p><i :class="passwordChecks.number ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Минимум одна цифра</p>
                </div>
                <Button label="Сохранить" class="w-100 text-center" @click="changePassword"/>
            </Dialog>

            <!-- Изменить о себе -->
            <div v-if="isCurrentUser">
                <Button label="Сменить пароль" text icon="pi pi-key" class="d-flex justify-content-between w-100" iconPos="right" @click="visiblePass = true" />
                <Dialog v-model:visible="visiblePass" modal header="Сменить пароль" :style="{ 'max-width': '25rem' }">
                    <form>
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
                    </form>
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

            <Dialog v-model:visible="showAddExternalDialog" modal header="Добавить внешний аккаунт" :style="{ 'max-width': '40rem', width: '100%' }">
                <div class="external-form-grid">
                    <div>
                        <label for="externalSystemType" class="mb-1 d-block">Тип системы</label>
                        <Select
                            id="externalSystemType"
                            v-model="externalForm.systemType"
                            :options="systemTypeOptions"
                            optionLabel="label"
                            optionValue="value"
                            class="w-100"
                            placeholder="Выберите систему"
                            :loading="systemTypeOptionsLoading"
                        />
                    </div>
                    <div>
                        <label for="externalSystemUserId" class="mb-1 d-block">ID пользователя в системе</label>
                        <InputText id="externalSystemUserId" v-model="externalForm.userIdInOtherSystem" class="w-100" />
                    </div>
                    <div class="full-width">
                        <label class="mb-1 d-block">Формат Information</label>
                        <SelectButton
                            v-model="addInformationMode"
                            :options="addInformationModeOptions"
                            optionLabel="label"
                            optionValue="value"
                            class="w-100 mb-2"
                        />
                    </div>
                    <div class="full-width" v-if="addInformationMode === 'fields'">
                        <div class="external-edit-grid">
                            <div
                                v-for="(field, index) in addExternalFields"
                                :key="`add-${index}`"
                                class="external-add-row"
                            >
                                <InputText v-model="field.key" placeholder="Ключ" class="w-100" />
                                <InputText v-model="field.value" placeholder="Значение" class="w-100" />
                                <Button
                                    icon="pi pi-trash"
                                    severity="danger"
                                    outlined
                                    size="small"
                                    :disabled="addExternalFields.length === 1"
                                    @click="removeAddExternalField(index)"
                                />
                            </div>
                            <Button
                                label="Добавить поле"
                                icon="pi pi-plus"
                                outlined
                                severity="secondary"
                                size="small"
                                class="align-self-start"
                                @click="addExternalFields.push({ key: '', value: '' })"
                            />
                        </div>
                    </div>
                    <div class="full-width" v-else>
                        <label for="externalSystemInfo" class="mb-1 d-block">Information</label>
                        <Textarea id="externalSystemInfo" v-model="externalForm.information" rows="12" class="w-100" />
                    </div>
                </div>
                <div class="d-flex justify-content-end mt-3 gap-2">
                    <Button label="Отмена" text severity="secondary" @click="showAddExternalDialog = false" />
                    <Button label="Добавить" icon="pi pi-check" :loading="externalActionLoading" @click="addExternalAccount" />
                </div>
            </Dialog>

            <Dialog v-model:visible="showEditExternalDialog" modal header="Изменить" :style="{ 'max-width': '40rem', width: '100%' }">
                <div>
                    <label class="mb-1 d-block">Information</label>
                    <div v-if="isExternalInfoStructured" class="external-edit-grid">
                        <div
                            v-for="(field, index) in editableExternalFields"
                            :key="`${field.key}-${index}`"
                            class="external-edit-row"
                        >
                            <label class="external-edit-label">{{ field.key }}</label>
                            <InputText v-model="field.value" placeholder="Значение" class="w-100" />
                        </div>
                    </div>
                    <Textarea v-else id="externalSystemInfoEdit" v-model="editExternalInformation" rows="14" class="w-100" />
                </div>
                <div class="d-flex justify-content-end mt-3 gap-2">
                    <Button label="Отмена" text severity="secondary" @click="showEditExternalDialog = false" />
                    <Button label="Сохранить" icon="pi pi-check" :loading="externalActionLoading" @click="updateExternalAccountInformation" />
                </div>
            </Dialog>

            <Dialog v-model:visible="showDeleteExternalDialog" modal header="Удалить внешний аккаунт?" :style="{ 'max-width': '30rem' }">
                <p class="m-0">Вы уверены, что хотите удалить связку внешней системы?</p>
                <div class="d-flex justify-content-end mt-3 gap-2">
                    <Button label="Отмена" text severity="secondary" @click="showDeleteExternalDialog = false" />
                    <Button label="Удалить" icon="pi pi-trash" severity="danger" :loading="externalActionLoading" @click="deleteExternalAccount" />
                </div>
            </Dialog>
        </aside>
        

        <div class="content-wrap">
            <div v-if="activeProfile === 'user'">
                <div class="profile-card profile-card-user">
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
                                        <div class="profile-role d-flex flex-row gap-2">
                                            <template v-if="userRoles.length > 0">
                                                <div v-for="ur in userRoles" :key="ur.id">
                                                    <Chip class="role-label" >
                                                        <span class="roleType" :class="getRoleTypeClass(ur)">
                                                            {{ ur.type[0] }}
                                                        </span>
                                                        <span>{{ ur.title }}</span>
                                                    </Chip>
                                                </div>
                                            </template>
                                            <template v-else>
                                                <Tag severity="warn">Нет ролей</Tag>
                                            </template>
                                        </div>
                                    </div>
                                    <div class="col-auto d-flex align-items-center">
                                        <UpdateUser v-if="!isCurrentUser && hasPermission('User', 'Update')" :userId="userId"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="profile-card profile-card-user-secondary" style="margin-top: 10px;">
                    <div class="profile-info-header">
                        <div>
                            <h2 class="mb-1">Информация о пользователе</h2>
                            <p class="profile-info-subtitle">Основные данные профиля</p>
                        </div>
                        <i class="pi pi-id-card profile-info-icon"></i>
                    </div>
                    <div class="profile-info-body">
                        <div class="info-card">
                            <div class="field">Имя</div>
                            <div class="value">{{ firstName }}</div>
                        </div>
                        <div class="info-card">
                            <div class="field">Фамилия</div>
                            <div class="value">{{ lastName }}</div>
                        </div>
                        <div class="info-card">
                            <div class="field">Отчество</div>
                            <div class="value">{{ middleName || '-' }}</div>
                        </div>
                        <div class="info-card">
                            <div class="field">Email</div>
                            <div class="value">{{ email }}</div>
                        </div>
                        <!-- <div class="info-card">
                            <span class="field">Телефон</span>
                        </div> -->
                    </div>
                </div>
            </div>

            <!-- Полномочия -->
            <div v-if="activeProfile === 'permiss'">
                <div class="profile-card">
                    <MePermissionsPage />
                </div>
            </div>
            
            <div v-if="activeProfile === 'external'">
                <div class="profile-card">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h2 class="m-0">{{ selectedExternalAccount ? getSystemTypeLabel(selectedExternalAccount.systemType) : 'Внешние системы' }}</h2>
                        <div v-if="selectedExternalAccount && isAdmin" class="d-flex gap-2">
                            <Button label="Изменить" icon="pi pi-pencil" outlined severity="secondary" @click="openEditExternalDialog" />
                            <Button label="Удалить" icon="pi pi-trash" severity="danger" outlined @click="showDeleteExternalDialog = true" />
                        </div>
                    </div>

                    <div v-if="externalAccountsLoading" class="d-flex align-items-center gap-2">
                        <ProgressSpinner style="width: 24px; height: 24px;" />
                        <span>Загрузка внешних систем...</span>
                    </div>

                    <div v-else-if="!selectedExternalAccount" class="external-empty-page">
                        Выберите систему слева для просмотра информации
                    </div>

                    <div v-else class="external-info">
                        <div class="external-meta mb-3">
                            <div><strong>ID связки:</strong> {{ selectedExternalAccount.id }}</div>
                            <div><strong>User ID в системе:</strong> {{ selectedExternalAccount.userIdInOtherSystem }}</div>
                        </div>

                        <div v-if="parsedExternalInformationEntries.length" class="external-info-grid">
                            <div v-for="entry in parsedExternalInformationEntries" :key="entry.key" class="external-info-row">
                                <div class="external-key">{{ entry.key }}</div>
                                <div class="external-value">{{ entry.value }}</div>
                            </div>
                        </div>

                        <pre v-else class="external-raw">{{ selectedExternalAccount.information || 'Пусто' }}</pre>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import axiosInstance from '@/utils/axios.js';
import { usePermissionStore } from '@/stores/permissions.js';
import { getSessionUserId } from '@/utils/TokenService.js';

import UpdateUser from '@/components/Users/UpdateUser.vue';
import MePermissionsPage from '@/views/MePermissionsPage.vue';

import GetOtpButton from '@/components/Users/GetOtpButton.vue';

const permissionStore = usePermissionStore();

const hasPermission = (type, action) => permissionStore.hasPermission(type, action);

const isCurrentUser = computed(() => {
    return String(getSessionUserId() || '') === String(userId.value || '');
});

const route = useRoute();

const srcAvatar = ref(null);
const loading = ref(true);
const visible = ref(false);
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
const userRoles = ref([]);

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

const userId = ref(route.query.id || null);
const currentUserRoleIds = ref([]);
const isAdmin = computed(() => currentUserRoleIds.value.includes(1));

const isBlocked = ref(null);

const externalAccounts = ref([]);
const externalAccountsLoading = ref(false);
const selectedExternalAccount = ref(null);
const showAddExternalDialog = ref(false);
const showEditExternalDialog = ref(false);
const showDeleteExternalDialog = ref(false);
const externalActionLoading = ref(false);
const systemTypeOptions = ref([]);
const systemTypeOptionsLoading = ref(false);
const externalForm = ref({
    userIdInOtherSystem: '',
    systemType: null,
    information: ''
});
const addInformationMode = ref('fields');
const addInformationModeOptions = [
    { label: 'Ключ-значение', value: 'fields' },
    { label: 'JSON', value: 'raw' }
];
const addExternalFields = ref([{ key: '', value: '' }]);
const addInformationModeSync = ref(false);
const editExternalInformation = ref('');
const editableExternalFields = ref([]);
const isExternalInfoStructured = ref(false);

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
const getRoleTypeClass = (role) => {
    return role?.type === 'Custom' ? 'custom-role-type' : 'default-role-type';
}

const setActiveProfile = async (profile) => {
    activeProfile.value = profile;
    sidebarVisible.value = false;

    if (profile === 'external' && !externalAccounts.value.length) {
        await fetchExternalAccounts();
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

let statusInfra = null;
const status = ref(false);
const INFRA_MANAGER_SYSTEM_TYPE = 0;

const parseInformation = (information) => {
    if (!information) return null;
    if (typeof information === 'object') return information;
    try {
        return JSON.parse(information);
    } catch {
        return null;
    }
};

const parsedExternalInformationEntries = computed(() => {
    const info = parseInformation(selectedExternalAccount.value?.information);
    if (!info || typeof info !== 'object' || Array.isArray(info)) return [];

    return Object.entries(info).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    }));
});

const getSystemTypeLabel = (systemType) => {
    const matchedSystemType = systemTypeOptions.value.find((option) => Number(option.value) === Number(systemType));
    if (matchedSystemType?.label) return matchedSystemType.label;

    const map = {
        0: 'InfraManager'
    };
    return map[Number(systemType)] || `Система ${systemType}`;
};

const normalizeSystemTypeOptions = (payload) => {
    if (!Array.isArray(payload)) return [];

    return payload
        .map((item) => {
            if (typeof item === 'number' || typeof item === 'string') {
                const numericValue = Number(item);
                return {
                    label: getSystemTypeLabel(numericValue),
                    value: numericValue,
                };
            }

            const value = item?.value ?? item?.id ?? item?.systemType ?? item?.type;
            if (value === undefined || value === null || value === '') return null;

            return {
                label: item?.label || item?.title || item?.name || `Система ${value}`,
                value: Number(value),
            };
        })
        .filter(Boolean);
};

const loadSystemTypeOptions = async () => {
    try {
        systemTypeOptionsLoading.value = true;
        const response = await axiosInstance.get('/api/users/get-system-types');
        systemTypeOptions.value = normalizeSystemTypeOptions(response.data);
    } catch (error) {
        console.debug('Ошибка при получении типов систем: ', error);
        systemTypeOptions.value = [];
        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'error',
                summary: 'Внешние системы',
                detail: 'Не удалось загрузить список систем'
            }
        }));
    } finally {
        systemTypeOptionsLoading.value = false;
    }
};

const getInfraExternalAccount = (accounts = []) => {
    return accounts.find(account => Number(account.systemType) === INFRA_MANAGER_SYSTEM_TYPE) || null;
};

const openExternalAccount = (account) => {
    selectedExternalAccount.value = account;
    activeProfile.value = 'external';
};

const fetchCurrentUserRole = async () => {
    try {
        const response = await axiosInstance.get('/api/users/me/info');
        currentUserRoleIds.value = (response.data?.roles || []).map(role => role.id).filter(Boolean);
    } catch (error) {
        console.debug('Ошибка при получении роли текущего пользователя: ', error);
    }
};

const fetchExternalAccounts = async () => {
    if (!userId.value) return;

    try {
        externalAccountsLoading.value = true;
        const endpoint = isAdmin.value && !isCurrentUser.value
            ? `/api/users/other-accounts/${userId.value}`
            : '/api/users/other-accounts/getall';

        const response = await axiosInstance.get(endpoint);
        externalAccounts.value = response.data?.accounts || [];
        statusInfra = getInfraExternalAccount(externalAccounts.value);
        status.value = !!statusInfra;

        if (!externalAccounts.value.length) {
            selectedExternalAccount.value = null;
            return;
        }

        const selectedId = selectedExternalAccount.value?.id;
        selectedExternalAccount.value = externalAccounts.value.find(a => a.id === selectedId) || externalAccounts.value[0];
    } catch (error) {
        console.debug('Ошибка при получении внешних аккаунтов: ', error);
        externalAccounts.value = [];
        selectedExternalAccount.value = null;
        statusInfra = null;
        status.value = false;
    } finally {
        externalAccountsLoading.value = false;
    }
};

const resetExternalForm = () => {
    externalForm.value = {
        userIdInOtherSystem: '',
        systemType: null,
        information: ''
    };
    addInformationMode.value = 'fields';
    addExternalFields.value = [{ key: '', value: '' }];
};

const openAddExternalDialog = async () => {
    if (!systemTypeOptions.value.length) {
        await loadSystemTypeOptions();
    }
    showAddExternalDialog.value = true;
};

const removeAddExternalField = (index) => {
    if (addExternalFields.value.length === 1) return;
    addExternalFields.value.splice(index, 1);
};

const buildInformationFromFields = () => {
    const result = {};
    addExternalFields.value.forEach((field) => {
        const key = (field.key || '').trim();
        if (!key) return;
        result[key] = field.value ?? '';
    });
    return result;
};

const mapInfoObjectToFields = (infoObject) => {
    const entries = Object.entries(infoObject).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')
    }));
    addExternalFields.value = entries.length ? entries : [{ key: '', value: '' }];
};

watch(addInformationMode, (newMode, oldMode) => {
    if (!showAddExternalDialog.value || addInformationModeSync.value) return;

    if (newMode === 'raw' && oldMode === 'fields') {
        externalForm.value.information = JSON.stringify(buildInformationFromFields(), null, 2);
        return;
    }

    if (newMode === 'fields' && oldMode === 'raw') {
        if (!externalForm.value.information?.trim()) {
            addExternalFields.value = [{ key: '', value: '' }];
            return;
        }

        const parsed = parseInformation(externalForm.value.information);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            addInformationModeSync.value = true;
            addInformationMode.value = 'raw';
            addInformationModeSync.value = false;
            window.dispatchEvent(new CustomEvent('toast', {
                detail: {
                    severity: 'error',
                    summary: 'Внешние системы',
                    detail: 'Для режима "Ключ-значение" нужен JSON-объект'
                }
            }));
            return;
        }

        mapInfoObjectToFields(parsed);
    }
});

const buildAddInformationPayload = () => {
    if (addInformationMode.value === 'raw') {
        if (!externalForm.value.information?.trim()) return '';
        try {
            JSON.parse(externalForm.value.information);
            return externalForm.value.information;
        } catch {
            throw new Error('INVALID_JSON');
        }
    }

    return JSON.stringify(buildInformationFromFields(), null, 2);
};

const addExternalAccount = async () => {
    if (!userId.value) return;

    try {
        externalActionLoading.value = true;
        const informationPayload = buildAddInformationPayload();
        await axiosInstance.post('/api/users/other-accounts/add-user-account-in-other-system', {
            userId: userId.value,
            userIdInOtherSystem: externalForm.value.userIdInOtherSystem,
            systemType: externalForm.value.systemType,
            information: informationPayload
        });

        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'success',
                summary: 'Внешние системы',
                detail: 'Внешний аккаунт успешно добавлен'
            }
        }));

        showAddExternalDialog.value = false;
        resetExternalForm();
        await fetchExternalAccounts();
    } catch (error) {
        if (error?.message === 'INVALID_JSON') {
            window.dispatchEvent(new CustomEvent('toast', {
                detail: {
                    severity: 'error',
                    summary: 'Внешние системы',
                    detail: 'JSON в Information невалиден'
                }
            }));
            return;
        }
        console.debug('Ошибка при добавлении внешнего аккаунта: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'error',
                summary: 'Внешние системы',
                detail: 'Не удалось добавить внешний аккаунт'
            }
        }));
    } finally {
        externalActionLoading.value = false;
    }
};

const openEditExternalDialog = () => {
    editExternalInformation.value = selectedExternalAccount.value?.information || '';
    const parsed = parseInformation(editExternalInformation.value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        isExternalInfoStructured.value = true;
        editableExternalFields.value = Object.entries(parsed).map(([key, value]) => ({
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            originalType: Array.isArray(value) ? 'array' : typeof value
        }));
    } else {
        isExternalInfoStructured.value = false;
        editableExternalFields.value = [];
    }
    showEditExternalDialog.value = true;
};

const castFieldValueByType = (value, type) => {
    if (type === 'boolean') {
        return value === 'true';
    }
    if (type === 'number') {
        const numberValue = Number(value);
        return Number.isNaN(numberValue) ? value : numberValue;
    }
    if (type === 'object' || type === 'array') {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }
    return value;
};

const buildExternalInformationPayload = () => {
    if (!isExternalInfoStructured.value) {
        return editExternalInformation.value;
    }

    const normalized = {};
    editableExternalFields.value.forEach((field) => {
        const key = (field.key || '').trim();
        if (!key) return;
        normalized[key] = castFieldValueByType(field.value, field.originalType);
    });

    return JSON.stringify(normalized, null, 2);
};

const updateExternalAccountInformation = async () => {
    if (!selectedExternalAccount.value?.id) return;

    try {
        externalActionLoading.value = true;
        const informationPayload = buildExternalInformationPayload();
        try {
            await axiosInstance.patch(`/api/users/other-accounts/${selectedExternalAccount.value.id}`, null, {
                params: { information: informationPayload }
            });
        } catch (error) {
            if (error?.response?.status === 405 || error?.response?.status === 404) {
                await axiosInstance.put(`/api/users/other-accounts/${selectedExternalAccount.value.id}`, null, {
                    params: { information: informationPayload }
                });
            } else {
                throw error;
            }
        }

        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'success',
                summary: 'Внешние системы',
                detail: 'Information успешно обновлен'
            }
        }));

        showEditExternalDialog.value = false;
        await fetchExternalAccounts();
    } catch (error) {
        console.debug('Ошибка при обновлении внешнего аккаунта: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'error',
                summary: 'Внешние системы',
                detail: 'Не удалось обновить information'
            }
        }));
    } finally {
        externalActionLoading.value = false;
    }
};

const deleteExternalAccount = async () => {
    if (!selectedExternalAccount.value?.id) return;

    try {
        externalActionLoading.value = true;
        await axiosInstance.delete(`/api/users/other-accounts/delete-by-id/${selectedExternalAccount.value.id}`);

        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'success',
                summary: 'Внешние системы',
                detail: 'Внешний аккаунт удален'
            }
        }));

        showDeleteExternalDialog.value = false;
        await fetchExternalAccounts();
    } catch (error) {
        console.debug('Ошибка при удалении внешнего аккаунта: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'error',
                summary: 'Внешние системы',
                detail: 'Не удалось удалить внешний аккаунт'
            }
        }));
    } finally {
        externalActionLoading.value = false;
    }
};

const fetchUserProfile = async (id) => {
    try {
        let response;
        if (isCurrentUser.value) {
            response = await axiosInstance.get(`/api/users/me/info`);
        } else {
            response = await axiosInstance.get(`/api/users/${id}`);
        }

        firstName.value = response.data.firstName;
        lastName.value = response.data.lastName;
        middleName.value = response.data.middleName;
        email.value = response.data.email;
        userRoles.value = response.data.roles || [];
        isBlocked.value = response.data.isBlocked;

        fullName.value = `${firstName.value} ${lastName.value}`.trim();
        statusInfra = null;
        status.value = false;
    } catch (error) {
        console.debug('Ошибка при получении информации о пользователе: ', error);
    }

    loading.value = false;
};

watch(() => route.query.id, async (newId) => {
    userId.value = newId;
    await fetchUserProfile(userId.value);
    await fetchExternalAccounts();
});

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
                severity: 'error', 
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
                severity: 'error', 
                summary: 'Мой профиль', 
                detail: `Ошибка при обновлении пароля`,
            }
        }));
    }
}


onMounted(async () => {
    await fetchCurrentUserRole();
    await loadSystemTypeOptions();
    if (!userId.value) return;
    await fetchUserProfile(userId.value);
    await fetchExternalAccounts();
});

</script>

<style scoped>
main {
    position: relative;
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
    padding: 10px 1rem;
}
.menu-item:hover {
    background-color: var(--p-blue-500-low-op);
    color: rgb(var(--p-color-icon-menu));
    border: 2px solid transparent;
}
.active-link {
    color: rgb(var(--p-color-icon-menu));
    background-color: var(--p-blue-500-low-op);
}
.disabled {
    pointer-events: none;
    color: var(--p-grey-2);
}
.sidebar {
    position: fixed;
    width: 210px;
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
    border: 2px solid rgba(var(--p-blue-500-rgb), 0.14);
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
.external-systems-title {
    font-size: 0.9rem;
    color: var(--p-grey-2);
    margin-bottom: 0.5rem;
}
.external-systems-list {
    margin-bottom: 1rem;
}
.external-empty {
    color: var(--p-grey-2);
    font-size: 0.9rem;
    margin: 0.25rem 0 0.5rem 0;
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
    transition: opacity 0.5s;
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
    border-width: 2px;
    border-style: solid;
    border-color: rgba(var(--p-blue-500-rgb), 0.14);
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
    border-radius: 12px;
    transition: all 0.5s;
    width: 100%;
    padding: 20px;
}
.profile-card-user {
    position: relative;
    overflow: hidden;
    padding: 16px;
    border-color: rgba(var(--p-blue-500-rgb), 0.14);
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
    box-shadow:
        0 8px 18px rgba(0, 0, 0, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.profile-card-user::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
        circle at 20% 10%,
        rgba(var(--p-blue-500-rgb), 0.06),
        transparent 60%
    );
    pointer-events: none;
}
.profile-card-user-secondary {
    border-color: rgba(var(--p-blue-500-rgb), 0.14);
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
}
.profile-card-user .avatar-wrapper {
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
    padding: 3px;
    background: linear-gradient(
        135deg,
        rgba(var(--p-blue-500-rgb), 0.35),
        rgba(255, 255, 255, 0)
    );
}
.profile-card-user .profile-email {
    color: var(--p-grey-1);
    font-size: 15px;
}
.profile-card-user-secondary .profile-info-body {
    gap: 24px;
}
.profile-info-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}
.profile-info-subtitle {
    margin: 0;
    color: var(--p-grey-2);
    font-size: 0.9rem;
}
.profile-info-icon {
    font-size: 1.5rem;
    color: rgba(var(--p-blue-500-rgb), 0.6);
}
.info-card {
    padding: 14px 16px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    transition: all 0.3s ease;
}
.info-card:hover {
    border-color: rgba(var(--p-blue-500-rgb), 0.3);
}
.profile-card-user-secondary .field {
    text-transform: uppercase;
    letter-spacing: 0.4px;
    font-size: 0.85rem;
}
.profile-card-user-secondary .value {
    font-size: 1.1rem;
}
.role-label {
    background: rgba(var(--p-blue-500-rgb), 0.1);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.25);
    padding: 4px 8px;
    border-radius: 999px;
    gap: 8px;
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
.profile-role {
    margin-top: 8px;
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
.external-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}
.external-form-grid .full-width {
    grid-column: 1 / -1;
}
.external-empty-page {
    color: var(--p-grey-2);
    padding: 0.5rem 0;
}
.external-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    color: var(--p-text-color);
}
.external-info-grid {
    border: 1px solid var(--p-grey-4);
    border-radius: 8px;
    overflow: hidden;
}
.external-info-row {
    display: grid;
    grid-template-columns: 260px 1fr;
    border-bottom: 1px solid var(--p-grey-4);
}
.external-info-row:last-child {
    border-bottom: none;
}
.external-key {
    background: var(--p-grey-6);
    padding: 0.6rem 0.75rem;
    font-weight: 600;
    word-break: break-word;
}
.external-value {
    padding: 0.6rem 0.75rem;
    word-break: break-word;
}
.external-raw {
    background: var(--p-grey-6);
    border: 1px solid var(--p-grey-4);
    border-radius: 8px;
    padding: 0.75rem;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
}
.external-edit-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 420px;
    overflow-y: auto;
    padding-right: 4px;
}
.external-edit-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    align-items: center;
}
.external-add-row {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 0.5rem;
    align-items: center;
}
.external-edit-label {
    font-weight: 600;
    color: var(--p-text-color);
    word-break: break-word;
}
</style>
