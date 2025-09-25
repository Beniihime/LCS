<template>
    <Button 
        icon="pi pi-pencil"
        text
        size="small"
        v-tooltip.top="'Добавить оценку'"
        @click="openDialog"
    />
    <Dialog v-model:visible="visible" header="Добавить оценку сотруднику" modal
        :style="{ width: '90vw', maxWidth: '1400px' }" class="add-employee-dialog">
        
        <div class="dialog-content">
            <!-- Left Side -->
            <div class="indicator-info-section">
                <div class="section-card">
                    <h3 class="section-title">
                        <i class="pi pi-info-circle"></i>
                        Информация о показателе
                    </h3>
                    <div class="indicator-details">
                        <div class="detail-item">
                            <span class="detail-label">Номер:</span>
                            <span class="detail-value">
                                {{ indicatorData.groupIndicator?.numberInOrder || 'N' }}.{{ indicatorData.subGroupIndicator?.numberInOrder || 'N' }}.{{ indicatorData.numberInOrder }}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Название:</span>
                            <span class="detail-value">{{ indicatorData.title }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Группа:</span>
                            <span class="detail-value">{{ indicatorData.groupIndicator?.title || '-' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Подгруппа:</span>
                            <span class="detail-value">{{ indicatorData.subGroupIndicator?.title || '-' }}</span>
                        </div>
                    </div>
                </div>

                <div class="section-card">
                    <h3 class="section-title">
                        <i class="pi pi-chart-line"></i>
                        Система оценивания
                    </h3>

                    <!-- Переключатель между табличным и списковым видом -->
                    <div class="view-toggle">
                        <Button 
                            :label="showTableView ? 'Списком' : 'Таблицей'" 
                            icon="pi pi-table" 
                            text
                            size="small"
                            @click="showTableView = !showTableView"
                        />
                    </div>

                    <!-- Табличное представление -->
                    <div v-if="showTableView && parsedTableData.length > 0" class="table-view">
                        <div class="table-container" v-html="indicatorData.scores[0]?.description?.table || ''"></div>
                    </div>

                    <!-- Списковое представление -->
                    <div v-else-if="parsedScores.length > 0" class="scores-container">
                        <div class="scores-header">
                            <span>Критерий оценивания</span>
                            <span>Баллы</span>
                        </div>
                        <div class="scores-list">
                            <div v-for="(score, index) in parsedScores" :key="index"
                                class="score-item" :class="{ 'selected': selectedScore === score.points }"
                                @click="selectScore(score)"
                            >
                                <span class="score-criteria" v-html="score.criteria"></span>
                                <span class="score-points">{{ score.points }}</span>
                            </div>
                        </div>
                    </div>
                    <div v-else class="no-scores">
                        <i class="pi pi-exclamation-triangle"></i>
                        <p>Нет доступных критериев оценивания</p>
                    </div>
                </div>
            </div>

            <!-- Right Side -->
            <div class="employee-form-section">
                <div class="section-card">
                    <h3 class="section-title">
                        <i class="pi pi-user-plus"></i>
                        Выбор сотрудника
                    </h3>

                    <div class="search-section">
                        <div class="search-input-wrapper">
                            <i class="pi pi-search search-icon"></i>
                            <InputText 
                                v-model="searchQuery"
                                placeholder="Поиск сотрудника по ФИО"
                                class="search-input"
                                @input="searchEmployees"
                            />
                            <Button 
                                icon="pi pi-times"
                                text
                                class="clear-search"
                                @click="clearSearch"
                                v-if="searchQuery"
                            />
                        </div>
                    </div>

                    <div class="employees-list">
                        <div v-if="filteredEmployees.length > 0" class="employees-scrollable">
                            <div v-for="employee in filteredEmployees" :key="employee.id"
                                class="employee-card" :class="{ 'selected': selectedEmployee?.id === employee.id }"
                                @click="selectEmployee(employee)"
                            >
                                <div class="employee-avatar">
                                    <i class="pi pi-user"></i>
                                </div>
                                <div class="employee-info">
                                    <span class="employee-name">
                                        {{ employee.lastName }} {{ employee.firstName }} {{ employee.middleName || '' }}
                                    </span>
                                    <span class="employee-position">
                                        {{ employee.jobPositions?.map(jp => jp.title).join(', ') || '-' }}
                                    </span>
                                </div>
                                <div class="employee-actions">
                                    <i class="pi pi-check selected-icon" v-if="selectedEmployee?.id === employee.id"></i>
                                </div>
                            </div>
                        </div>
                        <div v-else-if="loadingEmployees" class="loading-employees">
                            <ProgressSpinner style="width: 30px; height: 30px" />
                            <span>Загрузка сотрудников...</span>
                        </div>
                        <div v-else class="no-employees">
                            <i class="pi pi-users"></i>
                            <p>Сотрудники не найдены</p>
                        </div>
                    </div>
                </div>

                <div class="section-card">
                    <h3 class="section-title">
                        <i class="pi pi-plus"></i>
                        Добавление оценки
                    </h3>

                    <div class="selected-info">
                        <div v-if="selectedEmployee" class="selected-employee">
                            <span class="selected-label">Выбранный сотрудник:</span>
                            <span class="selected-value">
                                {{ selectedEmployee.lastName }} {{ selectedEmployee.firstName }} {{ selectedEmployee.middleName || '' }}
                            </span>
                        </div>
                        <div v-if="selectedScore !== null" class="selected-score">
                            <span class="selected-label">Выбранные баллы:</span>
                            <span class="selected-value">{{ selectedScore }}</span>
                        </div>
                        <div v-if="manualPoints > 0" class="manual-points">
                            <span class="selected-label">Ручной ввод:</span>
                            <InputNumber 
                                v-model="manualPoints"
                                :min="-20.00"
                                :max="100.00"
                                size="small"
                                @update:modelValue="selectManualPoints"
                            />
                        </div>
                    </div>

                    <div class="action-buttons">
                        <Button 
                            label="Добавить оценку"
                            icon="pi pi-check"
                            severity="success"
                            @click="submitEvaluation"
                            :disabled="!canSubmit"
                            :loading="submitting"
                            class="submit-button"
                        />
                        <Button 
                            label="Отмена"
                            icon="pi pi-times"
                            severity="secondary"
                            @click="closeDialog"
                            class="cancel-button"
                        />
                    </div>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import axiosInstance from '@/utils/axios';

const props = defineProps({
    indicatorId: Number,
    seasonId: String,
    indicatorData: {
        type: Object,
        default: () => ({})
    }
});

const emit = defineEmits(['updated']);

const visible = ref(false);
const loadingEmployees = ref(false);
const submitting = ref(false);
const showTableView = ref(false);

const allEmployees = ref([]);
const filteredEmployees = ref([]);
const searchQuery = ref('');
const selectedEmployee = ref(null);

const parsedScores = ref([]);
const parsedTableData = ref([]);
const selectedScore = ref(null);
const manualPoints = ref(0.00);

const openDialog = async () => {
    visible.value = true;
    await loadEmployees();
    parseScores();
}

const closeDialog = () => {
    visible.value = false;
    resetForm();
}

const resetForm = () => {
    selectedEmployee.value = null;
    selectedScore.value = null;
    searchQuery.value = '';
    filteredEmployees.value = allEmployees.value;
}

const canSubmit = computed(() =>{
    return selectedEmployee.value !== null && selectedScore.value !== null;
});

const loadEmployees = async () => {
    loadingEmployees.value = true;
    try {
        const response = await axiosInstance.get('/api/rating/employees');
        allEmployees.value = response.data.employees || [];
        filteredEmployees.value = allEmployees.value;
    } catch (error) {
        console.error('Ошибка при загрузке сотрудников: ', error);
        allEmployees.value = [];
        filteredEmployees.value = [];
    } finally {
        loadingEmployees.value = false;
    }
}

const searchEmployees = () => {
    if (!searchQuery.value.trim()) {
        filteredEmployees.value = allEmployees.value;
        return;
    }

    const query = searchQuery.value.toLowerCase();
    filteredEmployees.value = allEmployees.value.filter(employee => {
        const fullName = `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.toLowerCase();
        const positions = employee.jobPositions?.map(jp => jp.title.toLowerCase()).join(' ') || '';

        return fullName.includes(query) || positions.includes(query);
    })
};

const clearSearch = () => {
    searchQuery.value = '';
    filteredEmployees.value = allEmployees.value;
}

const selectEmployee = (employee) => {
    selectedEmployee.value = employee;
}

/* --------------------- Универсальный парсер таблиц --------------------- */

/**
    * Игнорируемые заголовки (точное совпадение по lowercase, без пробелов/переносов)
*/
const IGNORED_HEADER_TITLES = new Set([
    'оценочные значения выполнения показателей эффективности',
    'количество баллов'
]);

/**
    * Убирает HTML сущности, нормализует пробелы
*/
const normalizeText = (s) => {
    if (!s && s !== 0) return '';
    const str = String(s);
    const decoded = str.replace(/&nbsp;/gi, ' ').replace(/&times;|×/g, '×');
    return decoded.replace(/\s+/g, ' ').trim();
};

/**
    * Извлекает либо формулу, либо числовое значение.
    * Правила:
    *  - Если текст содержит операторы или буквы (переменные), считаем это формулой -> возвращаем formula (points = null)
    *  - Иначе если есть одиночное число -> возвращаем points (float)
    *  - raw — очищённый текст для fallback-criteria
**/
const extractPointsAndFormula = (text) => {
    const raw = normalizeText(text);
    if (!raw) return { points: null, formula: null, raw };

    const tailCut = raw.replace(/\bгде[:\s].*$/i, '').trim();
    const hasOperator = /[×x*\/]/i.test(tailCut);
    const numberMatch = tailCut.match(/(-?\d+(?:[.,]\d+)?)/);
    const hasLetters = /[A-Za-zА-Яа-яЁё]/.test(tailCut);

    if (hasOperator || (numberMatch && hasLetters) || (/^\d+\s+[A-Za-zА-Яа-яЁё]/.test(tailCut))) {
        const formula = tailCut.replace(/[x×X]/g, '×').replace(/\s+/g, ' ').trim();
        return { points: null, formula, raw };
    }

    if (numberMatch) {
        const num = numberMatch[1].replace(',', '.');
        const parsed = parseFloat(num);
        if (!isNaN(parsed)) return { points: parsed, formula: null, raw };
    }

    return { points: null, formula: null, raw };
};
/**
    * Строит матрицу таблицы с учётом rowspan/colspan, возвращает matrix[rows][cols] = cellObj
*/
const buildTableMatrix = (table) => {
    const rows = Array.from(table.querySelectorAll('tr'));
    let maxCols = 0;
    rows.forEach(row => {
        const cells = Array.from(row.children).filter(n => n.tagName === 'TD' || n.tagName === 'TH');
        let colCount = 0;
        cells.forEach(cell => {
            const colSpan = parseInt(cell.getAttribute('colspan')) || cell.colSpan || 1;
            colCount += colSpan;
        });
        maxCols = Math.max(maxCols, colCount);
    });

    const matrix = Array.from({ length: rows.length }, () => Array.from({ length: maxCols }, () => null));

    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const cells = Array.from(row.children).filter(n => n.tagName === 'TD' || n.tagName === 'TH');
        let c = 0;
        for (let ci = 0; ci < cells.length; ci++) {
            while (c < maxCols && matrix[r][c] !== null) c++;
            if (c >= maxCols) break;

            const node = cells[ci];
            const colspan = parseInt(node.getAttribute('colspan')) || node.colSpan || 1;
            const rowspan = parseInt(node.getAttribute('rowspan')) || node.rowSpan || 1;
            const text = normalizeText(node.textContent || '');
            const isHeader = node.tagName === 'TH';

            const cellObj = { text, isHeader, rowspan, colspan, tagName: node.tagName, originalRow: r, originalCol: c };

            for (let rr = 0; rr < rowspan; rr++) {
                for (let cc = 0; cc < colspan; cc++) {
                    const rrIndex = r + rr;
                    const ccIndex = c + cc;
                    if (rrIndex < matrix.length && ccIndex < maxCols) {
                        matrix[rrIndex][ccIndex] = cellObj;
                    }
                }
            }

            c += colspan;
        }
    }
    return { matrix, rowsCount: rows.length, colsCount: maxCols };
};

/**
    * Универсальный HTML-парсер: собирает колоночные заголовки (несколько рядов), 
    * собирает дескрипторы слева и формирует записи.
*/
const parseHtmlTableUniversal = (htmlString) => {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const table = doc.querySelector('table');
        if (!table) return [];

        const { matrix, rowsCount, colsCount } = buildTableMatrix(table);

        // header rows (строки с TH)
        let headerRowsCount = 0;
        for (let r = 0; r < rowsCount; r++) {
            const rowArr = matrix[r] || [];
            const rowHasTH = rowArr.some(cell => cell && cell.isHeader);
            if (rowHasTH) headerRowsCount++;
            else break;
        }

        // column headers: игнорируем левый служебный заголовок
        const columnHeaders = Array.from({ length: colsCount }, () => []);
        for (let col = 0; col < colsCount; col++) {
            for (let hr = 0; hr < headerRowsCount; hr++) {
                const cell = matrix[hr][col];
                if (cell && cell.text) {
                    const txt = cell.text.trim();
                    const low = txt.toLowerCase();
                    // если это большой левый заголовок (первый столбец) и он служебный — игнорируем
                    if (cell.originalCol === 0 && IGNORED_HEADER_TITLES.has(low)) continue;
                    if (!IGNORED_HEADER_TITLES.has(low)) {
                        if (columnHeaders[col].length === 0 || columnHeaders[col][columnHeaders[col].length - 1] !== txt) {
                            columnHeaders[col].push(txt);
                        }
                    }
                }
            }
        }
        const columnHeaderStrings = columnHeaders.map(parts => parts.join(' / ').trim());
        console.log(columnHeaders);

        const footerKeywords = [
            'при подготовке', 'баллы начисляются', 'включаются', 'не более', 'при подготовке команды',
            'баллы за привлечение', 'баллы начисляются за', 'добавляются', 'прибавляются', 'где:'
        ].map(s => s.toLowerCase());

        const results = [];

        for (let r = headerRowsCount; r < rowsCount; r++) {
            const row = matrix[r];
            if (!row) continue;

            const rowTexts = row.map(c => c && c.text ? c.text.trim().toLowerCase() : '').filter(Boolean);
            const isFooterLike = rowTexts.some(t => footerKeywords.some(k => t.includes(k)));
            if (isFooterLike) continue;

            // value columns
            const valueCols = [];
            for (let col = 0; col < colsCount; col++) {
                const cell = row[col];
                if (!cell || !cell.text) continue;
                const { points, formula } = extractPointsAndFormula(cell.text);
                if ((points !== null && !isNaN(points)) || (formula && formula.length)) {
                    valueCols.push(col);
                }
            }
            if (valueCols.length === 0) {
                for (let col = 0; col < colsCount; col++) {
                    const cell = row[col];
                    if (!cell || !cell.text) continue;
                    const tmp = extractPointsAndFormula(cell.text);
                    if ((tmp.points !== null && !isNaN(tmp.points)) || (tmp.formula && tmp.formula.length)) {
                        valueCols.push(col);
                    }
                }
            }
            const leftMostValueCol = valueCols.length ? Math.min(...valueCols) : colsCount;

            // descriptor: первая релевантная лев. ячейка до leftMostValueCol
            let descriptor = '';
            for (let col = 0; col < leftMostValueCol; col++) {
                const cell = row[col];
                if (!cell || !cell.text) continue;
                const txt = cell.text.trim();
                const low = txt.toLowerCase();
                if (IGNORED_HEADER_TITLES.has(low)) continue;
                if (/^-?\d+(?:[.,]\d+)?$/.test(txt)) continue;
                if (txt.length <= 1) continue;
                descriptor = txt;
                break;
            }
            if (!descriptor) {
                const leftCell = row[0];
                if (leftCell && leftCell.text) {
                    const t = leftCell.text.trim();
                    if (t && !IGNORED_HEADER_TITLES.has(t.toLowerCase())) descriptor = t;
                }
            }

            const handledCols = new Set();
            for (const col of valueCols) {
                if (handledCols.has(col)) continue;
                const cell = row[col];
                if (!cell || !cell.text) continue;
                const extracted = extractPointsAndFormula(cell.text);
                if (!extracted || (!extracted.points && !extracted.formula)) continue;

                const colHeader = columnHeaderStrings[col];
                let criteria = '';

                if (descriptor && colHeader) {
                    criteria = `${descriptor} (${colHeader})`;
                } else if (descriptor) {
                    criteria = descriptor;
                } else if (colHeader) {
                    criteria = colHeader;
                } else {
                    criteria = (extracted.raw || cell.text || '').replace(/\bгде[:\s].*$/i, '').trim();
                }

                if (!criteria || IGNORED_HEADER_TITLES.has(criteria.toLowerCase())) {
                    criteria = (extracted.raw || cell.text || '').trim();
                }
                if (!criteria) continue;

                results.push({
                    criteria: criteria,
                    points: (extracted.points !== null && !isNaN(extracted.points)) ? extracted.points : null,
                    formula: extracted.formula || null,
                    raw: extracted.raw || cell.text || ''
                });

                handledCols.add(col);
            }

            // fallback
            if (valueCols.length === 0) {
                for (let col = 0; col < colsCount; col++) {
                    const cell = row[col];
                    if (!cell || !cell.text) continue;
                    const extracted = extractPointsAndFormula(cell.text);
                    if (extracted && (extracted.points !== null || extracted.formula)) {
                        let criteria = descriptor || columnHeaderStrings[col] || extracted.raw || cell.text;
                        if (!criteria || IGNORED_HEADER_TITLES.has(criteria.toLowerCase())) criteria = extracted.raw || cell.text;
                        if (!criteria) continue;
                        results.push({
                            criteria: criteria,
                            points: (extracted.points !== null && !isNaN(extracted.points)) ? extracted.points : null,
                            formula: extracted.formula || null,
                            raw: extracted.raw || cell.text || ''
                        });
                        break;
                    }
                }
            }
        }

        // dedupe & final cleanup
        const seen = new Set();
        const cleaned = [];
        for (const it of results) {
            const critNorm = (it.criteria || '').replace(/\s+/g, ' ').trim();
            if (!critNorm) continue;
            const lowCrit = critNorm.toLowerCase();
            if (IGNORED_HEADER_TITLES.has(lowCrit)) continue;
            const key = `${critNorm}|${it.points !== null ? it.points : ''}|${it.formula || ''}`;
            if (seen.has(key)) continue;
            seen.add(key);
            cleaned.push({
                criteria: critNorm,
                points: (it.points !== null && !isNaN(it.points)) ? it.points : null,
                formula: it.formula || null,
                raw: it.raw || ''
            });
        }

        return cleaned;
    } catch (err) {
        console.error('Ошибка универсального парсера таблицы:', err);
        return [];
    }
};
/**
    * Если нет <table>, парсим plain text / формулы построчно
*/
const smartTableParser = (htmlOrText) => {
    if (!htmlOrText) return [];
    if (/<table[\s>]/i.test(htmlOrText)) {
        const parsed = parseHtmlTableUniversal(htmlOrText);
        if (parsed && parsed.length) return parsed;
    }

    const lines = htmlOrText.replace(/\r\n/g, '\n').split('\n').map(l => normalizeText(l)).filter(Boolean);
    const results = [];
    const footerKeywords = ['где', 'примечание', 'баллы начисляются', 'при подготовке'];
    for (const line of lines) {
        const low = line.toLowerCase();
        if (footerKeywords.some(k => low.includes(k))) continue;
        const parts = line.split(/\s*[-–—:]\s*/);
        if (parts.length >= 2) {
            const desc = parts.slice(0, parts.length - 1).join(' — ').trim();
            const tail = parts[parts.length - 1].trim();
            const extracted = extractPointsAndFormula(tail);
            if (extracted && (extracted.points !== null || extracted.formula)) {
                results.push({
                    criteria: desc || extracted.raw || tail,
                    points: (extracted.points !== null && !isNaN(extracted.points)) ? extracted.points : null,
                    formula: extracted.formula || null,
                    raw: extracted.raw || tail
                });
                continue;
            }
        }
        const extracted = extractPointsAndFormula(line);
        if (extracted && (extracted.points !== null || extracted.formula)) {
            results.push({
                criteria: extracted.formula ? extracted.raw : line,
                points: (extracted.points !== null && !isNaN(extracted.points)) ? extracted.points : null,
                formula: extracted.formula || null,
                raw: extracted.raw || line
            });
        }
    }

    const seen = new Set();
    return results.filter(it => {
        const key = `${(it.criteria||'').trim()}|${it.points !== null ? it.points : ''}|${it.formula || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        const low = (it.criteria||'').toLowerCase();
        if (IGNORED_HEADER_TITLES.has(low)) return false;
        return true;
    });
};

/* --------------------- Интеграция в parseScores --------------------- */

const parseScores = () => {
    parsedScores.value = [];
    parsedTableData.value = [];

    if (!props.indicatorData.scores || !Array.isArray(props.indicatorData.scores) || props.indicatorData.scores.length === 0) {
        return;
    }

    try {
        const aggregated = [];

        props.indicatorData.scores.forEach(scoreItem => {
            if (scoreItem.description?.table) {
                parsedTableData.value.push(scoreItem.description.table);
                const parsed = smartTableParser(scoreItem.description.table);
                parsed.forEach(p => aggregated.push(p));
            }

            if (scoreItem.description?.list && Array.isArray(scoreItem.description.list)) {
                scoreItem.description.list.forEach(item => {
                    const title = normalizeText(item.title || item.name || item.criteria || '');
                    const val = item.point !== undefined && item.point !== null ? String(item.point) : item.value || '';
                    const extracted = extractPointsAndFormula(val || title);
                    const criteria = title && !IGNORED_HEADER_TITLES.has(title.toLowerCase()) ? title : (extracted.raw || title);
                    if ((extracted.points !== null && !isNaN(extracted.points)) || extracted.formula) {
                        aggregated.push({
                            criteria,
                            points: (extracted.points !== null && !isNaN(extracted.points)) ? extracted.points : null,
                            formula: extracted.formula || null,
                            raw: extracted.raw || val
                        });
                    } else if (val && val.trim()) {
                        aggregated.push({
                            criteria,
                            points: null,
                            formula: val.trim(),
                            raw: val.trim()
                        });
                    }
                });
            }

            if (scoreItem.description?.text && !scoreItem.description?.table) {
                const parsed = smartTableParser(scoreItem.description.text);
                parsed.forEach(p => aggregated.push(p));
            }

            if (typeof scoreItem === 'string') {
                const parsed = smartTableParser(scoreItem);
                parsed.forEach(p => aggregated.push(p));
            }
        });

        const seen = new Set();
        const cleaned = [];
        for (const it of aggregated) {
            if (!((it.points !== null && !isNaN(it.points)) || (it.formula && it.formula.length))) continue;
            let crit = (it.criteria || '').trim();
            if (!crit) crit = (it.raw || '').trim();
            if (!crit) continue;
            const lowCrit = crit.toLowerCase();
            if (IGNORED_HEADER_TITLES.has(lowCrit)) continue;
            const key = `${crit}|${it.points !== null ? it.points : ''}|${it.formula || ''}`;
            if (seen.has(key)) continue;
            seen.add(key);
            cleaned.push({
                criteria: crit,
                points: (it.points !== null && !isNaN(it.points)) ? it.points : null,
                formula: it.formula || null,
                raw: it.raw || ''
            });
        }

        const suffixedBases = new Set();
        cleaned.forEach(item => {
            const m = item.criteria.match(/^(.*)\s*\(.+\)$/);
            if (m) {
                const base = m[1].trim();
                if (base) suffixedBases.add(base);
            }
        });
        const finalList = cleaned.filter(item => {
            // если есть точное совпадение с базой — удаляем
            if (suffixedBases.has(item.criteria.trim())) return false;
            return true;
        });

        parsedScores.value = finalList;
    } catch (err) {
        console.error('Ошибка при парсинге системы оценивания:', err);
        parsedScores.value = [];
        parsedTableData.value = [];
    }
};

/* --------------------- UI handlers --------------------- */

const selectScore = (score) => {
    if (score.points !== null && !isNaN(score.points)) {
        selectedScore.value = score.points;
        manualPoints.value = 0;
    } else {
        // Формулы — не выбираем автоматически. Пользователь вводит manualPoints в UI.
        selectedScore.value = null;
        manualPoints.value = 0;
        // Можно показывать тултип, если нужно.
    }
};

const selectManualPoints = (value) => {
    if (value !== null && value !== undefined) {
        manualPoints.value = value;
        selectedScore.value = null;
    }
};

const submitEvaluation = async () => {
    if (!canSubmit.value) return;

    submitting.value = true;
    try {
        const pointsToSubmit = selectedScore.value !== null ? selectedScore.value : manualPoints.value;

        await axiosInstance.post('/api/rating/employee-indicators-value', {
            employeeId: selectedEmployee.value.id,
            indicatorId: props.indicatorId,
            seasonId: Number(props.seasonId),
            points: pointsToSubmit,
            jobPosition: selectedEmployee.value.jobPositions?.[0]?.title || 'Не указана'
        });

        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Рейтинг', 
                detail: `Оценка для сотрудника добавлена успешно`,
            }
        }));

        emit('updated');
        closeDialog();
    } catch (error) {
        console.error('Ошибка при добавлении оценки:', error);
        
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'danger', 
                summary: 'Рейтинг', 
                detail: `Не удалось добавить оценку: ${error.response?.data?.message || error.message}`,
            }
        }));
    } finally {
        submitting.value = false;
    }
};


