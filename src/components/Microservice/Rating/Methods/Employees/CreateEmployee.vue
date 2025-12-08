<template>
    <Dialog v-model:visible="showCreateDialog" modal header="Добавить сотрудника" :style="{ width: '500px' }">
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
            </div>
        </div>
        <template #footer>
            <Button 
                label="Отмена" 
                icon="pi pi-times" 
                @click="closeDialog" 
                outlined 
                severity="secondary" 
                class="min-w-24"
            />
            <Button 
                label="Сохранить" 
                icon="pi pi-check" 
                @click="saveEmployee" 
                severity="success" 
                class="min-w-24"
                :disabled="!isFormValid"
                :loading="loading"
            />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, defineEmits, computed } from 'vue';
import axiosInstance from "@/utils/axios.js";

const emit = defineEmits(['created']);

const showCreateDialog = ref(false);
const loading = ref(false);
const emailError = ref('');

const employee = ref({
    firstName: '',
    lastName: '',
    middleName: '',
    jobPositionIds: [],
    responsibleIndicatorsIds: [],
    inn: '',
    snils: '',
    email: ''
});

const jobPositions = ref([]);

const isFormValid = computed(() => {
    return employee.value.firstName.trim() && employee.value.lastName.trim();
});

// Валидация email
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
    console.log(emailError.value);
};

const fetchJobPositions = async () => {
    try {
        const { data } = await axiosInstance.get('/api/rating/job-positions');
        jobPositions.value = data;
    } catch (error) {
        console.error('Ошибка при загрузке должностей:', error);
    }
};

const openCreateDialog = async () => {
    await fetchJobPositions();
    showCreateDialog.value = true;
};

const closeDialog = () => {
    showCreateDialog.value = false;
    resetForm();
};

const saveEmployee = async () => {
    if (!isFormValid.value) return;
    
    loading.value = true;
    try {
        const cleanedData = {
            firstName: employee.value.firstName,
            lastName: employee.value.lastName,
            middleName: employee.value.middleName,
            jobPositionIds: employee.value.jobPositionIds,
            responsibleIndicatorsIds: employee.value.responsibleIndicatorsIds,
            inn: employee.value.inn,
            snils: employee.value.snils,
            email: employee.value.email
        };
        await axiosInstance.post('/api/rating/employees', cleanedData);
        showCreateDialog.value = false;
        resetForm();
        emit('created');
    } catch (error) {
        console.error('Ошибка при создании сотрудника:', error);
    } finally {
        loading.value = false;
    }
};

const resetForm = () => {
    employee.value = {
        firstName: '',
        lastName: '',
        middleName: '',
        jobPositionIds: [],
        responsibleIndicatorsIds: [],
        inn: '',
        snils: '',
        email: ''
    };
    emailError.value = '';
};


</script>

<style scoped>
.add-card {
    padding: 30px 20px;
    display: flex;
    cursor: pointer;
    background-color: var(--p-grey-8);
    border: 2px dashed var(--p-grey-5);
    border-radius: 18px;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
    height: 100%;
    position: relative;
    overflow: hidden;
}

.add-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(var(--p-color-icon-menu), 0.1), transparent);
    transition: left 0.5s ease;
}

.add-card:hover::before {
    left: 100%;
}

.add-card:hover {
    border-color: rgb(var(--p-color-icon-menu));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.add-card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
}

.add-icon {
    font-size: 2rem;
    color: var(--p-grey-4);
    transition: all 0.3s ease;
}

.add-text {
    font-size: 1rem;
    font-weight: 500;
    color: var(--p-grey-3);
    transition: all 0.3s ease;
}

.add-card:hover .add-icon {
    color: rgb(var(--p-color-icon-menu));
}

.add-card:hover .add-text {
    color: rgb(var(--p-color-icon-menu));
}

.dialog-content {
    padding: 1rem 0;
}

.form-grid {
    display: grid;
    gap: 1.5rem;
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

.input-field:hover, .multiselect-field:hover {
    border-color: var(--p-primary-color);
}

.input-field:focus, .multiselect-field:focus {
    box-shadow: 0 0 0 2px rgba(var(--p-primary-color), 0.1);
}

.dialog-footer {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid var(--p-gray-200);
}

.cancel-btn, .save-btn {
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s ease;
}

.cancel-btn:hover {
    transform: translateY(-1px);
}

.save-btn:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--p-success-color), 0.3);
}

</style>