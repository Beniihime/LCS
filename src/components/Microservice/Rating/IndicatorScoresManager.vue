<template>
    <div class="indicator-scores-manager">
        <Button 
            icon="pi pi-eye"
            text
            rounded
            class="view-scores-btn"
            @click="openDialog"
            v-tooltip.top="'Просмотр/добавление оценок'"
        />
        <!-- <Button 
            text
            rounded
            class="view-scores-btn"
            @click="openDialog"
            v-tooltip.top="'Просмотр/добавление оценок'"
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 69.17 53.91" width="1.5em" height="1.5em" fill="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g>
                    <g id="eye">
                        <path class="cls-1" d="M17.5,27C5.84,27,.36,14.62.12,14.1c-.16-.38-.16-.82,0-1.2C.36,12.38,5.84,0,17.5,0s17.14,12.38,17.38,12.9c.16.38.16.82,0,1.2-.24.52-5.72,12.9-17.38,12.9ZM3.16,13.5c1.18,2.3,6,10.5,14.34,10.5s13.16-8.2,14.34-10.5c-1.18-2.3-6-10.5-14.34-10.5S4.34,11.2,3.16,13.5Z"/>
                        <path class="cls-1" d="M17.5,20c-3.59,0-6.5-2.91-6.5-6.5s2.91-6.5,6.5-6.5,6.5,2.91,6.5,6.5c-.01,3.59-2.91,6.49-6.5,6.5ZM17.5,10c-1.93,0-3.5,1.57-3.5,3.5s1.57,3.5,3.5,3.5,3.5-1.57,3.5-3.5c-.01-1.93-1.57-3.49-3.5-3.5Z"/>
                    </g>
                    <g id="pencil">
                        <path class="cls-1" d="M36.54,53.81c-.39,0-.76-.15-1.04-.42-.32-.31-.48-.75-.44-1.2l.62-7.68c.03-.36.18-.69.44-.94l22.12-22.12c1.23-1.15,2.87-1.77,4.56-1.72,1.68.01,3.29.66,4.5,1.82,2.42,2.48,2.51,6.4.22,9l-22.14,22.22c-.25.25-.57.4-.92.44l-7.78.7-.14-.1ZM38.54,45.29l-.42,5.48,5.48-.5,21.8-21.84c1.23-1.45,1.04-3.62-.41-4.85-.63-.53-1.43-.82-2.25-.81-.87-.06-1.73.25-2.38.84h0l-21.82,21.68Z"/>
                    </g>
                    <rect class="cls-1" x=".58" y="26.99" width="68.84" height="4" rx="2" ry="2" transform="translate(-10.24 33.24) rotate(-45)"/>
                </g>
            </svg>
        </Button> -->

        <Dialog
            v-model:visible="visible"
            :style="{ maxWidth: '90vw', minHeight: '900px' }"
            header="Управление оценками"
            modal
            class="scores-manager-dialog"
        >
            <div class="dialog-header">
                <div class="indicator-info">
                    <span class="indicator-number">{{ indicatorData.number }}</span>
                    <h3 class="indicator-title">{{ indicatorData.indicator }}</h3>
                </div>
                <div class="indicator-meta">
                    <Tag 
                        v-if="indicatorData.periodicity"
                        :value="indicatorData.periodicity"
                        severity="info"
                        class="meta-tag"
                    />
                    <Tag 
                        v-if="indicatorData.responsible"
                        :value="indicatorData.responsible"
                        severity="success"
                        class="meta-tag"
                    />
                </div>
            </div>

            <Tabs v-model:value="activeTab">
                <TabList>
                    <Tab value="0">Просмотр оценок</Tab>
                    <Tab value="1">Добавление оценки</Tab>
                </TabList>
                <!-- Вкладка просмотра оценок -->
                <TabPanel value="0">
                    <div class="tab-content">
                        <div class="stats-overview">
                            <div class="stat-item">
                                <span class="stat-value">{{ filteredScores.length }}</span>
                                <span class="stat-label">Всего оценок</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">{{ averagePoints.toFixed(1) }}</span>
                                <span class="stat-label">Средний балл</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">{{ maxPoints }}</span>
                                <span class="stat-label">Максимальный балл</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">{{ minPoints }}</span>
                                <span class="stat-label">Минимальный балл</span>
                            </div>
                        </div>

                        <div class="search-section-view">
                            <div class="search-input-wrapper-view">
                                <i class="pi pi-search search-icon"></i>
                                <InputText 
                                    v-model="searchQueryView"
                                    placeholder="Поиск по ФИО сотрудника"
                                    class="search-input"
                                />
                                <Button 
                                    icon="pi pi-times"
                                    text
                                    class="clear-search"
                                    @click="clearSearchView"
                                    v-if="searchQueryView"
                                />
                            </div>
                        </div>

                        <div class="scores-table-container">
                            <DataTable
                                v-if="filteredScores.length !== 0"
                                :value="filteredScores" 
                                :scrollable="true" 
                                scrollHeight="400px"
                                class="scores-table"
                                :loading="loading"
                            >
                                <Column field="employeeName" header="Сотрудник" style="width: 300px">
                                    <template #body="{ data }">
                                        <div class="employee-info_1">
                                            <i class="pi pi-user employee-icon"></i>
                                            <div class="employee-details">
                                                <span class="employee-name">{{ data.employeeName || 'Не указан' }}</span>
                                                <span class="employee-position">{{ data.jobPosition || '—' }}</span>
                                            </div>
                                        </div>
                                    </template>
                                </Column>

                                <Column field="comment" header="Комментарий" style="width: 700px">
                                    <template #body="{ data }">
                                        <div v-html="data.comment"></div>
                                    </template>
                                </Column>

                                <Column field="points" header="Баллы" style="width: 120px">
                                    <template #body="{ data }">
                                        <Tag 
                                            :value="data.points.toString()"
                                            :severity="getPointsSeverity(data.points)"
                                            class="points-tag"
                                        />
                                    </template>
                                </Column>

                                <Column field="date" header="Дата оценки" style="width: 140px">
                                    <template #body="{ data }">
                                        <span class="date-text">{{ formatDate(data.createdAt) }}</span>
                                    </template>
                                </Column>

                                <Column header="Действия" style="width: 100px">
                                    <template #body="{ data }">
                                        <DeleteEmployeeValue 
                                            :value="data"
                                            @deleted="handleScoreDeleted"
                                        />
                                    </template>
                                </Column>
                            </DataTable>
                        </div>

                        <div v-if="filteredScores.length === 0 && !loading" class="empty-scores">
                            <div class="empty-content">
                                <i class="pi pi-chart-line empty-icon"></i>
                                <h4>{{ searchQueryView ? 'Оценки не найдены' : 'Оценки не найдены' }}</h4>
                                <p>{{ searchQueryView ? 'По запросу не найдено оценок' : 'По данному индикатору еще нет оценок сотрудников' }}</p>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <!-- Вкладка добавления оценки -->
                <TabPanel value="1">
                    <div class="tab-content">
                        <div class="add-score-content">
                            <!-- Левая часть - информация о показателе -->
                            <div class="form-section">

                                <div class="section-card">
                                    <h3 class="section-title">
                                        <i class="pi pi-chart-line"></i>
                                        Система оценивания
                                    </h3>

                                    <!-- Всегда показываем варианты оценивания -->
                                    <div class="scoring-system">

                                        <!-- Табличное представление -->
                                        <div v-if="parsedTableData.length > 0" class="table-view">
                                            <div class="table-container" v-html="indicatorData.raw?.scores[0]?.description?.table || ''"></div>
                                        </div>

                                        <!-- Списковое представление -->
                                        <div v-if="hasScoringOptions" class="scores-container mt-3">
                                            <div class="scores-header">
                                                <span>Критерий оценивания</span>
                                                <span>Баллы</span>
                                            </div>
                                            <div class="scores-list">
                                                <div v-for="(score, index) in availableScores" :key="index"
                                                    class="score-item" :class="{ 
                                                        'selected': selectedScoreItem === score.id,
                                                        'has-formula': score.formula && !score.points
                                                    }"
                                                    @click="selectScore(score)"
                                                >
                                                    <span class="score-criteria" v-html="score.criteria"></span>
                                                    <span class="score-points">
                                                        <template v-if="applyAdditionalPoints && additionalPoints && score.originalPoints !== undefined">
                                                            <span class="original-points">{{ score.originalPoints }}</span>
                                                            <span class="new-points">{{ score.points }}</span>
                                                        </template>
                                                        <template v-else>
                                                            {{ score.points }}
                                                        </template>
                                                    </span>
                                                </div>
                                            </div>

                                            <div v-if="additionalPoints !== null" class="additional-points-checkbox">
                                                <Checkbox 
                                                    v-model="applyAdditionalPoints" 
                                                    :binary="true" 
                                                    inputId="additionalPoints"
                                                />
                                                <label for="additionalPoints" class="checkbox-label">
                                                    Добавить баллы: +{{ additionalPoints }}
                                                </label>
                                            </div>
                                        </div>

                                        <!-- Ручной ввод показываем только если нет вариантов с баллами -->
                                        <div v-if="!hasScoringOptions" class="manual-input-section">
                                            <div class="manual-input-card">
                                                <h4 class="manual-title">
                                                    <i class="pi pi-pencil"></i>
                                                    Ручной ввод баллов
                                                </h4>
                                                <div class="manual-input-content">
                                                    <div class="input-field">
                                                        <label for="manualPoints">Введите количество баллов:</label>
                                                        <InputNumber 
                                                            id="manualPoints"
                                                            v-model="manualPoints"
                                                            :min="-10.00"
                                                            :max="60.00"
                                                            mode="decimal"
                                                            :minFractionDigits="2"
                                                            :maxFractionDigits="2"
                                                            showButtons
                                                            :step="0.5"
                                                            class="manual-input"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <div class="range-info">
                                                        <span class="range-label">Допустимый диапазон:</span>
                                                        <span class="range-value">от -10.00 до 60.00</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div v-if="!hasScoringOptions && !hasTableData && parsedScores.length === 0" class="no-scores">
                                            <i class="pi pi-exclamation-triangle"></i>
                                            <p>Нет доступных критериев оценивания</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Правая часть - выбор сотрудника -->
                            <div class="form-section">
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
                                        <i class="pi pi-comment"></i>
                                        Комментарий к оценке
                                        <span class="char-counter" :class="{
                                            'char-counter-warning': commentCharsCount > 250,
                                            'char-counter-error': commentCharsCount > 300
                                        }">
                                            {{ commentCharsCount }}/300
                                        </span>
                                    </h3>
                                    <div class="comment-editor">
                                        <Editor
                                            ref="editorRef"
                                            v-model="comment"
                                            editorStyle="height: 200px"
                                            placeholder="Добавьте пояснение к оценке..."
                                            @text-change="handleCommentChange"
                                            @keydown="handleKeyDown"
                                        >
                                            <template v-slot:toolbar>
                                                <span class="ql-formats">
                                                    <button v-tooltip.bottom="'Полужирный'" class="ql-bold"></button>
                                                    <button v-tooltip.bottom="'Курсив'" class="ql-italic"></button>
                                                    <button v-tooltip.bottom="'Подчеркнутый'" class="ql-underline"></button>
                                                    <button v-tooltip.bottom="'Зачеркнутый'" class="ql-strike"></button>
                                                    <button v-tooltip.bottom="'Нумерация'" value="ordered" class="ql-list"></button>
                                                </span>
                                            </template>
                                        </Editor>
                                        <div class="editor-hint">
                                            <i class="pi pi-info-circle"></i>
                                            <span>Комментарий будет сохранен в формате HTML</span>
                                        </div>
                                        <div v-if="commentCharsCount > 300" class="char-limit-error">
                                            <i class="pi pi-exclamation-circle"></i>
                                            <span>Превышено ограничение в 300 символов</span>
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

                                        <div v-if="selectedEmployee && selectedEmployee.jobPositions?.length > 1" class="position-selection">
                                            <span class="selected-label">Выберите должность для оценки:</span>
                                            <div class="position-options">
                                                <div v-for="position in selectedEmployee.jobPositions"
                                                    :key="position.id"
                                                    class="position-option"
                                                    :class="{ 'selected': selectedJobPosition?.id === position.id }"
                                                    @click="selectJobPosition(position)"
                                                >
                                                    <i class="pi pi-briefcase position-icon"></i>
                                                    <span class="position-title">{{ position.title }}</span>
                                                    <i class="pi pi-check position-check" v-if="selectedJobPosition?.id === position.id"></i>
                                                </div>
                                            </div>
                                        </div>

                                        <div v-else-if="selectedEmployee && selectedEmployee.jobPositions?.length === 1" class="auto-position">
                                            <span class="selected-label">Должность:</span>
                                            <span class="selected-value">
                                                {{ selectedEmployee.jobPositions[0].title }}
                                            </span>
                                        </div>

                                        <div v-else-if="selectedEmployee" class="no-position">
                                            <span class="selected-label">Должность:</span>
                                            <span class="selected-value warning">Не указана</span>
                                        </div>

                                        <div class="selected-points">
                                            <span class="selected-label">Режим оценки:</span>
                                            <span class="selected-value">
                                                {{ hasScoringOptions ? 'По критериям' : 'Ручной ввод' }}
                                            </span>
                                        </div>

                                        <div v-if="hasScoringOptions && selectedScoreItem !== null" class="selected-score">
                                            <span class="selected-label">Выбранные баллы:</span>
                                            <span class="selected-value">{{ selectedScoreObject.points }}</span>
                                        </div>

                                        <div v-if="!hasScoringOptions" class="manual-points-display">
                                            <span class="selected-label">Введенные баллы:</span>
                                            <span class="selected-value">{{ manualPoints }}</span>
                                        </div>

                                        <div v-if="!hasValidPoints" class="points-warning">
                                            <i class="pi pi-exclamation-circle"></i>
                                            <span v-if="hasScoringOptions">Выберите критерий оценивания</span>
                                            <span v-else>Введите баллы вручную</span>
                                        </div>

                                        <div v-if="selectedEmployee && selectedEmployee.jobPositions?.length > 1 && !selectedJobPosition" class="position-warning">
                                            <i class="pi pi-exclamation-circle"></i>
                                            <span>Выберите должность для оценки</span>
                                        </div>

                                        <div v-if="comment && commentCharsCount >= 300" class="comment-warning">
                                            <i class="pi pi-exclamation-circle"></i>
                                            <span>Комментарий слишком длинный ({{ commentCharsCount }}/300)</span>
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
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>
            </Tabs>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import axiosInstance from '@/utils/axios';
