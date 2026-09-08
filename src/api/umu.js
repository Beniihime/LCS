import axiosInstance from '@/utils/axios.js';

const base = '/api/umu';

/**
 * Получить записи/группы аутентифицированного студента в UMU.
 * @returns {Promise} axios-ответ со списком StudentProfileEntry
 */
export function getMyUmuGroups() {
    return axiosInstance.get(`${base}/students/me/groups`);
}

/**
 * Получить оценки студента из ведомостей по выбранной группе.
 * @param {Object} params
 * @param {number} params.studentId — код студента в UMU, привязанный к выбранной группе
 * @param {number} [params.semester] — явный семестр
 * @param {boolean} [params.latestSemester] — только самый свежий (Год, Семестр)
 * @param {string} [params.fromDate] — ISO-дата (по Дата_Экзамена ведомости, с)
 * @param {string} [params.toDate] — ISO-дата (по Дата_Экзамена ведомости, по)
 * @param {string} [params.discipline] — поиск по названию предмета
 * @returns {Promise} axios-ответ со списком StudentGrades
 */
export function getMyUmuGrades(params = {}) {
    return axiosInstance.get(`${base}/students/me/grades`, { params });
}