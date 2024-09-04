<template>
    <div class="d-flex justify-content-center">
        <Button v-tooltip.left="{ value: 'Изменение роли', showDelay: 300, hideDelay: 300 }" icon="pi pi-cog" class="edit-btn" @click="openDialog(id)"/>
        <Dialog v-model:visible="visible" modal header="Изменение роли" :style="{ 'max-width': '30rem' }">
            <div class="row row-cols-1 my-4">
                <div class="col mb-4">
                    <FloatLabel>
                        <InputText v-model="currentRole.title" class="form-input"/>
                        <label>Название</label>
                    </FloatLabel>
                </div>
                <div class="col mb-4">
                    <FloatLabel>
                        <Textarea v-model="currentRole.description" rows="5" class="w-100"/>
                        <label>Описание</label>
                    </FloatLabel>
                </div>
                <div class="col">
                    <FloatLabel>
                        <Select v-model="currentRole.priority" :options="priorities" optionValue="value" optionLabel="label" class="form-input" />
                        <label>Приоритет</label>
                    </FloatLabel>
                </div>
            </div>
            <Divider class="my-4 py-1"/>
            <div class="text-center">
                <Button label="Сохранить" class="save-btn w-100 mb-3"/>
            </div>
        </Dialog>
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

const visible = ref(false);
const roles = ref([]);
const currentRole = ref({
    id: null,
    title: '',
    description: '',
    priority: 1
});

const priorities = ref([]);

const roleId = ref(null);

const props = defineProps({
    id: Number,
    title: String,
    description: String,
    priority: Number
})

const fetchRoles = async () => {
    try {
        const response = await axiosInstance.get(`/api/rbac/roles/`);

        roles.value = response.data;
    } catch (error) {
        console.error('Ошибка при получении ролей: ', error);
    }
}

const openDialog = (id) => {
    if (id === null) return;

    roleId.value = id;
    const role = roles.value.find(r => r.id === id);
    if (role) {
        currentRole.value = { ...role };
        visible.value = true;
    }
};

const fetchPriorities = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles/priorities');
        priorities.value = response.data.map(value => ({ label: value, value }));
    } catch (error) {
        console.error('Ошибка при получении приоритетов: ', error);
    }
};

const updateRole = async () => {
    try {
        await axiosInstance.put(`/api/rbac/roles/${props.id}`);
        visible.value = false;
        await fetchRoles();
    } catch (error) {
        console.error('Ошибка при обновлении роли: ', error);
    }
}

onMounted(async () => {
    await fetchRoles();
    await fetchPriorities();
})

</script>

<style scoped>
label {
    font-size: 16px;
}
.form-input {
    font-size: 16px;
    width: 100%;
}
.edit-btn {
    margin-top: 10px;
    border-radius: 12px;
    color: white;
    position: absolute;
    top: 10px;
    right: 20px;
    border-radius: 10px;
    width: 40px;
    height: 40px;
}
.save-btn {
    border-radius: 12pt;
    font-size: 14pt;
    transition: all 0.5s ease-out;
}
</style>