import { smartTableParser, extractPointsAndFormula, normalizeText, extractAdditionalPoints } from '@/utils/universalParser';
import DeleteEmployeeValue from "@/components/Microservice/Rating/Methods/DeleteEmployeeValue.vue";

const props = defineProps({
    indicatorData: {
        type: Object,
        default: () => ({})
    },
    seasonId: Number,
    employeeIndicatorValues: Array,
    employees: Array
});

const emit = defineEmits(['updated']);

const visible = ref(false);
const loading = ref(false);
const loadingEmployees = ref(false);
const submitting = ref(false);

const activeTab = ref('0');

const allEmployees = ref([]);
const filteredEmployees = ref([]);
const searchQuery = ref('');
const searchQueryView = ref('');
const selectedEmployee = ref(null);
const selectedJobPosition = ref(null);

const parsedScores = ref([]);
const parsedTableData = ref([]);
const selectedScoreItem = ref(null);
const manualPoints = ref(null);

const comment = ref('');
const editorRef = ref(null);

const additionalPoints = ref(null);
const applyAdditionalPoints = ref(false);

// Computed properties
const commentCharsCount = computed(() => {
    if (!comment.value) return 0;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = comment.value;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    return plainText.length;
});


const scores = computed(() => {
    if (!props.indicatorData || !props.employeeIndicatorValues) return [];
    
    return props.employeeIndicatorValues.filter(score => 
        score.indicator.id === props.indicatorData.id && 
        score.season.id === props.seasonId
    ).map(score => ({
        ...score,
        employeeName: getEmployeeName(score.employeeId),
    }));
});

