<template>
    <div class="schedule-container">
        <header class="header">
            <h2 class="title">Расписание занятий</h2>
        </header>
        <WelcomeScreen :visible="loading" />
        <div class="year-selection row">
            <h3>Учебный год</h3>
            <div class="col" v-for="year in years" :key="year">
                <button  @click="selectYear(year)" 
                        :class="{'active': selectedYear === year}">
                    {{ year }}
                </button>
            </div>
        </div>

        <div class="category-selection row">
            <div class="col" v-for="category in categories" :key="category.id">
                <button @click="selectCategory(category)" :class="{'active': selectedCategory === category.id}">
                    <div class="row justify-content-center fs-5">
                        <div class="col-auto d-flex align-items-center"><i :class="category.icon"></i></div>
                        <div class="col-auto">{{ category.name }}</div>
                    </div>
                     
                </button>
            </div>
        </div>

        <IconField class="searchBar">
            <InputIcon class="pi pi-search" />
            <InputText id="search" name="search" placeholder="Поиск..." class="search" v-model="searchQuery" />
        </IconField>
        
        <div class="schedule position-relative">
            <div class="schedule-visible" v-if="loading === false">
                <div class="schedule-grid">
                    <div v-for="item in paginatedSchedule" :key="item.id" class="schedule-card" @click="goToSchedule(item)">
                        <div class="card-content">
                            <template v-if="selectedCategory === 1">
                                <h4 class="card-title">{{ item.name }}</h4>
                                <Tag class="card-subtitle" :severity="severityFacul(item.facul)">{{ item.facul }}</Tag>
                                <p class="card-info">{{ item.kurs }} курс</p>
                            </template>

                            <template v-else-if="selectedCategory === 2">
                                <i class="pi pi-building room-icon"></i>
                                <h4 class="room-title">{{ item.name }}</h4>
                                <p class="room-info">Аудитория</p>
                            </template>

                            <template v-else-if="selectedCategory === 3">
                                <i class="pi pi-user teacher-icon"></i>
                                <h4 class="teacher-name">{{ item.name }}</h4>
                                <p v-if="item.kaf" class="teacher-kaf">{{ item.kaf || 'Кафедра не указана' }}</p>
                            </template>
                        </div>
                    </div>
                </div>

                <Paginator 
                    :rows="rowsPerPage" 
                    :totalRecords="computedFilteredSchedule.length"
                    :rowsPerPageOptions="[5, 10, 15]"
                    @page="onPageChange"
                    @update:rows="onRowsPerPageOptions"
                    class="paginatorSchedule"
                />
            </div>

            <Skeleton v-if="loading === true" class="position-absolute" style="top: 20px;" width="100%" height="40vh" borderRadius="12px"></Skeleton>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import axios from "axios";
import { useRouter } from 'vue-router';
import { useGroupsStore } from '@/stores/groups';

import WelcomeScreen from '@/components/Utils/WelcomeScreen.vue';

const filteredSchedule = ref([]);
const years = ref([]);
const selectedYear = ref("");
const selectedCategory = ref(1);
const searchQuery = ref("");

const loading = ref(false);
const router = useRouter();

const currentPage = ref(0);
const rowsPerPage = ref(10); // Количество карточек на странице (по умолчанию)

const groupsStore = useGroupsStore();

const paginatedSchedule = computed(() => {
    const start = currentPage.value * rowsPerPage.value;
    const end = start + rowsPerPage.value;
    return computedFilteredSchedule.value.slice(start, end);
});

// Функция для получения ключа хранилища по категории
const getSearchKey = (categoryId) => `searchQuery_category_${categoryId}`;

// Обновление значения `searchQuery` в `localStorage`
watch(searchQuery, (newQuery) => {
    localStorage.setItem(getSearchKey(selectedCategory.value), newQuery);
});

// Фильтрация списка по введенному запросу
const computedFilteredSchedule = computed(() => {
    if (!searchQuery.value.trim()) {
        return filteredSchedule.value;
    }
    const query = searchQuery.value.toLowerCase();
    return filteredSchedule.value.filter(item =>
        item.name.toLowerCase().includes(query) || 
        (item.facul && item.facul.toLowerCase().includes(query))
    );
});

// Обработчик paginator
const onRowsPerPageOptions = (newRows) => {
    rowsPerPage.value = newRows;
    currentPage.value = 0;
}

const onPageChange = (event) => {
    currentPage.value = event.page;
};

const goToSchedule = (item) => {
    if (selectedCategory.value === 1) router.push({ path: `/schedule/group/${item.id}` });
    else if (selectedCategory.value === 2) router.push({ path: `/schedule/room/${item.id}` });
    else if (selectedCategory.value === 3) router.push({ path: `/schedule/teacher/${item.id}` });
}

const fetchYears = async () => {
    try {
        const response = await axios.get('https://umu.sibadi.org/api/Rasp/ListYears');
        years.value = response.data.data.years;
        
        if (years.value.length > 0) {
            selectedYear.value = years.value[years.value.length - 1];
        }
    } catch (error) {
        console.debug('Ошибка при получении годов: ', error);
    }
};

