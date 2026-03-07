<template>
    <div class="control-room-page">
        <div class="control-room-card">
            <div class="header">
                <div>
                    <h2>Control Room</h2>
                    <p>Скрытая служебная панель для runtime-настроек.</p>
                </div>
                <Tag severity="contrast" value="hidden" />
            </div>

            <div class="section">
                <h4>Моки и API</h4>
                <div class="row-item">
                    <div>
                        <div class="row-title">Использовать мок-данные для справок</div>
                        <small>Влияет на список и детали в модуле "Справки".</small>
                    </div>
                    <ToggleSwitch :modelValue="config.useMockData" @update:modelValue="onToggleMock" />
                </div>

                <div class="field">
                    <label for="apiBaseOverride">Override API Base URL</label>
                    <InputText
                        id="apiBaseOverride"
                        v-model.trim="apiBaseDraft"
                        placeholder="https://development.sibadi.org"
                    />
                    <small>Пусто = автоопределение по хосту.</small>
                </div>
            </div>

            <div class="section">
                <h4>FAQ</h4>
                <div class="row-item">
                    <div>
                        <div class="row-title">Использовать /api/faq/{segment}/...</div>
                        <small>Если выключено, используются обычные `/api/faq/...` endpoint'ы.</small>
                    </div>
                    <ToggleSwitch :modelValue="config.useSuFaqEndpoints" @update:modelValue="onToggleFaqEndpoints" />
                </div>

                <div class="field">
                    <label for="faqSegment">FAQ Admin Segment</label>
                    <InputText
                        id="faqSegment"
                        v-model.trim="faqSegmentDraft"
                        placeholder="su"
                    />
                </div>
            </div>

            <div class="actions">
                <Button label="Сохранить" icon="pi pi-check" @click="saveConfig" />
                <Button label="Сбросить дефолты" icon="pi pi-refresh" severity="secondary" outlined @click="resetToDefaults" />
                <Button label="Закрыть доступ" icon="pi pi-lock" severity="danger" outlined @click="lockAndExit" />
            </div>

            <div class="hint">
                <i class="pi pi-info-circle"></i>
                <span>Вход в эту страницу: последовательность ↑↑↓↓←→←→BA и unlock-код.</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
    RUNTIME_CONFIG_EVENT,
    getRuntimeConfig,
    resetRuntimeConfig,
    setHiddenAdminUnlocked,
    updateRuntimeConfig,
} from "@/mocks/config";

const router = useRouter();
const config = ref(getRuntimeConfig());

const faqSegmentDraft = ref(config.value.faqAdminSegment);
const apiBaseDraft = ref(config.value.apiBaseUrlOverride);

const syncFromStorage = () => {
    config.value = getRuntimeConfig();
    faqSegmentDraft.value = config.value.faqAdminSegment;
    apiBaseDraft.value = config.value.apiBaseUrlOverride;
};

const onToggleMock = (value) => {
    updateRuntimeConfig({ useMockData: value });
    syncFromStorage();
};

const onToggleFaqEndpoints = (value) => {
    updateRuntimeConfig({ useSuFaqEndpoints: value });
    syncFromStorage();
};

const saveConfig = () => {
    updateRuntimeConfig({
        faqAdminSegment: faqSegmentDraft.value,
        apiBaseUrlOverride: apiBaseDraft.value,
    });
    syncFromStorage();

    window.dispatchEvent(new CustomEvent("toast", {
        detail: {
            severity: "success",
            summary: "Control Room",
            detail: "Настройки применены",
        },
    }));
};

const resetToDefaults = () => {
    resetRuntimeConfig();
    syncFromStorage();

    window.dispatchEvent(new CustomEvent("toast", {
        detail: {
            severity: "info",
            summary: "Control Room",
            detail: "Runtime-настройки сброшены",
        },
    }));
};

const lockAndExit = () => {
    setHiddenAdminUnlocked(false);
    router.replace("/overview");
};

onMounted(() => {
    window.addEventListener(RUNTIME_CONFIG_EVENT, syncFromStorage);
});

onBeforeUnmount(() => {
    window.removeEventListener(RUNTIME_CONFIG_EVENT, syncFromStorage);
});
</script>

<style scoped>
.control-room-page {
    padding: 1.5rem;
}

.control-room-card {
    max-width: 920px;
    margin: 0 auto;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.25);
    border-radius: 18px;
    padding: 1.25rem;
    background: rgba(var(--p-blue-500-rgb), 0.03);
}

.header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1.25rem;
    color: var(--p-text-color);
}

.header h2 {
    margin: 0;
}

.header p {
    margin: 0.3rem 0 0;
    color: var(--p-grey-2);
}

.section {
    margin-bottom: 1rem;
    padding: 1rem;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.2);
    border-radius: 12px;
    color: var(--p-text-color);
}

.section h4 {
    margin: 0 0 1rem;
}

.row-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
}

.row-title {
    font-weight: 600;
}

small {
    color: var(--p-grey-2);
}
.field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
}

.hint {
    margin-top: 1rem;
    display: flex;
    gap: 0.4rem;
    color: var(--p-grey-2);
}

@media (max-width: 768px) {
    .control-room-page {
        padding: 0.75rem;
    }

    .row-item {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