const filteredScores = computed(() => {
    if (!searchQueryView.value.trim()) {
        return scores.value;
    }
    
    const query = searchQueryView.value.toLowerCase();
    return scores.value.filter(score => {
        const employeeName = (score.employeeName || '').toLowerCase();
        return employeeName.includes(query);
    });
});

const selectedScoreObject = computed(() => {
    if (!selectedScoreItem.value) return null;
    return availableScores.value.find(score => score.id === selectedScoreItem.value);
});

// Доступные варианты оценок (только с баллами)
const availableScores = computed(() => {
    const baseScores = parsedScores.value
        .filter(score => score.points !== null && !isNaN(score.points))
        .map((score, index) => ({
            ...score,
            id: `score_${index}`,
            originalPoints: score.points
        }));
    
    if (applyAdditionalPoints.value && additionalPoints.value !== null) {
        return baseScores.map(score => ({
            ...score,
            points: score.originalPoints  + additionalPoints.value
        }));
    }
    
    return baseScores;
});

// Есть ли варианты с баллами
const hasScoringOptions = computed(() => {
    return availableScores.value.length > 0;
});

// Есть ли табличные данные
const hasTableData = computed(() => {
    return parsedTableData.value.length > 0;
});


const averagePoints = computed(() => {
    if (filteredScores.value.length === 0) return 0;
    return filteredScores.value.reduce((sum, score) => sum + score.points, 0) / filteredScores.value.length;
});

