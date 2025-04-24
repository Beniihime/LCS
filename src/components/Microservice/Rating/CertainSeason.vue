<template>
    <main>
        <WelcolmeScreen :visible="loading"/>
        <div class="content-wrapper">
            <header class="header">
                <div class="header-row justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <Button icon="pi pi-arrow-left" size="small" rounded @click="goBack" />
                        <span class="fs-3 ms-4">Показатели эффективности</span>
                    </div>

                    <div class="certain-season">Выбранный сезон: {{ seasonTitle }}</div>
                </div>
                

                <div class="header-row">
                    <div class="header-card" v-for="(_, index) in 3" :key="index">
                        <span class="card-title">{{ headerTitles[index] }}</span>
                        <span class="card-value">{{ headerValues[index] }}</span>
                    </div>
                </div>
            </header>
            
            <div class="mt-4 certain-season-table">
                <DataTable
                    v-model:expandedRows="expandedRows"
                    v-model:expandedRowGroups="expandedRowGroups"
                    :value="filteredIndicators"
                    dataKey="id"
                    paginator
                    expandableRowGroups
                    rowGroupMode="subheader"
                    groupRowsBy="group"
                    :pt="{ rowGroupHeaderCell: { colspan: 7 }, rowGroupFooterCell: { colspan: 7 }}"
                    :rows="rowsPerPage"
                    stripedRows
                    scrollable
                    scrollHeight="65vh"
                    :rowClass="rowClass"
                >
                    <template #header>
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="header-left-group d-flex align-items-center">
                                <!-- <Button label="Добавить" severity="contrast" icon="pi pi-plus" /> -->
                                <AddIndToSeason :seasonId="seasonId" @added="fetchIndicators" />
                                <Button 
                                    :icon="allExpanded ? 'pi pi-minus' : 'pi pi-plus'"
                                    :label="allExpanded ? 'Свернуть все': 'Развернуть все'"
                                    severity="secondary"
                                    @click="toggleExpandAll"
                                    class="ms-2"
                                />
                            </div>
                            
                            <h3 class="m-0">Показатели эффективности</h3>

                            <div class="header-right-group">
                                <IconField class="searchBar">
                                    <InputIcon class="pi pi-search" />
                                    <InputText id="search" name="search" placeholder="Поиск по показателю..." class="search" v-model="searchInd" />
                                </IconField>
                            </div>
                        </div>
                    </template>

                    <template #groupheader="{ data }">
                        <span class="ms-2 align-baseline">{{ data.group }}</span>
                    </template>

                    <Column expander style="width: 6rem;"/>

                    <Column field="number" header="#" style="max-width: 40px;">
                        <template #body="{ data }">
                            {{ data.number }}
                        </template>
                    </Column>

                    <Column field="indicator" header="Наименование показателя эффективности" style="max-width: 220px;">
                        <template #body="{ data }">
                            <span>{{ data.indicator }}</span>
                        </template>
                    </Column>

                    <Column header="Оценка и баллы" style="max-width: 100px;">
                        <template #body="{ data }">
                            <div v-if="data.target">
                                <div v-for="(target, index) in data.target" :key="index" class="target-row">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span>{{ target }}</span>
                                        <Tag :value="data.point[index]" 
                                             :severity="getSeverity(index, data.point)" />
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="periodicity" header="Периодичность" style="max-width: 150px;">
                        <template #body="{ data }">
                            <span>{{ data.periodicity }}</span>
                        </template>
                    </Column>

                    <Column field="responsible" header="Ответственный" style="max-width: 150px;">
                        <template #body="{ data }">
                            <span>{{ data.responsible }}</span>
                        </template>
                    </Column>

                    <Column field="edit" style="max-width: 100px;">
                        <template #body="{ data }">
                            <DeleteIndicator :item="data" :seasonId="seasonId" @deleted="fetchIndicators" />
                        </template>
                    </Column>

                    <template #expansion="slotProps">
                        <div class="p-3 h-100">
                            <h5 class="mb-3">Сотрудники по показателю: {{ slotProps.data.indicator }}</h5>
                            <DataTable :value="filteredEmployees(slotProps.data.employees)" responsiveLayout="scroll" scrollable>
                                <template #header>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <IconField class="searchBar">
                                            <InputIcon class="pi pi-search" />
                                            <InputText id="searchEmp" name="search" placeholder="Поиск по сотруднику..." class="search" v-model="searchEmp" />
                                        </IconField>
                                        <h4 class="m-0 translate-middle-x">Сотрудники</h4>
                                        <!-- <AddEmpToInd @updated="fetchIndicators" :seasonId="seasonId"/> -->
                                    </div>
                                    
                                </template>
                                <Column field="name" header="ФИО сотрудника" />
                                <Column field="group" header="Группа" />
                                <Column field="periodicity" header="Периодичность" />
                                <Column field="value" header="Балл" />
                                <Column field="edit" style="max-width: 40px;">
                                    <template #body="{ data }">
                                        <UpdEmployeeValue />
                                    </template>
                                </Column>
                                <template #footer>
                                    <div class="d-flex justify-content-end">
                                        Всего сотрудников: {{ slotProps.data.employees.length }}
                                    </div>
                                </template>
                            </DataTable>
                        </div>
                    </template>

                    <template #groupfooter="slotProps">
                        <div class="d-flex justify-content-end">
                            Всего показателей: {{ calculateIndicatorsTotal(slotProps.data.group) }}
                        </div>
                    </template>

                    <template #paginatorstart>
                        <span>Всего показателей: {{ formattedIndicators.length }}</span>
                    </template>

                    <template #paginatorend>
                        <div class="d-flex align-items-center">
                            <span>Показать</span>
                            <Select 
                                v-model="rowsPerPage"
                                :options="rowsPerPageOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="search mx-1 px-1"
                            />
                        </div>
                    </template>

                </DataTable>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from "vue-router";
