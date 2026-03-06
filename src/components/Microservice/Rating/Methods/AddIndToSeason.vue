<template>
    <Button label="Добавить" outlined class="toggle-button" severity="contrast" icon="pi pi-plus" @click="openDialog"/>
    <Dialog v-model:visible="visible" header="Добавить показатель к сезону" :modal="true" :style="{ width: '90vw', maxWidth: '1200px' }">
        <div class="dialog-content">
            <TreeTable
                :value="treeNodes"
                :expandedKeys="expandedKeys"
                @nodeExpand="onNodeExpand"
                @nodeCollapse="onNodeCollapse"
                dataKey="key"
                scrollable
                scrollHeight="60vh"
                class="indicators-tree"
            >
                <Column field="name" header="Наименование" expander>
                    <template #body="{ node }">
                        <div class="node-content">
                            <div v-if="node.data.isGroup" class="group-node">
                                <!-- <i class="pi pi-folder group-icon"></i> -->
                                <span class="indicator-number">{{ node.data.number }}</span>
                                <span class="group-name">{{ node.data.group }}</span>
                            </div>

                            <div v-else-if="node.data.isSubGroup" class="subgroup-node">
                                <i v-if="node.data.number === 'N'" class="pi pi-folder-open subgroup-icon"></i>
                                <span v-else class="indicator-number">{{ node.data.number }}</span>
                                <span class="subgroup-name">{{ node.data.subGroup }}</span>
                            </div>

                            <div v-else class="indicator-node">
                                <Checkbox 
                                    :modelValue="isIndicatorSelected(node.data.id)" 
                                    @update:modelValue="(checked) => toggleIndicator(node.data.id, checked)"
                                    :binary="true" 
                                    class="indicator-checkbox"
                                />
                                <span class="indicator-number">{{ node.data.number }}</span>
                                <span class="indicator-name">{{ node.data.name }}</span>
                                <div v-if="node.data.periodicity || node.data.responsible" class="indicator-meta">
                                    <Tag v-if="node.data.periodicity" :value="node.data.periodicity" severity="info" class="meta-tag"/>
                                    <Tag v-if="node.data.responsible" :value="node.data.responsible" severity="success" class="meta-tag"/>
                                </div>
                            </div>
                        </div>
                    </template>
                </Column>

                <Column field="actions" header="Статус" style="width: 120px">
                    <template #body="{ node }">
                        <div v-if="!node.data.isGroup && !node.data.isSubGroup" class="status-cell">
                            <Tag 
                                v-if="isIndicatorSelected(node.data.id)"
                                value="Выбран" 
                                severity="success" 
                                icon="pi pi-check"
                            />
                        </div>
                    </template>
                </Column>
            </TreeTable>

            <div class="selection-info">
                <i class="pi pi-info-circle"></i>
                Выбрано показателей: {{ selectedIndicators.length }}
            </div>
        </div>

        <template #footer>
            <Button label="Отмена" icon="pi pi-times" severity="secondary" @click="closeDialog" outlined />
            <Button 
                label="Добавить выбранные" 
                icon="pi pi-check" 
                severity="success" 
                @click="addIndicatorsToSeason" 
                :disabled="selectedIndicators.length === 0 || loading" 
                :loading="loading"
            />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axiosInstance from "@/utils/axios.js";

const visible = ref(false);
const emit = defineEmits(['added']);
const loading = ref(false);

const props = defineProps({
    seasonId: String,
    rawIndicators: {
        type: Array,
        default: () => []
    }
})

const indicators = ref([]);
const selectedIndicators = ref([]);
const expandedKeys = ref({});
const treeNodes = ref([]);

watch(() => props.rawIndicators, () => {
    buildTreeNodes();
}, { deep: true });

const isIndicatorSelected = (id) => {
    if (id === undefined || id === null) return false;
    const sid = String(id);
    return selectedIndicators.value.includes(sid);
};

const toggleIndicator = (id, checked) => {
    const sid = String(id);
    
    if (checked) {
        if (!selectedIndicators.value.includes(sid)) {
            selectedIndicators.value.push(sid);
        }
    } else {
        const idx = selectedIndicators.value.indexOf(sid);
        if (idx > -1) {
            selectedIndicators.value.splice(idx, 1);
        }
    }
};

const onNodeExpand = (node) => {
    expandedKeys.value[node.key] = true;
};

const onNodeCollapse = (node) => {
    delete expandedKeys.value[node.key];
    expandedKeys.value = { ...expandedKeys.value };
};

const fetchInds = async () => {
    try {
        const response = await axiosInstance.get('/api/rating/indicators');
        indicators.value = response.data || [];
        buildTreeNodes();
    } catch(error) {
        console.error("Ошибка при загрузке показателей: ", error);
        indicators.value = [];
    }
};