const maxPoints = computed(() => {
    if (filteredScores.value.length === 0) return 0;
    return Math.max(...filteredScores.value.map(score => score.points));
});

const minPoints = computed(() => {
    if (filteredScores.value.length === 0) return 0;
    return Math.min(...filteredScores.value.map(score => score.points));
});

const hasValidPoints = computed(() => {
    if (hasScoringOptions.value) {
        return selectedScoreItem.value !== null;
    } else {
        return manualPoints.value !== null && manualPoints.value !== 0.00;
    }
});

const hasValidPosition = computed(() => {
    if (!selectedEmployee.value) return false;
    
    if (!selectedEmployee.value.jobPositions || selectedEmployee.value.jobPositions.length === 0) {
        return true;
    }
    
    if (selectedEmployee.value.jobPositions.length === 1) {
        return true;
    }
    
    return selectedJobPosition.value !== null;
});

const canSubmit = computed(() => {
    return selectedEmployee.value !== null && 
        hasValidPoints.value && 
        hasValidPosition.value &&
        commentCharsCount.value <= 300;
});

// Methods
const openDialog = async () => {
    visible.value = true;
    activeTab.value = '0';
    await loadEmployees();
    parseScores();
};

const handleScoreDeleted = () => {
    emit('updated');
    
    window.dispatchEvent(new CustomEvent('toast', {
        detail: { 
            severity: 'success', 
            summary: 'Рейтинг', 
            detail: 'Оценка успешно удалена',
        }
    }));
};

