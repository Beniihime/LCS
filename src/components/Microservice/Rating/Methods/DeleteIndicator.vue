<template>
    <Button icon="pi pi-minus" outlined rounded severity="danger" @click="showDeleteDialog(props.item)" />
    <Dialog v-model:visible="deleteDialogVisible" modal header="Удалить показатель"
            :style="{ width: '30rem' }">
        <span>Вы уверены, что хотите удалить этот показатель ?<Tag>{{ props.item.indicator }}</Tag></span>
        <template #footer>
            <Button label="Нет" icon="pi pi-times" severity="secondary" outlined @click="deleteDialogVisible = false" />
            <Button label="Да" icon="pi pi-trash" severity="danger" @click="confirmDelete" />
        </template>
    </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import axiosInstance from "@/utils/axios.js";

const props = defineProps({
    item: Object,
    seasonId: String
})

const emit = defineEmits(['deleted']);

const deleteDialogVisible = ref(false);
const itemToDelete = ref(null);

const showDeleteDialog = (item) => {
    itemToDelete.value = item;
    deleteDialogVisible.value = true;
};

const confirmDelete = async () => {
    if (itemToDelete.value) {
        try {
            await axiosInstance.delete(`/api/rating/seasons/${props.seasonId}/indicators/${props.item.id}`);
            emit('deleted');
            deleteDialogVisible.value = false;
            window.dispatchEvent(new CustomEvent('toast', {
                detail: { 
                    severity: 'success', 
                    summary: 'Рейтинг', 
                    detail: `Показатель для сезона успешно удален`,
                }
            }));
        } catch(error) {
            console.error('Ошибка при удалении: ', error);
            window.dispatchEvent(new CustomEvent('toast', {
                detail: { 
                    severity: 'error', 
                    summary: 'Рейтинг', 
                    detail: `Ошибка при удалении показателя для сезона `,
                }
            }));
        }
    }
}
</script>

<style scoped>

</style>