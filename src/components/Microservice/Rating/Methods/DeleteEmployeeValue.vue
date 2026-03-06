<template>
    <Button 
        icon="pi pi-trash" 
        outlined 
        rounded 
        severity="danger" 
        @click="showDeleteDialog" 
        v-tooltip.top="'Удалить оценку'"
    />
    <Dialog v-model:visible="deleteDialogVisible" header="Удаление оценки" modal>
        <p>Вы уверены, что хотите удалить оценку для <b>{{ value?.employeeName }}</b>?</p>
        <template #footer>
            <Button label="Отмена" icon="pi pi-times" severity="secondary" @click="closeDialog" outlined />
            <Button label="Удалить" icon="pi pi-trash" severity="danger" @click="deleteEmpValue" :loading="deleting" />
        </template>
    </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import axiosInstance from '@/utils/axios.js';

const props = defineProps({
    value: Object
});
const emit = defineEmits(['deleted']);

const deleteDialogVisible = ref(false);
const deleting = ref(false);

const showDeleteDialog = () => {
    deleteDialogVisible.value = true;
};

const closeDialog = () => {
    deleteDialogVisible.value = false;
};

const deleteEmpValue = async () => {
    if (!props.value?.id) return;

    deleting.value = true;
    try {
        await axiosInstance.delete(`/api/rating/employee-indicators-value/${props.value.id}`);
        emit('deleted');
        deleteDialogVisible.value = false;
    } catch (err) {
        console.error('Ошибка при удалении оценки', err);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'Ошибка', 
                detail: 'Не удалось удалить оценку',
            }
        }));
    } finally {
        deleting.value = false;
    }
};
</script>
