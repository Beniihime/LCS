import { formatDateRuShort } from '@/utils/date.js';

// Общие утилиты для таблиц
export const getMethodSeverity = (method) => {
    switch (method) {
        case 'Manually': return 'success';
        case 'Automatic': return 'info';
        default: return 'secondary';
    }
};

export const formatDate = (dateString) => {
    return formatDateRuShort(dateString, '-');
};

// Декоратор с debounce
export const createDebounceFunction = (callback, delay = 500) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => callback(...args), delay);
    };
};
