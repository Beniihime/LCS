<template>
    <section class="content-wrapper">
        <div class="section-header">
            <div class="section-title-wrapper">
                <i :class="icon" class="section-icon"></i>
                <div class="section-title-content">
                    <h2 class="section-title">{{ title }}</h2>
                    <p class="section-subtitle" v-if="subtitle">{{ subtitle }}</p>
                </div>
                
                <!-- Кнопка создания с улучшенным дизайном -->
                <slot name="header-actions">
                    <div v-if="showCreateButton" class="create-button-wrapper">
                        <Button 
                            icon="pi pi-plus"
                            :label="createButtonLabel"
                            @click="$emit('create')"
                            class="create-button"
                            :class="{ 'create-button-icon-only': createButtonIconOnly }"
                            v-tooltip="createButtonIconOnly ? 'Создать' : null"
                        >
                            <template #icon>
                                <i class="pi pi-plus create-button-icon"></i>
                            </template>
                        </Button>
                    </div>
                </slot>
            </div>
        </div>

        <!-- Панель быстрых действий -->
        <div v-if="showActionPanel" class="action-panel mb-4">
            <slot name="action-panel" :filters="filters" :clearFilter="clearFilter">
                <div class="action-panel-content">
                    <!-- Поиск и фильтры -->
                    <div class="search-filters">
                        <slot name="quick-search">
                            <div class="search-wrapper">
                                <i class="pi pi-search search-icon"></i>
                                <InputText 
                                    v-model="quickSearch"
                                    placeholder="Быстрый поиск..."
                                    class="quick-search-input"
                                    @input="onQuickSearch"
                                />
                                <Button 
                                    v-if="quickSearch"
                                    icon="pi pi-times"
                                    class="p-button-text p-button-rounded p-button-sm clear-search"
                                    @click="clearQuickSearch"
                                    v-tooltip="'Очистить поиск'"
                                />
                            </div>
                        </slot>
                        
                        <!-- Быстрые фильтры -->
                        <div v-if="showQuickFilters && activeFilters.length > 0" class="active-filters">
                            <div class="active-filters-label">
                                <i class="pi pi-filter"></i>
                                <span>Фильтры:</span>
                            </div>
                            <div class="active-filters-tags">
                                <Tag 
                                    v-for="filter in activeFilters" 
                                    :key="filter.key"
                                    :value="filter.label"
                                    severity="info"
                                    icon="pi pi-filter"
                                    @click="clearFilter(filter.key)"
                                    class="active-filter-tag"
                                />
                                <Button 
                                    label="Сбросить все"
                                    icon="pi pi-times"
                                    class="p-button-text p-button-sm reset-all-filters"
                                    @click="resetFilters"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <!-- Дополнительные кнопки действий -->
                    <div class="action-buttons">
                        <slot name="action-buttons">
                            <Button 
                                v-if="exportConfig"
                                icon="pi pi-file-excel"
                                label="Экспорт"
                                class="p-button-outlined p-button-success export-button"
                                @click="exportData"
                                :loading="exporting"
                            />
                            <Button 
                                icon="pi pi-refresh"
                                class="p-button-text p-button-rounded refresh-button"
                                @click="refreshData"
                                v-tooltip="'Обновить данные'"
                            />
                        </slot>
                    </div>
                </div>
            </slot>
        </div>

        <!-- Таблица -->
        <div class="table-container">
            <DataTable
                :value="tableData.entities" 
                :loading="loading"
                class="p-datatable-sm custom-datatable"
                responsive-layout="scroll"
                filterDisplay="row"
                paginator
                lazy
                :rows="pagination.pageSize"
                :totalRecords="tableData.countEntities"
                :first="pagination.page * pagination.pageSize"
                @page="onPageChange"
                :rowsPerPageOptions="rowsPerPageOptions"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            >
                <template #header>
                    <div class="table-header">
                        <div class="table-header-left">
                            <h4 class="table-title">Все {{ title.toLowerCase() }}</h4>
                            <Badge v-if="tableData.countEntities" :value="tableData.countEntities" severity="info" class="count-badge" />
                        </div>
                        <div class="table-header-right">
                            <slot name="table-header-actions">
                                <!-- Выбор колонок -->
                                <div class="columns-selector">
                                    <i class="pi pi-eye columns-icon"></i>
                                    <MultiSelect 
                                        :modelValue="selectedColumnsComputed"
                                        :options="columns"
                                        optionLabel="header"
                                        display="chip"
                                        placeholder="Колонки"
                                        class="columns-multiselect"
                                        @update:modelValue="onColumnsToggle"
                                    />
                                    <Button 
                                        icon="pi pi-sync"
                                        outlined
                                        severity="secondary"
                                        @click="fetchData"
                                        :loading="loading"
                                        :disabled="loading"
                                    />
                                </div>
                            </slot>
                        </div>
                    </div>
                </template>

                <!-- Стандартные колонки -->
                <template v-for="col in selectedColumnsComputed" :key="col.field">
                    <Column
                        :field="col.field"
                        :header="col.header"
                        :sortable="col.sortable || false"
                        :showFilterMenu="col.showFilterMenu || false"
                        :style="col.style || 'min-width: 180px;'"
                        :class="`column-${col.field}`"
                    >
                        <template #header>
                            <div class="column-header">
                                <i v-if="col.filterable" class="pi pi-filter column-filter-icon"></i>
                            </div>
                        </template>
                        
                        <template #body="{ data }">
                            <slot :name="`body-${col.field}`" :data="data" :column="col">
                                <div class="cell-content">
                                    {{ formatValue(data[col.field]) }}
                                </div>
                            </slot>
                        </template>
                        
                        <template #filter v-if="col.filterable">
                            <slot :name="`filter-${col.field}`" :column="col" :filters="filters" :onInput="debounceFetchData">
                                <!-- Стандартные типы фильтров -->
                                <div class="column-filter">
                                    <InputText 
                                        v-if="col.filterType === 'text'"
                                        v-model="filters[col.filterField || col.field]"
                                        :placeholder="col.placeholder"
                                        @input="debounceFetchData"
                                        class="filter-input"
                                    />
                                    <Select 
                                        v-else-if="col.filterType === 'select'"
                                        v-model="filters[col.filterField || col.field]"
                                        :options="col.options"
                                        optionLabel="label"
                                        optionValue="value"
                                        :placeholder="col.placeholder"
                                        @change="fetchData"
                                        class="filter-select"
                                    />
                                    <Calendar 
                                        v-else-if="col.filterType === 'date'"
                                        v-model="filters[col.filterField || col.field]"
                                        :placeholder="col.placeholder"
                                        dateFormat="dd.mm.yy"
                                        @date-select="fetchData"
                                        class="filter-calendar"
                                    />
                                </div>
                            </slot>
                        </template>
                    </Column>
                </template>
                
                <!-- Колонка действий -->
                <Column v-if="!hideActions" header="Действия" :style="actionsStyle" class="actions-column">
                    <template #header>
                        <div class="actions-header">
                            <i class="pi pi-cog"></i>
                        </div>
                    </template>
                    
                    <template #body="{ data }">
                        <slot name="actions" :data="data">
                            <div class="actions-buttons">
                                <Button 
                                    v-if="!hideEdit"
                                    icon="pi pi-pencil" 
                                    class="p-button-text p-button-rounded p-button-sm action-button edit-button"
                                    @click="$emit('edit', data)"
                                    v-tooltip="'Редактировать'"
                                />
                                <Button 
                                    v-if="!hideDelete"
                                    icon="pi pi-trash"
                                    severity="danger"
                                    class="p-button-text p-button-rounded p-button-sm action-button delete-button"
                                    @click="$emit('delete', data)"
                                    v-tooltip="'Удалить'"
                                />
                                <!-- Дополнительные действия -->
                                <slot name="additional-actions" :data="data"></slot>
                            </div>
                        </slot>
                    </template>
                </Column>

                <!-- Кастомные колонки -->
                <slot name="custom-columns"></slot>

                <template #paginatorstart>
                    <div class="paginator-start">
                        <div class="paginator-info">
                            <span class="paginator-total">Всего: {{ tableData.countEntities }}</span>
                            <span class="paginator-pages" v-if="tableData.countPages > 1">
                                (Страница {{ pagination.page + 1 }} из {{ tableData.countPages }})
                            </span>
                        </div>
                        <slot name="paginator-start"></slot>
                    </div>
                </template>

                <template #paginatorend>
                    <div class="paginator-end">
                        <div class="rows-per-page">
                            <span class="rows-label">Строк:</span>
                            <Select 
                                v-model="pagination.pageSize"
                                :options="rowsPerPageOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="rows-select"
                                @change="onRowsChange"
                            />
                        </div>
                        <slot name="paginator-end"></slot>
                    </div>
                </template>

                <!-- Состояние "Нет данных" -->
                <template #empty>
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i :class="emptyIcon || 'pi pi-database'" class="empty-icon"></i>
                        </div>
                        <div class="empty-state-content">
                            <h3 class="empty-title">{{ emptyTitle || 'Нет данных' }}</h3>
                            <p class="empty-message">{{ emptyMessage || `Начните создавать ${title.toLowerCase()}, чтобы увидеть их здесь.` }}</p>
                            <slot name="empty">
                                <Button 
                                    v-if="showCreateButton"
                                    icon="pi pi-plus"
                                    :label="emptyButtonLabel || `Создать ${title.toLowerCase()}`"
                                    @click="$emit('create')"
                                    class="empty-create-button"
                                />
                            </slot>
                        </div>
                    </div>
                </template>

                <!-- Состояние загрузки -->
                <template #loading>
                    <div class="loading-state">
                        <div class="loading-spinner">
                            <ProgressSpinner style="width: 60px; height: 60px" strokeWidth="4" />
                        </div>
                        <div class="loading-content">
                            <h3 class="loading-title">Загрузка данных</h3>
                            <p class="loading-message">Пожалуйста, подождите...</p>
                        </div>
                    </div>
                </template>
            </DataTable>
        </div>
    </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const props = defineProps({
    title: String,
    subtitle: String,
    icon: String,
    columns: Array,
    fetchFunction: Function,
    initialFilters: {
        type: Object,
        default: () => ({})
    },
    rowsPerPageOptions: {
        type: Array,
        default: () => [
            { label: '5', value: 5 },
            { label: '10', value: 10 },
            { label: '20', value: 20 },
            { label: '50', value: 50 },
            { label: '100', value: 100 }
        ]
    },
    defaultColumns: {
        type: Array,
        default: () => []
    },
    showCreateButton: {
        type: Boolean,
        default: true
    },
    createButtonLabel: {
        type: String,
        default: 'Создать'
    },
    createButtonIconOnly: {
        type: Boolean,
        default: false
    },
    hideActions: {
        type: Boolean,
        default: false
    },
    hideEdit: {
        type: Boolean,
        default: false
    },
    hideDelete: {
        type: Boolean,
        default: false
    },
    actionsStyle: {
        type: String,
        default: 'width: 120px; min-width: 120px;'
    },
    emptyIcon: String,
    emptyTitle: String,
    emptyMessage: String,
    emptyButtonLabel: String,
    exportConfig: {
        type: Object,
        default: null
    },
    showActionPanel: {
        type: Boolean,
        default: false
    },
    showQuickFilters: {
        type: Boolean,
        default: false
    },
    enableQuickSearch: {
        type: Boolean,
        default: false
    },
    quickSearchField: {
        type: String,
        default: false
    }
});

