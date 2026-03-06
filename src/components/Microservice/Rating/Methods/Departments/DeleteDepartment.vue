<template>
    <Dialog v-model:visible="visible" header="Удаление отдела" :modal="true">
        <p>Вы уверены, что хотите удалить отдел <b>{{ department?.name }}</b>?</p>
        <template #footer>
            <Button label="Отмена" icon="pi pi-times" severity="secondary" @click="closeDialog" outlined />
            <Button label="Удалить" icon="pi pi-trash" severity="danger" @click="deleteDepartment" />
        </template>
    </Dialog>
</template>
  
<script setup>
import { ref } from 'vue';
import axiosInstance from '@/utils/axios.js';
  
const props = defineProps({
    department: Object
});
const emit = defineEmits(['deleted']);
const visible = ref(false);
const closeDialog = () => {
    visible.value = false;
};
  
const deleteDepartment = async () => {
    try {
        await axiosInstance.delete(`/api/rating/departments/${props.department.id}`);
        emit('deleted');
        closeDialog();
    } catch (err) {
        console.error('Ошибка при удалении отдела', err);
    }
};
</script>

