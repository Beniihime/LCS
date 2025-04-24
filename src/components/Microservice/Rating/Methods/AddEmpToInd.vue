<template>
    <Button label="Добавить" icon="pi pi-plus" severity="contrast" size="small" @click="visible = true"/>
    <Dialog v-model:visible="visible" header="Добавить сотрудника" modal>
      <div class="row-cols-1">
        <AutoComplete 
          v-model="selectedEmployee" 
          :suggestions="filteredEmployees" 
          @complete="searchEmployees" 
          placeholder="Выберите сотрудника"
          field="fullName"
        />
  
        <InputNumber v-model="points" placeholder="Баллы" :min="0" :max="100"/>
  
      </div>
      <template #footer>
        <Button label="Добавить" @click="submit" :disabled="!canSubmit" />
      </template>
    </Dialog>
</template>
  
<script setup>
import { ref, computed, watch } from 'vue';
import axiosInstance from '@/utils/axios';
  
const props = defineProps({
    indicatorId: Number,
    seasonId: String,
});
  
const emit = defineEmits(['updated']);

const selectedEmployee = ref(null);
const filteredEmployees = ref([]);
const points = ref(0);
const visible = ref(false);
  
const canSubmit = computed(() =>
    selectedEmployee.value && points.value > 0
);
  
const searchEmployees = async (event) => {
    try {
        const { data } = await axiosInstance.get('/api/employees', {
            params: { patternSearch: event.query }
        });
        filteredEmployees.value = data;
    } catch (e) {
        console.error('Не удалось загрузить сотрудников: ', e);
    }
};
  
const submit = async () => {
    try {
        await axiosInstance.post('/api/rating/employee-indicators-value', {
            employeeId: selectedEmployee.value.id,
            responsibleEmployeeId: selectedEmployee.value.id,
            indicatorId: props.indicatorId,
            seasonId: props.seasonId,
            points: points.value
        });
  
    //   toast.add({ severity: 'success', summary: 'Успешно', detail: 'Сотрудник добавлен' });
  
        emit('updated');
        visible.value = false;
    } catch (e) {
        console.error('Не удалось добавить сотрудника: ', e);
    }
};
</script>
  