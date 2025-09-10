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

                    <div class="certain-season">Выбранный сезон: {{ certainSeason?.title }}</div>

                    <div class="header-card" v-for="(_, index) in 2" :key="index">
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
                    scrollHeight="72vh"
                    :rowClass="rowClass"
                >
                    <template #header>
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="header-left-group d-flex align-items-center">
                                <AddIndToSeason :seasonId="seasonId" @added="(id) => onIndicatorAdded(id)" :rawIndicators="rawIndicators"/>
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

                    <Column header="Оценка и баллы" style="max-width: 220px;">
                        <template #body="{ data }">
                            <div v-if="data.statistics" class="stats-table">
                                <div 
                                    v-for="(stat, index) in data.statistics" 
                                    :key="index" 
                                    class="stats-row d-flex justify-content-between align-items-center"
                                >
                                    <span class="stats-title">{{ stat.title }}</span>
                                    <Tag 
                                        :value="stat.point"
                                        v-bind="getTagStyle(stat.point, data.statistics)"
                                    />
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
                        <div class="p-0 h-100">
                            <DataTable :value="filteredEmployees(slotProps.data.employees)" responsiveLayout="scroll" scrollable>
                                <template #header>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <IconField class="searchBar">
                                            <InputIcon class="pi pi-search" />
                                            <InputText id="searchEmp" name="search" placeholder="Поиск по сотруднику..." class="search" v-model="searchEmp" />
                                        </IconField>
                                        <h4 class="m-0 translate-middle-x">Оценки сотрудников</h4>
                                        <AddEmpToInd @updated="fetchIndicators" :seasonId="seasonId" :indicatorId="slotProps.data.id"/>
                                    </div>
                                    
                                </template>
                                <Column field="employeeId" header="ФИО сотрудника" />
                                <Column field="group" header="Группа" style="max-width: 150px;" />
                                <Column field="periodicity" header="Периодичность" style="max-width: 100px;"/>
                                <Column field="points" header="Балл">
                                    <template #body="{ data }">
                                        <Tag :value="data.points" 
                                             :severity="getSeverity(_, data.point)" />
                                    </template>
                                </Column>
                                <Column field="edit" style="max-width: 40px;">
                                    <template #body="{ data }">
                                        <DeleteEmployeeValue :value="data" @deleted="fetchIndicators" />
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
import DeleteEmployeeValue from "@/components/Microservice/Rating/Methods/DeleteEmployeeValue.vue";
import AddIndToSeason from "@/components/Microservice/Rating/Methods/AddIndToSeason.vue";
import AddEmpToInd from "@/components/Microservice/Rating/Methods/AddEmpToInd.vue";

const router = useRouter();
const route = useRoute();

const seasonId = route.params.idSeason;
const certainSeason = ref({});

const rowsPerPage = ref(10);
const rowsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
];

const goBack = () => router.back();
const loading = ref(true);
const headerTitles = ["Оценки сотрудников", "Период"];
const headerValues = computed(() => 
    [
        calculateTotalEmployeeScores(), 
        getQuarterPeriod(certainSeason?.value?.title?.split('/')[1])
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

const lastAddedIndicatorId = ref(null);

const onIndicatorAdded = (id) => {
    lastAddedIndicatorId.value = id;
    fetchIndicators(id);
};

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

const getTagStyle = (points, allPoints) => {
    if (!allPoints || allPoints.length === 0) {
        return { severity: 'info' };
    }

    if (allPoints.length === 1) {
        return { severity: 'info' };
    }

    const min = Math.min(...allPoints.map(p => Number(p.point)));
    const max = Math.max(...allPoints.map(p => Number(p.point)));
    const val = Number(points);

    const ratio = (val - min) / (max - min || 1);

    const hue = 0 + ratio * 120;

    return {
        style: {
            backgroundColor: `hsl(${hue}, 60%, 40%)`,
            color: '#fff',
            border: 'none'
        }
    }
}

const calculateIndicatorsTotal = (groupName) => {
    return formattedIndicators.value.filter(ind => ind.group === groupName).length;
}

const calculateTotalEmployeeScores = () => {
    return formattedIndicators.value
        .filter(indicator => indicator.employees)
        .reduce((acc, indicator) => acc + indicator.employees.length, 0);
};

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

const lastCreatedId = ref(null);

const rowClass = (data) => {
    return [{ 'highlighted-row': data.id === lastCreatedId.value }];
};

const fetchIndicators = async (highlightId = null) => {
    loading.value = true;
    try {
        const [{ data: groupsData }, { data: indicatorsData }, { data: valuesData }, { data: seasonData }] = await Promise.all([
            axiosInstance.get('/api/rating/groups-indicators'),
            axiosInstance.get(`/api/rating/seasons/${seasonId}/indicators`),
            axiosInstance.get('/api/rating/employee-indicators-value'),
            axiosInstance.get(`/api/rating/seasons/${seasonId}`),
        ]);

        groups.value = groupsData;
        rawIndicators.value = indicatorsData;
        employeeValues.value = valuesData;
        certainSeason.value = seasonData;

        const groupMap = groups.value.reduce((map, g, i) => {
            map.set(g.id, { ...g, index: i + 1 });
            return map;
        }, new Map());


        const grouped = rawIndicators.value.reduce((acc, ind) => {
            const groupId = ind.groupIndicator.id;
            if (!acc[groupId]) acc[groupId] = [];
            acc[groupId].push(ind);
            return acc;
        }, {});

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
                    employees: relatedValues.map(v => ({
                        id: v.id,
                        employeeId: v.employeeId,
                        responsibleEmployeeId: v.responsibleEmployeeId,
                        group: ind.groupIndicator.title,
                        indicatorId: v.indicatorId,
                        periodicity: ind.periodicityIndicators.map(p => p.title).join(', '),
                        points: v.points
                    })),
                    statistics: ind.statistics
                };
            });
        });

        if (lastAddedIndicatorId.value) {
            const addedIndicator = formattedIndicators.value.find(ind => ind.id === lastAddedIndicatorId.value);
            if (addedIndicator) {
                if (!expandedRowGroups.value) {
                    expandedRowGroups.value = [];
                }
                if (!expandedRowGroups.value.includes(addedIndicator.group)) {
                    expandedRowGroups.value.push(addedIndicator.group);
                }
            }
            lastAddedIndicatorId.value = null;
        };

        if (highlightId) {
            lastCreatedId.value = highlightId;
            console.debug(lastCreatedId.value);
            setTimeout(() => {
                lastCreatedId.value = null;
            }, 5000);
        }
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
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 100dvh;
}
header {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-inline: 0rem;
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
.stats-table {
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    overflow: hidden;
    background-color: var(--p-grey-7);
}
.stats-row {
    padding: 6px 10px;
    border-bottom: 1px solid var(--p-grey-3);
    font-size: 0.9rem;
}
.stats-row:last-child {
    border-bottom: none;
}

.stats-title {
    color: var(--p-text-color);
    font-weight: 500;
}
:deep(.p-datatable-row-group-header) {
    background-color: var(--p-grey-7);
}
:deep(.p-datatable-row-expansion .p-datatable-scrollable-table .p-datatable-thead) {
    z-index: 0;
}
/* :deep(.p-datatable-row-expansion .p-datatable-table-container) {
    border-radius: 12px 12px 0 0;
} */
:deep(.p-datatable-row-expansion > td) {
    padding: 0;
}
:deep(.p-datatable-row-expansion .p-datatable-header), 
:deep(.p-datatable-row-expansion .p-datatable-table-container) {
    border-radius: 0;
    border: 0;
}
</style>