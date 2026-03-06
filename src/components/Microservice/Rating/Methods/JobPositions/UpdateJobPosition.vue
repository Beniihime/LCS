<template>
    <Dialog 
        v-model:visible="internalVisible" 
        header="Редактирование должности" 
        :modal="true"
        :style="{ width: '400px' }"
        :draggable="false"
        class="job-position-edit-dialog"
    >
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
            <Button label="Отмена" icon="pi pi-times" @click="closeDialog" severity="secondary" outlined />
            <Button 
                label="Сохранить" 
                icon="pi pi-check" 
                @click="editJobPosition" 
                severity="success" 
                :disabled="!jobPosition.title.trim()"
            />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import axiosInstance from '@/utils/axios.js';

const props = defineProps({
    visible: Boolean,
    jobPosition: Object
});

const emit = defineEmits(['update:visible', 'edited']);

const internalVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const jobPosition = ref({
    title: ''
});

const loadJobPositionData = () => {
    if (props.jobPosition) {
        jobPosition.value = {
            title: props.jobPosition.title || ''
        };
    }
};

watch(
    () => internalVisible.value,
    (newVal) => {
        if (newVal) {
            loadJobPositionData();
        }
    }
);

watch(
    () => props.jobPosition,
    () => {
        if (internalVisible.value) {
            loadJobPositionData();
        }
    },
    { deep: true }
);

const closeDialog = () => {
    internalVisible.value = false;
};

const editJobPosition = async () => {
    if (!jobPosition.value.title.trim()) return;
    
    try {
        await axiosInstance.put(`/api/rating/job-positions/${props.jobPosition.id}`, {
            title: jobPosition.value.title.trim()
        });
        emit("edited");
        closeDialog();
    } catch (err) {
        console.error("Ошибка при редактировании должности", err);
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