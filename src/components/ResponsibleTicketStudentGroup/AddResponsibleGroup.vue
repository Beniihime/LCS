<template>
    <div>
        <Button icon="pi pi-plus" @click="showAddDialog = true" />

        <Dialog 
            v-model:visible="showAddDialog" 
            modal 
            header="Новая связь группы и ответственного" 
            :style="{ 'width' : '30rem' }"
            @show="loadInitialData"
        >
            <form @submit.prevent="submitGroup" class="d-flex flex-column gap-3">
                <!-- Выбор года -->
                <div>
                    <label for="yearSelect" class="block mb-2">Учебный год</label>
                    <Dropdown
                        v-model="selectedYear"
                        :options="yearOptions"
                        optionLabel="label"
                        optionValue="label"
                        placeholder="Выберите год"
                        class="w-100"
                        @change="onYearChange"
                        :disabled="loadingGroups"
                    />
                </div>

                <!-- Autocomplete для групп -->
                <div>
                    <label for="groupSelect" class="block mb-2">Группа</label>
                    <AutoComplete
                        v-model="selectedGroup"
                        :suggestions="filteredGroups"
                        optionLabel="label"
                        field="label"
                        placeholder="Начните вводить название группы..."
                        @complete="searchGroups"
                        class="w-100"
                        :disabled="!selectedYear || loadingGroups"
                        :loading="loadingGroups"
                    />
                    
                    <small v-if="!selectedGroup" class="text-danger block mt-1">
                        Выберите группу
                    </small>
                </div>

                <!-- Autocomplete для пользователя -->
                <div>
                    <label for="userSelect" class="block mb-2">Ответственный пользователь</label>
                    <AutoComplete
                        v-model="selectedUser"
                        :suggestions="filteredUsers"
                        optionLabel="fullName"
                        field="fullName"
                        placeholder="Начните вводить ФИО..."
                        @complete="searchUsers"
                        class="w-100"
                        :disabled="loadingUsers"
                    />
                    
                    <small v-if="!selectedUser" class="text-danger block mt-1">
                        Выберите ответственного пользователя
                    </small>
                </div>
                
                <div class="d-flex justify-content-end gap-2 mt-3">
                    <Button 
                        label="Отмена" 
                        severity="secondary" 
                        outlined 
                        @click="closeDialog" 
                    />
                    <Button 
                        label="Сохранить" 
                        type="submit" 
                        severity="success" 
                        :disabled="!selectedGroup || !selectedUser"
                        :loading="submitting"
                    />
                </div>
            </form>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import axiosInstance from '@/utils/axios';

const showAddDialog = ref(false);
const emit = defineEmits(['added']);

const newGroup = ref({
    groupName: '',
    userId: ''
});

// Годы
const now = new Date();
const currentCalendarYear = now.getFullYear();

const currentStudyYear = now.getMonth() >= 8 
    ? currentCalendarYear 
    : currentCalendarYear - 1;

const selectedYear = ref(`${currentStudyYear}-${currentStudyYear + 1}`);

const yearOptions = computed(() => {
    const years = [];
    for (let i = -3; i <= 2; i++) {
        const start = currentStudyYear + i;
        years.push({
            label: `${start}-${start + 1}`,
            value: `${start}-${start + 1}`
        });
    }
    return years;
});

// Группы
const selectedGroup = ref(null);
const allGroups = ref([]);
const filteredGroups = ref([]);
const loadingGroups = ref(false);

// Пользователи
const selectedUser = ref(null);
const allUsers = ref([]);
const filteredUsers = ref([]);
const loadingUsers = ref(false);
const submitting = ref(false);

// Загрузка начальных данных
const loadInitialData = () => {
    loadGroups();
    loadUsers();
};

