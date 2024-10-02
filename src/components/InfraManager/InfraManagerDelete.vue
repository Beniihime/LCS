<template>
    <div class="d-flex justify-content-center" @click="showDelete = true">
        <Button label="Удалить привязку" class="button"/>

        <Dialog v-model:visible="showDelete" modal header="Удалить привязку" :style="{ 'max-width': '50rem' }">
            <div class="row mb-4">
                <div class="col">
                    <h5>Пользователь ЛКС</h5>
                    <AutoComplete 
                        v-model="selectedLKSUser"
                        optionLabel="fullName"
                        :suggestions="filteredLKSUsers"
                        @complete="searchLKSUsers"
                        field="fullName"
                        placeholder="Выберите пользователя..."    
                    />
                </div>
            </div>
            <Button class="button" label="Удалить" @click="deleteLink" :disabled="!selectedLKSUser" />
        </Dialog>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import axiosInstance from '@/utils/axios.js';

import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Button from 'primevue/button';
import AutoComplete from 'primevue/autocomplete';

const showDelete = ref(false);

// Данные для пользователей ЛКС
const selectedLKSUser = ref(null);
const filteredLKSUsers = ref([]);

const searchLKSUsers = async (event) => {
    const query = event.query;

    try {
        const response = await axiosInstance.get('/api/users', {
            params: {
                page: 1,
                pageSize: 30
            }
        });

        filteredLKSUsers.value = response.data.users
            .filter(user =>
                `${user.firstName} ${user.middleName ?? ''} ${user.lastName}`.toLowerCase().includes(query.toLowerCase())
            )
            .map(user => ({
                fullName: `${user.firstName} ${user.middleName ?? ''} ${user.lastName}`,
                id: user.id
            }));
    } catch (error) {
        console.error('Ошибка при загрузке пользователей ЛКС:', error);
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
            console.error('Ошибка при удалении связи: ', error);
        }
    }
}
</script>

<style scoped>
.button {
    width: 100%;
    border-radius: 12px;
    color: white;
    font-size: 1.2rem;
}
</style>