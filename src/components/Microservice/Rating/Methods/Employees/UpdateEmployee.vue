<template>
    <Dialog 
        v-model:visible="internalVisible" 
        header="Редактирование сотрудника" 
        :modal="true"
        :style="{ 'min-width': '500px' }"
        class="employee-edit-dialog"
    >
        <div class="dialog-content">
            <div class="form-grid">
                <div class="field">
                    <label for="lastName" class="field-label">Фамилия</label>
                    <InputText 
                        id="lastName" 
                        v-model="employee.lastName" 
                        placeholder="Введите фамилию"
                        class="w-full input-field"
                        :class="{ 'p-invalid': !employee.lastName }"
                        autofocus
                    />
                </div>
                
                <div class="field">
                    <label for="firstName" class="field-label">Имя</label>
                    <InputText 
                        id="firstName" 
                        v-model="employee.firstName" 
                        placeholder="Введите имя"
                        class="w-full input-field"
                        :class="{ 'p-invalid': !employee.firstName }"
                    />
                </div>
                
                <div class="field">
                    <label for="middleName" class="field-label">Отчество</label>
                    <InputText 
                        id="middleName" 
                        v-model="employee.middleName" 
                        placeholder="Введите отчество"
                        class="w-full input-field"
                    />
                </div>

                <div class="field full-width">
                    <label for="jobPositions" class="field-label">Должности</label>
                    <MultiSelect 
                        id="jobPositions"
                        v-model="employee.jobPositionIds" 
                        :options="jobPositions" 
                        optionLabel="title" 
                        optionValue="id"
                        placeholder="Выберите должности"
                        class="w-full multiselect-field"
                        display="chip"
                        :maxSelectedLabels="3"
                    />
                </div>

                <div class="field">
                    <label for="inn" class="field-label">ИНН</label>
                    <InputMask
                        id="inn" 
                        v-model="employee.inn" 
                        placeholder="Введите ИНН"
                        class="w-full input-field"
                        mask="999999999999"
                    />
                </div>

                <div class="field">
                    <label for="snils" class="field-label">СНИЛС</label>
                    <InputMask 
                        id="snils" 
                        v-model="employee.snils" 
                        placeholder="Введите СНИЛС"
                        class="w-full input-field"
                        mask="999-999-999 99"
                    />
                </div>

                <div class="field">
                    <label for="email" class="field-label">Email</label>
                    <InputText 
                        id="email" 
                        v-model="employee.email" 
                        placeholder="Введите Email"
                        class="w-full"
                        :invalid="emailError !== ''"
                        @blur="validateEmail"
                    />
                </div>

                <div class="field" v-if="isAdmin">
                    <label for="personalAccountUserId" class="field-label">ID пользователя ЛКС</label>
                    <InputText 
                        id="personalAccountUserId"
                        v-model="employee.personalAccountUserId"
                        placeholder="Введите ID пользователя ЛКС"
                        class="w-full input-field"
                    />
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Отмена" icon="pi pi-times" @click="closeDialog" severity="secondary" outlined />
            <Button 
                label="Сохранить" 
                icon="pi pi-check" 
                @click="editEmployee" 
                severity="success" 
                :disabled="!isFormValid"
                :loading="loading"
            />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import axiosInstance from '@/utils/axios.js';

const props = defineProps({
    visible: Boolean,
    employee: Object
});

const emit = defineEmits(['update:visible', 'edited']);

const internalVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const loading = ref(false);
const emailError = ref('');
const isAdmin = ref(false);

const employee = ref({
    firstName: '',
    lastName: '',
    middleName: '',
    jobPositionIds: [],
    responsibleIndicatorsIds: [],
    inn: '',
    snils: '',
    email: '',
    personalAccountUserId: ''
});

const jobPositions = ref([]);

const isFormValid = computed(() => {
    return employee.value.firstName.trim() && employee.value.lastName.trim();
});

const validateEmail = () => {
    const email = employee.value.email.trim();
    
    if (!email) {
        emailError.value = '';
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailError.value = 'Введите корректный email адрес';
    } else {
        emailError.value = '';
    }
};

const checkAdmin = async () => {
    try {
        const response = await axiosInstance.get('/api/users/me/info');
        const currentUserRoleId = response.data.roles[0]?.id;
        isAdmin.value = currentUserRoleId === 1;
    } catch (error) {
        console.error('Ошибка при получении информации о пользователе: ', error);
        isAdmin.value = false;
    }
}

const fetchJobPositions = async () => {
    try {
        const { data } = await axiosInstance.get('/api/rating/job-positions');
        jobPositions.value = data;
    } catch (error) {
        console.error('Ошибка при загрузке должностей:', error);
    }
};

const loadEmployeeData = async () => {
    if (props.employee) {
        await fetchJobPositions();
        employee.value = {
            firstName: props.employee.firstName || '',
            lastName: props.employee.lastName || '',
            middleName: props.employee.middleName || '',
            jobPositionIds: props.employee.jobPositions?.map(jp => jp.id) || [],
            responsibleIndicatorsIds: props.employee.responsibleIndicatorsIds,
            inn: props.employee.inn || '',
            snils: props.employee.snils || '',
            email: props.employee.email || '',
            personalAccountUserId: props.employee.personalAccountUserId || ''
        };
        emailError.value = '';
    }
};

watch(
    () => internalVisible.value,
    (newVal) => {
        if (newVal) {
            loadEmployeeData();
        }
    }
);

watch(
    () => props.employee,
    () => {
        if (internalVisible.value) {
            loadEmployeeData();
        }
    },
    { deep: true }
);

const closeDialog = () => {
    internalVisible.value = false;
};

const editEmployee = async () => {
    if (!isFormValid.value) return;
    
    loading.value = true;
    try {
        const cleanedData = {
            firstName: employee.value.firstName.trim(),
            lastName: employee.value.lastName.trim(),
            middleName: employee.value.middleName.trim(),
            jobPositionIds: employee.value.jobPositionIds,
            responsibleIndicatorsIds: employee.value.responsibleIndicatorsIds,
            inn: employee.value.inn,
            snils: employee.value.snils,
            email: employee.value.email.trim()
        };
        if (isAdmin.value && employee.value.personalAccountUserId) {
            cleanedData.pasUserId = employee.value.personalAccountUserId.trim();
        }

        await axiosInstance.put(`/api/rating/employees/${props.employee.id}`, cleanedData);
        emit("edited");
        closeDialog();
    } catch (err) {
        console.error("Ошибка при редактировании сотрудника", err);
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    await checkAdmin();
});
</script>

<style scoped>
.dialog-content {
    padding: 1rem 0;
}

.form-grid {
    display: grid;
    gap: 1rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.full-width {
    grid-column: 1 / -1;
}

.field-label {
    color: var(--p-grey-1);
    font-size: 0.9rem;
}

.input-field, .multiselect-field {
    border-radius: 8px;
    transition: all 0.2s ease;
}
</style>