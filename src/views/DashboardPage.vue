<template>
    <main class="dashboard">
        <section class="hero">
            <div class="hero-content">
                <div class="hero-pill">
                    <i class="pi pi-sparkles"></i>
                    <span>Добро пожаловать</span>
                </div>
                <h1>Добро пожаловать в ЛКС, {{ firstName }}!</h1>
                <p class="subtitle">Быстрый доступ к основным разделам и вашей активности</p>
            </div>
            <div class="hero-glow" aria-hidden="true"></div>
        </section>

        <section class="quick-actions">
            <h2>Быстрые действия</h2>
            <div class="actions-grid">
                <router-link class="action-card" to="/requests">
                    <div class="action-icon">
                        <i class="pi pi-pen-to-square"></i>
                    </div>
                    <div>
                        <div class="action-title">Создать заявку</div>
                        <div class="action-subtitle">Новая заявка в сервис</div>
                    </div>
                </router-link>
                <router-link class="action-card" to="/tickets">
                    <div class="action-icon">
                        <i class="pi pi-ticket"></i>
                    </div>
                    <div>
                        <div class="action-title">Справки</div>
                        <div class="action-subtitle">Мои справки и заявки</div>
                    </div>
                </router-link>
                <router-link class="action-card" to="/schedule">
                    <div class="action-icon">
                        <i class="pi pi-calendar"></i>
                    </div>
                    <div>
                        <div class="action-title">Расписание</div>
                        <div class="action-subtitle">На сегодня и неделю</div>
                    </div>
                </router-link>
            </div>
        </section>

        <section class="overview-grid">
            <div class="panel-card">
                <div class="panel-header">
                    <div class="panel-title">
                        <h3>Мой статус</h3>
                        <span class="panel-subtitle">Краткий обзор профиля</span>
                    </div>
                    <div class="panel-icon">
                        <i class="pi pi-user"></i>
                    </div>
                </div>
                <div class="panel-content status-grid">
                    <div class="status-item">
                        <span class="label">Профиль</span>
                        <router-link to="/profile" class="value-link">Открыть</router-link>
                    </div>
                    <div class="status-item">
                        <span class="label">Полномочия</span>
                        <router-link to="/me-permissions" class="value-link">Просмотреть</router-link>
                    </div>
                    <div class="status-item">
                        <span class="label">Роль</span>
                        <span class="value">{{ roleTitle || '—' }}</span>
                    </div>
                    <div class="status-item">
                        <span class="label">Infra статус</span>
                        <span class="value">{{ infraStatusText }}</span>
                    </div>
                    <div class="status-item">
                        <span class="label">Пользователь</span>
                        <span class="value">{{ isBlocked ? 'Заблокирован' : 'Активен' }}</span>
                    </div>
                </div>
            </div>

            <div class="panel-card">
                <div class="panel-header">
                    <h3>Расписание</h3>
                    <i class="pi pi-calendar"></i>
                </div>
                <div class="panel-content">
                    <div v-if="!scheduleGroupName" class="activity-item muted">
                        Выберите группу в расписании, чтобы отобразить
                    </div>
                    <div v-else-if="todayLessons.length === 0" class="activity-item muted">
                        Ближайших занятий нет
                    </div>
                    <div v-else class="schedule-mini">
                        <div class="schedule-mini-date">Ближайшая дата: {{ scheduleDateLabel }}</div>
                        <div v-for="lesson in todayLessons" :key="lesson.key" class="schedule-mini-item">
                            <div class="schedule-badges">
                                <span class="schedule-time badge">{{ lesson.time }}</span>
                                <span
                                    v-if="lesson.type"
                                    class="schedule-type badge"
                                    :style="{ '--type-color': `var(--p-${lesson.typeColor}-500)` }"
                                >
                                    {{ lesson.type }}
                                </span>
                            </div>
                            <span class="schedule-title">{{ lesson.title }}</span>
                            <span class="schedule-room badge" v-if="lesson.room">{{ lesson.room }}</span>
                        </div>
                    </div>
                    <router-link to="/schedule" class="value-link">Открыть расписание</router-link>
                </div>
            </div>

            <div class="panel-card">
                <div class="panel-header">
                    <h3>Последние заявки</h3>
                    <i class="pi pi-list"></i>
                </div>
                <div class="panel-content">
                    <div class="activity-item">Здесь будут ваши последние заявки</div>
                    <router-link to="/requests" class="value-link">Открыть список</router-link>
                </div>
            </div>
        </section>
    </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import axios from 'axios';
import axiosInstance from '@/utils/axios.js';

