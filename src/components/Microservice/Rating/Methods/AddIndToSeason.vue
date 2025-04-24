<template>
    <Button label="Добавить" severity="contrast" icon="pi pi-plus" @click="visible = true"/>
    <Dialog v-model:visible="visible" header="Добавить показатель к сезону" :modal="true">
        <div class="row-cols-1">
            <label for="seasons">Показатель</label>
            <AutoComplete 
                v-model="selectedInd"
                :suggestions="filteredIndicators"
                optionLabel="title"
                placeholder="Выберите показатель..."
                @complete="searchIndicators"
            >
                <template #option="slotProps">
                    <div class="autocomplete-item">
                        {{ slotProps.option.title }}
                    </div>
                </template>
            </AutoComplete>
        </div>
        <template #footer>
            <Button label="Отмена" icon="pi pi-times" severity="secondary" @click="closeDialog" outlined />
            <Button label="Добавить" icon="pi pi-check" severity="success" @click="addIndtoSeason" :disbaled="!selectedInd" />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axiosInstance from "@/utils/axios.js";
const visible = ref(false);
const emit = defineEmits(['added']);

const props = defineProps({
    seasonId: String
})

const selectedInd = ref(null);
const indicators = ref([]);

const fetchInds = async () => {
    try {
        const response = await axiosInstance.get('/api/rating/indicators');
        indicators.value = response.data;
    } catch(error) {
        console.error("Ошибка при загрузке показателей: ", error);
    }
};

const filteredIndicators = ref([]);

const searchIndicators = (event) => {
    const query = event.query.toLowerCase();
    filteredIndicators.value = indicators.value.filter(ind =>
        ind.title.toLowerCase().includes(query)
    );
};

const closeDialog = () => {
    selectedInd.value = '';
    visible.value = false;
} 

const addIndtoSeason = async () => {
    try {
        await axiosInstance.post(`/api/rating/seasons/${props.seasonId}/indicators/${selectedInd.value.id}`);
        emit('added');
        closeDialog();
    } catch(error) {
        console.error('Ошибка при добавлении показателя: ', error);
    }
}

onMounted(async () => {
    await fetchInds();
});
</script>

<style scoped>
.autocomplete-item {
    white-space: normal;
    word-break: break-all;
    padding: 0.5rem;
    line-height: 1.3;
}
:deep(.p-autocomplete-list) {
    width: 100px;
}
</style>