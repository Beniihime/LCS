export const TABLE_STATE_VERSION = 1;
export const TABLE_STATE_PREFIX = 'lcs.table';

export const buildTableStateKey = (scope) => `${TABLE_STATE_PREFIX}.${scope}`;

const normalizeStoredState = (raw, expectedVersion) => {
    if (!raw || typeof raw !== 'object') return null;

    // Backward compatibility: previous format was plain object.
    if (!Object.prototype.hasOwnProperty.call(raw, 'meta') && !Object.prototype.hasOwnProperty.call(raw, 'data')) {
        return raw;
    }

    const version = raw?.meta?.version;
    if (typeof version === 'number' && version !== expectedVersion) {
        return null;
    }

    return raw?.data ?? null;
};

export const readTableState = (
    key,
    {
        version = TABLE_STATE_VERSION,
        legacyKeys = [],
    } = {}
) => {
    const keys = [key, ...legacyKeys];

    for (const storageKey of keys) {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) continue;

            const parsed = JSON.parse(raw);
            const normalized = normalizeStoredState(parsed, version);
            if (normalized !== null) {
                return normalized;
            }
        } catch {
            continue;
        }
    }

    return null;
};

export const writeTableState = (
    key,
    state,
    {
        version = TABLE_STATE_VERSION
    } = {}
) => {
    const payload = {
        meta: {
            version,
            savedAt: Date.now()
        },
        data: state
    };

    localStorage.setItem(key, JSON.stringify(payload));
};

export const getNumberOrDefault = (value, fallback, { allowZero = false } = {}) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    if (allowZero) return parsed >= 0 ? parsed : fallback;
    return parsed > 0 ? parsed : fallback;
};

export const getStringOrEmpty = (value) => (typeof value === 'string' ? value : '');

export const getArrayOrDefault = (value, fallback = []) => (Array.isArray(value) ? value : fallback);

export const getQueryArray = (value, fallback = []) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.length) return value.split(',');
    return fallback;
};

export const removeTableState = (key) => {
    try {
        localStorage.removeItem(key);
    } catch {
        return;
    }
};
