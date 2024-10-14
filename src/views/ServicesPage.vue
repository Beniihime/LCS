<template>
    <main>
        <WelcomeScreen :visible="loading" />
        <div class="content-wrapper">
            <h1 class="mb-4">Микросервисы</h1>
            <div class="services-cards">
                <div class="card h-100">
                    <div class="row">
                        <div class="col">
                            <div class="card-body">
                                <div class="row mb-4">
                                    <div class="col">
                                        <div class="header">
                                            <h2>InfraManager</h2>
                                            <h5 class="card-text">Управление системой автоматизации ИТ-процессов</h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-auto">
                                        <Menu :model="menuItems"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <InfraManagerCreate ref="infraCreateRef"/>
                <InfraManagerDelete ref="infraDeleteRef"/>
                <InfraManagerSearchUsers ref="infraSearchRef"/>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';

import WelcomeScreen from '@/components/Utils/WelcomeScreen.vue';
import InfraManagerCreate from '@/components/InfraManager/InfraManagerCreate.vue';
import InfraManagerSearchUsers from '@/components/InfraManager/InfraManagerSearchUsers.vue';
import InfraManagerDelete from '@/components/InfraManager/InfraManagerDelete.vue';

const loading = ref(true);

const infraCreateRef = ref(null); // InfraManagerCreate
const infraDeleteRef = ref(null); // InfraManagerDelete
const infraSearchRef = ref(null); // InfraManagerSearchUsers

const menuItems = ref([
    {
        label: 'Действия',
        items: [
            {
                label: 'Связка пользователей',
                icon: 'pi pi-link',
                command: () => {
                    showCreateDialog();
                }
            },
            {
                label: 'Удаление связи',
                icon: 'pi pi-trash',
                command: () => {
                    showDeleteDialog();
                }
            },
            {
                label: 'Поиск пользоватлей',
                icon: 'pi pi-user',
                command: () => {
                    showSearchDialog();
                }
            }
        ]
    }
    
])

// Вызываем метод для открытия диалога в дочернем компоненте
const showCreateDialog = () => {
    nextTick(() => {
        if (infraCreateRef.value) {
            infraCreateRef.value.openDialogCreate();
        } else {
            console.error('openDialog method is not available.');
        }
    });
};

const showDeleteDialog = () => {
    nextTick(() => {
        if (infraDeleteRef.value) {
            infraDeleteRef.value.openDialogDelete();
        } else {
            console.error('openDialog method is not available.');
        }
    });
};

const showSearchDialog = () => {
    nextTick(() => {
        if (infraSearchRef.value) {
            infraSearchRef.value.openDialogSearch();
        } else {
            console.error('openDialog method is not available.');
        }
    });
};

onMounted(() => {
    setTimeout(() => {
        loading.value = false;
    }, 250);
});

</script>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}
.content-wrapper {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 20px 8rem;
    overflow: hidden;
    color: var(--p-text-color);
}
.card-text {
    font-size: 1.3rem;
    font-family: 'SF Pro Rounded', sans-serif;
    color: var(--p-grey-1);
    margin-top: 20px;
}
.card {
    border-radius: 18px;
    transition: all 0.5s;
    background-color: transparent;
    color: var(--p-text-color);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    border: 0;
}
.card-body {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}
</style>