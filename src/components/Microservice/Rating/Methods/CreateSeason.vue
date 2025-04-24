<template>
    <main>
        <div class="add-season" v-tooltip.bottom="'Добавить сезон'" @click="openCreateDialog">
            <i class="pi pi-plus-circle my-5"></i>
        </div>
        <Dialog v-model:visible="showCreateDialog" header="Создание сезона" :modal="true">
            <div class="row-cols-1">
                <label for="title" class="ms-2">Название сезона</label>
                <InputText id="title" v-model="title" placeholder="Например, 2025/1" />
            </div>
            <template #footer>
                <Button label="Отмена" icon="pi pi-times" severity="secondary" @click="closeDialog" outlined />
                <Button label="Создать" icon="pi pi-check" severity="success" @click="createSeason" :disbaled="!title" />
            </template>
        </Dialog>
    </main>
</template>

<script setup>
import { ref } from 'vue';
import axiosInstance from "@/utils/axios";

const emit = defineEmits(['created']);

const showCreateDialog = ref(false);
const title = ref('');

const openCreateDialog = () => {
  showCreateDialog.value = true;
};

const closeDialog = () => {
    title.value = '';
    showCreateDialog.value = false;
};

const createSeason = async () => {
    try {
        await axiosInstance.post('/api/rating/seasons', { title: title.value });
        emit('created');
        closeDialog();
    } catch(error) {
        console.error('Ошибка при создании сезона: ', error);
    }
}
</script>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}
.add-season {
    padding: 30px;
    display: flex;
    cursor: pointer;

    background-color: var(--p-grey-7);
    border: 2px solid var(--p-grey-5);
    border-radius: 18px;

    justify-content: center;
    align-items: center;
    place-items: center;
    transition: all 0.5s;

    .pi {
        font-size: 32px;
        color: var(--p-grey-2);
        transition: all 0.5s;
    }
}
.add-season:hover {
    background-color: var(--p-blue-500-low-op);
    border-color: var(--p-color-icon-menu);
    .pi {
        color: var(--p-color-icon-menu);
    }
}
</style>