const emit = defineEmits(['edit', 'delete', 'create', 'export', 'refresh']);

// Данные таблицы
const tableData = ref({
    entities: [],
    countPages: null,
    countEntities: null
});

const pagination = ref({
    page: 0,
    pageSize: 10
});

const filters = ref({ ...props.initialFilters });
const loading = ref(false);
const exporting = ref(false);
const quickSearch = ref('');

// Управление колонками
const selectedColumns = ref(props.defaultColumns.length ? props.defaultColumns : props.columns.map(c => c.field));
const selectedColumnsComputed = computed(() => 
    props.columns.filter(c => selectedColumns.value.includes(c.field))
);

// Активные фильтры для отображения
const activeFilters = computed(() => {
    const active = [];
    for (const [key, value] of Object.entries(filters.value)) {
        if (value !== null && value !== undefined && value !== '') {
            const column = props.columns.find(col => col.field === key || col.filterField === key);
            if (column) {
                let displayValue = value;
                if (column.filterType === 'select' && column.options) {
                    const option = column.options.find(opt => opt.value === value);
                    displayValue = option ? option.label : value;
                }
                active.push({
                    key,
                    label: `${column.header}: ${displayValue}`,
                    value
                });
            }
        }
    }
    return active;
});

// Debounce таймер
let debounceTimer;

