export const useTicketStatus = () => {
    // Маппинг статусов
    const statusMap = {
        'New': 'Новая',
        'Open': 'Открыта',
        'Assigned': 'Назначена',
        'Pending': 'В ожидании',
        'Resolved': 'Решена',
        'Closed': 'Закрыта',
        'Cancelled': 'Отменена'
    };

    // Маппинг приоритетов
    const priorityMap = {
        'Low': 'Низкий',
        'Medium': 'Средний',
        'High': 'Высокий'
    };

    // Получение стиля статуса
    const getStatusSeverity = (status) => {
        const map = {
            'New': 'info',
            'Open': 'warning',
            'Assigned': 'success',
            'Pending': 'secondary',
            'Resolved': 'success',
            'Closed': 'secondary',
            'Cancelled': 'danger'
        };
        return map[status] || 'info';
    };

    // Получение названия статуса
    const getStatusLabel = (status) => statusMap[status] || status;

    // Получение иконки статуса
    const getStatusIcon = (status) => {
        const map = {
            'New': 'pi pi-plus-circle',
            'Open': 'pi pi-folder-open',
            'Assigned': 'pi pi-verified',
            'Pending': 'pi pi-hourglass',
            'Resolved': 'pi pi-check-circle',
            'Closed': 'pi pi-lock',
            'Cancelled': 'pi pi-times-circle'
        };
        return map[status] || 'pi pi-info-circle';
    };

    // Получение стиля приоритета
    const getPrioritySeverity = (priority) => {
        const map = {
            'Low': 'success',
            'Medium': 'warning',
            'High': 'danger'
        };
        return map[priority] || 'info';
    };

    // Получение названия приоритета
    const getPriorityLabel = (priority) => priorityMap[priority] || priority;

    return {
        getStatusSeverity,
        getStatusLabel,
        getStatusIcon,
        getPrioritySeverity,
        getPriorityLabel,
        statusMap,
        priorityMap
    };
};