</script>

<style scoped>
.dialog-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    height: 70vh;
}

.indicator-info-section,
.employee-form-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.section-card {
    background: var(--p-grey-7);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid var(--p-grey-4);
}

.section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    color: var(--p-text-color);
    font-weight: 600;
}

/* Стили для переключателя вида */
.view-toggle {
    margin-bottom: 1rem;
    display: flex;
    justify-content: flex-end;
}

/* Стили для табличного представления */
.table-view {
    border: 1px solid var(--p-grey-4);
    border-radius: 8px;
    overflow: auto;
    max-height: 300px;
}

.table-container {
    padding: 0.25rem;
}

.table-container table {
    width: 100%;
    border-collapse: collapse;
}

.table-container th,
.table-container td {
    border: 1px solid var(--p-grey-4);
    padding: 0.5rem;
    text-align: center;
}

.table-container th {
    background: var(--p-grey-3);
    font-weight: 600;
}
/* Стили для системы оценивания */
.scores-container {
    border: 1px solid var(--p-grey-4);
    border-radius: 8px;
    overflow: hidden;
}

.scores-header {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    background: var(--p-grey-3);
    font-weight: 600;
    border-bottom: 1px solid var(--p-grey-4);
}

.scores-list {
    max-height: 200px;
    overflow-y: auto;
}

