<template>
    <main class="cup-page">
        <section class="cup-shell">
            <header class="cup-header">
                <div class="cup-copy">
                    <Tag rounded severity="info">Портфолио</Tag>
                    <h2>Учебный план</h2>
                    <p v-if="selectedGroup">
                        {{ selectedGroup.groupName || 'Группа не указана'
                            }}{{ selectedGroup.course ? ` · ${selectedGroup.course} курс` : ''
                            }}{{ selectedGroup.specialtyCode ? ` · ${selectedGroup.specialtyCode}${selectedGroup.specialtyName ? ` ${selectedGroup.specialtyName}` : ''}` : '' }}
                    </p>
                    <p v-else>Дисциплины учебного плана и расписание сессии по выбранной группе.</p>
                </div>

                <div class="cup-actions">
                    <Button
                        icon="pi pi-refresh"
                        label="Обновить"
                        outlined
                        severity="secondary"
                        :loading="activeLoading"
                        @click="loadActiveTab"
                    />
                </div>
            </header>

            <!-- Состояния загрузки/ошибки групп -->
            <section v-if="groupsLoading" class="cup-empty-state">
                <ProgressSpinner style="width: 2.5rem; height: 2.5rem;" />
                <h4>Загрузка данных…</h4>
            </section>

            <section v-else-if="groupsError" class="cup-empty-state">
                <i class="pi pi-exclamation-triangle"></i>
                <h4>Не удалось загрузить учебный план</h4>
                <p>{{ groupsErrorDetail || 'Проверьте связь с системой UMU и попробуйте позже.' }}</p>
            </section>

            <section v-else-if="!groups.length" class="cup-empty-state">
                <i class="pi pi-list-check"></i>
                <h4>Записи не найдены</h4>
                <p>В системе UMU не найдено учебных записей для вашего аккаунта.</p>
            </section>

            <template v-else-if="selectedGroup">
                <div v-if="groups.length > 1" class="cup-group-select">
                    <label>Группа</label>
                    <Select
                        :modelValue="selectedGroup"
                        :options="groups"
                        optionLabel="groupName"
                        placeholder="Выбрать группу"
                        @update:modelValue="selectGroup"
                    >
                        <template #option="{ option }">
                            <div class="cup-group-option">
                                <strong>{{ option.groupName || 'Без названия' }}</strong>
                                <small>{{
                                    [
                                        option.course ? `${option.course} курс` : null,
                                        option.specialtyCode
                                            ? `${option.specialtyCode}${option.specialtyName ? ` ${option.specialtyName}` : ''}`
                                            : null,
                                    ].filter(Boolean).join(' · ') || 'Учебная запись'
                                }}</small>
                            </div>
                        </template>
                    </Select>
                </div>

                <div class="cup-tabs">
                    <button
                        type="button"
                        :class="{ active: activeTab === 'curriculum' }"
                        @click="setTab('curriculum')"
                    >Дисциплины</button>
                    <button
                        type="button"
                        :class="{ active: activeTab === 'exams' }"
                        @click="setTab('exams')"
                    >Расписание сессии</button>
                </div>

                <!-- Дисциплины -->
                <section v-if="activeTab === 'curriculum'" class="cup-card">
                    <div class="cup-card-head">
                        <div class="cup-title-row">
                            <h3>Дисциплины</h3>
                            <Tag :value="`Всего: ${curriculumItems.length}`" severity="contrast" />
                        </div>
                    </div>

                    <div v-if="curriculumLoading" class="cup-empty-state">
                        <ProgressSpinner style="width: 2.5rem; height: 2.5rem;" />
                        <h4>Загрузка учебного плана…</h4>
                    </div>

                    <div v-else-if="!curriculumItems.length && !electiveGroups.length" class="cup-empty-state">
                        <i class="pi pi-inbox"></i>
                        <h4>Учебный план не найден</h4>
                        <p>Данные учебного плана для этой записи пока отсутствуют.</p>
                    </div>

                    <div v-else class="cup-curriculum">
                        <section
                            v-for="group in curriculumBySemester"
                            :key="`cur-${group.semester}`"
                            class="cup-curriculum-group"
                        >
                            <div class="cup-group-head">
                                <h4>Семестр {{ group.semester }}</h4>
                                <Tag :value="`${group.items.length} дисц.`" severity="secondary" />
                            </div>
                            <div class="cup-subjects-grid">
                                <article
                                    v-for="item in group.items"
                                    :key="item.disciplineId || item.discipline"
                                    class="cup-subject-card"
                                >
                                    <div class="cup-subject-title">
                                        <strong>{{ item.discipline || 'Без названия' }}</strong>
                                        <div class="cup-tags">
                                            <Tag v-if="item.block" severity="secondary" :value="item.block" />
                                            <Tag v-if="item.elective" severity="info" value="Выборная" />
                                            <Tag v-if="item.additionalElective" severity="info" value="Доп. выборная" />
                                            <Tag v-if="item.facultative" severity="warn" value="Факультатив" />
                                        </div>
                                    </div>
                                    <div class="cup-subject-meta">
                                        <span><i class="pi pi-clock"></i>{{ item.hours ? `${item.hours} ч` : '—' }}</span>
                                        <span><i class="pi pi-users"></i>{{ item.hoursAud ? `${item.hoursAud} ч ауд.` : '—' }}</span>
                                        <span v-if="item.department"><i class="pi pi-building"></i>{{ item.department }}</span>
                                    </div>
                                </article>
                            </div>
                        </section>

                        <section v-if="electiveGroups.length" class="cup-electives">
                            <div class="cup-group-head">
                                <h4>Выборные дисциплины</h4>
                            </div>
                            <section
                                v-for="(group, idx) in electiveGroups"
                                :key="`elec-${idx}`"
                                class="cup-curriculum-group cup-curriculum-group--nested"
                            >
                                <div class="cup-subhead">
                                    <span>{{ group.block || 'Блок' }}</span>
                                    <Tag :value="`Семестр ${group.semester}`" severity="secondary" />
                                </div>
                                <div class="cup-subjects-grid">
                                    <article
                                        v-for="item in group.disciplines"
                                        :key="item.disciplineId || item.discipline"
                                        class="cup-subject-card"
                                    >
                                        <div class="cup-subject-title">
                                            <strong>{{ item.discipline || 'Без названия' }}</strong>
                                            <small v-if="item.hours">{{ item.hours }} ч</small>
                                        </div>
                                        <div class="cup-subject-meta">
                                            <span v-if="item.department"><i class="pi pi-building"></i>{{ item.department }}</span>
                                        </div>
                                    </article>
                                </div>
                            </section>
                        </section>
                    </div>
                </section>

                <!-- Расписание сессии -->
                <section v-else-if="activeTab === 'exams'" class="cup-card">
                    <div class="cup-card-head">
                        <div class="cup-title-row">
                            <h3>Расписание сессии</h3>
                            <Tag :value="`${examItems.length} зап.`" severity="contrast" />
                        </div>
                    </div>

                    <div v-if="examLoading" class="cup-empty-state">
                        <ProgressSpinner style="width: 2.5rem; height: 2.5rem;" />
                        <h4>Загрузка расписания сессии…</h4>
                    </div>

                    <div v-else-if="!examItems.length" class="cup-empty-state">
                        <i class="pi pi-inbox"></i>
                        <h4>Расписание не найдено</h4>
                        <p>Данные расписания сессии для этой записи пока отсутствуют.</p>
                    </div>

                    <div v-else class="cup-curriculum">
                        <section
                            v-for="group in examsBySemester"
                            :key="`exam-${group.semester}`"
                            class="cup-curriculum-group"
                        >
                            <div class="cup-group-head">
                                <h4>Семестр {{ group.semester }}</h4>
                                <Tag :value="`${group.items.length} зап.`" severity="secondary" />
                            </div>
                            <div class="cup-subjects-grid">
                                <article
                                    v-for="(item, idx) in group.items"
                                    :key="`${item.discipline}-${item.controlType}-${idx}`"
                                    class="cup-subject-card cup-exam-card"
                                    :class="{ 'cup-exam-card--resit': item.isResit }"
                                >
                                    <div class="cup-subject-title">
                                        <strong>{{ item.discipline || 'Без названия' }}</strong>
                                        <div class="cup-tags">
                                            <Tag
                                                v-if="item.controlTypeName"
                                                :severity="examSeverity(item.controlType)"
                                                :value="item.controlTypeName"
                                            />
                                            <Tag v-if="item.isResit" severity="warn" value="Пересдача" />
                                            <Tag v-if="item.block" severity="secondary" :value="item.block" />
                                        </div>
                                    </div>
                                    <div class="cup-subject-meta">
                                        <span v-if="item.examDate"><i class="pi pi-calendar"></i>Экзамен: {{ item.examDate }}</span>
                                        <span v-if="item.creditDate"><i class="pi pi-calendar-check"></i>Зачёт: {{ item.creditDate }}</span>
                                    </div>
                                    <div class="cup-subject-meta">
                                        <span v-if="item.examAuditorium"><i class="pi pi-map-marker"></i>{{ item.examAuditorium }}</span>
                                        <span v-if="item.creditAuditorium"><i class="pi pi-map-marker"></i>{{ item.creditAuditorium }}</span>
                                    </div>
                                    <div class="cup-subject-meta">
                                        <span v-if="item.teacher"><i class="pi pi-user"></i>{{ item.teacher }}</span>
                                        <span v-if="item.department"><i class="pi pi-building"></i>{{ item.department }}</span>
                                    </div>
                                </article>
                            </div>
                        </section>
                    </div>
                </section>
            </template>
        </section>
    </main>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useUmuStudentGroups } from '@/composables/useUmuStudentGroups.js';