// Быстрый поиск
const onQuickSearch = () => {
    if (props.enableQuickSearch && props.quickSearchField) {
        filters.value[props.quickSearchField] = quickSearch.value;
    } else if (props.enableQuickSearch) {
        // Если не указано поле, используем первое текстовое поле
        const textColumn = props.columns.find(col => col.filterType === 'text');
        if (textColumn) {
            filters.value[textColumn.filterField || textColumn.field] = quickSearch.value;
        }
    }
    debounceFetchData();
};

const clearQuickSearch = () => {
    quickSearch.value = '';
    if (props.quickSearchField) {
        filters.value[props.quickSearchField] = '';
    } else {
        const textColumn = props.columns.find(col => col.filterType === 'text');
        if (textColumn) {
            filters.value[textColumn.filterField || textColumn.field] = '';
        }
    }
    debounceFetchData();
};

// Форматирование значения по умолчанию
const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
    if (Array.isArray(value) && value.length === 0) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
};

// Основные методы
const fetchData = async () => {
    loading.value = true;
    try {
        const request = {
            page: pagination.value.page + 1,
            pageSize: pagination.value.pageSize,
            ...cleanFilters(filters.value)
        };
        
        const { data } = await props.fetchFunction(request);
        tableData.value = data;
        emit('refresh', data);
    } catch (error) {
        console.error(`Ошибка при получении ${props.title.toLowerCase()}:`, error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: `Не удалось загрузить ${props.title.toLowerCase()}`,
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const refreshData = () => {
    pagination.value.page = 0;
    fetchData();
    toast.add({
        severity: 'info',
        summary: 'Обновление',
        detail: 'Данные обновляются...',
        life: 2000
    });
};

const cleanFilters = (filterObj) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(filterObj)) {
        if (value === null || value === undefined) continue;
        if (typeof value === 'string' && value.trim() === '') continue;
        if (Array.isArray(value) && value.length === 0) continue;
        cleaned[key] = value;
    }
    return cleaned;
};

const debounceFetchData = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        pagination.value.page = 0;
        fetchData();
    }, 500);
};

