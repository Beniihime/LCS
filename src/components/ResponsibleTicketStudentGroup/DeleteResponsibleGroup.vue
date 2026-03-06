<template>
    <div>
        <Button icon="pi pi-trash" severity="danger" @click="visible = true" rounded outlined />
        <Dialog v-model:visible="visible" modal header="Удалить связь" :style="{ width: '25rem' }">
            <p>Вы уверены, что хотите удалить связь для группы <strong>{{ group?.groupName }}</strong>?</p>
            <div v-if="group?.user" class="mb-3 p-2 bg-gray-100 rounded">
                <small>Ответственный: {{ group.user.lastName }} {{ group.user.firstName }} {{ group.user.middleName }}</small>
            </div>
            <template #footer>
                <Button label="Отмена" icon="pi pi-times" severity="secondary" outlined @click="visible = false" />
                <Button label="Удалить" icon="pi pi-trash" severity="danger" @click="deleteGroup" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import axiosInstance from '@/utils/axios';

const props = defineProps({
    group: Object
});

const visible = ref(false);
const emit = defineEmits(['deleted']);

const deleteGroup = async () => {
    try {
        await axiosInstance.delete(`/api/responsibleticketstudentgroup/${props.group.id}`);
        emit('deleted');
        visible.value = false;
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Группы', 
                detail: 'Связь успешно удалена',
            }
        }));
    } catch(error) {
        console.debug("Ошибка при удалении связи: ", error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'Группы', 
                detail: `Ошибка при удалении связи: ${error.response?.data?.message || error.message}`,
            }
        }));
    }
}
</script>