const buildTreeNodes = () => {
    if (!indicators.value.length) return;
    
    const rawIndicators = props.rawIndicators || [];
    const addedIds = new Set(rawIndicators.map(ind => ind.id?.toString()));
    const availableIndicators = indicators.value.filter(ind => ind && !addedIds.has(ind.id?.toString()));
    
    const groupsMap = {};

    availableIndicators.forEach((ind) => {
        if (!ind) return;
        
        const hasParentGroup = !!ind.groupIndicator?.parentGroupIndicator;
        
        const mainGroup = hasParentGroup
            ? ind.groupIndicator?.parentGroupIndicator?.title
            : ind.groupIndicator?.title || "—";
            
        const subGroup = hasParentGroup 
            ? ind.groupIndicator?.title 
            : "—";

        const mainGroupNum = hasParentGroup 
            ? ind.groupIndicator?.parentGroupIndicator?.numberInOrder 
            : ind.groupIndicator?.numberInOrder || 'N';
            
        const subGroupNum = hasParentGroup 
            ? ind.groupIndicator?.numberInOrder 
            : 'N';

        const indNum = ind.numberInOrder || 'N';

        const groupKey = `group_${mainGroup}`;
        const subGroupKey = `subgroup_${mainGroup}_${subGroup}`;

        if (!groupsMap[groupKey]) {
            groupsMap[groupKey] = { 
                mainGroupNum,
                mainGroup, 
                key: groupKey,
                subGroups: {} 
            };
        }

        if (!groupsMap[groupKey].subGroups[subGroupKey]) {
            groupsMap[groupKey].subGroups[subGroupKey] = {
                subGroupNum,
                subGroup,
                key: subGroupKey,
                indicators: []
            };
        }

        let indicatorFullNumber;
        if (hasParentGroup) {
            indicatorFullNumber = `${mainGroupNum}${subGroupNum !== 'N' ? '.' + subGroupNum : ''}${indNum !== 'N' ? '.' + indNum : ''}`;
        } else {
            indicatorFullNumber = `${mainGroupNum}${indNum !== 'N' ? '.' + indNum : '.N.N'}`;
        }

        groupsMap[groupKey].subGroups[subGroupKey].indicators.push({
            id: ind.id,
            key: `indicator_${ind.id}`,
            number: indicatorFullNumber,
            name: ind.title,
            periodicity: ind.periodicityIndicators?.map(p => p.title).join(", ") || "",
            responsible: ind.responsibleIndicators?.map(r => r.title).join(", ") || "",
            isGroup: false,
            isSubGroup: false
        });
    });

    treeNodes.value = Object.values(groupsMap).map((g) => {
        const subGroupsArray = Object.values(g.subGroups || {});
        
        const subNodes = subGroupsArray.map((s) => {
            const subgroupNumber = s.subGroup === "—" ? 'N' : `${g.mainGroupNum}${s.subGroupNum !== 'N' ? '.' + s.subGroupNum : ''}`;
            
            return {
                key: s.key,
                data: { 
                    number: subgroupNumber,
                    subGroup: s.subGroup, 
                    isGroup: false, 
                    isSubGroup: true 
                },
                children: (s.indicators || []).map(ind => ({
                    key: ind.key,
                    data: ind
                }))
            };
        });

        return {
            key: g.key,
            data: { 
                number: g.mainGroupNum,
                group: g.mainGroup, 
                isGroup: true, 
                isSubGroup: false 
            },
            children: subNodes
        };
    });
};

const openDialog = async () => {
    await fetchInds();
    selectedIndicators.value = [];
    visible.value = true;
}; 

const closeDialog = () => {
    selectedIndicators.value = [];
    loading.value = false;
    visible.value = false;
}; 

const addIndicatorsToSeason = async () => {
    if (selectedIndicators.value.length === 0) return;
    
    loading.value = true;
    
    try {
        const indicatorIds = selectedIndicators.value.map(id => parseInt(id));

        const response = await axiosInstance.post(
            `/api/rating/seasons/${props.seasonId}/indicators`,
            indicatorIds
        );

        emit('added');
        
        closeDialog();
        
        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'success',
                summary: 'Рейтинг',
                detail: `Добавлено показателей: ${indicatorIds.length}`,
            }
        }));

    } catch(error) {
        console.error('Ошибка при добавлении показателей: ', error);

        let errorMessage = 'Ошибка при добавлении показателей';
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'Рейтинг', 
                detail: errorMessage,
            }
        }));
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    await fetchInds();
});
</script>

<style scoped>
.dialog-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.indicators-tree {
    border-radius: 12px;
    overflow: hidden;
}

.indicators-tree :deep(.p-treetable) {
    border: none;
}

.indicators-tree :deep(.p-treetable-thead > tr > th) {
    background: var(--p-grey-3);
    border: none;
    font-weight: 600;
    padding: 1rem;
}

.indicators-tree :deep(.p-treetable-tbody > tr > td) {
    border-bottom: 1px solid var(--p-grey-4);
    padding: 0.75rem 1rem;
}

.node-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.group-node, .subgroup-node {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
}

.group-icon {
    color: #667eea;
    font-size: 1.25rem;
}

.subgroup-icon {
    color: #f093fb;
    font-size: 1.1rem;
}

.indicator-node {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.indicator-checkbox {
    margin-right: 0.5rem;
}

.indicator-number {
    background: #667eea;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    min-width: 40px;
    text-align: center;
}

.indicator-name {
    font-weight: 500;
    flex: 1;
}

.indicator-meta {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
}

.meta-tag {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
}

.status-cell {
    display: flex;
    justify-content: center;
}

.selection-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--p-grey-5);
    border-radius: 6px;
    font-size: 0.875rem;
    color: var(--p-gray-400);
}

.toggle-button {
    border-radius: 12px;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
}
</style>