const onPageChange = (event) => {
    pagination.value.page = event.page;
    pagination.value.pageSize = event.rows;
    fetchData();
};

const onRowsChange = () => {
    pagination.value.page = 0;
    fetchData();
};

const onColumnsToggle = (val) => {
    selectedColumns.value = val.map(col => col.field);
    localStorage.setItem(`${props.title}_columns`, JSON.stringify(selectedColumns.value));
};

const clearFilter = (key) => {
    if (filters.value.hasOwnProperty(key)) {
        filters.value[key] = null;
        // Очищаем quick search если это поле поиска
        if (props.quickSearchField === key || 
            (!props.quickSearchField && props.columns.some(col => 
                (col.filterField || col.field) === key && col.filterType === 'text'
            ))) {
            quickSearch.value = '';
        }
        pagination.value.page = 0;
        fetchData();
    }
};

const resetFilters = () => {
    filters.value = { ...props.initialFilters };
    quickSearch.value = '';
    pagination.value.page = 0;
    fetchData();
};

const exportData = async () => {
    if (!props.exportConfig) return;
    
    exporting.value = true;
    try {
        const request = {
            page: 1,
            pageSize: 10000,
            ...cleanFilters(filters.value)
        };
        
        const { data } = await props.fetchFunction(request);
        
        emit('export', {
            data: data.entities,
            columns: selectedColumnsComputed.value,
            title: props.title
        });
        
        toast.add({
            severity: 'success',
            summary: 'Экспорт',
            detail: `Экспортировано ${data.entities.length} записей`,
            life: 3000
        });
    } catch (error) {
        console.error('Ошибка при экспорте:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось экспортировать данные',
            life: 3000
        });
    } finally {
        exporting.value = false;
    }
};

