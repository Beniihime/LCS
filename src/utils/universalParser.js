// utils/universalParser.js

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

export { smartTableParser, extractPointsAndFormula, normalizeText }