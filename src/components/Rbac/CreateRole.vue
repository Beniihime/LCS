<template>
    <div class="d-flex justify-content-center">
        <Button icon="pi pi-plus" label="Создать роль" class="create-btn" @click="openDialog"/>
        <Dialog v-model:visible="visible" modal header="Создание новой роли" :style="{ 'max-width': '30rem' }">
            <div class="row row-cols-1 my-4">
                <div class="col mb-4">
                    <FloatLabel>
                        <InputText v-model="newRole.title" class="form-input"/>
                        <label>Название</label>
                    </FloatLabel>
                </div>
                <div class="col mb-4">
                    <FloatLabel>
                        <Textarea v-model="newRole.description" rows="5" class="w-100"/>
                        <label>Описание</label>
                    </FloatLabel>
                </div>
                <div class="col">
                    <FloatLabel>
                        <Select v-model="newRole.priority" :options="priorities" optionValue="value" optionLabel="label" class="form-input"/>
                        <label>Приоритет</label>
                    </FloatLabel>
                </div>
            </div>
            <Divider class="my-4 py-1"/>
            <div class="text-center">
                <Button label="Создать" class="save-btn w-100 mb-3" @click="createRole" />
            </div>
        </Dialog>
        <Toast ref="toast" />
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axiosInstance from '@/utils/axios.js';

import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Divider from 'primevue/divider';
import FloatLabel from 'primevue/floatlabel';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import Toast from 'primevue/toast';

const visible = ref(false);
const newRole = ref({
    title: '',
    description: '',
    priority: null
});

const props = defineProps({
    refreshRoles: Function
})

const toast = ref(null);

const priorities = ref([]);
const userPriority = ref(0);

const openDialog = () => {
    visible.value = true;
}

const fetchPriorities = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles/priorities');
        priorities.value = response.data.map(value => ({ label: value, value }));
    } catch (error) {
        console.error('Ошибка при получении приоритетов: ', error);
    }
};

const fetchUserPriority = async () => {
    try {
        const response = await axiosInstance.get('/api/users/me/info');
        userPriority.value = Math.max(...response.data.roles.map(role => role.priority));
    } catch (error) {
        console.error('Ошибка при получении данных пользователя: ', error);
    }
};

const createRole = async () => {
    if (newRole.value.priority < userPriority.value) {
        toast.value.add({ severity: 'info', summary: 'Приоритет ролей', detail: 'Вы не можете создавать роль с приоритетом выше вашего.', life: 3000 });
        return;
    }
    if (newRole.value.priority === 0) {
        toast.value.add({ severity: 'info', summary: 'Приоритет ролей', detail: 'Вы не можете создавать роль с приоритетом 0.', life: 3000 });
    }

    try {
        await axiosInstance.post('/api/rbac/roles', newRole.value);
        visible.value = false;
        await props.refreshRoles();

        toast.value.add({ severity: 'success', summary: 'Успех', detail: 'Роль создана', life: 3000 });
    } catch (error) {
        console.error('Ошибка при создании роли: ', error);
    }
};

onMounted(async () => {
    await fetchPriorities();
    await fetchUserPriority();
});

</script>

<style scoped>
label {
    font-size: 16px;
}
.create-btn {
    border-radius: 12pt;
    font-size: 14pt;
    transition: all 0.5s ease-out;
}
.form-input {
    font-size: 16px;
    width: 100%;
}
.save-btn {
    border-radius: 12pt;
    font-size: 14pt;
    transition: all 0.5s ease-out;
}
</style>