// Загрузка групп для выбранного года
const loadGroups = async () => {
    if (!selectedYear.value) {
        filteredGroups.value = [];
        return;
    }

    loadingGroups.value = true;
    try {
        const response = await axiosInstance.get('https://umu.sibadi.org/api/raspGrouplist', {
            params: { year: selectedYear.value }
        });
        
        allGroups.value = response.data.data.map(group => {
            if (typeof group === 'string') {
                return {
                    label: group,
                    value: group,
                    code: extractGroupCode(group)
                };
            } else {
                return {
                    label: group.name || group.title || group.groupName || JSON.stringify(group),
                    value: group.id || group.code || group.name,
                    code: group.code || extractGroupCode(group.name)
                };
            }
        });
        
        filteredGroups.value = [...allGroups.value];
        selectedGroup.value = null;
    } catch (error) {
        console.debug("Ошибка при загрузке групп: ", error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'Ошибка', 
                detail: 'Не удалось загрузить список групп',
            }
        }));
    } finally {
        loadingGroups.value = false;
    }
};

// Функция для извлечения кода группы из названия
const extractGroupCode = (groupName) => {
    if (!groupName) return '';
    const match = groupName.match(/([А-Яа-яA-Za-z]+)[-\s]*(\d+)[-\s]*(\d+)?/);
    if (match) {
        return match[0];
    }
    return '';
};

// Поиск групп
const searchGroups = (event) => {
    const query = event.query || '';
    
    if (!query.trim()) {
        filteredGroups.value = allGroups.value;
        return;
    }
    
    filteredGroups.value = allGroups.value.filter(group => 
        group.label.toLowerCase().includes(query.toLowerCase()) ||
        (group.code && group.code.toLowerCase().includes(query.toLowerCase()))
    );
};

// Обработчик изменения года
const onYearChange = () => {
    selectedGroup.value = null;
    loadGroups();
};

// Загрузка пользователей
const loadUsers = async () => {
    if (allUsers.value.length > 0) return;
    
    loadingUsers.value = true;
    try {
        const payload = {
            page: 1,
            pageSize: 500,
            isBlocked: false
        };

        const response = await axiosInstance.post('/api/users/list', payload);
        
        allUsers.value = response.data.entities.map(user => ({
            id: user.id,
            fullName: `${user.lastName} ${user.firstName} ${user.middleName || ''}`.trim(),
            email: user.email,
            isBlocked: user.isBlocked
        }));
        
        filteredUsers.value = [...allUsers.value];
    } catch (error) {
        console.debug("Ошибка при загрузке пользователей: ", error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'Ошибка', 
                detail: 'Не удалось загрузить список пользователей',
            }
        }));
    } finally {
        loadingUsers.value = false;
    }
};

// Поиск пользователей
const searchUsers = (event) => {
    const query = event.query || '';
    
    if (!query.trim()) {
        filteredUsers.value = allUsers.value;
        return;
    }
    
    filteredUsers.value = allUsers.value.filter(user => 
        user.fullName.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase())
    );
};

// Сброс формы
const resetForm = () => {
    selectedGroup.value = null;
    selectedUser.value = null;
    filteredGroups.value = [];
    submitting.value = false;
};

// Закрытие диалога
const closeDialog = () => {
    showAddDialog.value = false;
    resetForm();
};

// Отслеживаем выбранные значения
watch(selectedGroup, (group) => {
    newGroup.value.groupName = group?.label || '';
});

watch(selectedUser, (user) => {
    newGroup.value.userId = user?.id || '';
});

const submitGroup = async () => {
    if (!selectedGroup.value || !selectedUser.value) {
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'warn', 
                summary: 'Предупреждение', 
                detail: 'Заполните все обязательные поля',
            }
        }));
        return;
    }

    submitting.value = true;
    
    try {
        const payload = { 
            groupName: newGroup.value.groupName,
            userId: newGroup.value.userId
        };
        
        await axiosInstance.post('/api/responsibleticketstudentgroup', payload);
        
        emit('added');
        showAddDialog.value = false;
        
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Группы', 
                detail: 'Связь успешно добавлена',
            }
        }));
    } catch (error) {
        console.debug("Ошибка при сохранении связи: ", error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'Группы', 
                detail: `Ошибка при сохранении связи: ${error.response?.data?.message || error.message}`,
            }
        }));
    } finally {
        submitting.value = false;
        resetForm();
    }   
}
</script>

<style scoped>

</style>