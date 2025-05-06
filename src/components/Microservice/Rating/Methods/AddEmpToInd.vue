<template>
    <Button label="Добавить" icon="pi pi-plus" severity="contrast" size="small" @click="visible = true"/>
    <Dialog v-model:visible="visible" header="Добавить баллы сотруднику" modal>
      <!-- <div class="row-cols-1">
        <AutoComplete 
          v-model="selectedEmployee" 
          :suggestions="filteredEmployees" 
          @complete="searchEmployees" 
          placeholder="Выберите сотрудника"
          field="fullName"
        />
  
        <InputNumber v-model="points" placeholder="Баллы" :min="0" :max="100"/>
  
      </div> -->
      <div class="d-flex flex-column gap-4 p-3">
        <label class="fw-semibold">ID сотрудника</label>
        <InputText v-model="employeeId" placeholder="Введите ID сотрудника" />

        <label class="fw-semibold">Баллы</label>
        <InputNumber v-model="points" placeholder="Баллы" :min="0" :max="100" showButtons buttonLayout="horizontal" />
      </div>
      <template #footer>
        <Button label="Добавить" @click="submit" :disabled="!canSubmit" />
      </template>
    </Dialog>
</template>
  
<script setup>
import { ref, computed } from 'vue';
import axiosInstance from '@/utils/axios';
  
const props = defineProps({
    indicatorId: Number,
    seasonId: String,
});
  
const emit = defineEmits(['updated']);

const selectedEmployee = ref(null);
const filteredEmployees = ref([]);

const employeeId = ref('');
const points = ref(0);
const visible = ref(false);
  
const canSubmit = computed(() =>
    employeeId.value.trim() !== '' && points.value > 0
);
  
// const searchEmployees = async (event) => {
//     try {
//         const { data } = await axiosInstance.get('/api/employees', {
//             params: { patternSearch: event.query }
//         });
//         filteredEmployees.value = data;
//     } catch (e) {
//         console.error('Не удалось загрузить сотрудников: ', e);
//     }
// };
  
const submit = async () => {
    try {
        await axiosInstance.post('/api/rating/employee-indicators-value', {
            employeeId: Number(employeeId.value),
            responsibleEmployeeId: 1,
            indicatorId: props.indicatorId,
            seasonId: Number(props.seasonId),
            points: points.value
        });
  
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Рейтинг', 
                detail: `Оценка для показателя добавлена`,
            }
        }));
  
        emit('updated');
        employeeId.value = '';
        visible.value = false;
        points.value = 0;
    } catch (e) {
        console.error('Не удалось добавить сотрудника: ', e);

        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'danger', 
                summary: 'Рейтинг', 
                detail: `Не удалось добавить оценку для показателя`,
            }
        }));
    }
};
</script>
  