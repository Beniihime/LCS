<template>
    <div>
        <Button label="Добавить конфигурацию" icon="pi pi-plus" @click="showAddDialog = true" />

        <Dialog v-model:visible="showAddDialog" modal header="Новая SSO конфигурация" :style="{ 'width' : '30rem' }">
            <form @submit.prevent="submitConfig" class="d-flex flex-column">
                <InputText v-model="newConfig.clientName" placeholder="Имя клиента..." class="mb-3" />
                <InputText v-model="newConfig.clientId" placeholder="ID клиента..." class="mb-3" />
                <InputText v-model="newConfig.clientSecret" placeholder="Secret клиента..." class="mb-3" />
                <InputText v-model="newConfig.applicationType" placeholder="Тип приложения..." class="mb-3" />
                <InputText v-model="newConfig.tokenEndpointAuthMethod" placeholder="Метод авторизации..." class="mb-3" />
                <!-- <InputText v-model="newConfig.grantTypes" placeholder="Grant Types..." class="mb-3" /> -->
                <Chips v-model="newConfig.grantTypes" :allowDuplicate="false" class="mb-3" placeholder="Введите и нажмите Enter..." />
                <InputText v-model="newConfig.redirectUri" placeholder="Redirect URI..." class="mb-3" />
                <InputText v-model="newConfig.scope" placeholder="Scope..." class="mb-3" />
                <InputText v-model="newConfig.clientUri" placeholder="URI клиента..." class="mb-3" />
                <div class="mb-3">
                    <Checkbox v-model="newConfig.usePkce" :binary="true" inputId="pkce" />
                    <label for="pkce" class="ms-2">Использовать PKCE</label>
                </div>
                <Button label="Сохранить" type="submit" class="mt-2" severity="success" />
            </form>
        </Dialog>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import axiosInstance from '@/utils/axios';

const showAddDialog = ref(false);

const emit = defineEmits(['added']);

const newConfig = ref({
    applicationType: '',
    clientId: '',
    clientSecret: '',
    grantTypes: [],
    tokenEndpointAuthMethod: '',
    redirectUri: '',
    scope: '',
    clientName: '',
    clientUri: '',
    usePkce: false
})

const grantTypes = [
    { title: 'authorization_code' },
    { title: 'implicit' },
    { title: 'client_credentials' },
    { title: 'password' },
    { title: 'refresh_token' },
];

const submitConfig = async () => {
    try {
        const payload = { ...newConfig.value, grantTypes: newConfig.value.grantTypes };
        await axiosInstance.post('/api/sso/resources', payload);
        emit('added');
        showAddDialog.value = false;
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'SSO', 
                detail: `SSO конфигурация успешно добавлена`,
            }
        }));
    } catch (error) {
        console.debug("Ошибка при сохранении конфигурации SSO: ", error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'SSO', 
                detail: `Ошибка при сохранении конфигурации SSO`,
            }
        }));
    }   
}

</script>

<style scoped>

</style>