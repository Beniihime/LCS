// src/utils/formatSeason.js

export const getQuarterPeriod = (quarter) => {
    const map = {
      '1': 'Январь–Март',
      '2': 'Апрель–Июнь',
      '3': 'Июль–Сентябрь',
      '4': 'Октябрь–Декабрь'
    };
    return map[String(quarter)] ?? '-';
};