const handleCommentChange = (event) => {
    if (!event.htmlValue) return;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = event.htmlValue;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    if (plainText.length > 300) {
        const selection = window.getSelection();
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        
        comment.value = prevCommentValue.value;
        
        nextTick(() => {
            if (range && editorRef.value) {
                const quill = editorRef.value.getQuill();
                if (quill) {
                    quill.setSelection(range.startOffset, range.startOffset);
                }
            }
        });
    } else {
        prevCommentValue.value = event.htmlValue;
    }
};

const handleKeyDown = (event) => {
    if (commentCharsCount.value >= 300) {
        // Разрешаем только клавиши удаления и управления
        const allowedKeys = [
            'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 
            'ArrowUp', 'ArrowDown', 'Home', 'End',
            'Tab', 'Escape'
        ];
        
        // Разрешаем сочетания клавиш для выделения и удаления
        const allowedWithCtrl = ['a', 'c', 'x', 'z', 'y']; // Ctrl+A, Ctrl+C, Ctrl+X, Ctrl+Z, Ctrl+Y
        
        const isAllowedKey = allowedKeys.includes(event.key);
        const isAllowedWithCtrl = event.ctrlKey && allowedWithCtrl.includes(event.key.toLowerCase());
        const isSelectionKey = event.shiftKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight');
        
        // Запрещаем ввод новых символов, но разрешаем удаление и навигацию
        if (!isAllowedKey && !isAllowedWithCtrl && !isSelectionKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
            event.preventDefault();
            return false;
        }
    }
};

const prevCommentValue = ref('');

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
};

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
    });
};

const clearSearch = () => {
    searchQuery.value = '';
    filteredEmployees.value = allEmployees.value;
};

const clearSearchView = () => {
    searchQueryView.value = '';
};

const selectEmployee = (employee) => {
    selectedEmployee.value = employee;
    // selectedJobPosition.value = null;
    
    if (employee.jobPositions && employee.jobPositions.length === 1) {
        selectedJobPosition.value = employee.jobPositions[0];
    }

    console.log(employee);
};

const selectJobPosition = (position) => {
    selectedJobPosition.value = position;
};

const getEmployeeName = (employeeId) => {
    const employee = props.employees.find(emp => emp.id === employeeId);
    if (!employee) return `Сотрудник ${employeeId?.substring(0, 8)}`;
    
    const parts = [];
    if (employee.lastName) parts.push(employee.lastName);
    if (employee.firstName) parts.push(employee.firstName);
    if (employee.middleName) parts.push(employee.middleName);
    
    return parts.length > 0 ? parts.join(' ') : `Сотрудник ${employeeId?.substring(0, 8)}`;
};

