<template>
    <WelcomeScreen :visible="isLoading"/>
    <div class="schedule-details-container">
        <header class="schedule-header">
            <div class="header-row justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <Button icon="pi pi-arrow-left" size="small" rounded @click="goBack" />
                    <span class="fs-3 ms-4">Расписание</span>
                </div>
                
                <div class="refresh-time" v-if="!isLoading">
                    <span>Дата обновления: </span>
                    <span>{{ formatDate(scheduleData?.dateUploadingRasp) }}</span>
                </div>
                <Skeleton v-else width="300px" height="2.5rem"></Skeleton>
            </div>
            <div class="header-row justify-content-between">
                <div class="search-header-card">
                    <IconField class="searchBar">
                        <InputIcon class="pi pi-search" />
                        <InputText id="search" name="search" placeholder="Поиск..." class="search" v-model="searchQuery" />
                    </IconField>
                </div>
            </div>

            <div class="header-row">
                <div class="header-card" v-for="(_, index) in 4" :key="index">
                    <Skeleton v-if="isLoading" widh="100%" height="3rem" />
                    <template v-else>
                        <span class="card-title">{{ headerTitles[index] }}</span>
                        <span class="card-value">{{ headerValues[index] }}</span>
                    </template>
                </div>
            </div>

            <div class="header-row">
                <div class="header-card date-picker">
                    <Calendar v-model="selectedDate" :minDate="minDate" :maxDate="maxDate" :disabledDates="disabledDates"
                      showIcon dateFormat="dd.mm.yy" @update:modelValue="fetchScheduleData" />
                </div>
                <div class="header-card">
                    <span class="card-title">Тип недели</span>
                    <span class="card-value">{{ weekFullName }}</span>
                </div>
            </div>
            <Button @click="toggleScheduleMode" class="p-button-text">
                {{ showFullSchedule ? "Расписание на неделю" : "Всё расписание" }}
            </Button>
        </header>

        <div v-if="scheduleRasp.length" class="schedule-list">
            <div v-for="(lessons, day) in groupedLessons" :key="day" class="_per-day-container">
                <div class="day-container">
                    <h4 class="day-title">{{ day }}</h4>
                    <span>{{ formatDate(lessons[0].дата) }}</span>
                </div>
                
                <div v-for="lesson in lessons" :key="lesson.код" class="lesson-card">
                    <div class="lesson-header">
                        <span class="lesson-number" :style="{ 'background-color': `var(--p-${cleanDiscipline(lesson.дисциплина).color}-500)` }">{{ lesson?.номерЗанятия }}</span>
                        <span class="time">{{ lesson.начало.replace("-", ":") }} <span class="lesson-second_plan"> - {{ lesson.конец.replace("-", ":") }}</span></span>
                        <div class="other-schedule">
                            <Button size="small" icon="pi pi-ellipsis-v" variant="outlined" rounded class="me-3" />
                        </div>
                        
                    </div>
                    <div class="lesson-content">
                        <h3 class="lesson-title">{{ cleanDiscipline(lesson.дисциплина).cleanedDiscipline }}</h3>
                        <div class="lesson-type">{{ cleanDiscipline(lesson.дисциплина).type }}</div>
                        <p class="lesson-teacher lesson-second_plan">{{ lesson.преподаватель }}</p>
                        <p class="room lesson-second_plan">{{ lesson.аудитория }}</p>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="empty-message">
            <p>Нет занятий на выбранную дату</p>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import Calendar from "primevue/calendar";

import formatDate from "@/utils/formatDateWithoutTime.js";
import WelcomeScreen from "@/components/Utils/WelcomeScreen.vue";

const route = useRoute();
const router = useRouter();
const idGroup = route.params.idGroup;
const showFullSchedule = ref(false);

const selectedDate = ref(null);
const minDate = ref(null);
const maxDate = ref(null);
const availableDates = ref([]);
const scheduleData = ref([]);
const scheduleRasp = ref([]);

const isLoading = ref(true); 

const weekShortName = computed(() => {
    return scheduleData.value?.typesWeek?.find(t => t.typeWeekID === scheduleData.value?.curNumNed)?.shortName || '?';
});

const weekFullName = computed(() => {
    return scheduleData.value?.typesWeek?.find(t => t.typeWeekID === scheduleData.value?.selectedNumNed)?.name || 'Неизвестно';
});

const headerTitles = ["Группа", "Учебный год", "Семестр", "Текущая неделя"];
const headerValues = computed(() => [
    scheduleData.value?.group?.name,
    scheduleData.value?.year,
    scheduleData.value?.curSem,
    `${scheduleData.value?.curWeekNumber} (${weekShortName.value} нед.)`
]);

const toggleScheduleMode = () => {
    showFullSchedule.value = !showFullSchedule.value;
    fetchScheduleData();
};