const firstName = localStorage.getItem('firstName');
const userId = localStorage.getItem('userId');
const roleTitle = ref('');
const isBlocked = ref(false);
const infraStatusText = ref('—');
const scheduleGroupId = ref(localStorage.getItem('scheduleGroupId'));
const scheduleGroupName = ref(localStorage.getItem('scheduleGroupName'));
const todayLessons = ref([]);
const scheduleDateLabel = ref('');

const fetchUserStatus = async () => {
    try {
        const response = await axiosInstance.get('/api/users/me/info');
        roleTitle.value = response.data.roles?.[0]?.title || '';
        isBlocked.value = !!response.data.isBlocked;
    } catch (error) {
        console.debug('Ошибка при загрузке статуса пользователя:', error);
    }
};

const fetchInfraStatus = async () => {
    if (!userId) return;
    try {
        const response = await axiosInstance.get(`/api/infra-manager/db/users/${userId}/status`);
        infraStatusText.value = response.data?.infraManagerUserId ? 'Активен' : 'Не назначен';
    } catch (error) {
        infraStatusText.value = 'Не назначен';
    }
};

const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const fetchScheduleForDate = async (date) => {
    if (!scheduleGroupId.value) return;

    try {
        const formattedDate = formatLocalDate(date);
        const response = await axios.get(`https://umu.sibadi.org/api/Rasp?idGroup=${scheduleGroupId.value}&sdate=${formattedDate}`);
        const lessons = response.data?.data?.rasp || [];
        return lessons.filter((lesson) => {
            if (!lesson?.дата) return false;
            const lessonDate = new Date(lesson.дата);
            return formatLocalDate(lessonDate) === formattedDate;
        });
    } catch (error) {
        return [];
    }
};

// Очистка названия дисциплины от "лек.", "лаб.", "пр."
const cleanDiscipline = (discipline) => {
    const match = discipline?.match(/^(лек|лаб|пр|экз|зач)\s*/i, '');
    let type = "";
    let color = "blue";
    if (match) {
        const typeAbbr = match[1].toLowerCase();
        switch (typeAbbr) {
            case "лек":
                type = "Лекция";
                color = "green";
                break;
            case "лаб":
                type = "Лабораторная";
                color = "purple";
                break;
            case "пр":
                type = "Практика";
                color = "amber";
                break;
            case "экз":
                type = "Экзамен";
                color = "sky";
                break;
            case "зач":
                type = "Зачет";
                color = "sky";
                break;
            default:
                type = "";
        }
    }
    return {
        cleanedDiscipline: discipline?.replace(/^(лек|лаб|пр.|экз|зач)\s*/i, '') || discipline,
        type,
        color
    };
};

const setScheduleLessons = (lessons, date) => {
    todayLessons.value = lessons.slice(0, 4).map((lesson, index) => ({
        key: lesson.код || index,
        time: `${lesson.начало.replace('-', ':')} - ${lesson.конец.replace('-', ':')}`,
        title: cleanDiscipline(lesson.дисциплина).cleanedDiscipline,
        type: cleanDiscipline(lesson.дисциплина).type,
        typeColor: cleanDiscipline(lesson.дисциплина).color,
        room: lesson.аудитория
    }));
    scheduleDateLabel.value = date.toLocaleDateString('ru-RU', {
        weekday: 'short',
        day: '2-digit',
        month: 'long'
    });
};

const fetchNearestSchedule = async () => {
    if (!scheduleGroupId.value) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let offset = 0; offset <= 7; offset += 1) {
        const date = new Date(today);
        date.setDate(today.getDate() + offset);
        const lessons = await fetchScheduleForDate(date);
        if (lessons.length > 0) {
            setScheduleLessons(lessons, date);
            return;
        }
    }

    todayLessons.value = [];
    scheduleDateLabel.value = '';
};

onMounted(() => {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    fetchUserStatus();
    fetchInfraStatus();
    fetchNearestSchedule();
});
</script>

