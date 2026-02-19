<template>
    <main>
        <div class="header">
            <h2 class="m-0">Настройка SSO</h2>
        </div>

        <div class="content-wrapper">
            <Transition name="content-fade" mode="out-in">
            <DataTable 
                v-if="!loading || ssoList.length"
                key="sso-content"
                :value="paginatedList" 
                dataKey="id" 
                class="mb-4 no-row-hover" 
                paginator
                stripedRows
                :rows="rowsPerPage"
                :totalRecords="ssoList.length"
                :first="first"
                @page="onPageChange"
            >
                <template #header>
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="m-0">SSO конфигурации</h3>
                        <div class="page-controls d-flex gap-2">
                            <AddSsoConfig @added="loadConfigs" />
                            <Button 
                                icon="pi pi-sync"
                                outlined
                                severity="secondary"
                                @click="loadConfigs"
                                :loading="loading"
                                :disabled="loading"
                            />
                        </div>
                    </div>
                </template>

                <Column field="clientId" header="ID клиента" />
                <Column field="clientName" header="Клиент" />
                <Column field="clientSecret" header="Secret клиента" />
                <Column field="clientUri" header="URI клиента" />
                <Column field="applicationType" header="Тип приложения" />
                <Column header="Grant Types">
                    <template #body="{ data }">
                        {{ data.grantTypes?.map(g => g.title).join(', ') || '-' }}
                    </template>
                </Column>
                <Column field="tokenEndpointAuthMethod" header="Метод авторизации" />
                <Column field="redirectUri" header="Redirect URI" />
                <Column field="scope" header="Scope" />
                <Column field="usePkce" header="PKCE">
                   <template #body="{ data }">
                        <Tag 
                            :icon="!data.usePkce ? 'pi pi-times' : 'pi pi-check'" 
                            :severity="!data.usePkce ? 'danger' : 'success'" 
                        />
                   </template>
                </Column>
                <Column header="">
                    <template #body="{ data }">
                        <DeleteSsoConfig :config="data" @deleted="loadConfigs" />
                    </template>
                </Column>

                <template #paginatorstart>
                    <div>Всего конфигураций: {{ ssoList.length }}</div>
                </template>

                <template #paginatorend>
                    <div class="d-flex align-items-center">
                        <span>Показать</span>
                        <Select 
                            v-model="rowsPerPage"
                            :options="rowsPerPageOptions"
                            optionLabel="label"
                            optionValue="value"
                            class="search mx-1 px-1"
                        />
                        <span>строк</span>
                    </div>
                </template>

            </DataTable>
            <div v-else key="sso-skeleton" class="table-skeleton">
                <Skeleton width="16rem" height="2rem" class="mb-4" />
                <Skeleton width="100%" height="3rem" class="mb-3" />
                <Skeleton width="100%" height="3rem" class="mb-2" />
                <Skeleton width="100%" height="3rem" class="mb-2" />
                <Skeleton width="100%" height="3rem" class="mb-2" />
                <Skeleton width="100%" height="3rem" class="mb-2" />
            </div>
            </Transition>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axiosInstance from "@/utils/axios";

import DeleteSsoConfig from "@/components/Sso/DeleteSsoConfig.vue";
import AddSsoConfig from "@/components/Sso/AddSsoConfig.vue";

const loading = ref(true);

const ssoList = ref([]);
const first = ref(0);
const rowsPerPage = ref(5);

const paginatedList = computed(() => {
    const start = first.value;
    const end = first.value + rowsPerPage.value;
    return ssoList.value.slice(start, end);
});

const rowsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '15', value: 15 },
];

const onPageChange = (event) => {
    first.value = event.first;
}

onMounted(() => {
   loadConfigs(); 
});

const loadConfigs = async () => {
    loading.value = true;
    try {
        const response = await axiosInstance.get('/api/sso/resources');
        ssoList.value = response.data;
    } catch (error) {
        console.debug('Ошибка при загрузке SSO конфигураций: ', error);
        loading.value = false;
    } finally {
        loading.value = false;
    }
    
}

</script>

<style scoped>
main {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100vh;
    
    box-sizing: border-box;
    color: var(--p-text-color);
}
.header {
    padding: 20px 8rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.content-wrapper {
    height: 100%;
    padding: 10px 2rem;
}

:deep(.no-row-hover .p-datatable-tbody > tr:hover),
:deep(.no-row-hover .p-datatable-tbody > tr.p-row-hover),
:deep(.no-row-hover.p-datatable-hoverable-rows .p-datatable-tbody > tr:hover) {
    background: transparent !important;
}
.table-skeleton {
    width: 100%;
}
</style>