.score-item {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid var(--p-grey-4);
}

.score-item:last-child {
    border-bottom: none;
}

.score-item:hover {
    background: var(--p-grey-5);
}

.score-item.selected {
    background: var(--p-primary-color);
    color: white;
}

.score-criteria {
    flex: 1;
    line-height: 1.4;
}

.score-points {
    font-weight: 600;
    min-width: 50px;
    text-align: right;
}

.no-scores {
    text-align: center;
    padding: 2rem;
    color: var(--p-text-color-secondary);
}


/* Стили для информации о показателе */
.indicator-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.detail-item {
    display: flex;
    justify-content: between;
    gap: 1rem;
}

.detail-label {
    font-weight: 600;
    color: var(--p-text-color-secondary);
    min-width: 100px;
}

.detail-value {
    color: var(--p-text-color);
    flex: 1;
}

/* Стили для поиска сотрудников */
.search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--p-text-color-secondary);
    z-index: 1;
}

.search-input {
    padding-left: 2.5rem;
    padding-right: 2.5rem;
    width: 100%;
}

.clear-search {
    position: absolute;
    right: 0.5rem;
    color: var(--p-text-color-secondary);
}

.employees-list {
    margin-top: 1rem;
}

.employees-scrollable {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--p-grey-4);
    border-radius: 8px;
}

