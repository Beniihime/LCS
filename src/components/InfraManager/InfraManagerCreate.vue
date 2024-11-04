<template>
    <div class="d-flex justify-content-center">
        <!-- <Button label="Связать пользователей" class="button" @click="showCreateInfra = true"/> -->

        <Dialog v-model:visible="showCreateInfra" modal header="Связка пользователей" :style="{ 'max-width': '50rem' }">
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
            <Divider class="my-4"/>
            <div class="row my-4">
                <div class="col">
                    <h5>Пользователь InfraManager</h5>
                    <AutoComplete 
                        v-model="selectedInfraUser" 
                        optionLabel="fullName" 
                        :suggestions="filteredInfraUsers" 
                        @complete="searchInfraUsers" 
                        field="fullName" 
                        placeholder="Выберите пользователя..."
                        @item-select="onInfraUserSelect"
                        @clear="clearInfraUserSelection"
                    />
                </div>
            </div>
            <div v-if="selectedInfraUserDetails" class="row mt-4">
                <div class="col">
                    <h6>Информация о пользователе:</h6>
                    <p><strong>Email:</strong> {{ selectedInfraUserDetails.email }}</p>
                    <p><strong>Должность:</strong> {{ selectedInfraUserDetails.positionName }}</p>
                    <p><strong>Местоположение:</strong> {{ selectedInfraUserLocation.roomName }}</p>
                </div>
            </div>
            <Button class="button" label="Создать" @click="createLink" :disabled="!selectedLKSUser || !selectedInfraUser" />
        </Dialog>
    </div>
</template>

<script setup>
import { ref, defineExpose } from 'vue';
import axiosInstance from '@/utils/axios.js';

const showCreateInfra = ref(false);

// Данные для пользователей ЛКС
const selectedLKSUser = ref(null);
const filteredLKSUsers = ref([]);

// Данные для пользователей InfraManager
const selectedInfraUser = ref(null);
const filteredInfraUsers = ref([]);

// Дополонительеные данные о пользователе InfraManager
const selectedInfraUserDetails = ref(null);
const selectedInfraUserLocation = ref({});

// Функция для поиска пользователей ЛКС
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
        console.debug('Ошибка при загрузке пользователей ЛКС:', error);
    }
};

// Функция для поиска пользователей InfraManager
const searchInfraUsers = async (event) => {
    const query = event.query;

    try {
        const response = await axiosInstance.get('/api/infra-manager/users', {
            params: {
                patternSearch: query
            }
        });
        filteredInfraUsers.value = response.data.map(user => ({
            fullName: user.fullName,
            id: user.id,
            details: user.details
        }));
    } catch (error) {
        console.debug('Ошибка при загрузке пользователей:', error);
    }
};

// Функция, вызываемая при выборе пользователя InfraManager
const onInfraUserSelect = async (event) => {
    const user = event.value;
    try {
        // Запрос основной информации о пользователе
        const userDetailsResponse = await axiosInstance.get(`/api/infra-manager/users/${user.id}`);
        selectedInfraUserDetails.value = userDetailsResponse.data;

        // Запрос информации о местоположении пользователя
        const userLocationResponse = await axiosInstance.get(`/api/infra-manager/users/${user.id}/client/info`);
        selectedInfraUserLocation.value = userLocationResponse.data;
    } catch (error) {
        console.debug('Ошибка при загрузке информации о пользователе InfraManager:', error);
    }
}

// Функция, вызываемая при очистке поля AutoComplete
const clearInfraUserSelection = () => {
    selectedInfraUserDetails.value = null;
    selectedInfraUserLocation.value = null;
};

// Функция для создания связи между пользователями
const createLink = async () => {
    if (selectedLKSUser.value && selectedInfraUser.value) {
        try {
            await axiosInstance.post('/api/infra-manager/db/users', {
                personalAccountUserId: selectedLKSUser.value.id,
                infraManagerUserId: selectedInfraUser.value.id
            });

            window.dispatchEvent(new CustomEvent('toast', {
                detail: { 
                    severity: 'success', 
                    summary: 'InfraManager', 
                    detail: `Вы связали пользоватлей ${selectedLKSUser.value.fullName} и ${selectedInfraUser.value.fullName}` ,
                }
            }));

            showCreateInfra.value = false;
        } catch (error) {
            console.debug('Ошибка при создании связи: ', error);
        }
    }
}

// Добавляем метод для управления состоянием из родителя
const openDialogCreate = () => {
    showCreateInfra.value = true;
};

defineExpose({ openDialogCreate });
</script>

<style scoped>
.button {
    width: 100%;
    border-radius: 12px;
    color: white;
    font-size: 1.2rem;
}
</style>