// Получаем доступные даты из GetRaspDates
const fetchAvailableDates = async () => {
    try {
        const response = await axios.get(`https://umu.sibadi.org/api/GetRaspDates?idGroup=${idGroup}`);
        const data = response.data.data;

        minDate.value = new Date(data.minDate);
        maxDate.value = new Date(data.maxDate);
        
        availableDates.value = data.dates.map(date => new Date(date));

        // Устанавливаем текущую дату или ближайшую доступную
        selectedDate.value = new Date(data.selDate);

        fetchScheduleData();
    } catch (error) {
        console.error("Ошибка загрузки дат:", error);
    }
};

// Загружаем расписание на выбранную дату
const fetchScheduleData = async () => {
    if (!idGroup || !selectedDate.value) return;

    const formattedDate = selectedDate.value.toISOString().split("T")[0];
    const sdateParam = showFullSchedule.value ? "" : `&sdate=${formattedDate}`;

    try {
        const response = await axios.get(`https://umu.sibadi.org/api/Rasp?idGroup=${idGroup}${sdateParam}`);
        scheduleData.value = response.data.data.info;
        scheduleRasp.value = response.data.data.rasp;
        console.debug(scheduleData.value)
        
    } catch (error) {
        console.error("Ошибка загрузки расписания:", error);
    } finally {
        isLoading.value = false;
    }
};

// Групировка занятий по дням недели
const groupedLessons = computed(() => {
    const grouped = {};
    scheduleRasp.value.forEach(lesson => {
        const day = lesson.день_недели;
        if (!grouped[day]) {
            grouped[day] = [];
        }
        grouped[day].push(lesson);
    });
    return grouped;
});

// Очистка названия дисциплины от "лек.", "лаб.", "пр."
const cleanDiscipline = (discipline) => {
    const match = discipline.match(/^(лек|лаб|пр.)\s*/i, '');
    let type = "";
    let color = "";
    if (match) {
        const typeAbbr = match[1].toLowerCase();
        switch (typeAbbr) {
            case "лек":
                type = "Лекция";
                color = "green"
                break;
            case "лаб":
                type = "Лабораторная";
                color = "purple";
                break;
            case "пр.":
                type = "Практика";
                color = "amber";
                break;
            default:
                type = "";
        }
    }
    return {
        cleanedDiscipline: discipline.replace(/^(лек|лаб|пр.)\s*/i, ''),
        type,
        color
    };
};

// Отключенные даты (которые отсутствуют в массиве `availableDates`)
const disabledDates = computed(() => {
    const allDates = new Set(availableDates.value.map(d => d.toDateString()));
    const range = [];
    let current = new Date(minDate.value);
    while (current <= maxDate.value) {
        if (!allDates.has(current.toDateString())) {
            range.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
    }
    return range;
});

const goBack = () => {
    router.back();
};

onMounted(() => {
    fetchAvailableDates();
});
</script>

<style scoped>
h4 {
    margin: 0;
}
.schedule-details-container {
    padding: 20px 26rem;
    margin: auto;
    color: var(--p-text-color);
    transition: all 0.5s;
}
.schedule-header {
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 30px;
}
.header-row {
    display: flex;
    gap: 20px;
}
.refresh-time {
    border-radius: 12px;
    padding: 8px 14px;
    background-color: var(--p-grey-7);
    transition: all 0.5s;
}
.search-header-card {
    width: 100%;
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
.date-picker {
    display: flex;
    justify-content: center;
}
.schedule-list {
    margin-top: 10px;
}
._per-day-container {
    margin-bottom: 26px;
}
.day-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding: 12px 18px;
    border-radius: 12px;
    color: #fff;
    background-color: var(--p-primary-color);
}
.lesson-card {
    margin-bottom: 12px;
    background: var(--p-grey-7);
    border-radius: 12px;
    padding: 16px 0px;
    border: solid 2px var(--p-grey-4);
    transition: all 0.5s;
}
.time {
    font-size: 1.15rem;
}
.lesson-header {
    display: flex;
    gap: 12px;
    align-items: center;
    font-weight: 600;
    margin-bottom: 4px;
    position: relative;
}
.other-schedule {
    position: absolute;
    right: 0;
    top: 0;
}
.lesson-number {
    color: #fff;
    padding: 1px 14px;
    border-top-right-radius: 12px;
    border-bottom-right-radius: 12px;
    transition: all 0.5s;
}
.lesson-content {
    margin-left: 40px;
}
.lesson-title {
    font-size: 1.4rem;
    color: var(--p-text-color);
    margin-bottom: 2px;
    transition: all 0.5s;
}
.lesson-type {
    font-size: 1.2rem;
}
.lesson-second_plan {
    color: var(--p-grey-1);
    transition: all 0.5s;
}
.lesson-teacher {
    font-size: 1rem;
    margin: 0;
}
.room {
    font-size: 1rem;
    margin: 0;
}
.empty-message {
    text-align: center;
    margin-top: 20px;
    font-size: 1.1rem;
    color: var(--p-text-secondary);
    transition: all 0.5s;
}
.search {
    border-radius: 12px;
    transition: all 0.5s;
    width: 100%; 
}
</style>