.employee-card {
    display: flex;
    align-items: center;
    padding: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid var(--p-grey-4);
}

.employee-card:last-child {
    border-bottom: none;
}

.employee-card:hover {
    background: var(--p-grey-5);
}

.employee-card.selected {
    background: var(--p-primary-color);
    color: white;
}

.employee-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--p-grey-4);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
}

.employee-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.employee-name {
    font-weight: 600;
}

.employee-position {
    font-size: 0.875rem;
    opacity: 0.8;
}

.employee-actions {
    margin-left: auto;
}

.selected-icon {
    color: inherit;
}

.loading-employees,
.no-employees {
    text-align: center;
    padding: 2rem;
    color: var(--p-text-color-secondary);
}

.loading-employees {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

/* Стили для выбранных значений */
.selected-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--p-grey-6);
    border-radius: 8px;
}

.selected-employee,
.selected-score,
.manual-points {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.selected-label {
    font-size: 0.875rem;
    color: var(--p-text-color-secondary);
    font-weight: 600;
}

.selected-value {
    color: var(--p-text-color);
    font-weight: 500;
}

.manual-points {
    display: flex;
    align-items: center;
    gap: 1rem;
}

/* Стили для кнопок */
.action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}

.submit-button,
.cancel-button {
    min-width: 150px;
}

/* Адаптивность */
@media (max-width: 1200px) {
    .dialog-content {
        grid-template-columns: 1fr;
        height: auto;
        max-height: 80vh;
        overflow-y: auto;
    }
    
    .indicator-info-section,
    .employee-form-section {
        min-height: 300px;
    }
}

@media (max-width: 768px) {
    .action-buttons {
        flex-direction: column;
    }
    
    .submit-button,
    .cancel-button {
        min-width: auto;
        width: 100%;
    }
    
    .detail-item {
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .detail-label {
        min-width: auto;
    }
}

/* Стили для встроенных HTML таблиц */
:deep(.table-view table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    border: 0;
}

:deep(.table-view th),
:deep(.table-view td) {
    border: 1px solid var(--p-grey-3);
    text-align: center;
}

:deep(.table-view th) {
    background-color: var(--p-grey-7);
    font-weight: 600;
}

:deep(.table-view tr) {
    background-color: var(--p-grey-6);
}

:deep(.table-view tr:hover) {
    background-color: var();
}
</style>
