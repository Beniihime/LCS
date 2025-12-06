<template>
    <Dialog 
        v-model:visible="internalVisible" 
        header="Редактирование отдела" 
        :modal="true"
        :style="{ width: '400px' }"
        :draggable="false"
        class="department-edit-dialog"
    >
        <div class="p-fluid">
            <div class="field">
                <label for="name" class="field-label">Название отдела</label>
                <InputText 
                    id="name" 
                    v-model="department.name" 
                    placeholder="Введите название отдела"
                    class="w-full input-field"
                    autofocus
                />
            </div>
            <div class="field">
                <label for="number" class="field-label">Номер отдела</label>
                <InputText 
                    id="number" 
                    v-model="department.number" 
                    placeholder="Введите номер отдела"
                    class="w-full input-field"
                />
            </div>
        </div>

        <template #footer>
            <Button label="Отмена" icon="pi pi-times" @click="closeDialog" severity="secondary" outlined />
            <Button 
                label="Сохранить" 
                icon="pi pi-check" 
                @click="editDepartment" 
                severity="success" 
                :disabled="!department.name.trim()"
            />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import axiosInstance from '@/utils/axios.js';

const props = defineProps({
    visible: Boolean,
    department: Object
});

const emit = defineEmits(['update:visible', 'edited']);

const internalVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const department = ref({
    name: '',
    number: ''
});

const loadDepartmentData = () => {
    if (props.department) {
        department.value = {
            name: props.department.name || '',
            number: props.department.number || ''
        };
    }
};

watch(
    () => internalVisible.value,
    (newVal) => {
        if (newVal) {
            loadDepartmentData();
        }
    }
);

watch(
    () => props.department,
    () => {
        if (internalVisible.value) {
            loadDepartmentData();
        }
    },
    { deep: true }
);

const closeDialog = () => {
    internalVisible.value = false;
};

const editDepartment = async () => {
    if (!department.value.name.trim()) return;
    
    try {
        await axiosInstance.put(`/api/rating/departments/${props.department.id}`, {
            name: department.value.name.trim(),
            number: department.value.number.trim() || null
        });
        emit("edited");
        closeDialog();
    } catch (err) {
        console.error("Ошибка при редактировании отдела", err);
    }
};
</script>

<style scoped>
.field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.field-label {
    color: var(--p-grey-1);
    font-size: 0.9rem;
}

.input-field {
    border-radius: 8px;
    transition: all 0.2s ease;
}
</style>