const IGNORED_HEADER_TITLES = new Set([
    'оценочные значения выполнения показателей эффективности',
    'количество баллов'
]);

const parseScores = () => {
    parsedScores.value = [];
    parsedTableData.value = [];
    additionalPoints.value = null;

    if (!props.indicatorData.raw?.scores || !Array.isArray(props.indicatorData.raw.scores) || props.indicatorData.raw.scores.length === 0) {
        return;
    }

    try {
        const aggregated = [];
        let foundAdditionalPoints = null;

        props.indicatorData.raw.scores.forEach(scoreItem => {
            if (scoreItem.description?.table) {
                parsedTableData.value.push(scoreItem.description.table);
                const parsed = smartTableParser(scoreItem.description.table);
                parsed.scores.forEach(p => aggregated.push(p));

                if (parsed.additionalPoints !== null && foundAdditionalPoints === null) {
                    foundAdditionalPoints = parsed.additionalPoints;
                }
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
                parsed.scores.forEach(p => aggregated.push(p));
                if (parsed.additionalPoints !== null && foundAdditionalPoints === null) {
                    foundAdditionalPoints = parsed.additionalPoints;
                }
            }

            if (typeof scoreItem === 'string') {
                const parsed = smartTableParser(scoreItem);
                parsed.scores.forEach(p => aggregated.push(p));
                if (parsed.additionalPoints !== null && foundAdditionalPoints === null) {
                    foundAdditionalPoints = parsed.additionalPoints;
                }
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
            if (suffixedBases.has(item.criteria.trim())) return false;
            return true;
        });

        parsedScores.value = finalList;
        additionalPoints.value = foundAdditionalPoints;
    } catch (err) {
        console.error('Ошибка при парсинге системы оценивания:', err);
        parsedScores.value = [];
        parsedTableData.value = [];
        additionalPoints.value = null;
    }
};

const selectScore = (score) => {
    if (score.points !== null && !isNaN(score.points)) {
        selectedScoreItem.value = score.id;
    } else if (score.formula) {
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'info', 
                summary: 'Формула', 
                detail: `Этот критерий содержит формулу расчета: ${score.formula}. Используйте ручной ввод для установки значения.`,
            }
        }));
    }
};

const getPointsSeverity = (points) => {
    if (points >= 20) return 'success';
    if (points >= 15) return 'info';
    if (points >= 5) return 'warn';
    return 'danger';
}

const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
};

const submitEvaluation = async () => {
    if (!canSubmit.value) return;

    submitting.value = true;
    try {
        let pointsToSubmit;

        if (hasScoringOptions.value) {
            pointsToSubmit = selectedScoreObject.value.points;
        } else {
            pointsToSubmit = manualPoints.value;
            if (applyAdditionalPoints.value && additionalPoints.value !== null) {
                pointsToSubmit += additionalPoints.value;
            }
        }

        let jobPositionToSubmit = 'Не указана';
        if (selectedEmployee.value.jobPositions && selectedEmployee.value.jobPositions.length > 0) {
            if (selectedEmployee.value.jobPositions.length === 1) {
                jobPositionToSubmit = selectedEmployee.value.jobPositions[0].title;
            } else if (selectedJobPosition.value) {
                jobPositionToSubmit = selectedJobPosition.value.title;
            }
        }

        await axiosInstance.post('/api/rating/employee-indicators-value', {
            employeeId: selectedEmployee.value.id,
            indicatorId: props.indicatorData.id,
            seasonId: Number(props.seasonId),
            points: pointsToSubmit,
            jobPosition: jobPositionToSubmit,
            department: (selectedJobPosition.value.department?.name).toString(),
            comment: comment.value && comment.value !== '<p><br></p>' ? comment.value : '',
            pasAuthorUserId: localStorage.getItem('userId')
        });

        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Рейтинг', 
                detail: `Оценка для сотрудника добавлена успешно`,
            }
        }));

        emit('updated');
        activeTab.value = '0';
        resetForm();
    } catch (error) {
        console.error('Ошибка при добавлении оценки:', error);
        
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'Рейтинг', 
                detail: `Не удалось добавить оценку: ${error.response?.data?.message || error.message}`,
            }
        }));
    } finally {
        submitting.value = false;
    }
};

