<template>
    <Dialog v-model:visible="visible" header="Удаление сезона" :modal="true">
      <p>Вы уверены, что хотите удалить сезон <b>{{ season?.title }}</b>?</p>
      <template #footer>
        <Button label="Отмена" icon="pi pi-times" severity="secondary" @click="closeDialog" outlined />
        <Button label="Удалить" icon="pi pi-trash" severity="danger" @click="deleteSeason" />
      </template>
    </Dialog>
</template>
  
<script setup>
import { ref } from 'vue';
import axiosInstance from '@/utils/axios.js';
  
const props = defineProps({
    season: Object
});
const emit = defineEmits(['deleted']);
const visible = ref(false);
const closeDialog = () => {
    visible.value = false;
};
  
const deleteSeason = async () => {
    try {
      await axiosInstance.delete(`/api/rating/seasons/${props.season.id}`);
      emit('deleted');
      closeDialog();
    } catch (err) {
      console.error('Ошибка при удалении сезона', err);
    }
};
</script>
  