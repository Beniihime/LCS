// Общие утилиты для таблиц
export const getMethodSeverity = (method) => {
    switch (method) {
        case 'Manually': return 'success';
        case 'Automatic': return 'info';
        default: return 'secondary';
    }
};

export const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
};

// Декоратор с debounce
export const createDebounceFunction = (callback, delay = 500) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => callback(...args), delay);
    };
};