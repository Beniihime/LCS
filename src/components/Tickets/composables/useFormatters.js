export const useFormatters = () => {
    // Форматирование размера файла
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Форматирование даты
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    };

    // Создание событий таймлайна
    const createTimelineEvents = (ticket) => {
        if (!ticket) return [];
        
        const events = [];
        
        if (ticket.createdAt) {
            events.push({
                date: ticket.createdAt,
                label: 'Создана',
                status: ticket.status,
                description: 'Заявка создана'
            });
        }
        
        if (ticket.updatedAt && ticket.updatedAt !== ticket.createdAt) {
            events.push({
                date: ticket.updatedAt,
                label: 'Обновлена',
                status: ticket.status,
                description: 'Внесены изменения'
            });
        }
        
        if (ticket.resolvedAt) {
            events.push({
                date: ticket.resolvedAt,
                label: 'Решена',
                status: 'Resolved',
                description: 'Проблема решена'
            });
        }
        
        if (ticket.closedAt) {
            events.push({
                date: ticket.closedAt,
                label: 'Закрыта',
                status: 'Closed',
                description: 'Заявка закрыта'
            });
        }
        
        return events.sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    return {
        formatFileSize,
        formatDate,
        createTimelineEvents
    };
};