const STORAGE_KEYS = {
    useMockData: "lcs.runtime.useMockData",
    useSuFaqEndpoints: "lcs.runtime.useSuFaqEndpoints",
    faqAdminSegment: "lcs.runtime.faqAdminSegment",
    apiBaseUrlOverride: "lcs.runtime.apiBaseUrlOverride",
    hiddenAdminUnlocked: "lcs.runtime.hiddenAdminUnlocked",
};

const DEFAULTS = {
    useMockData: false,
    useSuFaqEndpoints: false,
    faqAdminSegment: "su",
    apiBaseUrlOverride: "",
    hiddenAdminUnlocked: false,
};

export const RUNTIME_CONFIG_EVENT = "lcs:runtime-config-updated";
const IS_DEV = import.meta.env.DEV;
const HIDDEN_ADMIN_UNLOCK_CODE = String(import.meta.env.VITE_CONTROL_ROOM_CODE || "").trim().toLowerCase();

const readBoolean = (key, fallback = false) => {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    return value === "true";
};

const writeBoolean = (key, value) => {
    localStorage.setItem(key, String(Boolean(value)));
};

const readString = (key, fallback = "") => {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    return String(value).trim();
};

const emitRuntimeConfigUpdated = () => {
    window.dispatchEvent(new CustomEvent(RUNTIME_CONFIG_EVENT));
};

export const getUseMockData = () => readBoolean(STORAGE_KEYS.useMockData, DEFAULTS.useMockData);
export const getUseSuFaqEndpoints = () => readBoolean(STORAGE_KEYS.useSuFaqEndpoints, DEFAULTS.useSuFaqEndpoints);
export const getFaqAdminSegment = () => readString(STORAGE_KEYS.faqAdminSegment, DEFAULTS.faqAdminSegment);
export const getApiBaseUrlOverride = () => readString(STORAGE_KEYS.apiBaseUrlOverride, DEFAULTS.apiBaseUrlOverride);
export const isHiddenAdminUnlocked = () => {
    if (!IS_DEV) return false;
    return readBoolean(STORAGE_KEYS.hiddenAdminUnlocked, DEFAULTS.hiddenAdminUnlocked);
};

export const updateRuntimeConfig = (patch = {}) => {
    if (Object.prototype.hasOwnProperty.call(patch, "useMockData")) {
        writeBoolean(STORAGE_KEYS.useMockData, patch.useMockData);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "useSuFaqEndpoints")) {
        writeBoolean(STORAGE_KEYS.useSuFaqEndpoints, patch.useSuFaqEndpoints);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "faqAdminSegment")) {
        const value = String(patch.faqAdminSegment || DEFAULTS.faqAdminSegment).trim() || DEFAULTS.faqAdminSegment;
        localStorage.setItem(STORAGE_KEYS.faqAdminSegment, value);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "apiBaseUrlOverride")) {
        const value = String(patch.apiBaseUrlOverride || "").trim();
        if (!value) {
            localStorage.removeItem(STORAGE_KEYS.apiBaseUrlOverride);
        } else {
            localStorage.setItem(STORAGE_KEYS.apiBaseUrlOverride, value);
        }
    }
    emitRuntimeConfigUpdated();
};

export const getRuntimeConfig = () => ({
    useMockData: getUseMockData(),
    useSuFaqEndpoints: getUseSuFaqEndpoints(),
    faqAdminSegment: getFaqAdminSegment(),
    apiBaseUrlOverride: getApiBaseUrlOverride(),
    hiddenAdminUnlocked: isHiddenAdminUnlocked(),
});

export const resetRuntimeConfig = () => {
    localStorage.removeItem(STORAGE_KEYS.useMockData);
    localStorage.removeItem(STORAGE_KEYS.useSuFaqEndpoints);
    localStorage.removeItem(STORAGE_KEYS.faqAdminSegment);
    localStorage.removeItem(STORAGE_KEYS.apiBaseUrlOverride);
    emitRuntimeConfigUpdated();
};

export const unlockHiddenAdmin = (providedCode) => {
    if (!IS_DEV) return false;
    if (!HIDDEN_ADMIN_UNLOCK_CODE) return false;

    const normalized = String(providedCode || "").trim().toLowerCase();
    const isValid = normalized === HIDDEN_ADMIN_UNLOCK_CODE;

    if (isValid) {
        writeBoolean(STORAGE_KEYS.hiddenAdminUnlocked, true);
        emitRuntimeConfigUpdated();
    }

    return isValid;
};

export const setHiddenAdminUnlocked = (value) => {
    if (!IS_DEV) return;
    writeBoolean(STORAGE_KEYS.hiddenAdminUnlocked, value);
    emitRuntimeConfigUpdated();
};
