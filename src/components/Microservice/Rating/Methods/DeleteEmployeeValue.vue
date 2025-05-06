<template>
    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="showDeleteDialog(props.value)" />
    <Dialog v-model:visible="deleteDialogVisible" header="Удаление оценки" :modal="true">
      <p>Вы уверены, что хотите удалить оценку для <b>{{ value?.employeeId }}</b>?</p>
      <template #footer>
        <Button label="Отмена" icon="pi pi-times" severity="secondary" @click="closeDialog" outlined />
        <Button label="Удалить" icon="pi pi-trash" severity="danger" @click="deleteEmpValue" />
      </template>
    </Dialog>
</template>
  
<script setup>
import { ref, onMounted } from 'vue';
import axiosInstance from '@/utils/axios.js';
  
const props = defineProps({
    value: Object
});
const emit = defineEmits(['deleted']);
const deleteDialogVisible = ref(false);
const itemToDelete = ref(null);

const showDeleteDialog = (item) => {
    itemToDelete.value = item;
    deleteDialogVisible.value = true;
};
  
const deleteEmpValue = async () => {
    if (itemToDelete.value) {
        try {
            await axiosInstance.delete(`/api/rating/employee-indicators-value/${props.value.id}`);
            emit('deleted');
            deleteDialogVisible.value = false;
        } catch (err) {
            console.error('Ошибка при удалении оценки', err);
        }
    }
};
</script>
  