<template>
    <div class="content">
        <div class="content-wrapper">                
            <WelcomeScreen v-if="isFirstLoadDone" :visible="loading" />
            <DataTable
                lazy
                v-if="isFirstLoadDone"
                :value="customers" 
                paginator
                scrollable
                stripedRows
                :rows="rowsPerPage"
                :rowClass="rowClass"
                @row-click="(event) => navigateToProfile(event.data.id, event.data.roles[0]?.id)"
                :totalRecords="totalRecords"
                @page="onPage"
                :rowsPerPageOptions="[5, 10, 15]"
                filterDisplay="row"
            >
                <template #header>
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="m-0 ps-4">Пользователи</h3>
                        <div class="d-flex gap-2">
                            <MultiSelect :modelValue="selectedColumns" :options="columns" optionLabel="header" @update:modelValue="onToggle"
                                display="chip" placeholder="Выберите поля" />
                            <CreateUser v-if="hasPermission('User', 'Create')"/>
                        </div>
                    </div>
                    
                </template>

                <template #paginatorstart>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>Всего пользователей: {{ totalRecords }}</div>
                    </div>
                </template>

                <template #paginatorend>
                    <Button disabled type="button" icon="pi pi-download" text />
                </template>

                <template #empty>Не найдено.</template>
                <template #loading>Данные загружаются. Подождите.</template>

                <Column header="OTP" :showFilterMenu="false" :exportable="false">
                    <template #body="{ data }">
                        <GetOtpButton 
                            :userId="data.id"
                            :buttonClass="'p-button-sm me-2'"
                            :showLabel="false"
                        />
                    </template>
                </Column>

                <Column 
                    v-for="col in ordinaryColumns"
                    :field="col.field"
                    :key="col.field"
                    :header="col.header"
                    :showFilterMenu="false"
                >
                    <template #filter>
                        <InputText 
                            :value="filters[col.field]" 
                            :placeholder="col.placeholder" 
                            @input="event => onFilter(col.field, event.target.value)"
                            autocomplete="off"
                            class="w-75"
                        />
                    </template>
                </Column>
                
                <Column field="roleIds" header="Роли" :showFilterMenu="false" v-if="selectedColumnFields.includes('roleIds')">
                    <template #body="{ data }">
                        <div class="role-label-container">
                            <Chip v-if="data.roles.length > 0" class="role-label">
                                <span class="roleType" :class="getRoleTypeClass(data.roles[0])">
                                    {{ data.roles[0].type.charAt(0) }}
                                </span>
                                <span>{{ data.roles[0].title }}</span>
                            </Chip>
                            
                            <Button v-if="data.roles.length > 1" rounded text class="p-2 ms-2" icon="pi pi-ellipsis-h" @click.stop="(event) => togglePopover($refs['popover' + data.id], event)" />

                            <Popover :ref="'popover' + data.id">
                                <div class="roles-container">
                                    <div v-for="(role, index) in data.roles.slice(1)" :key="role.id" class="role-list-item">
                                        <Chip class="role-label">
                                            <span class="roleType" :class="getRoleTypeClass(role)">
                                                {{ role.type.charAt(0) }}
                                            </span>
                                            <span>{{ role.title }}</span>
                                        </Chip>
                                    </div>
                                </div>
                                
                            </Popover>
                        </div>
                    </template>
                    <template #filter>
                        <MultiSelect 
                            v-model="filters.roleIds"
                            :options="roles"
                            optionLabel="title"
                            optionValue="id"
                            :maxSelectedLabels="1"
                            placeholder="Выберите роли"
                            @change="onFilter"
                        />
                    </template>
                </Column>
                <Column field="isBlocked" header="Статус" :showFilterMenu="false" v-if="selectedColumnFields.includes('isBlocked')">
                    <template #body="{ data }">
                        <Tag 
                            :severity="data.isBlocked ? 'danger' : 'success'" 
                            :value="data.isBlocked ? 'Заблокирован' : 'Активен'" 
                            :icon="data.isBlocked ? 'pi pi-times' : 'pi pi-check'"
                        />
                    </template>
                    <template #filter>
                        <Select 
                            v-model="filters.isBlocked" 
                            :options="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Выберите статус" 
                            @change="onFilter" 
                        />
                    </template>
                </Column>
                
            </DataTable>
            
            <Skeleton v-else-if="!isFirstLoadDone && loading" width="100%" height="100%" class="skeleton-table" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import axiosInstance from '@/utils/axios.js';
import { useRouter } from 'vue-router';
import { debounce } from 'lodash';

