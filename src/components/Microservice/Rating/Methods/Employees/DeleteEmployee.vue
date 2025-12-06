<template>
    <Dialog v-model:visible="visible" header="Удаление сотрудника" :modal="true">
        <p>Вы уверены, что хотите удалить сотрудника <b>{{ employee?.lastName }} {{ employee?.firstName }} {{ employee?.middleName }}</b>?</p>
        <template #footer>
            <Button label="Отмена" icon="pi pi-times" severity="secondary" @click="closeDialog" outlined />
            <Button label="Удалить" icon="pi pi-trash" severity="danger" @click="deleteEmployee" />
        </template>
    </Dialog>
</template>
  
<script setup>
import { ref } from 'vue';
import axiosInstance from '@/utils/axios.js';
  
const props = defineProps({
    employee: Object
});
const emit = defineEmits(['deleted']);
const visible = ref(false);
const closeDialog = () => {
    visible.value = false;
};
  
const deleteEmployee = async () => {
    try {
        await axiosInstance.delete(`/api/rating/employees/${props.employee.id}`);
        emit('deleted');
        closeDialog();
    } catch (err) {
        console.error('Ошибка при удалении сотрудника', err);
    }
};
</script>