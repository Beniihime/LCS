<template>
    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="showDeleteDialog(props.item)" />
    <Dialog v-model:visible="deleteDialogVisible" modal header="Подтверждение удаления"
            :style="{ width: '30rem' }">
        <span>Вы уверены, что хотите удалить этот показатель ?<Tag>{{ props.item.indicator }}</Tag></span>
        <template #footer>
            <Button label="Нет" icon="pi pi-times" severity="secondary" outlined @click="deleteDialogVisible = false" />
            <Button label="Да" icon="pi pi-check" severity="contrast" @click="confirmDelete" />
        </template>
    </Dialog>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    item: Object,
})

const deleteDialogVisible = ref(false);
const itemToDelete = ref(null);

const showDeleteDialog = (item) => {
    itemToDelete.value = item;
    deleteDialogVisible.value = true;
};

const confirmDelete = () => {
    if (itemToDelete.value) {
        
    }
}
</script>

<style scoped>

</style>