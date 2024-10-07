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

import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import AutoComplete from 'primevue/autocomplete';

const showDelete = ref(false);
const isLinked = ref(false);

// Данные для пользователей ЛКС
const selectedLKSUser = ref(null);
const filteredLKSUsers = ref([]);

const checkLinkStatus = async () => {
    try {
        const response = await axiosInstance.get(`/api/infra-manager/db/users/${selectedLKSUser.value.id}/status`);

        if (response.data.personalAccountUserId && response.data.infraManagerUserId) {
            isLinked.value = true;
            window.dispatchEvent(new CustomEvent('toast', {
                detail: { 
                    severity: 'info', 
                    summary: 'InfraManager', 
                    detail: `Связка для пользователя ${selectedLKSUser.value.fullName} существует`
                }
            }));
        } else {
            window.dispatchEvent(new CustomEvent('toast', {
                detail: {
                    severity: 'warn',
                    summary: 'InfraManager',
                    detail: `Связка для пользователя ${selectedLKSUser.value.fullName} не найдена`
                }
            }));
        }
    } catch (error) {
        console.error('Ошибка при проверки статуса связки: ', error);
    }
}

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