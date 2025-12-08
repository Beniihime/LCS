<template>
    <Dialog v-model:visible="internalVisible" modal header="Добавить отдел" :style="{ width: '400px' }" :draggable="false">
        <div class="form-grid">
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
                @click="saveDepartment" 
                severity="success" 
                class="min-w-24"
                :disabled="!department.name.trim()"
            />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import axiosInstance from "@/utils/axios.js";

const props = defineProps({
    visible: Boolean
});

const emit = defineEmits(['update:visible', 'created']);

const internalVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const department = ref({
    name: '',
    number: ''
});

const openCreateDialog = async () => {
    internalVisible.value = true;
};

const closeDialog = () => {
    internalVisible.value = false;
    department.value.name = '';
    department.value.number = '';
};

const saveDepartment = async () => {
    if (!department.value.name.trim()) return;
    
    try {
        await axiosInstance.post('/api/rating/departments', {
            name: department.value.name.trim(),
            number: department.value.number.trim() || null
        });
        closeDialog();
        emit('created');
    } catch (error) {
        console.error('Ошибка при создании отдела:', error);
    }
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
.field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-grid {
    display: grid;
    gap: 1.5rem;
}

.full-width {
    grid-column: 1 / -1;
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