<style scoped>
.dashboard {
    display: flex;
    flex-direction: column;
    padding: 10px 2rem;
    gap: 24px;
}
.hero {
    position: relative;
    overflow: hidden;
    border-radius: 16px;
    padding: 24px 28px;
    background: linear-gradient(
        120deg,
        rgba(var(--p-blue-500-rgb), 0.08),
        rgba(255, 255, 255, 0)
    );
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
}
.hero-content {
    position: relative;
    z-index: 1;
}
.hero h1 {
    font-size: 2.2rem;
    color: var(--p-text-color);
    margin: 0 0 6px;
}
.hero-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 0.8rem;
    background: rgba(var(--p-blue-500-rgb), 0.12);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.18);
    color: var(--p-text-color);
    margin-bottom: 12px;
}
.hero-actions {
    display: flex;
    gap: 12px;
    margin-top: 16px;
    flex-wrap: wrap;
}
.hero-cta {
    text-decoration: none;
    padding: 10px 16px;
    border-radius: 16px;
    background: rgba(var(--p-blue-500-rgb), 0.16);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.24);
    color: var(--p-text-color);
    font-weight: 600;
    transition: all 0.2s ease;
}
.hero-cta:hover {
    transform: translateY(-1px);
    border-color: rgba(var(--p-blue-500-rgb), 0.36);
}
.hero-cta.secondary {
    background: transparent;
}
.hero-glow {
    position: absolute;
    right: -120px;
    top: -120px;
    width: 280px;
    height: 280px;
    background: radial-gradient(
        circle,
        rgba(var(--p-blue-500-rgb), 0.18),
        transparent 70%
    );
}
.subtitle {
    margin: 0;
    color: var(--p-grey-2);
}
.quick-actions h2,
.overview-grid h3 {
    margin: 0 0 12px;
    color: var(--p-text-color);
}
.actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
}
.action-card {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    border-radius: 16px;
    text-decoration: none;
    color: var(--p-text-color);
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
    transition: all 0.3s ease;
}
.action-card:hover {
    border-color: rgba(var(--p-blue-500-rgb), 0.3);
    transform: translateY(-1px);
}
.action-icon {
    width: 40px;
    height: 40px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--p-blue-500-rgb), 0.12);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.2);
}
.action-card .pi {
    font-size: 1.2rem;
    color: rgba(var(--p-blue-500-rgb), 0.8);
}
.action-title {
    font-weight: 600;
}
.action-subtitle {
    font-size: 0.85rem;
    color: var(--p-grey-2);
}
.overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
}
.panel-card {
    padding: 16px;
    border-radius: 16px;
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.03),
        rgba(255, 255, 255, 0)
    );
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}
.panel-title {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.panel-subtitle {
    font-size: 0.8rem;
    color: var(--p-grey-2);
}
.panel-icon {
    width: 40px;
    height: 40px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--p-blue-500-rgb), 0.12);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.2);
}
.panel-header i {
    color: rgba(var(--p-blue-500-rgb), 0.8);
}
.panel-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.status-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}
.status-item {
    padding: 10px 12px;
    border-radius: 16px;
    background: rgba(var(--p-blue-500-rgb), 0.06);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.info-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}
.label {
    color: var(--p-text-color);
    font-size: 0.85rem;
}
.value,
.value-link {
    font-weight: 600;
    color: var(--p-text-color);
    text-decoration: none;
    min-width: 0;
    word-break: break-word;
}
.value-link:hover {
    color: rgb(var(--p-color-icon-menu));
}
.activity-item {
    color: var(--p-text-color);
}
.activity-item.muted {
    color: var(--p-text-color);
    font-size: 0.85rem;
}
.schedule-mini {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.schedule-mini-date {
    font-size: 0.85rem;
    color: var(--p-grey-2);
}
.schedule-mini-item {
    display: grid;
    grid-template-rows: auto auto auto;
    align-items: start;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 16px;
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.08),
        rgba(255, 255, 255, 0)
    );
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.16);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.schedule-badges {
    color: var(--p-text-color);
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
}
.badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.schedule-time {
    font-size: 0.85rem;
    color: var(--p-text-color);
    white-space: nowrap;
    background: rgba(var(--p-blue-500-rgb), 0.12);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.2);
    padding: 4px 8px;
    border-radius: 999px;
}
.schedule-title {
    font-size: 0.95rem;
    color: var(--p-text-color);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.schedule-room {
    font-size: 0.85rem;
    color: var(--p-text-color);
    background: rgba(var(--p-blue-500-rgb), 0.12);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.2);
    padding: 4px 8px;
    border-radius: 999px;
    white-space: nowrap;
    justify-self: start;
}
.schedule-type {
    font-size: 0.8rem;
    color: var(--type-color);
    border: 1px solid color-mix(in srgb, var(--type-color), transparent 60%);
    background: color-mix(in srgb, var(--type-color), transparent 90%);
    padding: 4px 8px;
    border-radius: 999px;
    white-space: nowrap;
}

@media (max-width: 1024px) {
    .dashboard {
        padding: 20px 2rem;
    }
    .hero h1 {
        font-size: 2rem;
    }
}

@media (max-width: 640px) {
    .dashboard {
        padding: 16px;
    }
    .status-grid {
        grid-template-columns: 1fr;
    }
}
</style>
