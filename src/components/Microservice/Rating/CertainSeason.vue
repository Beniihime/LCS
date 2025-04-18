как мне вот сделать чтобы target и points были построчно, а indicator, periodicity, responsible были span?

<template>
    <main>
        <div class="content-wrapper">
            <header class="header">
                <div class="header-row justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <Button icon="pi pi-arrow-left" size="small" rounded @click="goBack" />
                        <span class="fs-3 ms-4">Показатели эффективности</span>
                    </div>

                    <div class="certain-season">Выбранный сезон: 1 квартал 2025</div>
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
                                <Button label="Добавить" severity="contrast" icon="pi pi-plus" />
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
                            <DeleteIndicator :item="data" />
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
                                        <Button label="Добавить" icon="pi pi-plus" severity="contrast" size="small" />
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
                        <span>Всего показателей: {{ raw.length }}</span>
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
import { ref, computed, watch } from 'vue';
import { useRouter } from "vue-router";

import DeleteIndicator from "@/components/Microservice/Rating/Methods/DeleteIndicator.vue";
import UpdEmployeeValue from "@/components/Microservice/Rating/Methods/UpdEmployeeValue.vue";

const rowsPerPage = ref(10);
const rowsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
];

const router = useRouter();

const goBack = () => {
    router.back();
};

const expandedRows = ref({});
const expandedRowGroups = ref();

const expandAll = () => {
    const groups = [...new Set(raw.value.map(item => item.group))];
    expandedRowGroups.value = groups;
    // Разворачиваем только строки из развернутых групп
    expandedRows.value = raw.value
        .filter(item => groups.includes(item.group))
        .reduce((acc, p) => (acc[p.id] = true) && acc, {});
};
const collapseAll = () => {
    expandedRowGroups.value = [];
    expandedRows.value = null;
};

const searchInd = ref('');
const searchEmp = ref('');

const allExpanded = ref(false);
const toggleExpandAll = () => {
    if (allExpanded.value) {
        collapseAll();
    } else {
        expandAll ();
    }
    allExpanded.value = !allExpanded.value;
};

const filteredIndicators = computed(() => {
    if (!searchInd.value) return raw.value;

    const searchTerm = searchInd.value.toLowerCase();
    const results = raw.value.filter(indicator =>
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

const calculateIndicatorsTotal = (name) => {
    let total = 0;

    if (raw.value) {
        for (let indicator of raw.value) {
            if (indicator.group === name) {
                total++;
            }
        }
    }

    return total;
}

watch(expandedRowGroups, (newGroups, oldGroups) => {
    // Находим группы, которые были свернуты
    const collapsedGroups = oldGroups?.filter(group => !newGroups?.includes(group)) || [];
    
    if (collapsedGroups.length > 0) {
        // Сворачиваем только строки из свернутых групп
        const newExpandedRows = {...expandedRows.value};
        raw.value
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



const raw = ref([
  {
    id: 1,
    number: "1.1",
    indicator: "Средний балл ЕГЭ поступивших на обучение по очной форме по специальностям и направлениям, закрепленным за институтом",
    target: ["менее 60", "60-65", "66-89", "90-100"],
    point: [0, 5, 10, 23],
    periodicity: "3 квартал",
    responsible: "Ответственный секретарь приемной комиссии",
    employees: [
      { name: "Иван Иванов", value: 23, group: "Директор", periodicity: '3 квартал' },
      { name: "Мария Петрова", value: 10 },
    ],
    group: "Директор"
  },
  {
    id: 2,
    number: 1.2,
    indicator: "Процент приема в пределах контрольных цифр приема по специальностям и направлениям, закрепленным за институтом",
    target: ["менее 100%", "100%"],
    point: [0, 3],
    periodicity: "3 квартал",
    responsible: "Ответственный секретарь приемной комиссии",
    employees: [
      { name: "Иван Иванов", value: 0 },
      { name: "Мария Петрова", value: 3 },
      { name: "Григорий Шамрай", value: 4 },
    ],
    group: "Директор"
  },
  {
    id: 3,
    number: 1.3,
    indicator: "Соотношение численности абитуриентов, подавших заявление на поступление, к численности принятых на обучение по специальностям и направлениям, по очной и очно-заочной форме обучения, закрепленным за институтом",
    target: ["менее 1,5", "1,6-2,0", "2,1-3,0", "3,1-4,0"],
    point: [0, 3, 4, 5],
    periodicity: "3 квартал",
    responsible: "Ответственный секретарь приемной комиссии",
    employees: [
      { name: "Иван Иванов", value: 0 },
      { name: "Мария Петрова", value: 3 },
    ],
    group: "Директор"
  },
  {
    id: 4,
    number: 1.4,
    indicator: "Доля принятых на обучения в рамках квоты приема на целевое обучение по специальностям и направлениям, закрепленным за институтом",
    target: ["менее 10%", "10-29%", "30-39%", "40-49%", "более 50%"],
    point: [0, 3, 6, 9, 12],
    periodicity: "3 квартал",
    responsible: "Ответственный секретарь приемной комиссии",
    employees: [
      { name: "Иван Иванов", value: 0 },
      { name: "Мария Петрова", value: 3 },
    ],
    group: "Директор"
  },
  {
    id: 5,
    number: 1.5,
    indicator: "Процент заявлений на поступление на следующий уровень образования, принятых от лиц, имеющих диплом бакалавра, специалиста, магистра, на полученных в других образовательных организациях по специальностям и направлениям, закрепленным за институтом",
    target: ["менее 10%", "10-20%", "20-30%", "30-40%", "40-50%", "50% и более"],
    point: [0, 2, 4, 6, 8, 10],
    periodicity: "3 квартал",
    responsible: "Ответственный секретарь приемной комиссии",
    employees: [
      { name: "Иван Иванов", value: 0 },
      { name: "Мария Петрова", value: 3 },
    ],
    group: "Директор"
  },
  {
    id: 6,
    number: 2.1,
    indicator: "Соотношение приведенной численности лиц, прошедших обучение по дополнительным программам, и приведенного контингента студентов института",
    target: ["0", "1-5%", "6-10%", "11-20%", "21-25%", "более 25%"],
    point: [0, 1, 2, 3, 4, 6],
    periodicity: "1 раз в квартал (1 квартал года следующего за отчетным)",
    responsible: "Директор ИДО",
    employees: [
      { name: "Иван Иванов", value: 0 },
      { name: "Мария Петрова", value: 3 },
    ],
    group: "Заведующий кафедры"
  },
  {
    id: 7,
    number: 2.2,
    indicator: "Доля обучающихся по договорам о целевом обучении в приведенном контингенте студентов института",
    target: ["0", "1-10%", "11-20%", "21-30%", "31-40%", "41-50%", "50% и более"],
    point: [0, 5, 10, 15, 20, 25, 30],
    periodicity: "4 квартал",
    responsible: "Начальник УМУ",
    employees: [
      { name: "Иван Иванов", value: 0 },
      { name: "Мария Петрова", value: 3 },
    ],
    group: "Заведующий кафедры"
  },
]);

const headerTitles = ["Сотрудники", "Показатели", "Период"];
const headerValues = computed(() => [
    12, 27, "Январь-Март"
]);
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