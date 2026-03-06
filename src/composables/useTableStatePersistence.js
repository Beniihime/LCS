import { watch } from 'vue';
import { writeTableState } from '@/utils/tableState.js';

export const useTableStatePersistence = ({
    key,
    collectState,
    watchTargets = [],
    options = {},
}) => {
    if (!key || typeof collectState !== 'function') return;

    const persist = () => {
        writeTableState(key, collectState(), options);
    };

    for (const target of watchTargets) {
        if (!target) continue;

        if (typeof target === 'function' || Array.isArray(target)) {
            watch(target, persist, { deep: true });
            continue;
        }

        watch(target.source, persist, { deep: true, ...(target.options || {}) });
    }

    return { persist };
};
