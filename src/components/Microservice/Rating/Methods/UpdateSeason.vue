<template>
    <Dialog v-model:visible="visible" header="Изменение сезона" :modal="true">
      <div class="row-cols-1">
        <label for="title" class="ms-2">Новое название</label>
        <InputText id="title" v-model="title" />
      </div>
      <template #footer>
        <Button label="Отмена" icon="pi pi-times" @click="closeDialog" severity="secondary" outlined />
        <Button label="Сохранить" icon="pi pi-check" @click="editSeason" severity="success" :disabled="!title" />
      </template>
    </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import axiosInstance from '@/utils/axios.js';

const props = defineProps({
    season: Object
});
const visible = ref(false);
const emit = defineEmits(['edited']);

const title = ref('');

watch(() => props.season, (val) => {
    if (val) title.value = val.title;
}, { immediate: true });

const closeDialog = () => {
    title.value = '';
    visible.value = false;
};

const editSeason = async () => {
    try {
        await axiosInstance.put(`/api/rating/seasons/${props.season.id}`, { title: title.value });
        emit('edited');
        closeDialog();
    } catch (err) {
        console.error('Ошибка при редактировании сезона', err);
    }
};
</script>
  