import axiosInstance from "@/utils/axios.js";
import { getQuarterPeriod } from '@/utils/formatSeason.js';

import WelcolmeScreen from "@/components/Utils/WelcomeScreen.vue";

import DeleteIndicator from "@/components/Microservice/Rating/Methods/DeleteIndicator.vue";
import UpdEmployeeValue from "@/components/Microservice/Rating/Methods/UpdEmployeeValue.vue";
import AddIndToSeason from "@/components/Microservice/Rating/Methods/AddIndToSeason.vue";
import AddEmpToInd from "@/components/Microservice/Rating/Methods/AddEmpToInd.vue";

const router = useRouter();
const route = useRoute();

const seasonId = route.params.idSeason;
const seasonTitle = computed(() => route.query.title);

const rowsPerPage = ref(10);
const rowsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
];

const goBack = () => router.back();
const loading = ref(true);
const headerTitles = ["Сотрудники", "Показатели", "Период"];
const headerValues = computed(() => 
    [
        12, 
        formattedIndicators.value.length, 
        getQuarterPeriod(seasonTitle.value.split('/')[1])
    ]
);

const groups = ref([]);
const rawIndicators = ref([]);
const formattedIndicators = ref([]);
const employeeValues = ref([]);

const searchInd = ref('');
const searchEmp = ref('');
const expandedRows = ref({});
const expandedRowGroups = ref();
const allExpanded = ref(false);

const expandAll = () => {
    const groups = [...new Set(formattedIndicators.value.map(item => item.group))];
    expandedRowGroups.value = groups;
    // Разворачиваем только строки из развернутых групп
    expandedRows.value = formattedIndicators.value
        .filter(item => groups.includes(item.group))
        .reduce((acc, p) => (acc[p.id] = true) && acc, {});
};
const collapseAll = () => {
    expandedRowGroups.value = [];
    expandedRows.value = null;
};

const toggleExpandAll = () => {
    if (allExpanded.value) {
        collapseAll();
    } else {
        expandAll ();
    }
    allExpanded.value = !allExpanded.value;
};

const filteredIndicators = computed(() => {
    if (!searchInd.value) return formattedIndicators.value;

    const searchTerm = searchInd.value.toLowerCase();
    const results = formattedIndicators.value.filter(indicator =>
        indicator.indicator.toLowerCase().includes(searchTerm)
    );

    if (searchInd.value) {
        const groupsToExpand = [...new Set(results.map(item => item.group))];
        expandedRowGroups.value = groupsToExpand;

        const newExpandedRows = {};
        results.forEach(item => {
            newExpandedRows[item.id] = true;
        });
        expandedRows.value = newExpandedRows;
    }

    return results;
});

const filteredEmployees = (employees) => {
    if (!searchEmp.value || !employees) return employees;

    const term = searchEmp.value.toLowerCase();
    return employees.filter(emp =>
        emp.name.toLowerCase().includes(term)
    );
};

