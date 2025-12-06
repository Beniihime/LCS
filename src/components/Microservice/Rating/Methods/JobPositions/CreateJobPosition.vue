<template>
    <div class="add-card" @click="openCreateDialog">
        <div class="add-card-content">
            <i class="pi pi-plus-circle add-icon"></i>
            <span class="add-text">Добавить должность</span>
        </div>
    </div>
    <Dialog v-model:visible="showCreateDialog" modal header="Добавить должность" :style="{ width: '400px' }" :draggable="false">
        <div class="p-fluid">
            <div class="field">
                <label for="title" class="field-label">Название должности</label>
                <InputText 
                    id="title" 
                    v-model="jobPosition.title" 
                    placeholder="Введите название должности"
                    class="w-full input-field"
                    autofocus
                />
            </div>
        </div>
        <template #footer>
            <Button 
                label="Отмена" 
                icon="pi pi-times" 
                @click="showCreateDialog = false" 
                outlined 
                severity="secondary" 
                class="min-w-24"
            />
            <Button 
                label="Сохранить" 
                icon="pi pi-check" 
                @click="saveJobPosition" 
                severity="success" 
                class="min-w-24"
                :disabled="!jobPosition.title.trim()"
            />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, defineEmits } from 'vue';
import axiosInstance from "@/utils/axios.js";

const emit = defineEmits(['created']);

const jobPosition = ref({
    title: ''
});

const showCreateDialog = ref(false);

const openCreateDialog = async () => {
    showCreateDialog.value = true;
};

const saveJobPosition = async () => {
    if (!jobPosition.value.title.trim()) return;
    
    try {
        await axiosInstance.post('/api/rating/job-positions', {
            title: jobPosition.value.title.trim()
        });
        showCreateDialog.value = false;
        jobPosition.value.title = '';
        emit('created');
    } catch (error) {
        console.error('Ошибка при создании должности:', error);
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