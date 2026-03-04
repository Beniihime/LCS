export const getInfraStatusSeverity = (status) => {
    switch (status) {
        case 'Открыта':
            return 'info';
        case 'Закрыта':
            return 'success';
        case 'Ожидает':
            return 'secondary';
        case 'Зарегистрирована':
            return 'warn';
        case 'Инициирована':
            return 'contrast';
        default:
            return null;
    }
};

export const getInfraStatusIcon = (status) => {
    switch (status) {
        case 'Открыта':
            return 'pi pi-info-circle';
        case 'Закрыта':
            return 'pi pi-check';
        case 'Ожидает':
            return 'pi pi-hourglass';
        case 'Зарегистрирована':
            return 'pi pi-book';
        case 'Инициирована':
            return 'pi pi-eject';
        default:
            return null;
    }
};