import { getMyUmuCurriculum, getMyUmuExamSchedule } from '@/api/umu.js';

const toast = useToast();
const route = useRoute();

const TABS = ['curriculum', 'exams'];
const activeTab = ref(TABS.includes(route.query.tab) ? route.query.tab : 'curriculum');

const {
    groups,
    groupsLoading,
    groupsError,
    groupsErrorDetail,
    selectedGroup,
    selectGroup,
} = useUmuStudentGroups();

const curriculumData = ref(null);
const curriculumLoading = ref(false);

const examData = ref(null);
const examLoading = ref(false);

const curriculumItems = computed(() => curriculumData.value?.curriculum || []);
const electiveGroups = computed(() => curriculumData.value?.electives || []);

const examItems = computed(() => examData.value?.items || []);

const groupBySemester = (items) => {
    const map = new Map();
    for (const item of items) {
        const sem = item.semester ?? 0;
        if (!map.has(sem)) map.set(sem, { semester: sem, items: [] });
        map.get(sem).items.push(item);
    }
    return [...map.values()].sort((a, b) => a.semester - b.semester);
};

const curriculumBySemester = computed(() => groupBySemester(curriculumItems.value));
const examsBySemester = computed(() => groupBySemester(examItems.value));

const activeLoading = computed(() => (
    activeTab.value === 'curriculum' ? curriculumLoading.value : examLoading.value
));

