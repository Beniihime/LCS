<template>
    <Dialog 
        v-model:visible="internalVisible" 
        header="Редактирование сезона" 
        :modal="true"
        :style="{ width: '450px' }"
        class="season-edit-dialog"
    >
        <div class="d-flex flex-column gap-4">

            <div class="field">
                <div class="year-display">
                    <span>{{ currentYear }}</span>
                </div>
            </div>

            <div class="field">
                <label class="field-label">Квартал</label>
                <SelectButton
                    v-model="selectedQuarter"
                    :options="quarters"
                    optionLabel="label"
                    optionValue="value"
                    class="quarter-selector"
                    :disabled="isClosed"
                />
            </div>

            <div class="field">
                <div class="field-label">Статус</div>
                <div class="status-section">
                    <ToggleSwitch 
                        v-model="isClosed"
                        class="status-switch"
                    />
                    <div class="status-info">
                        <span class="status-label" :class="{'status-closed': isClosed, 'status-open': !isClosed}">
                            {{ isClosed ? 'Сезон закрыт' : 'Сезон открыт' }} 
                        </span>
                        
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Отмена" icon="pi pi-times" @click="closeDialog" severity="secondary" outlined />
            <Button label="Сохранить" icon="pi pi-check" @click="editSeason" severity="success" :disabled="!selectedQuarter" />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import axiosInstance from '@/utils/axios.js';

const props = defineProps({
    visible: Boolean,
    season: Object
});

const emit = defineEmits(['update:visible', 'edited']);

const internalVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const currentYear = computed(() => {
    if (props.season?.title) {
        return props.season.title.split("/")[0];
    }
    return new Date().getFullYear().toString(); // Fallback на текущий год
});
const selectedQuarter = ref(null);
const isClosed = ref(false);

const quarters = [
    { label: "1 квартал", value: 1 },
    { label: "2 квартал", value: 2 },
    { label: "3 квартал", value: 3 },
    { label: "4 квартал", value: 4 },
];

const formattedTitle = computed(() =>
    selectedQuarter.value ? `${currentYear.value}/${selectedQuarter.value}` : ""
);

const loadSeasonData = () => {
    if (props.season?.title) {
        const [year, quarter] = props.season.title.split("/");
        if (parseInt(year) === parseInt(currentYear.value)) {
            selectedQuarter.value = parseInt(quarter);
        } else {
            selectedQuarter.value = null;
        }
    } else {
        selectedQuarter.value = null;
    }
    isClosed.value = props.season?.isClosed || false;
};

watch(
    () => internalVisible.value,
    (newVal) => {
        if (newVal) {
            loadSeasonData();
        }
    }
);

watch(
    () => props.season,
    () => {
        if (internalVisible.value) {
            loadSeasonData();
        }
    },
    { deep: true }
);

const closeDialog = () => {
    internalVisible.value = false;
};

const editSeason = async () => {
    try {
        await axiosInstance.put(`/api/rating/seasons/${props.season.id}`, {
            title: formattedTitle.value,
            isClosed: isClosed.value
        });
        emit("edited");
        closeDialog();
    } catch (err) {
        console.error("Ошибка при редактировании сезона", err);
    }
};
</script>

<style scoped>
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

.year-display {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    background-color: var(--p-grey-7);
    font-size: 2rem;
}

.quarter-selector {
    width: 100%;
}

.status-section {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: var(--p-grey-7);
    border-radius: 8px;
}

.status-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.25rem;
    flex: 1;
}

.status-label {
    font-weight: 600;
    font-size: 0.95rem;
}

</style>