// Универсальная функция для загрузки данных
const fetchSchedule = async (url) => {
    if (!selectedYear.value) return; // Проверяем, установлен ли год

    try {
        loading.value = true;
        const response = await axios.get(url, {
            params: { year: selectedYear.value }
        });
        filteredSchedule.value = response.data.data;
        if(url.match("raspGrouplist").length > 0) {
            groupsStore.setGroups(response.data.data);
        }
    } catch (error) {
        console.error('Ошибка при загрузке расписания: ', error);
    } finally {
        loading.value = false;
    }
};

// Функции для разных категорий
const fetchScheduleGroup = () => fetchSchedule('https://umu.sibadi.org/api/raspGrouplist');
const fetchScheduleAudit = () => fetchSchedule('https://umu.sibadi.org/api/raspAudlist');
const fetchScheduleTeacher = () => fetchSchedule('https://umu.sibadi.org/api/raspTeacherlist');

const categories = [
    {
        "id": 1,
        "icon": "pi pi-users",
        "name": "По группам",
        "command": fetchScheduleGroup,
    },
    {
        "id": 2,
        "icon": "pi pi-building",
        "name": "По аудиториям",
        "command": fetchScheduleAudit,
    },
    {
        "id": 3,
        "icon": "pi pi-user",
        "name": "По преподавателям" ,
        "command": fetchScheduleTeacher,
    },
];

const severityFacul = computed(() => (facul) => {
    const map = {
        "АДПГС": "danger",
        "ИСЭиУ": "warn",
        "ИСУ": "warn",
        "АТНиСТ": "info",
        "ЗФ": "success",
        "ИМА": "primary"
    };
    return map[facul] || "secondary";
});

const selectCategory = (category) => {
    selectedCategory.value = category.id;
    searchQuery.value = localStorage.getItem(getSearchKey(selectedCategory.value)) || "";
    category.command();
};

const selectYear = (year) => {
    selectedYear.value = year;
};

// Следим за изменением года и загружаем данные
watch(selectedYear, () => {
    if (loading.value) return; // Не перезапускаем загрузку, если она уже идет
    const currentCategory = categories.find(cat => cat.id === selectedCategory.value);
    if (currentCategory && currentCategory.command) {
        currentCategory.command();
    }
});

watch(selectedCategory, (newCategory) => {
    sessionStorage.setItem("selectedCategory", newCategory);
})

onMounted(() => {
    const savedCategory = sessionStorage.getItem("selectedCategory");
    if (savedCategory) {
        selectedCategory.value = Number(savedCategory); // Приводим к числу
    }
    searchQuery.value = localStorage.getItem(getSearchKey(selectedCategory.value)) || "";
    
    fetchYears().then(() => {
        const currentCategory = categories.find(cat => cat.id === selectedCategory.value);
        if (currentCategory && currentCategory.command) {
            currentCategory.command();
        }
    });
});

</script>

<style scoped>
.schedule-container {
    /* position: relative; */
    margin: auto;
    height: 100px;
    color: var(--p-text-color);
    padding: 20px 8rem;
    border-radius: 10px;
    transition: all 0.5s;
}

.header {
  text-align: left;
  font-size: 1.5rem;
  color: var(--p-text-color);
  padding: 10px;
  transition: all 0.5s;
}
.year-selection {
    padding: 20px;
    background: var(--p-grey-7);
    margin: 0;
    border-radius: 12px;
    transition: all 0.5s;
}
.category-selection {
    margin: 30px 0 0;
    background: var(--p-grey-7);
    padding: 20px;
    border-radius: 12px;
    transition: all 0.5s;
}
.year-selection button, .category-selection button {
  background: var(--p-grey-6);
  color: var(--p-text-color);
  width: 100%;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.5s;
}
.year-selection button:hover, .category-selection button:hover {
    background: var(--p-blue-500-low-op);
    color: var(--p-color-icon-menu);
}

.year-selection button.active, .category-selection button.active {
  background: var(--p-blue-500-low-op);
  color: var(--p-color-icon-menu);
}

.searchBar {
    margin: 30px 0 0;
}
.search {
    border-radius: 12px;
    transition: all 0.5s;
    width: 100%; 
}

/* Сетка карточек */
.schedule-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 15px;
    margin-top: 30px;
}

.schedule-card {
    position: relative;
    background: var(--p-grey-7);
    border-radius: 12px;
    padding: 15px;
    transition: all 0.5s;
}

.schedule-card:hover {
    background: var(--p-blue-500-low-op);
    color: var(--p-color-icon-menu);
    cursor: pointer;
}
.teacher-icon {
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 2rem;
    color: var(--p-blue-500);
    margin-bottom: 10px;
}
.teacher-name {
    font-size: 1.2rem;
    font-weight: bold;
    width: 70%;
}
.room-icon {
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 2rem;
    color: var(--p-blue-500);
    margin-bottom: 10px;
}

.room-title {
    font-size: 1.4rem;
    font-weight: bold;
}

.card-title {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 10px;
}

.card-subtitle {
    position: absolute;
    top: 15px;
    right: 15px;

    font-size: 0.9rem;
}

.card-info {
    font-size: 0.9rem;
    margin: 5px 0;
}

.category-selection  .pi {
    font-size: 1.5rem;
}
</style>