const examSeverity = (controlType) => {
    // 1=экзамен, 2=зачёт, 3/4=пересдача
    if (controlType === 1) return 'warn';
    if (controlType === 2) return 'success';
    if (controlType === 3 || controlType === 4) return 'danger';
    return 'secondary';
};

const loadCurriculum = async () => {
    if (!selectedGroup.value) return;

    curriculumLoading.value = true;

    try {
        const response = await getMyUmuCurriculum({ studentId: selectedGroup.value.studentId });
        curriculumData.value = response.data ?? null;
    } catch (error) {
        curriculumData.value = null;
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить учебный план',
            detail: error?.response?.data?.title || error?.response?.data?.message || 'Попробуйте позже.',
            life: 3500,
        });
    } finally {
        curriculumLoading.value = false;
    }
};

const loadExams = async () => {
    if (!selectedGroup.value) return;

    examLoading.value = true;

    try {
        const response = await getMyUmuExamSchedule({ studentId: selectedGroup.value.studentId });
        examData.value = response.data ?? null;
    } catch (error) {
        examData.value = null;
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить расписание сессии',
            detail: error?.response?.data?.title || error?.response?.data?.message || 'Попробуйте позже.',
            life: 3500,
        });
    } finally {
        examLoading.value = false;
    }
};

const loadActiveTab = async () => {
    if (activeTab.value === 'curriculum') {
        await loadCurriculum();
    } else if (activeTab.value === 'exams') {
        await loadExams();
    }
};

const setTab = (tab) => {
    if (activeTab.value === tab) return;
    activeTab.value = tab;
    loadActiveTab();
};

// При смене группы сбрасываем кэш и подгружаем активный таб.
watch(selectedGroup, async (group) => {
    if (!group) return;
    curriculumData.value = null;
    examData.value = null;
    await loadActiveTab();
});
</script>

<style scoped>
.cup-page {
    --cup-border: rgba(var(--p-blue-500-rgb), 0.14);
    min-height: 100%;
    padding: 10px;
}

