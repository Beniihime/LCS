<template>
    <Dialog
        :visible="visible"
        @update:visible="$emit('update:visible', $event)"
        :style="{ width: '90vw', maxWidth: '1200px' }"
        header="Оценки сотрудников"
        modal
        class="indicator-scores-dialog"
    >
        <div class="dialog-content">
            <div class="indicator-header">
                <div class="indicator-title-section">
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

            <!-- Статистика -->
            <div class="stats-overview">
                <div class="stat-item">
                    <span class="stat-value">{{ scores.length }}</span>
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

            <!-- Таблица с оценками -->
            <div class="scores-table-container">
                <DataTable 
                    :value="scores" 
                    :scrollable="true" 
                    scrollHeight="400px"
                    class="scores-table"
                    :loading="loading"
                >
                    <Column field="employeeName" header="Сотрудник" style="min-width: 200px">
                        <template #body="{ data }">
                            <div class="employee-info">
                                <i class="pi pi-user employee-icon"></i>
                                <div class="employee-details">
                                    <span class="employee-name">{{ data.employeeName || 'Не указан' }}</span>
                                    <span class="employee-position">{{ data.jobPosition || '—' }}</span>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="points" header="Баллы" style="width: 120px">
                        <template #body="{ data }">
                            <div class="points-display">
                                <span class="points-value" :class="getPointsClass(data.points)">
                                    {{ data.points }}
                                </span>
                            </div>
                        </template>
                    </Column>

                    <Column field="date" header="Дата оценки" style="width: 140px">
                        <template #body="{ data }">
                            <span class="date-text">{{ formatDate(data.createdAt) }}</span>
                        </template>
                    </Column>

                    <Column header="Детали" style="width: 100px">
                        <template #body="{ data }">
                            <Button 
                                icon="pi pi-eye" 
                                class="p-button-text p-button-rounded detail-btn"
                                @click="showScoreDetails(data)"
                                v-tooltip="'Подробности оценки'"
                            />
                        </template>
                    </Column>
                </DataTable>
            </div>

            <!-- Состояние пустого списка -->
            <div v-if="scores.length === 0 && !loading" class="empty-scores">
                <div class="empty-content">
                    <i class="pi pi-chart-line empty-icon"></i>
                    <h4>Оценки не найдены</h4>
                    <p>По данному индикатору еще нет оценок сотрудников</p>
                </div>
            </div>
        </div>

        
    </Dialog>

    <!-- Диалог с деталями оценки -->
    <Dialog 
        v-model:visible="detailVisible" 
        header="Детали оценки" 
        :style="{ width: '500px' }"
    >
        <div class="score-details" v-if="selectedScore">
            <div class="detail-section">
                <h4>Информация об оценке</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Сотрудник:</span>
                        <span class="detail-value">{{ selectedScore.employeeName || 'Не указан' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Должность:</span>
                        <span class="detail-value">{{ selectedScore.jobPosition || '—' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Баллы:</span>
                        <span class="detail-value points-badge" :class="getPointsClass(selectedScore.points)">
                            {{ selectedScore.points }}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Оценивший:</span>
                        <span class="detail-value">{{ selectedScore.responsibleEmployeeName || '—' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Дата оценки:</span>
                        <span class="detail-value">{{ selectedScore.createdAt }}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section" v-if="selectedScore.description">
                <h4>Комментарий</h4>
                <p class="comment-text">{{ selectedScore.description }}</p>
            </div>
        </div>
    </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
    visible: Boolean,
    indicatorData: Object,
    seasonId: Number,
    employeeIndicatorValues: Array,
    employees: Array
});

const emit = defineEmits(['update:visible']);

const detailVisible = ref(false);
const selectedScore = ref(null);
const loading = ref(false);

const findEmployeeById = (employeeId) => {
    return props.employees.find(emp => emp.id === employeeId);
};

const getEmployeeName = (employeeId) => {
    const employee = findEmployeeById(employeeId);
    if (!employee) return `Сотрудник ${employeeId?.substring(0, 8)}`;
    
    const parts = [];
    if (employee.lastName) parts.push(employee.lastName);
    if (employee.firstName) parts.push(employee.firstName);
    if (employee.middleName) parts.push(employee.middleName);
    
    return parts.length > 0 ? parts.join(' ') : `Сотрудник ${employeeId?.substring(0, 8)}`;
};

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

const averagePoints = computed(() => {
    if (scores.value.length === 0) return 0;
    return scores.value.reduce((sum, score) => sum + score.points, 0) / scores.value.length;
});

const maxPoints = computed(() => {
    if (scores.value.length === 0) return 0;
    return Math.max(...scores.value.map(score => score.points));
});

const minPoints = computed(() => {
    if (scores.value.length === 0) return 0;
    return Math.min(...scores.value.map(score => score.points));
});

const closeDialog = () => {
    emit('update:visible', false);
};

const showScoreDetails = (score) => {
    selectedScore.value = score;
    detailVisible.value = true;
};

const getPointsClass = (points) => {
    if (points >= 90) return 'points-excellent';
    if (points >= 70) return 'points-good';
    if (points >= 50) return 'points-average';
    return 'points-poor';
};

const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
};

watch(() => props.visible, (newVal) => {
    if (!newVal) {
        detailVisible.value = false;
        selectedScore.value = null;
    }
});
</script>

<style scoped>
.dialog-content {
    padding: 0.5rem;
}

.indicator-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--p-grey-3);
}

.indicator-title-section {
    display: flex;
    align-items: center;
    gap: 1rem;
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

.employee-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.employee-icon {
    color: var(--p-primary-color);
    font-size: 1.25rem;
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

.points-display {
    text-align: center;
}

.points-value {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-weight: 700;
    font-size: 0.875rem;
}

.points-excellent {
    background: #d4edda;
    color: #155724;
}

.points-good {
    background: #d1ecf1;
    color: #0c5460;
}

.points-average {
    background: #fff3cd;
    color: #856404;
}

.points-poor {
    background: #f8d7da;
    color: #721c24;
}

.date-text {
    font-size: 0.875rem;
    color: var(--p-text-secondary);
}

.detail-btn {
    color: var(--p-primary-color) !important;
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

.empty-scores h4 {
    color: #2c3e50;
    margin: 0 0 0.5rem 0;
}

.empty-scores p {
    color: #7f8c8d;
    margin: 0;
}

/* Детали оценки */
.score-details {
    padding: 0.5rem;
}

.detail-section {
    margin-bottom: 1.5rem;
}

.detail-section h4 {
    margin: 0 0 1rem 0;
    color: var(--p-text-color);
    font-weight: 600;
}

.detail-grid {
    display: grid;
    gap: 0.75rem;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--p-grey-3);
}

.detail-label {
    font-weight: 600;
    color: var(--p-text-secondary);
}

.detail-value {
    color: var(--p-text-color);
}

.points-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-weight: 600;
}

.comment-text {
    background: var(--p-grey-7);
    padding: 1rem;
    border-radius: 8px;
    margin: 0;
    line-height: 1.5;
}

/* Адаптивность */
@media (max-width: 768px) {
    .indicator-header {
        flex-direction: column;
        gap: 1rem;
    }
    
    .stats-overview {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .employee-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
    }
}
</style>