<template>
    <main>
        <div class="add-card" @click="openCreateDialog">
            <div class="add-card-content">
                <i class="pi pi-plus-circle add-icon"></i>
                <span class="add-text">Добавить сезон</span>
            </div>
        </div>
        <Dialog 
            v-model:visible="showCreateDialog" 
            header="Создание сезона" 
            :modal="true"
            :style="{ width: '450px' }"
            class="season-create-dialog"
        >
            <div class="d-flex flex-column gap-4">

                <div class="field">
                    <label class="field-label">Год</label>
                    <SelectButton
                        v-model="selectedYear"
                        :options="availableYears"
                        optionLabel="label"
                        optionValue="value"
                        class="year-selector"
                    />
                </div>

                <div class="field">
                    <label class="field-label">Квартал</label>
                    <SelectButton
                        v-model="selectedQuarter"
                        :options="quarters"
                        optionLabel="label"
                        optionValue="value"
                        class="quarter-selector"
                    />
                </div>
            </div>
            <template #footer>
                <Button label="Отмена" icon="pi pi-times" severity="secondary" @click="closeDialog" outlined />
                <Button label="Создать" icon="pi pi-check" severity="success" @click="createSeason" :disbaled="!selectedQuarter" />
            </template>
        </Dialog>
    </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axiosInstance from "@/utils/axios";

const emit = defineEmits(['created']);

const showCreateDialog = ref(false);
const selectedYear = ref(null);
const selectedQuarter = ref(null);

const currentYear = new Date().getFullYear();

const availableYears = computed(() => {
    const years = [];
    for (let i = -1; i <= 2; i++) {
        const year = currentYear + i;
        years.push({
            label: year.toString(),
            value: year
        });
    }
    return years;
});

const quarters = [
    { label: "1 квартал", value: 1 },
    { label: "2 квартал", value: 2 },
    { label: "3 квартал", value: 3 },
    { label: "4 квартал", value: 4 },
];

const formattedTitle = computed(() =>
    selectedYear.value && selectedQuarter.value 
        ? `${selectedYear.value}/${selectedQuarter.value}` 
        : "—"
);

onMounted(() => {
    selectedYear.value = currentYear;
});

const openCreateDialog = () => {
    showCreateDialog.value = true;
};

const closeDialog = () => {
    selectedQuarter.value = null;
    selectedYear.value = currentYear;
    showCreateDialog.value = false;
};

const createSeason = async () => {
    try {
        await axiosInstance.post('/api/rating/seasons', { 
            title: formattedTitle.value 
        });
        emit('created');
        closeDialog();
    } catch(error) {
        console.error('Ошибка при создании сезона: ', error);
    }
}
</script>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}
.add-card {
    padding: 30px 20px;
    display: flex;
    cursor: pointer;
    background-color: var(--p-grey-8);
    border: 2px dashed var(--p-grey-5);
    border-radius: 18px;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
    height: 100%;
    position: relative;
    overflow: hidden;
}

.add-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(var(--p-color-icon-menu), 0.1), transparent);
    transition: left 0.5s ease;
}

.add-card:hover::before {
    left: 100%;
}

.add-card:hover {
    border-color: rgb(var(--p-color-icon-menu));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.add-card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
}

.add-icon {
    font-size: 2rem;
    color: var(--p-grey-4);
    transition: all 0.3s ease;
}

.add-text {
    font-size: 1rem;
    font-weight: 500;
    color: var(--p-grey-3);
    transition: all 0.3s ease;
}

.add-card:hover .add-icon {
    color: rgb(var(--p-color-icon-menu));
}

.add-card:hover .add-text {
    color: rgb(var(--p-color-icon-menu));
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.field-label {
    font-weight: 600;
    color: var(--p-grey-1);
    font-size: 0.9rem;
}

.year-selector,
.quarter-selector {
    width: 100%;
}
</style>