// Утилиты для работы с сезонами

/**
    * Получает текущий сезон на основе месяца
    * @returns {string} - Название сезона
*/
export const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1; // Месяцы от 1 до 12
    
    if (month >= 12 || month <= 2) return 'winter';    // Декабрь, Январь, Февраль
    if (month >= 3 && month <= 5) return 'spring';     // Март, Апрель, Май
    if (month >= 6 && month <= 8) return 'summer';     // Июнь, Июль, Август
    if (month >= 9 && month <= 11) return 'autumn';    // Сентябрь, Октябрь, Ноябрь
    
    return 'winter'; // На всякий случай
};

/**
    * Получает название сезона на русском
    * @param {string} season - Код сезона
    * @returns {string} - Русское название
*/
export const getSeasonName = (season) => {
    const names = {
        'winter': 'Зима',
        'spring': 'Весна',
        'summer': 'Лето',
        'autumn': 'Осень'
    };
    return names[season] || 'Зима';
};

/**
    * Получает путь к фоновому изображению для сезона
    * @param {string} season - Код сезона
    * @returns {string} - Путь к изображению
*/
export const getSeasonBackground = (season) => {
    const backgrounds = {
        'winter': '/src/assets/backgrounds/winter.webp',
        'spring': '/src/assets/backgrounds/spring.webp',
        'summer': '/src/assets/backgrounds/summer.webp',
        'autumn': '/src/assets/backgrounds/autumn.webp'
    };
    return backgrounds[season] || backgrounds.winter;
};

/**
    * Получает путь к иконке сезона
    * @param {string} season - Код сезона
    * @returns {string} - Путь к иконке
*/
export const getSeasonIcon = (season) => {
    const icons = {
        'winter': 'pi pi-snowflake',
        'spring': 'pi pi-leaf',
        'summer': 'pi pi-sun',
        'autumn': 'pi pi-cloud'
    };
    return icons[season] || 'pi pi-question-circle';
};

/**
    * Получает градиент для сезона
    * @param {string} season - Код сезона
    * @returns {string} - CSS градиент
*/
export const getSeasonGradient = (season) => {
    const gradients = {
        'winter': 'linear-gradient(to bottom, rgba(173, 216, 230, 0.1), rgba(240, 248, 255, 0.8))',
        'spring': 'linear-gradient(to bottom, rgba(152, 251, 152, 0.1), rgba(240, 255, 240, 0.8))',
        'summer': 'linear-gradient(to bottom, rgba(255, 215, 0, 0.1), rgba(255, 250, 205, 0.8))',
        'autumn': 'linear-gradient(to bottom, rgba(255, 140, 0, 0.1), rgba(255, 228, 196, 0.8))'
    };
    return gradients[season] || gradients.winter;
};

/**
    * Получает цвет акцента для сезона
    * @param {string} season - Код сезона
    * @returns {string} - CSS переменная цвета
*/
export const getSeasonAccentColor = (season) => {
    const colors = {
        'winter': 'var(--p-blue-400)',
        'spring': 'var(--p-green-400)',
        'summer': 'var(--p-yellow-500)',
        'autumn': 'var(--p-orange-400)'
    };
    return colors[season] || colors.winter;
};