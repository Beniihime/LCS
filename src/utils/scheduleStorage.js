const SCHEDULE_LAST_TYPE_KEY = 'scheduleLastType';
const SCHEDULE_LAST_ID_KEY = 'scheduleLastId';
const SCHEDULE_LAST_NAME_KEY = 'scheduleLastName';
const SCHEDULE_SELECTED_CATEGORY_KEY = 'selectedScheduleCategory';

export const SCHEDULE_TYPE_GROUP = 'group';
export const SCHEDULE_TYPE_ROOM = 'room';
export const SCHEDULE_TYPE_TEACHER = 'teacher';

export const SCHEDULE_TYPES = [
    SCHEDULE_TYPE_GROUP,
    SCHEDULE_TYPE_ROOM,
    SCHEDULE_TYPE_TEACHER
];

const TYPE_TO_CATEGORY = {
    [SCHEDULE_TYPE_GROUP]: 1,
    [SCHEDULE_TYPE_ROOM]: 2,
    [SCHEDULE_TYPE_TEACHER]: 3
};

const CATEGORY_TO_TYPE = {
    1: SCHEDULE_TYPE_GROUP,
    2: SCHEDULE_TYPE_ROOM,
    3: SCHEDULE_TYPE_TEACHER
};

const TYPE_TO_ROUTE = {
    [SCHEDULE_TYPE_GROUP]: 'group',
    [SCHEDULE_TYPE_ROOM]: 'room',
    [SCHEDULE_TYPE_TEACHER]: 'teacher'
};

const TYPE_TO_STORAGE_KEYS = {
    [SCHEDULE_TYPE_GROUP]: { id: 'scheduleGroupId', name: 'scheduleGroupName' },
    [SCHEDULE_TYPE_ROOM]: { id: 'scheduleRoomId', name: 'scheduleRoomName' },
    [SCHEDULE_TYPE_TEACHER]: { id: 'scheduleTeacherId', name: 'scheduleTeacherName' }
};

export const normalizeScheduleType = (type) => {
    if (!type) return SCHEDULE_TYPE_GROUP;
    const normalized = String(type).toLowerCase();
    return SCHEDULE_TYPES.includes(normalized) ? normalized : SCHEDULE_TYPE_GROUP;
};

export const categoryToScheduleType = (categoryId) => CATEGORY_TO_TYPE[Number(categoryId)] || SCHEDULE_TYPE_GROUP;

export const scheduleTypeToCategory = (type) => TYPE_TO_CATEGORY[normalizeScheduleType(type)] || 1;

export const buildSchedulePath = (type, id) => {
    const safeType = normalizeScheduleType(type);
    if (!id) return '/schedule';
    return `/schedule/${TYPE_TO_ROUTE[safeType]}/${id}`;
};

export const saveScheduleSelection = ({ type, id, name, setAsLast = true }) => {
    const safeType = normalizeScheduleType(type);
    if (!id) return;

    const keys = TYPE_TO_STORAGE_KEYS[safeType];
    const safeId = String(id);

    localStorage.setItem(keys.id, safeId);

    if (name) {
        localStorage.setItem(keys.name, String(name));
    }

    if (setAsLast) {
        localStorage.setItem(SCHEDULE_LAST_TYPE_KEY, safeType);
        localStorage.setItem(SCHEDULE_LAST_ID_KEY, safeId);
        localStorage.setItem(SCHEDULE_LAST_NAME_KEY, name ? String(name) : '');
    }
};

export const getScheduleSelectionByType = (type) => {
    const safeType = normalizeScheduleType(type);
    const keys = TYPE_TO_STORAGE_KEYS[safeType];

    return {
        type: safeType,
        id: localStorage.getItem(keys.id) || '',
        name: localStorage.getItem(keys.name) || ''
    };
};

export const getLastScheduleSelection = () => {
    const type = normalizeScheduleType(localStorage.getItem(SCHEDULE_LAST_TYPE_KEY));
    const id = localStorage.getItem(SCHEDULE_LAST_ID_KEY) || '';
    const name = localStorage.getItem(SCHEDULE_LAST_NAME_KEY) || '';

    if (!id) {
        return getScheduleSelectionByType(type);
    }

    return { type, id, name };
};

export const saveSelectedScheduleCategory = (categoryId) => {
    localStorage.setItem(SCHEDULE_SELECTED_CATEGORY_KEY, String(categoryId));
};

export const getSavedScheduleCategory = () => {
    const saved = Number(localStorage.getItem(SCHEDULE_SELECTED_CATEGORY_KEY));
    if ([1, 2, 3].includes(saved)) return saved;
    return null;
};