.cup-shell {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 100%;
    padding: 1.25rem;
    border-radius: 20px;
    border: 1px solid var(--cup-border);
    background:
        radial-gradient(1000px 220px at 0% 0%, rgba(var(--p-blue-500-rgb), 0.08), transparent 60%),
        linear-gradient(180deg, var(--p-bg-color-2) 0%, var(--p-bg-color-1) 100%);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}

.cup-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
}

.cup-copy h2 { margin: 0.75rem 0 0; }
.cup-copy p {
    margin: 0.65rem 0 0;
    max-width: 70ch;
    color: var(--p-grey-1);
    line-height: 1.5;
}

.cup-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.cup-group-select {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    max-width: 26rem;
}
.cup-group-select label {
    font-size: 0.78rem;
    color: var(--p-grey-1);
}
.cup-group-option {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
}
.cup-group-option small {
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.74rem;
}

.cup-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}
.cup-tabs button {
    flex: 1 1 0;
    min-width: 9rem;
    padding: 0.6rem 1rem;
    border: 1px solid var(--p-grey-4);
    border-radius: 0.75rem;
    background: var(--p-bg-color-1);
    color: var(--p-text-color);
    font-size: 0.9rem;
    font-weight: 650;
    cursor: pointer;
    transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}
.cup-tabs button:hover {
    border-color: color-mix(in srgb, var(--p-primary-color) 55%, transparent);
    color: var(--p-primary-color);
}
.cup-tabs button.active {
    border-color: color-mix(in srgb, var(--p-primary-color) 55%, transparent);
    color: var(--p-primary-color);
    background: color-mix(in srgb, var(--p-primary-color) 13%, transparent);
}

.cup-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.15rem;
    border-radius: 18px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.1);
    background:
        linear-gradient(180deg,
            color-mix(in srgb, var(--p-content-background) 96%, var(--p-primary-color) 4%),
            color-mix(in srgb, var(--p-content-background) 90%, var(--p-primary-color) 10%));
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.cup-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
}
.cup-title-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}
.cup-title-row h3 { margin: 0; }

.cup-curriculum {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-top: 0.25rem;
}
.cup-curriculum-group {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
}
.cup-group-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
}
.cup-group-head h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 750;
}
.cup-curriculum-group--nested {
    padding: 0.75rem;
    border-radius: 0.75rem;
    border: 1px dashed var(--cup-border);
    background: rgba(var(--p-blue-500-rgb), 0.03);
}
.cup-subhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-weight: 650;
    font-size: 0.88rem;
}
.cup-electives {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--p-grey-4);
}
.cup-electives .cup-group-head h4 { color: var(--p-primary-color); }

.cup-subjects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(clamp(260px, 45vw, 340px), 1fr));
    gap: 0.75rem;
}

.cup-subject-card {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 1rem;
    border: 1px solid var(--p-grey-4);
    border-radius: 1rem;
    background: var(--p-bg-color-1);
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}
.cup-subject-card:hover {
    border-color: color-mix(in srgb, var(--p-primary-color) 48%, transparent);
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}
.cup-exam-card--resit {
    border-color: color-mix(in srgb, var(--p-orange-400, #fb923c) 40%, transparent);
    background: color-mix(in srgb, var(--p-orange-400, #fb923c) 6%, var(--p-bg-color-1));
}

.cup-subject-title {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
}
.cup-subject-title strong {
    font-size: 1.02rem;
    font-weight: 750;
    line-height: 1.25;
}
.cup-subject-title small {
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.76rem;
}
.cup-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.2rem;
}

.cup-subject-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.82rem;
}
.cup-subject-meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
}
.cup-subject-meta i {
    font-size: 0.8rem;
    color: var(--p-primary-color);
}

.cup-empty-state {
    min-height: 240px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
}
.cup-empty-state i { font-size: 2rem; color: var(--p-grey-1); }
.cup-empty-state h4, .cup-empty-state p { margin: 0; }
.cup-empty-state p { max-width: 48ch; color: var(--p-grey-1); }

@media (max-width: 768px) {
    .cup-shell { padding: 1rem; }
    .cup-header { flex-direction: column; align-items: stretch; }
    .cup-actions { justify-content: flex-start; }
    .cup-subjects-grid { grid-template-columns: 1fr; }
    .cup-tabs { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
    .cup-tabs::-webkit-scrollbar { display: none; }
    .cup-tabs button { flex: 0 0 auto; white-space: nowrap; min-width: 0; }
}
</style>