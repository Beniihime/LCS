export const useFormDataProcessor = () => {
    // Маппинг полей формы
    const formFieldLabels = {
        'fio': 'ФИО',
        'eduCode': 'Код направления',
        'eduGroup': 'Группа',
        'eduFaculty': 'Институт',
        'certificateType': 'Тип справки',
        'certificateCount': 'Количество',
        'name': 'Имя',
        'email': 'Email',
        'phone': 'Телефон',
        'description': 'Описание',
        'message': 'Сообщение',
        'subject': 'Тема',
        'category': 'Категория',
        'department': 'Отдел',
        'status': 'Статус',
        'comments': 'Комментарии'
    };

    // Маппинг иконок для полей
    const fieldIcons = {
        'fio': 'pi pi-user',
        'eduCode': 'pi pi-code',
        'eduGroup': 'pi pi-users',
        'eduFaculty': 'pi pi-building',
        'certificateType': 'pi pi-file',
        'certificateCount': 'pi pi-copy',
        'email': 'pi pi-envelope',
        'phone': 'pi pi-phone',
        'description': 'pi pi-align-left',
        'default': 'pi pi-info-circle'
    };

    // Маппинг типов справок
    const certificateTypeMap = {
        'ПФ': 'Для Пенсионного фонда',
        'Общая': 'Общая справка',
        'PF': 'Для Пенсионного фонда',
        'General': 'Общая справка'
    };

    // Форматирование типа справки
    const formatCertificateType = (type) => {
        return certificateTypeMap[type] || type;
    };

    // Получение класса для типа справки
    const getCertificateTypeClass = (type) => {
        const map = {
            'ПФ': 'type-pfr',
            'PF': 'type-pfr',
            'Общая': 'type-general',
            'General': 'type-general'
        };
        return map[type] || 'type-default';
    };

    // Парсинг данных формы
    const parseFormData = (formData) => {
        if (!formData) return null;
        
        try {
            return typeof formData === 'string' 
                ? JSON.parse(formData) 
                : formData;
        } catch (error) {
            console.error('Ошибка парсинга данных формы:', error);
            return null;
        }
    };

    // Структурирование полей формы
    const processFormData = (formData) => {
        const parsed = parseFormData(formData);
        if (!parsed) return { fields: [], fioField: null, certificateFields: [], otherFields: [] };

        const fields = [];
        
        Object.entries(parsed).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') return;
            
            const label = formFieldLabels[key] || key;
            let formattedValue = value;
            
            switch (key) {
                case 'certificateType':
                    formattedValue = formatCertificateType(value);
                    break;
                case 'certificateCount':
                    formattedValue = `${value}`;
                    break;
                case 'fio':
                    formattedValue = value.toString().split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    break;
                case 'eduGroup':
                    formattedValue = value.toString().trim();
                    break;
                case 'eduCode':
                    formattedValue = value.toString().trim();
                    break;
                default:
                    if (typeof value === 'object') {
                        formattedValue = JSON.stringify(value, null, 2);
                    } else if (Array.isArray(value)) {
                        formattedValue = value.join(', ');
                    }
            }
            
            fields.push({
                key,
                label,
                value: formattedValue,
                rawValue: value
            });
        });

        const priorityOrder = ['fio', 'eduFaculty', 'eduCode', 'eduGroup', 'certificateType', 'certificateCount'];
        const sortedFields = fields.sort((a, b) => {
            const aIndex = priorityOrder.indexOf(a.key);
            const bIndex = priorityOrder.indexOf(b.key);
            
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            
            return a.label.localeCompare(b.label);
        });

        const fioField = sortedFields.find(f => f.key === 'fio');
        const certificateFields = sortedFields.filter(f => ['certificateType', 'certificateCount'].includes(f.key));
        const otherFields = sortedFields.filter(f => !['fio', 'certificateType', 'certificateCount'].includes(f.key));
        const certificateTypeValue = certificateFields.find(f => f.key === 'certificateType')?.rawValue;
        const certificateCountValue = certificateFields.find(f => f.key === 'certificateCount')?.rawValue || 0;

        const faculty = sortedFields.find(f => f.key === 'eduFaculty')?.value;
        const group = sortedFields.find(f => f.key === 'eduGroup')?.value;
        const code = sortedFields.find(f => f.key === 'eduCode')?.value;
        
        const studentInfo = (faculty || group || code) ? {
            faculty: faculty || 'Институт не указан',
            group: group || 'Группа не указана',
            code: code || null
        } : null;

        return {
            fields: sortedFields,
            fioField,
            certificateFields,
            otherFields,
            certificateTypeValue,
            certificateCountValue,
            studentInfo
        };
    };

    return {
        processFormData,
        getCertificateTypeClass,
        formatCertificateType,
        parseFormData
    };
};