// Восстановление сохраненных колонок
onMounted(async () => {
    const savedColumns = localStorage.getItem(`${props.title}_columns`);
    if (savedColumns) {
        try {
            selectedColumns.value = JSON.parse(savedColumns);
        } catch (e) {
            console.error('Ошибка при восстановлении колонок:', e);
        }
    }
    
    await fetchData();
});

// Экспортируем методы для доступа из родительского компонента
defineExpose({
    fetchData,
    refreshData,
    clearFilter,
    resetFilters,
    refresh: fetchData,
    getData: () => tableData.value,
    getFilters: () => filters.value,
    setFilter: (key, value) => {
        filters.value[key] = value;
        pagination.value.page = 0;
        fetchData();
    }
});
</script>

<style scoped>
/* ========== Основные стили ========== */
.content-wrapper {
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 2rem 4rem;
    overflow: hidden;
    color: var(--p-text-color);
    min-height: calc(100vh - 200px);
}

/* ========== Заголовок секции ========== */
.section-header {
    margin-bottom: 2rem;
}

.section-title-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.section-title-content {
    flex: 1;
    min-width: 200px;
}

.section-title {
    font-size: 2rem;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, var(--p-primary-600), var(--p-primary-400));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.5px;
}

.p-dark .section-title {
    background: linear-gradient(135deg, var(--p-primary-400), var(--p-primary-300));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.section-subtitle {
    color: var(--p-text-color-secondary);
    font-size: 0.95rem;
    margin: 0;
    opacity: 0.8;
}

.section-icon {
    font-size: 2rem;
    color: white;
    padding: 1rem;
    background: linear-gradient(135deg, var(--p-primary-600), var(--p-primary-400));
    border-radius: 16px;
    box-shadow: 0 8px 25px rgba(var(--p-primary-color-rgb, 59, 130, 246), 0.3);
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.p-dark .section-icon {
    background: linear-gradient(135deg, var(--p-primary-700), var(--p-primary-500));
    box-shadow: 0 8px 25px rgba(var(--p-primary-color-rgb, 59, 130, 246), 0.4);
}

/* ========== Кнопка создания ========== */
.create-button-wrapper {
    flex-shrink: 0;
}

.create-button {
    background: linear-gradient(135deg, var(--p-primary-600), var(--p-primary-400)) !important;
    border: none;
    color: white !important;
    padding: 0.875rem 1.75rem;
    border-radius: 12px;
    font-weight: 600;
    letter-spacing: 0.3px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    border: none;
    overflow: hidden;
}

.create-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.7s ease;
}

.create-button:hover {
    background: linear-gradient(135deg, var(--p-primary-700), var(--p-primary-500));
    transform: translateY(-2px);
    border: none !important;
    box-shadow: 0 8px 25px rgba(var(--p-primary-color-rgb, 59, 130, 246), 0.35);
}

.create-button:hover::before {
    left: 100%;
}

.create-button:active {
    transform: translateY(0);
    box-shadow: 0 4px 15px rgba(var(--p-primary-color-rgb, 59, 130, 246), 0.3);
}

.create-button-icon {
    margin-right: 0.5rem;
    font-weight: bold;
}

.create-button-icon-only {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.create-button-icon-only .create-button-icon {
    margin-right: 0;
    font-size: 1.2rem;
}

.p-dark .create-button {
    background: linear-gradient(135deg, var(--p-primary-700), var(--p-primary-500));
}

.p-dark .create-button:hover {
    background: linear-gradient(135deg, var(--p-primary-800), var(--p-primary-600));
}

/* ========== Панель действий ========== */
.action-panel {
    background: linear-gradient(135deg, var(--p-surface-50), var(--p-surface-100));
    border-radius: 16px;
    padding: 1.25rem;
    border: 1px solid var(--p-surface-200);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    margin-bottom: 2rem;
}

.p-dark .action-panel {
    background: linear-gradient(135deg, var(--p-surface-800), var(--p-surface-900));
    border-color: var(--p-surface-700);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.action-panel-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.search-filters {
    flex: 1;
    min-width: 300px;
}

.search-wrapper {
    position: relative;
    display: inline-block;
    width: 100%;
    max-width: 400px;
}

.search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--p-text-color-secondary);
    z-index: 1;
}

.quick-search-input {
    width: 100%;
    padding-left: 3rem !important;
    padding-right: 3rem !important;
    border-radius: 10px;
    border: 1px solid var(--p-surface-300);
    background: var(--p-surface-0);
    transition: all 0.3s ease;
}

.quick-search-input:focus {
    border-color: var(--p-primary-400);
    box-shadow: 0 0 0 2px rgba(var(--p-primary-color-rgb, 59, 130, 246), 0.1);
    background: var(--p-surface-0);
}

.p-dark .quick-search-input {
    background: var(--p-surface-800);
    border-color: var(--p-surface-600);
}

.p-dark .quick-search-input:focus {
    background: var(--p-surface-700);
}

.clear-search {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--p-text-color-secondary) !important;
}

