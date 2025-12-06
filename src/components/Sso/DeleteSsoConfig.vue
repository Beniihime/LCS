<template>
    <div>
        <Button icon="pi pi-trash" severity="danger" @click="visible = true" rounded outlined />
        <Dialog v-model:visible="visible" modal header="Удалить конфигурацию" :style="{ width: '25rem' }">
            <p>Вы уверены, что хотите удалить конфигурацию <strong>{{ config?.clientName }}</strong>?</p>
            <template #footer>
                <Button label="Отмена" icon="pi pi-times" severity="secondary" outlined @click="visible = false" />
                <Button label="Удалить" icon="pi pi-trash" severity="danger" @click="deleteConfig" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import axiosInstance from '@/utils/axios';

const props = defineProps({
    config: Object
});

const visible = ref(false);

const emit = defineEmits(['deleted']);

const deleteConfig = async () => {
    try {
        await axiosInstance.delete(`/api/sso/resources/${props.config.id}`);
        emit('deleted');
        visible.value = false;
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'SSO', 
                detail: `SSO конфигурация успешно удалена`,
            }
        }));
    } catch(error) {
        console.debug("Ошибка при удалении конфигурации: ", error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'SSO', 
                detail: `Ошбика при удалении SSO конфигурации`,
            }
        }));
    }
}
</script>

<style scoped>
</style>