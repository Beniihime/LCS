<template>
    <div>
        <Button class="toggle-button" label="Доступные сервисы" @click="fetchServices"/>
        <Dialog v-model:visible="isDialogVisible" modal :style="{ 'max-width': '80rem' }" @hide="closeDialog">
            <div class="service-card mt-3">
                <h2>Доступные сервисы</h2>
                <Divider />

                <div class="row">
                    <div class="col">
                        <Tree 
                            :value="servicesTree" 
                            :expanded-keys="expandedKeys" 
                            @node-expand="onNodeExpand" 
                            @node-collapse="onNodeCollapse"
                            loadingMode="icon"
                        >
                            <template #default="{ node }">
                                <span>{{ node.label }}</span>
                                <Tag 
                                    v-if="node.isAvailable !== undefined"
                                    :severity="node.isAvailable ? 'success' : 'danger'"
                                    :icon="node.isAvailable ? 'pi pi-check' : 'pi pi-times'"
                                    class="ms-2"
                                />
                            </template>
                        </Tree>
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axiosInstance from '@/utils/axios.js';

const isDialogVisible = ref(false);  // Видимость модального окна

const servicesTree = ref([]); // Данные для дерева сервисов
const expandedKeys = ref({}); // Раскрытые узлы дерева

// Функция для обработки раскрытия узла
const onNodeExpand = (event) => {
    expandedKeys.value = { ...expandedKeys.value, [event.node.key]: true };
}

// Фукнция для обработки сворачивания узла
const onNodeCollapse = (event) => {
    const newExpandedKeys = { ...expandedKeys.value };
    delete newExpandedKeys[event.node.key];
    expandedKeys.value = newExpandedKeys;
}

// Запрос доступных сервисов
const fetchServices = async () => {
    try {
        const servicesResponse = await axiosInstance.get(`/api/infra-manager/users/me/calls/services/available`);
        servicesTree.value = transformServicesToTree(servicesResponse.data); // Преобразуем в формат дерева
    } catch (error) {
        console.error('Ошибка при загрузке информации о пользователе InfraManager:', error);
    }
}

// Преобразование данных сервисов в формат дерева
const transformServicesToTree = (services) => {
    isDialogVisible.value = true;
    return services.map(category => ({
        key: `category-${category.id}`,
        label: category.name,
        children: category.services.map(service => ({
            key: `service-${service.id}`,
            label: service.name,
            isAvailable: service.isAvailable,
            children: service.items.map(item => ({
                key: `item-${item.id}`,
                label: item.name,
                isAvailable: item.isAvailable
            }))
        }))
    }));
};
</script>

<style scoped>
.service-card {
    border-radius: 24px;
    border: 2px solid var(--p-grey-4);
    transition: all 0.5s;
    width: 100%;
    padding: 30px;
}

h2 {
    margin-bottom: 5px;
    font-size: 24px;
    font-weight: bold;
}
.toggle-button {
    border-radius: 12px;
    font-size: 14pt;
    transition: all 0.5s;
}
</style>