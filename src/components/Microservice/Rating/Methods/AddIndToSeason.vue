<template>
    <Button label="Добавить" severity="contrast" icon="pi pi-plus" @click="openDialog"/>
    <Dialog v-model:visible="visible" header="Добавить показатель к сезону" :modal="true">
        <div class="row-cols-1">
            <PickList
                v-model="pickListValue"
                :showSourceControls="false"
                :showTargetControls="false"
                scrollHeight="30rem"
                style="width: 70rem;"
            >
                <template #option="{ option }">
                    <div class="autocomplete-item">
                        {{ option.title }}
                    </div>
                </template>
            </PickList>
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

const sohedar = ref('Доступные показатели')

const props = defineProps({
    seasonId: String,
    rawIndicators: Object
})

const pickListValue = ref([[], []]);
const selectedIndicators = ref(null);
const indicators = ref([]);

const fetchInds = async () => {
    try {
        const response = await axiosInstance.get('/api/rating/indicators');
        indicators.value = response.data;
    } catch(error) {
        console.error("Ошибка при загрузке показателей: ", error);
    }
};

const openDialog = async () => {
    const addedIds = new Set(props.rawIndicators.map(ind => ind.id));
    const availableIndicators = indicators.value.filter(ind => !addedIds.has(ind.id));

    pickListValue.value = [availableIndicators, []];
    visible.value = true;
} 

const closeDialog = () => {
    pickListValue.value = [ indicators.value, [] ];
    selectedIndicators.value = [];
    visible.value = false;
} 

const addIndtoSeason = async () => {
    try {
        const selectedInd = pickListValue.value[1][0];
        await axiosInstance.post(`/api/rating/seasons/${props.seasonId}/indicators/${selectedInd.id}`);
        const createdIndId = selectedInd.id;
        emit('added', createdIndId);
        closeDialog();
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Рейтинг', 
                detail: `Показатель добавлен в сезон`,
            }
        }));
    } catch(error) {
        console.error('Ошибка при добавлении показателя: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'danger', 
                summary: 'Рейтинг', 
                detail: `Ошибка при добавлении показателя`,
            }
        }));
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