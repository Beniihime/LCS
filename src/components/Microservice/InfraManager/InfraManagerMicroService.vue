<template>
    <main>
        <div class="card" @click="table">
            <div class="row">
                <div class="col">
                    <div class="card-body">
                        <div class="row mb-1 align-items-center justify-content-between">
                            <div class="col-auto">
                                <div class="header">
                                    <h3>InfraManager</h3>
                                    <h5 class="card-text">Управление системой автоматизации ИТ-процессов</h5>
                                </div>
                            </div>
                            <div class="col-auto">
                                <Button class="action" type="button" icon="pi pi-ellipsis-v" @click.stop="toggle" aria-haspopup="true" aria-controls="overlay_menu" severity="secondary"/>
                                <Menu ref="menu" :model="menuItems" :popup="true" id="overlay_menu"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <InfraManagerCreate ref="infraCreateRef"/>
        <InfraManagerDelete ref="infraDeleteRef"/>
        <InfraManagerSearchUsers ref="infraSearchRef"/>
    </main>
</template>

<script setup>
import { ref, nextTick } from "vue";
import { useRouter } from "vue-router";

import InfraManagerCreate from '@/components/InfraManager/InfraManagerCreate.vue';
import InfraManagerSearchUsers from '@/components/InfraManager/InfraManagerSearchUsers.vue';
import InfraManagerDelete from '@/components/InfraManager/InfraManagerDelete.vue';

const menu = ref();
const menuItems = ref([{
    label: 'Действия',
    items: [
        { label: 'Связка пользователей', icon: 'pi pi-link', command: () => { showCreateDialog() } },
        { label: 'Удаление связи', icon: 'pi pi-trash', command: () => { showDeleteDialog() } },
        { label: 'Поиск пользоватлей', icon: 'pi pi-user', command: () => { showSearchDialog() } },
    ]
}]);

const toggle = (event) => {
    menu.value.toggle(event);
};

const router = useRouter();

const table = () => {
    router.push("/services/infraManager");
}

const infraCreateRef = ref(null); // InfraManagerCreate
const infraDeleteRef = ref(null); // InfraManagerDelete
const infraSearchRef = ref(null); // InfraManagerSearchUsers

// Вызываем метод для открытия диалога в дочернем компоненте
const showCreateDialog = () => { nextTick(() => { infraCreateRef.value?.openDialogCreate(); }); };
const showDeleteDialog = () => { nextTick(() => { infraDeleteRef.value?.openDialogDelete(); }); };
const showSearchDialog = () => { nextTick(() => { infraSearchRef.value?.openDialogSearch(); }); };

</script>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}
.card-text {
    font-size: 1.15rem;
    font-family: 'SF Pro Rounded', sans-serif;
    color: var(--p-grey-1);
    margin-top: 10px;
}
.card {
    border-radius: 12px;
    transition: all 0.5s;
    background-color: var(--p-grey-7);
    color: var(--p-text-color);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    border: 2px solid transparent;
}
.card:hover {
    border: 2px solid var(--p-blue-500);
    background-color: var(--p-blue-500-low-op);
    color: rgb(var(--p-color-icon-menu));
    cursor: pointer;
}
.card-body {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}
</style>