<template>
    <main>
        <WelcolmeScreen :visible="loading"/>
        <div class="content-wrapper">
            <h2 class="mb-4">Выберите сезон</h2>
            <div class="seasons-grid">
                <div v-for="(item, index) in seasons" :key="item.id" class="season" @click="goToSeason(item.id)">
                    <h3>{{ item.title }}</h3>
                    <div class="content mb-4">
                        <i class="pi pi-calendar me-2"></i>
                        <span>{{ item.period }}</span>
                    </div>
                    <div class="content second-plan">
                        <i class="pi pi-chart-bar me-2"></i>
                        <span>Показателей: {{ item.indicators }}</span>
                    </div>
                    <div class="content second-plan">
                        <i class="pi pi-users me-2"></i>
                        <span>Сотрудников: {{ item.employees }}</span>
                    </div>
                    <div class="menu">
                        <Button type="button" icon="pi pi-ellipsis-h" class="edit-btn" @click.stop="(event) => toggle(event, index)" aria-haspopup="true" aria-controls="overlay_menu" v-tooltip="'Действия'" />
                        <Menu :ref="(el) => { if (el) menus[index] = el }" :model="menuItems[index]" :popup="true" id="season_edit"/>
                    </div>
                </div>
                
                <CreateSeason @created="fetchSeasons" />
                <UpdateSeason @edited="fetchSeasons" :season="selectedSeason" v-model:visible="showEditDialog" />
                <DeleteSeason @deleted="fetchSeasons" :season="selectedSeason" v-model:visible="showDeleteDialog"/>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from "vue-router";
import axiosInstance from "@/utils/axios.js";
import { getQuarterPeriod } from '@/utils/formatSeason.js';

import WelcolmeScreen from "@/components/Utils/WelcomeScreen.vue";
import CreateSeason from "@/components/Microservice/Rating/Methods/CreateSeason.vue";
import UpdateSeason from "@/components/Microservice/Rating/Methods/UpdateSeason.vue";
import DeleteSeason from "@/components/Microservice/Rating/Methods/DeleteSeason.vue";

const menus = ref([]);
const router = useRouter();
const seasons = ref([]);
const loading = ref(true);

const menuItems = ref([]);

const selectedSeason = ref(null);

const showEditDialog = ref(false);
const showDeleteDialog = ref(false);

const openEditDialog = (season) => {
  selectedSeason.value = season;
  showEditDialog.value = true;
};

const openDeleteDialog = (season) => {
  selectedSeason.value = season;
  showDeleteDialog.value = true;
};

const toggle = (event, index) => {
    menus.value[index].toggle(event);
};

const goToSeason = (seasonId) => {
    const selected = seasons.value.find(s => s.id === seasonId);
    router.push({ 
        path: `/services/rating/season/${seasonId}`, 
        query: { title: selected.title }
    });
};

const fetchSeasons = async () => {
    loading.value = true;
    try {
        const { data } = await axiosInstance.get('/api/rating/seasons');
        seasons.value = data.map(season => {
            const quarter = season.title.split('/')[1];
            const period = getQuarterPeriod(quarter);

            return {
                ...season,
                period,
                indicators: 0,  // заглушка
                employees: 0    // заглушка
            }
        });

        showEditDialog.value = false;
        showDeleteDialog.value = false;

        menuItems.value = seasons.value.map(season => ([{
            label: 'Действия',
            items: [
                {
                    label: 'Изменить',
                    icon: 'pi pi-pencil',
                    command: () => openEditDialog(season)
                },
                {
                    label: 'Удалить',
                    icon: 'pi pi-trash',
                    command: () => openDeleteDialog(season)
                }
            ]
        }]));
    } catch (error) {
        console.error('Ошибка при получении сезонов: ', error);
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
  await fetchSeasons();
});

</script>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}
.content-wrapper {
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 20px 8rem;
    overflow: hidden;
    color: var(--p-text-color);
}
.seasons-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(4, 1fr);
}
.season {
    padding: 20px;
    background-color: var(--p-grey-7);
    border-radius: 18px;
    transition: all 0.5s;
    position: relative;
}
.menu {
    position: absolute;
    top: 20px;
    right: 20px;
} 
.season:hover {
    cursor: pointer;
    background-color: var(--p-blue-500-low-op);
    color: var(--p-color-icon-menu);
}
.content {
    display: flex;
    align-items: center;
    font-size: 18px;
}

.pi {
    font-size: 20px;
}
.second-plan {
    color: var(--p-grey-1);
}
.edit-btn {
    border-radius: 8px;
    color: white;
    position: absolute;
    top: 0;
    right: 0;
    width: 30px;
    height: 30px;
}
</style>