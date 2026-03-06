<template>
    <div class="d-flex justify-content-center">
        <Dialog v-model:visible="showDelete" modal header="Удаление связки" :style="{ 'max-width': '50rem' }">
            <div class="row mb-4">
                <div class="col">
                    <h5>Пользователь ЛКС</h5>
                    <AutoComplete 
                        v-model="selectedLKSUser"
                        optionLabel="fullName"
                        :suggestions="filteredLKSUsers"
                        @complete="searchLKSUsers"
                        @item-select="checkLinkStatus"
                        field="fullName"
                        placeholder="Выберите пользователя..."    
                    />
                </div>
            </div>
            <Button class="button" label="Удалить" @click="deleteLink" :disabled="!isLinked" />
        </Dialog>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import axiosInstance from '@/utils/axios.js';
import { useToast } from 'primevue/usetoast';

const showDelete = ref(false);
const isLinked = ref(false);
const toast = useToast();

// Данные для пользователей ЛКС
const selectedLKSUser = ref(null);
const filteredLKSUsers = ref([]);

const checkLinkStatus = async () => {
    try {
        const response = await axiosInstance.get(`/api/infra-manager/db/users/${selectedLKSUser.value.id}/status`);

        if (response.data.personalAccountUserId && response.data.infraManagerUserId) {
            isLinked.value = true;
            toast.add({ severity: 'info', summary: 'InfraManager', detail: `Связка для пользователя ${selectedLKSUser.value.fullName} существует`, life: 3000 });
        } else {
            toast.add({ severity: 'warn', summary: 'InfraManager', detail: `Связка для пользователя ${selectedLKSUser.value.fullName} не найдена`, life: 3000 });
        }
    } catch (error) {
        console.debug('Ошибка при проверки статуса связки: ', error);
    }
}

const searchLKSUsers = async (event) => {
    const query = event.query;

    try {
        const payload = {
            page: 1,
            pageSize: 500,
            isBlocked: false
        };

        const response = await axiosInstance.post('/api/users/list', payload);

        filteredLKSUsers.value = response.data.entities
            .filter(user =>
                `${user.firstName} ${user.middleName ?? ''} ${user.lastName}`.toLowerCase().includes(query.toLowerCase())
            )
            .map(user => ({
                fullName: `${user.firstName} ${user.middleName ?? ''} ${user.lastName}`,
                id: user.id
            }));
    } catch (error) {
        console.debug('Ошибка при загрузке пользователей ЛКС:', error);
    }
};

// Функция для удаления связки
const deleteLink = async () => {

    if (selectedLKSUser.value) {
        try {
            await axiosInstance.delete(`/api/infra-manager/db/users/${selectedLKSUser.value.id}`);

            window.dispatchEvent(new CustomEvent('toast', {
                detail: { 
                    severity: 'success', 
                    summary: 'InfraManager', 
                    detail: `Вы удалили привязку для пользоватля ${selectedLKSUser.value.fullName}` ,
                }
            }));

            showDelete.value = false;
        } catch (error) {
            console.debug('Ошибка при удалении связи: ', error);
        }
    }
}

// Добавляем метод для управления состоянием из родителя
const openDialogDelete = () => {
    showDelete.value = true;
};

defineExpose({ openDialogDelete });
</script>

<style scoped>
.button {
    width: 100%;
    border-radius: 12px;
    color: white;
    font-size: 1.2rem;
}
</style>