.active-filters {
    margin-top: 1rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
}

.active-filters-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--p-text-color-secondary);
    font-size: 0.9rem;
    white-space: nowrap;
}

.active-filters-tags {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.active-filter-tag {
    cursor: pointer;
    transition: all 0.2s ease;
}

.active-filter-tag:hover {
    opacity: 0.8;
    transform: scale(0.98);
}

.reset-all-filters {
    color: var(--p-text-color-secondary) !important;
    font-size: 0.875rem;
}

.action-buttons {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
}

.export-button {
    border-radius: 8px;
    padding: 0.5rem 1rem;
}

.refresh-button {
    color: var(--p-text-color-secondary) !important;
    transition: all 0.3s ease;
}

.refresh-button:hover {
    transform: rotate(180deg);
    color: var(--p-primary-500) !important;
}

/* ========== Заголовок таблицы ========== */
.table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    padding: 0 0.25rem;
}

.table-header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.table-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    color: var(--p-text-color);
}

.count-badge {
    font-size: 0.875rem;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
}

.columns-selector {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--p-surface-100);
    padding: 0.5rem 1rem;
    border-radius: 10px;
    border: 1px solid var(--p-surface-200);
}

.p-dark .columns-selector {
    background: var(--p-surface-800);
    border-color: var(--p-surface-700);
}

.columns-icon {
    color: var(--p-primary-500);
    font-size: 1.1rem;
}

.columns-multiselect {
    min-width: 200px;
}

/* ========== Стили колонок таблицы ========== */
.custom-datatable {
    border: 1px solid var(--p-surface-200);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    background: var(--p-surface-0);
}

.p-dark .custom-datatable {
    border-color: var(--p-surface-700);
    background: var(--p-surface-900);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.column-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--p-text-color);
}

.column-filter-icon {
    font-size: 0.8rem;
    color: var(--p-text-color-secondary);
    opacity: 0.6;
}

.column-filter {
    width: 100%;
}

.filter-input,
.filter-select,
.filter-calendar {
    width: 100% !important;
}

