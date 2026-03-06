<template>
    <Dialog v-model:visible="visible" header="Удаление должности" :modal="true">
        <p>Вы уверены, что хотите удалить должность <b>{{ jobPosition?.title }}</b>?</p>
        <template #footer>
            <Button label="Отмена" icon="pi pi-times" severity="secondary" @click="closeDialog" outlined />
            <Button label="Удалить" icon="pi pi-trash" severity="danger" @click="deleteJobPosition" />
        </template>
    </Dialog>
</template>
  
<script setup>
import { ref } from 'vue';
import axiosInstance from '@/utils/axios.js';
  
const props = defineProps({
    jobPosition: Object
});
const emit = defineEmits(['deleted']);
const visible = ref(false);
const closeDialog = () => {
    visible.value = false;
};
  
const deleteJobPosition = async () => {
    try {
        await axiosInstance.delete(`/api/rating/job-positions/${props.jobPosition.id}`);
        emit('deleted');
        closeDialog();
    } catch (err) {
        console.error('Ошибка при удалении должности', err);
    }
};
</script>