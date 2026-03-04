const isInvalidDate = (value) => Number.isNaN(value.getTime());

const toDate = (value) => {
    if (value instanceof Date) return value;
    return new Date(value);
};

const formatByLocale = (value, options, emptyValue = '') => {
    if (!value) return emptyValue;
    const date = toDate(value);
    if (isInvalidDate(date)) return emptyValue;
    return date.toLocaleDateString('ru-RU', options);
};

export const formatDateRuLong = (value, emptyValue = '-') => {
    return formatByLocale(value, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }, emptyValue);
};

export const formatDateRuLongWithTime = (value, emptyValue = '-') => {
    return formatByLocale(value, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }, emptyValue);
};

export const formatDateRuShort = (value, emptyValue = '-') => {
    return formatByLocale(value, {}, emptyValue);
};

export const formatDateRuShortWithTime = (value, emptyValue = '-') => {
    if (!value) return emptyValue;
    const date = toDate(value);
    if (isInvalidDate(date)) return emptyValue;
    return `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
};

export const formatRuWeekday = (value, emptyValue = '') => {
    if (!value) return emptyValue;
    const date = toDate(value);
    if (isInvalidDate(date)) return emptyValue;
    return new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(date);
};

export const formatRuWeekdayCapitalized = (value, emptyValue = '') => {
    const weekday = formatRuWeekday(value, emptyValue);
    if (!weekday) return emptyValue;
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
};

export const formatDateOmskFromUnixSeconds = (value, emptyValue = '') => {
    if (!value && value !== 0) return emptyValue;
    const date = new Date(Number(value) * 1000);
    if (isInvalidDate(date)) return emptyValue;
    return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Omsk',
    }).format(date);
};

export const formatDateOmskFromUtcString = (value, emptyValue = '') => {
    if (!value) return emptyValue;
    const date = new Date(`${value}Z`);
    if (isInvalidDate(date)) return emptyValue;
    date.setHours(date.getUTCHours() + 6);
    return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
};

export const formatFileSize = (size, emptyValue = '') => {
    if (size === null || size === undefined || Number.isNaN(Number(size))) return emptyValue;
    const value = Number(size);
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};