import CreateUser from '@/components/Users/CreateUser.vue';
import GetOtpButton from '@/components/Users/GetOtpButton.vue';
import WelcomeScreen from '@/components/Utils/WelcomeScreen.vue';
import { usePermissionStore } from '@/stores/permissions.js';

const router = useRouter();

const customers = ref([]);
const totalRecords = ref(0);
const loading = ref(true);
const isFirstLoadDone = ref(false);

const roles = ref([]);
const userPriority = ref(null);

const permissionStore = usePermissionStore();
const hasPermission = (type, action) => permissionStore.hasPermission(type, action);

const filters = ref({
    firstName: null,
    lastName: null,
    middleName: null,
    email: null,
    roleIds: [],
    isBlocked: null,
});

const columns = ref([
    { field: 'lastName', header:'Фамилия', placeholder: 'Поиск по фамилии' },
    { field: 'firstName', header: 'Имя', placeholder: 'Поиск по имени' },
    { field: 'middleName', header: 'Отчество', placeholder: 'Поиск по отчеству' },
    { field: 'email', header: 'E-mail', placeholder: 'Поиск по E-mail' },
    { field: 'roleIds', header: 'Роли', placeholder: 'Выберите роли' },
    { field: 'isBlocked', header: 'Статус', placeholder: 'Выберите статус' }
]);
const defaultColumns = ['lastName', 'firstName', 'middleName', 'roleIds'];

const selectedColumnFields = ref(defaultColumns);
const selectedColumns = computed(() => 
    columns.value.filter(c => selectedColumnFields.value.includes(c.field))
);
const onToggle = (val) => {
    selectedColumnFields.value = val.map(col => col.field);
};
const ordinaryColumns = computed(() => 
    columns.value.filter(c => selectedColumnFields.value.includes(c.field) && !['roleIds','isBlocked'].includes(c.field))
);

const currentPage = ref(1);
const rowsPerPage = ref(10);

const onFilter = (field, value) => {
    filters.value[field] = value;
    currentPage.value = 1;
    debouncedFetchCustomers()
}

const debouncedFetchCustomers = debounce(async () => {
    await fetchCustomers()
}, 500)

const statusOptions = [
    { label: "Все", value: null },
    { label: 'Активен', value: false },
    { label: 'Заблокирован', value: true },
];

const togglePopover = (popoverRef, event) => {
    nextTick(() => {
        if (popoverRef) {
            popoverRef.toggle(event);
        } else {
            console.debug("Popover reference is null");
        }
    });
};

const rowClass = (data) => {
    return [{ 'pointer': !data.removed }];
};

const navigateToProfile = (userId, roleId) => {
    router.push({ 
        name: 'Profile', 
        query: { id: userId, r: roleId }
    });
};

// Классы для отображения ролей в зависимости от их типа
const getRoleTypeClass = (role) => {
    return role.type === 'Custom' ? 'custom-role-type' : 'default-role-type';
}

const onPage = async (event) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;
    await fetchCustomers();
}

const fetchCustomers = async () => {
    try {
        loading.value = true;
        const payload = {
            page: currentPage.value,
            pageSize: rowsPerPage.value,
            ...filters.value,
            roleIds: filters.value.roleIds?.length ? filters.value.roleIds : null,
        };

        const { data } = await axiosInstance.post('/api/users/list', payload)
        customers.value = data.entities;
        totalRecords.value = data.countEntities;      
    } catch (error) {
        console.debug('Ошибка при получении пользователей: ', error);
    } finally {
        loading.value = false;
        isFirstLoadDone.value = true;
    }
};


onMounted(async () => {
    await fetchCustomers();
    await fetchRoles();
});

const fetchRoles = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles');
        const allRoles = response.data;            
        // Фильтруем роли по приоритету
        roles.value = allRoles
            .filter(role => role.priority > userPriority.value)
    } catch (error) {
        console.debug('Ошибка при получении ролей: ', error);
    }
};

</script>

<style scoped>

h3 {
    color: var(--p-text-color);
    transition: all 0.5s;
}
.content {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    box-sizing: border-box;
}
.content-wrapper {
    position: relative;
    flex-grow: 1;
    align-content: center;
    padding: 10px;
    height: 100%;
    color: var(--p-text-color);
    transition: all 0.5s;
}
.search {
    border-radius: 12px;
    font-size: 18px;
    transition: all 0.5s;
}
.text-nowrap {
    white-space: nowrap;
}
.roles-container {
    display: flex;
    flex-direction: column;
}
.role-list-item {
    margin-bottom: 8px; /* Отступ между элементами */
}

.role-label {
    font-size: 1rem;
    font-weight: 500;
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
.skeleton-table {
    border-radius: 12px;
    background-color: var(--p-grey-3);
}

</style>