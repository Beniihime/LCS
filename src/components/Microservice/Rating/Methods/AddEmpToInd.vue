<template>
    <Button 
        icon="pi pi-pencil"
        text
        size="small"
        v-tooltip.top="'Добавить оценку'"
        @click="openDialog"
    />
    <Dialog v-model:visible="visible" header="Добавить оценку сотруднику" modal
        :style="{ width: '90vw', maxWidth: '1400px' }" class="add-employee-dialog">
        
        <div class="dialog-content">
            <!-- Left Side -->
            <div class="indicator-info-section">
                <div class="section-card">
                    <h3 class="section-title">
                        <i class="pi pi-info-circle"></i>
                        Информация о показателе
                    </h3>
                    <div class="indicator-details">
                        <div class="detail-item">
                            <span class="detail-label">Номер:</span>
                            <span class="detail-value">
                                {{ indicatorData.groupIndicator?.numberInOrder || 'N' }}.{{ indicatorData.subGroupIndicator?.numberInOrder || 'N' }}.{{ indicatorData.numberInOrder }}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Название:</span>
                            <span class="detail-value">{{ indicatorData.title }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Группа:</span>
                            <span class="detail-value">{{ indicatorData.groupIndicator?.title || '-' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Подгруппа:</span>
                            <span class="detail-value">{{ indicatorData.subGroupIndicator?.title || '-' }}</span>
                        </div>
                    </div>
                </div>

                <div class="section-card">
                    <h3 class="section-title">
                        <i class="pi pi-chart-line"></i>
                        Система оценивания
                    </h3>

                    <!-- Переключатель между табличным и списковым видом -->
                    <div class="view-toggle">
                        <Button 
                            :label="showTableView ? 'Списком' : 'Таблицей'" 
                            icon="pi pi-table" 
                            text
                            size="small"
                            @click="showTableView = !showTableView"
                        />
                    </div>

                    <!-- Табличное представление -->
                    <div v-if="showTableView && parsedTableData.length > 0" class="table-view">
                        <div class="table-container" v-html="indicatorData.scores[0]?.description?.table || ''"></div>
                    </div>

                    <!-- Списковое представление -->
                    <div v-else-if="parsedScores.length > 0" class="scores-container">
                        <div class="scores-header">
                            <span>Критерий оценивания</span>
                            <span>Баллы</span>
                        </div>
                        <div class="scores-list">
                            <div v-for="(score, index) in parsedScores" :key="index"
                                class="score-item" :class="{ 'selected': selectedScore === score.points }"
                                @click="selectScore(score)"
                            >
                                <span class="score-criteria" v-html="score.criteria"></span>
                                <span class="score-points">{{ score.points }}</span>
                            </div>
                        </div>
                    </div>
                    <div v-else class="no-scores">
                        <i class="pi pi-exclamation-triangle"></i>
                        <p>Нет доступных критериев оценивания</p>
                    </div>
                </div>
            </div>

            <!-- Right Side -->
            <div class="employee-form-section">
                <div class="section-card">
                    <h3 class="section-title">
                        <i class="pi pi-user-plus"></i>
                        Выбор сотрудника
                    </h3>

                    <div class="search-section">
                        <div class="search-input-wrapper">
                            <i class="pi pi-search search-icon"></i>
                            <InputText 
                                v-model="searchQuery"
                                placeholder="Поиск сотрудника по ФИО"
                                class="search-input"
                                @input="searchEmployees"
                            />
                            <Button 
                                icon="pi pi-times"
                                text
                                class="clear-search"
                                @click="clearSearch"
                                v-if="searchQuery"
                            />
                        </div>
                    </div>

                    <div class="employees-list">
                        <div v-if="filteredEmployees.length > 0" class="employees-scrollable">
                            <div v-for="employee in filteredEmployees" :key="employee.id"
                                class="employee-card" :class="{ 'selected': selectedEmployee?.id === employee.id }"
                                @click="selectEmployee(employee)"
                            >
                                <div class="employee-avatar">
                                    <i class="pi pi-user"></i>
                                </div>
                                <div class="employee-info">
                                    <span class="employee-name">
                                        {{ employee.lastName }} {{ employee.firstName }} {{ employee.middleName || '' }}
                                    </span>
                                    <span class="employee-position">
                                        {{ employee.jobPositions?.map(jp => jp.title).join(', ') || '-' }}
                                    </span>
                                </div>
                                <div class="employee-actions">
                                    <i class="pi pi-check selected-icon" v-if="selectedEmployee?.id === employee.id"></i>
                                </div>
                            </div>
                        </div>
                        <div v-else-if="loadingEmployees" class="loading-employees">
                            <ProgressSpinner style="width: 30px; height: 30px" />
                            <span>Загрузка сотрудников...</span>
                        </div>
                        <div v-else class="no-employees">
                            <i class="pi pi-users"></i>
                            <p>Сотрудники не найдены</p>
                        </div>
                    </div>
                </div>

                <div class="section-card">
                    <h3 class="section-title">
                        <i class="pi pi-plus"></i>
                        Добавление оценки
                    </h3>

                    <div class="selected-info">
                        <div v-if="selectedEmployee" class="selected-employee">
                            <span class="selected-label">Выбранный сотрудник:</span>
                            <span class="selected-value">
                                {{ selectedEmployee.lastName }} {{ selectedEmployee.firstName }} {{ selectedEmployee.middleName || '' }}
                            </span>
                        </div>
                        <div v-if="selectedScore !== null" class="selected-score">
                            <span class="selected-label">Выбранные баллы:</span>
                            <span class="selected-value">{{ selectedScore }}</span>
                        </div>
                        <div v-if="manualPoints > 0" class="manual-points">
                            <span class="selected-label">Ручной ввод:</span>
                            <InputNumber 
                                v-model="manualPoints"
                                :min="-20.00"
                                :max="100.00"
                                size="small"
                                @update:modelValue="selectManualPoints"
                            />
                        </div>
                    </div>

                    <div class="action-buttons">
                        <Button 
                            label="Добавить оценку"
                            icon="pi pi-check"
                            severity="success"
                            @click="submitEvaluation"
                            :disabled="!canSubmit"
                            :loading="submitting"
                            class="submit-button"
                        />
                        <Button 
                            label="Отмена"
                            icon="pi pi-times"
                            severity="secondary"
                            @click="closeDialog"
                            class="cancel-button"
                        />
                    </div>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import axiosInstance from '@/utils/axios';
import smartTableParser from '@/utils/universalParser';

const props = defineProps({
    indicatorId: Number,
    seasonId: String,
    indicatorData: {
        type: Object,
        default: () => ({})
    }
});

const emit = defineEmits(['updated']);

const visible = ref(false);
const loadingEmployees = ref(false);
const submitting = ref(false);
const showTableView = ref(false);

const allEmployees = ref([]);
const filteredEmployees = ref([]);
const searchQuery = ref('');
const selectedEmployee = ref(null);

const parsedScores = ref([]);
const parsedTableData = ref([]);
const selectedScore = ref(null);
const manualPoints = ref(0.00);

const openDialog = async () => {
    visible.value = true;
    await loadEmployees();
    parseScores();
}

const closeDialog = () => {
    visible.value = false;
    resetForm();
}

const resetForm = () => {
    selectedEmployee.value = null;
    selectedScore.value = null;
    searchQuery.value = '';
    filteredEmployees.value = allEmployees.value;
}

const canSubmit = computed(() =>{
    return selectedEmployee.value !== null && selectedScore.value !== null;
});

const loadEmployees = async () => {
    loadingEmployees.value = true;
    try {
        const response = await axiosInstance.get('/api/rating/employees');
        allEmployees.value = response.data.employees || [];
        filteredEmployees.value = allEmployees.value;
    } catch (error) {
        console.error('Ошибка при загрузке сотрудников: ', error);
        allEmployees.value = [];
        filteredEmployees.value = [];
    } finally {
        loadingEmployees.value = false;
    }
}

const searchEmployees = () => {
    if (!searchQuery.value.trim()) {
        filteredEmployees.value = allEmployees.value;
        return;
    }

    const query = searchQuery.value.toLowerCase();
    filteredEmployees.value = allEmployees.value.filter(employee => {
        const fullName = `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.toLowerCase();
        const positions = employee.jobPositions?.map(jp => jp.title.toLowerCase()).join(' ') || '';

        return fullName.includes(query) || positions.includes(query);
    })
};

const clearSearch = () => {
    searchQuery.value = '';
    filteredEmployees.value = allEmployees.value;
}

const selectEmployee = (employee) => {
    selectedEmployee.value = employee;
}

const IGNORED_HEADER_TITLES = new Set([
    'оценочные значения выполнения показателей эффективности',
    'количество баллов'
]);

/* --------------------- Интеграция в parseScores --------------------- */

const parseScores = () => {
    parsedScores.value = [];
    parsedTableData.value = [];

    if (!props.indicatorData.scores || !Array.isArray(props.indicatorData.scores) || props.indicatorData.scores.length === 0) {
        return;
    }

    try {
        const aggregated = [];

        props.indicatorData.scores.forEach(scoreItem => {
            if (scoreItem.description?.table) {
                parsedTableData.value.push(scoreItem.description.table);
                const parsed = smartTableParser(scoreItem.description.table);
                parsed.forEach(p => aggregated.push(p));
            }

            if (scoreItem.description?.list && Array.isArray(scoreItem.description.list)) {
                scoreItem.description.list.forEach(item => {
                    const title = normalizeText(item.title || item.name || item.criteria || '');
                    const val = item.point !== undefined && item.point !== null ? String(item.point) : item.value || '';
                    const extracted = extractPointsAndFormula(val || title);
                    const criteria = title && !IGNORED_HEADER_TITLES.has(title.toLowerCase()) ? title : (extracted.raw || title);
                    if ((extracted.points !== null && !isNaN(extracted.points)) || extracted.formula) {
                        aggregated.push({
                            criteria,
                            points: (extracted.points !== null && !isNaN(extracted.points)) ? extracted.points : null,
                            formula: extracted.formula || null,
                            raw: extracted.raw || val
                        });
                    } else if (val && val.trim()) {
                        aggregated.push({
                            criteria,
                            points: null,
                            formula: val.trim(),
                            raw: val.trim()
                        });
                    }
                });
            }

            if (scoreItem.description?.text && !scoreItem.description?.table) {
                const parsed = smartTableParser(scoreItem.description.text);
                parsed.forEach(p => aggregated.push(p));
            }

            if (typeof scoreItem === 'string') {
                const parsed = smartTableParser(scoreItem);
                parsed.forEach(p => aggregated.push(p));
            }
        });

        const seen = new Set();
        const cleaned = [];
        for (const it of aggregated) {
            if (!((it.points !== null && !isNaN(it.points)) || (it.formula && it.formula.length))) continue;
            let crit = (it.criteria || '').trim();
            if (!crit) crit = (it.raw || '').trim();
            if (!crit) continue;
            const lowCrit = crit.toLowerCase();
            if (IGNORED_HEADER_TITLES.has(lowCrit)) continue;
            const key = `${crit}|${it.points !== null ? it.points : ''}|${it.formula || ''}`;
            if (seen.has(key)) continue;
            seen.add(key);
            cleaned.push({
                criteria: crit,
                points: (it.points !== null && !isNaN(it.points)) ? it.points : null,
                formula: it.formula || null,
                raw: it.raw || ''
            });
        }

        const suffixedBases = new Set();
        cleaned.forEach(item => {
            const m = item.criteria.match(/^(.*)\s*\(.+\)$/);
            if (m) {
                const base = m[1].trim();
                if (base) suffixedBases.add(base);
            }
        });
        const finalList = cleaned.filter(item => {
            // если есть точное совпадение с базой — удаляем
            if (suffixedBases.has(item.criteria.trim())) return false;
            return true;
        });

        parsedScores.value = finalList;
    } catch (err) {
        console.error('Ошибка при парсинге системы оценивания:', err);
        parsedScores.value = [];
        parsedTableData.value = [];
    }
};

/* --------------------- UI handlers --------------------- */

const selectScore = (score) => {
    if (score.points !== null && !isNaN(score.points)) {
        selectedScore.value = score.points;
        manualPoints.value = 0;
    } else {
        // Формулы — не выбираем автоматически. Пользователь вводит manualPoints в UI.
        selectedScore.value = null;
        manualPoints.value = 0;
        // Можно показывать тултип, если нужно.
    }
};

const selectManualPoints = (value) => {
    if (value !== null && value !== undefined) {
        manualPoints.value = value;
        selectedScore.value = null;
    }
};

const submitEvaluation = async () => {
    if (!canSubmit.value) return;

    submitting.value = true;
    try {
        const pointsToSubmit = selectedScore.value !== null ? selectedScore.value : manualPoints.value;

        await axiosInstance.post('/api/rating/employee-indicators-value', {
            employeeId: selectedEmployee.value.id,
            indicatorId: props.indicatorId,
            seasonId: Number(props.seasonId),
            points: pointsToSubmit,
            jobPosition: selectedEmployee.value.jobPositions?.[0]?.title || 'Не указана'
        });

        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Рейтинг', 
                detail: `Оценка для сотрудника добавлена успешно`,
            }
        }));

        emit('updated');
        closeDialog();
    } catch (error) {
        console.error('Ошибка при добавлении оценки:', error);
        
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'danger', 
                summary: 'Рейтинг', 
                detail: `Не удалось добавить оценку: ${error.response?.data?.message || error.message}`,
            }
        }));
    } finally {
        submitting.value = false;
    }
};


</script>

<style scoped>
.dialog-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    height: 70vh;
}

.indicator-info-section,
.employee-form-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.section-card {
    background: var(--p-grey-7);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid var(--p-grey-4);
}

.section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    color: var(--p-text-color);
    font-weight: 600;
}

/* Стили для переключателя вида */
.view-toggle {
    margin-bottom: 1rem;
    display: flex;
    justify-content: flex-end;
}

/* Стили для табличного представления */
.table-view {
    border: 1px solid var(--p-grey-4);
    border-radius: 8px;
    overflow: auto;
    max-height: 300px;
}

.table-container {
    padding: 0.25rem;
}

.table-container table {
    width: 100%;
    border-collapse: collapse;
}

.table-container th,
.table-container td {
    border: 1px solid var(--p-grey-4);
    padding: 0.5rem;
    text-align: center;
}

.table-container th {
    background: var(--p-grey-3);
    font-weight: 600;
}
/* Стили для системы оценивания */
.scores-container {
    border: 1px solid var(--p-grey-4);
    border-radius: 8px;
    overflow: hidden;
}

.scores-header {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    background: var(--p-grey-3);
    font-weight: 600;
    border-bottom: 1px solid var(--p-grey-4);
}

.scores-list {
    max-height: 200px;
    overflow-y: auto;
}

.score-item {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid var(--p-grey-4);
}

.score-item:last-child {
    border-bottom: none;
}

.score-item:hover {
    background: var(--p-grey-5);
}

.score-item.selected {
    background: var(--p-primary-color);
    color: white;
}

.score-criteria {
    flex: 1;
    line-height: 1.4;
}

.score-points {
    font-weight: 600;
    min-width: 50px;
    text-align: right;
}

.no-scores {
    text-align: center;
    padding: 2rem;
    color: var(--p-text-color-secondary);
}


/* Стили для информации о показателе */
.indicator-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.detail-item {
    display: flex;
    justify-content: between;
    gap: 1rem;
}

.detail-label {
    font-weight: 600;
    color: var(--p-text-color-secondary);
    min-width: 100px;
}

.detail-value {
    color: var(--p-text-color);
    flex: 1;
}

/* Стили для поиска сотрудников */
.search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--p-text-color-secondary);
    z-index: 1;
}

.search-input {
    padding-left: 2.5rem;
    padding-right: 2.5rem;
    width: 100%;
}

.clear-search {
    position: absolute;
    right: 0.5rem;
    color: var(--p-text-color-secondary);
}

.employees-list {
    margin-top: 1rem;
}

.employees-scrollable {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--p-grey-4);
    border-radius: 8px;
}

.employee-card {
    display: flex;
    align-items: center;
    padding: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid var(--p-grey-4);
}

.employee-card:last-child {
    border-bottom: none;
}

.employee-card:hover {
    background: var(--p-grey-5);
}

.employee-card.selected {
    background: var(--p-primary-color);
    color: white;
}

.employee-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--p-grey-4);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
}

.employee-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.employee-name {
    font-weight: 600;
}

.employee-position {
    font-size: 0.875rem;
    opacity: 0.8;
}

.employee-actions {
    margin-left: auto;
}

.selected-icon {
    color: inherit;
}

.loading-employees,
.no-employees {
    text-align: center;
    padding: 2rem;
    color: var(--p-text-color-secondary);
}

.loading-employees {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

/* Стили для выбранных значений */
.selected-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--p-grey-6);
    border-radius: 8px;
}

.selected-employee,
.selected-score,
.manual-points {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.selected-label {
    font-size: 0.875rem;
    color: var(--p-text-color-secondary);
    font-weight: 600;
}

.selected-value {
    color: var(--p-text-color);
    font-weight: 500;
}

.manual-points {
    display: flex;
    align-items: center;
    gap: 1rem;
}

/* Стили для кнопок */
.action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}

.submit-button,
.cancel-button {
    min-width: 150px;
}

/* Адаптивность */
@media (max-width: 1200px) {
    .dialog-content {
        grid-template-columns: 1fr;
        height: auto;
        max-height: 80vh;
        overflow-y: auto;
    }
    
    .indicator-info-section,
    .employee-form-section {
        min-height: 300px;
    }
}

@media (max-width: 768px) {
    .action-buttons {
        flex-direction: column;
    }
    
    .submit-button,
    .cancel-button {
        min-width: auto;
        width: 100%;
    }
    
    .detail-item {
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .detail-label {
        min-width: auto;
    }
}

/* Стили для встроенных HTML таблиц */
:deep(.table-view table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    border: 0;
}

:deep(.table-view th),
:deep(.table-view td) {
    border: 1px solid var(--p-grey-3);
    text-align: center;
}

:deep(.table-view th) {
    background-color: var(--p-grey-7);
    font-weight: 600;
}

:deep(.table-view tr) {
    background-color: var(--p-grey-6);
}

:deep(.table-view tr:hover) {
    background-color: var();
}
</style>