const resetForm = () => {
    selectedEmployee.value = null;
    selectedJobPosition.value = null;
    selectedScoreItem.value = null;
    manualPoints.value = 0.00;
    searchQuery.value = '';
    filteredEmployees.value = allEmployees.value;
    applyAdditionalPoints.value = false;
    comment.value = '';
};

// Watchers
watch(manualPoints, (newValue) => {
    if (newValue !== null) {
        if (newValue < -20) manualPoints.value = -20;
        if (newValue > 100) manualPoints.value = 100;
    }
});

watch(visible, (newVal) => {
    if (!newVal) {
        resetForm();
        searchQueryView.value = '';
    }
});

watch(comment, (newValue) => {
    if (commentCharsCount.value <= 300) {
        prevCommentValue.value = newValue;
    }
}, { immediate: true });
</script>

<style scoped>
.indicator-scores-manager {
    display: inline-block;
}

.scores-manager-dialog {
    border-radius: 16px;
}

.dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--p-grey-7);
    border-radius: 12px;
}

.indicator-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
}

.indicator-number {
    background: var(--p-primary-color);
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 700;
    min-width: 50px;
    text-align: center;
}

.indicator-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--p-text-color);
}

.indicator-meta {
    display: flex;
    gap: 0.5rem;
}

.tab-content {
    padding: 0.5rem;
}

.add-score-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    height: 60vh;
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Стили из AddEmpToInd */
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
.input-mode-toggle {
    margin-bottom: 1rem;
}

.toggle-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

/* Стили для ручного ввода */
.manual-input-section {
    margin-top: 1rem;
}

.manual-input-card {
    border: 2px solid var(--p-primary-color);
    border-radius: 8px;
    padding: 1.5rem;
    background: var(--p-grey-6);
}

.manual-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem 0;
    color: var(--p-primary-color);
    font-weight: 600;
}

.manual-input-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.input-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.input-field label {
    font-weight: 600;
    color: var(--p-text-color);
}

.manual-input {
    width: 100%;
}

.range-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    color: var(--p-text-color-secondary);
}

.range-label {
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

.score-item.has-formula {
    border-left: 4px solid var(--p-warning-color);
}

.score-item.has-formula:hover {
    background: var(--p-warning-color-light);
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
.selected-points,
.manual-points-display {
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

.points-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--p-warning-color);
    font-size: 0.875rem;
}

/* Добавляем новые стили для выбора должности */

.employee-multiple-positions {
    font-size: 0.75rem;
    color: var(--p-warning-color);
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.25rem;
}

.position-selection {
    margin: 1rem 0;
}

.position-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.position-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--p-grey-4);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.position-option:hover {
    background: var(--p-grey-5);
    border-color: var(--p-primary-color);
}

.position-option.selected {
    background: var(--p-primary-color);
    color: white;
    border-color: var(--p-primary-color);
}

.position-icon {
    font-size: 1rem;
}П

.position-title {
    flex: 1;
    font-weight: 500;
}

.position-check {
    font-size: 0.875rem;
}

.auto-position,
.no-position {
    margin: 0.5rem 0;
}

.warning {
    color: var(--p-warning-color);
    font-style: italic;
}

.position-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--p-warning-color);
    font-size: 0.875rem;
    margin-top: 0.5rem;
}

.search-section-view {
    margin-bottom: 1.5rem;
}

.search-input-wrapper-view {
    position: relative;
    display: flex;
    align-items: center;
    max-width: 400px;
}

.search-input-wrapper-view .search-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--p-text-color-secondary);
    z-index: 1;
}

.search-input-wrapper-view .search-input {
    padding-left: 2.5rem;
    padding-right: 2.5rem;
    width: 100%;
}

.search-input-wrapper-view .clear-search {
    position: absolute;
    right: 0.5rem;
    color: var(--p-text-color-secondary);
}


/* Остальные стили из AddEmpToInd и ViewIndicatorScores */
.stats-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.stat-item {
    background: var(--p-grey-7);
    padding: 1rem;
    border-radius: 12px;
    text-align: center;
}

.stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--p-text-color);
}

.stat-label {
    font-size: 0.875rem;
    color: var(--p-grey-2);
}

.scores-table-container {
    overflow: hidden;
}

:deep(.p-datatable-table-container) {
    border-radius: 12px;
}