.cell-content {
    padding: 0.5rem 0;
}

/* ========== Колонка действий ========== */
.actions-column {
    text-align: center !important;
}

.actions-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: var(--p-text-color);
}

.actions-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.action-button {
    transition: all 0.2s ease;
}

/* ========== Пагинация ========== */
.paginator-start {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.paginator-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--p-text-color);
}

.paginator-total {
    font-weight: 600;
}

.paginator-pages {
    color: var(--p-text-color-secondary);
    font-size: 0.9rem;
}

.paginator-end {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.rows-per-page {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.rows-label {
    color: var(--p-text-color-secondary);
    font-size: 0.9rem;
}

.rows-select {
    min-width: 80px;
}

/* ========== Состояние "Нет данных" ========== */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
}

.empty-state-icon {
    margin-bottom: 1.5rem;
}

.empty-icon {
    font-size: 4rem;
    color: var(--p-surface-300);
    opacity: 0.5;
}

.empty-state-content {
    max-width: 400px;
}

.empty-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--p-text-color);
    margin-bottom: 0.75rem;
}

.empty-message {
    color: var(--p-text-color-secondary);
    line-height: 1.6;
    margin-bottom: 1.5rem;
}

.empty-create-button {
    background: linear-gradient(135deg, var(--p-primary-600), var(--p-primary-400));
    border: none !important;
    color: white !important;
    padding: 0.75rem 1.5rem;
    border-radius: 10px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 600;
}

.empty-create-button:hover {
    background: linear-gradient(135deg, var(--p-primary-700), var(--p-primary-500)) !important;
}

/* ========== Состояние загрузки ========== */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
}

.loading-spinner {
    margin-bottom: 1.5rem;
}

.loading-content {
    max-width: 300px;
}

.loading-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--p-text-color);
    margin-bottom: 0.5rem;
}

.loading-message {
    color: var(--p-text-color-secondary);
    font-size: 0.95rem;
}

/* Переопределяем глобальный стиль для строк таблицы */
:deep(.custom-datatable .p-datatable-tbody > tr:hover),
:deep(.custom-datatable .p-datatable-tbody > tr:hover > td.p-datatable-frozen-column) {
    background: inherit !important;
    transition: none !important;
}

/* ========== Адаптивность ========== */
@media (max-width: 1400px) {
    .content-wrapper {
        padding: 1.75rem 3rem;
    }
}

@media (max-width: 1200px) {
    .action-panel-content {
        flex-direction: column;
        align-items: stretch;
    }
    
    .search-filters,
    .action-buttons {
        width: 100%;
    }
    
    .search-wrapper {
        max-width: 100%;
    }
}

@media (max-width: 1024px) {
    .content-wrapper {
        padding: 1.5rem 2rem;
    }
    
    .section-title-wrapper {
        gap: 1rem;
    }
    
    .section-title {
        font-size: 1.75rem;
    }
    
    .table-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }
    
    .table-header-left,
    .table-header-right {
        width: 100%;
        justify-content: space-between;
    }
}

@media (max-width: 768px) {
    .content-wrapper {
        padding: 1.25rem 1rem;
    }
    
    .section-title-wrapper {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
    
    .create-button-wrapper {
        width: 100%;
    }
    
    .create-button {
        width: 100%;
    }
    
    .section-title {
        font-size: 1.5rem;
    }
    
    .section-icon {
        font-size: 1.75rem;
        padding: 0.875rem;
    }
    
    .section-subtitle {
        font-size: 0.9rem;
    }
    
    .action-panel {
        padding: 1rem;
    }
    
    .table-title {
        font-size: 1.25rem;
    }
    
    .columns-selector {
        width: 100%;
    }
    
    .columns-multiselect {
        min-width: unset;
        width: 100%;
    }
}

@media (max-width: 480px) {
    .active-filters {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .paginator-start,
    .paginator-end {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    
    .actions-buttons {
        flex-direction: column;
        gap: 0.25rem;
    }
}
</style>