const getSeverity = (index, points) => {
    if (!points || points.length === 0) return 'info';
    
    // Только последний (максимальный по порядку) элемент - зеленый
    if (index === points.length - 1) return 'success';
    
    // Первый элемент - красный
    if (index === 0) return 'danger';
    
    // Все остальные - оранжевые
    return 'warn';
};

const calculateIndicatorsTotal = (groupName) => {
    return formattedIndicators.value.filter(ind => ind.group === groupName).length;
}

watch(expandedRowGroups, (newGroups, oldGroups) => {
    // Находим группы, которые были свернуты
    const collapsedGroups = oldGroups?.filter(group => !newGroups?.includes(group)) || [];
    
    if (collapsedGroups.length > 0) {
        // Сворачиваем только строки из свернутых групп
        const newExpandedRows = {...expandedRows.value};
        formattedIndicators.value
            .filter(item => collapsedGroups.includes(item.group))
            .forEach(item => {
                delete newExpandedRows[item.id];
            });
        expandedRows.value = newExpandedRows;
    }
});

watch(searchInd, (newVal) => {
    if (!newVal) {
        expandedRowGroups.value = [];
        expandedRows.value = {};
    }
});

// const rowClass = (data) => {
//     return [{ 'highlighted-row': data.id === lastCreatedId.value }];
// };

const fetchIndicators = async () => {
    loading.value = true;
    try {
        const [groupRes, indicatorRes, valuesRes] = await Promise.all([
            axiosInstance.get('/api/rating/groups-indicators'),
            axiosInstance.get(`/api/rating/seasons/${seasonId}/indicators`),
            axiosInstance.get('/api/rating/employee-indicators-value'),
        ]);

        groups.value = groupRes.data;
        rawIndicators.value = indicatorRes.data;
        employeeValues.value = valuesRes.data;

        const groupMap = new Map(groups.value.map((g, i) => [g.id, { ...g, index: i + 1 }]));

        const grouped = {};
        rawIndicators.value.forEach(ind => {
            const groupId = ind.groupIndicator.id;
            if (!grouped[groupId]) grouped[groupId] = [];
            grouped[groupId].push(ind);
        });

        formattedIndicators.value = Object.entries(grouped).flatMap(([groupId, indicators]) => {
            const groupInfo = groupMap.get(Number(groupId));
            return indicators.map((ind, idx) => {
                const relatedValues = employeeValues.value.filter(v => v.indicator.id === ind.id);

                return {
                    id: ind.id,
                    group: groupInfo.title,
                    number: `${groupInfo.index}.${idx + 1}`,
                    indicator: ind.title,
                    periodicity: ind.periodicityIndicators.map(p => p.title).join(', '),
                    responsible: ind.responsibleIndicators.map(r => r.title).join(', '),
                    employees: relatedValues.map(v => v.employee.fio),
                    target: relatedValues.map(v => v.target),
                    point: relatedValues.map(v => v.value),
                };
            });
        });
    } catch(error) {
        console.error('Ошибка при загрузке: ', error);
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    await fetchIndicators();
});
</script>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 100dvh;
}
header {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-inline: 20rem;
}
.content-wrapper {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 20px 6rem;
    height: 100%;
    overflow: hidden;
    color: var(--p-text-color);
}
.certain-season-table {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
}
.header-row {
    display: flex;
    gap: 20px;
}
.header-card {
    flex: 1;
    padding: 12px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    background: var(--p-grey-7);
    transition: all 0.5s;
}
.card-title {
    font-size: 0.9rem;
    color: #bbb;
}
.card-value {
    font-size: 1.2rem;
    font-weight: bold;
    transition: all 0.5s;
}
.certain-season {
    border-radius: 12px;
    padding: 8px 14px;
    background-color: var(--p-grey-7);
    transition: all 0.5s;
}
.search {
    border-radius: 12px;
    transition: all 0.5s;
}
.target-row {
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--p-grey-3);
}
.target-row:last-child {
    border-bottom: none;
}
:deep(.p-datatable-row-group-header) {
    background-color: var(--p-grey-7);
}
:deep(.p-datatable-row-expansion .p-datatable-scrollable-table .p-datatable-thead) {
    z-index: 0;
}
:deep(.p-datatable-row-expansion .p-datatable-footer) {
    border: 2px solid var(--p-grey-4);
    border-top: none;
    border-radius: 0 0 12px 12px;
}
/* :deep(.p-datatable-row-expansion .p-datatable-table-container) {
    border-radius: 12px 12px 0 0;
} */
</style>