:deep(.p-datatable-tbody > tr:hover) {
    background-color: none !important;
}

.employee-info_1 {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
.employee-details {
    display: flex;
    flex-direction: column;
}

.employee-name {
    font-weight: 600;
    color: var(--p-text-color);
}

.employee-position {
    font-size: 0.875rem;
    color: var(--p-text-secondary);
}

.empty-scores {
    text-align: center;
    padding: 3rem 2rem;
}

.empty-icon {
    font-size: 3rem;
    color: #bdc3c7;
    margin-bottom: 1rem;
}

/* Стили для дополнительных баллов */
.additional-points-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--p-green-50);
    border-top: 1px solid var(--p-green-300);
    color: var(--p-green-500);
}

.p-dark .additional-points-checkbox {
    background: color-mix(in srgb, var(--p-green-500), transparent 84%);
    border-top: 1px solid var(--p-green-200);
    color: var(--p-green-200);
}

.checkbox-label {
    font-weight: bold;
}

.score-points {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-weight: 600;
    min-width: 80px;
    justify-content: flex-end;
}

.original-points {
    text-decoration: line-through;
    color: var(--p-grey-2);
    font-size: 0.85rem;
}

.new-points {
    color: var(--p-green-500);
    font-weight: 700;
}

/* Подсветка выбранного критерия с дополнительными баллами */
.score-item.selected .new-points {
    color: white;
}

.score-item.selected .additional-points {
    color: white;
    opacity: 0.9;
}

.comment-editor {
    margin-top: 1rem;
}

.editor-hint {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: var(--p-blue-50);
    border-radius: 4px;
    font-size: 0.875rem;
    color: var(--p-blue-600);
}

.p-dark .editor-hint {
    background: color-mix(in srgb, var(--p-blue-500), transparent 84%);
    color: var(--p-blue-200);
}

.selected-comment {
    margin: 1rem 0;
    background: var(--p-grey-6);
    border-radius: 8px;
}

.comment-preview {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background: white;
    border-radius: 4px;
    border: 1px solid var(--p-grey-4);
    max-height: 150px;
    overflow-y: auto;
    font-size: 0.9rem;
    line-height: 1.4;
    white-space: wrap !important;
    word-wrap: break-word !important;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
}

.p-dark .comment-preview {
    background: var(--p-grey-7);
}

.char-counter {
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: auto;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    background: var(--p-gray-200);
    color: var(--p-gray-700);
}

.char-counter-warning {
    background: var(--p-orange-100);
    color: var(--p-orange-700);
}

.char-counter-error {
    background: var(--p-red-100);
    color: var(--p-red-700);
}

.char-limit-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: var(--p-red-50);
    border: 1px solid var(--p-red-200);
    border-radius: 4px;
    color: var(--p-red-700);
    font-size: 0.875rem;
}

.p-dark .char-limit-error {
    background: color-mix(in srgb, var(--p-red-500), transparent 84%);
    border-color: var(--p-red-300);
    color: var(--p-red-200);
}

.comment-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 1rem 0;
    padding: 0.75rem;
    background: var(--p-red-50);
    border: 1px solid var(--p-red-200);
    border-radius: 6px;
    color: var(--p-red-700);
}

.p-dark .comment-warning {
    background: color-mix(in srgb, var(--p-red-500), transparent 84%);
    border-color: var(--p-red-300);
    color: var(--p-red-200);
}

:deep(.ql-editor) {
    white-space: wrap !important;
    word-wrap: break-word !important;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
    font-size: 16px !important;
}

:deep(.ql-container) {
    font-family: inherit !important;
}

:deep(.ql-editor p) {
    word-break: break-word !important;
    overflow-wrap: break-word !important;
}

:deep(.ql-editor .ql-better-line-breaks) {
    white-space: pre-wrap !important;
    word-wrap: break-word !important;
    word-break: break-word !important;
}

:deep(.ql-editor.ql-blank::before) {
    color: var(--p-grey-2);
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

/* Адаптивность */
@media (max-width: 1200px) {
    .add-score-content {
        grid-template-columns: 1fr;
        height: auto;
        max-height: 70vh;
        overflow-y: auto;
    }
    
    .dialog-header {
        flex-direction: column;
        gap: 1rem;
    }
}

@media (max-width: 768px) {
    .stats-overview {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .indicator-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .comment-preview {
        max-height: 100px;
    }
}
</style>