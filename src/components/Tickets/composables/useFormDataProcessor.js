export const useFormDataProcessor = () => {
    // Динамическая обработка данных формы на основе formSchema
    const processFormData = (formData, formSchema = []) => {
        const parsed = parseFormData(formData);
        if (!parsed) return { 
            fields: [], 
            groupedFields: {},
            fioField: null, 
            studentInfo: null,
            certificateInfo: null
        };

        const fields = [];
        const groupedFields = {};
        
        // Сначала обрабатываем поля, которые есть в formSchema
        formSchema.forEach(schemaField => {
            const key = schemaField.name;
            const value = parsed[key];
            
            if (value === null || value === undefined || value === '') return;
            
            const label = schemaField.label || key;
            let formattedValue = value;
            
            // Обработка в зависимости от типа поля
            if (schemaField.type === 'Select' && schemaField.options && schemaField.options.length > 0) {
                const option = schemaField.options.find(opt => opt.value === value || opt.value === String(value));
                if (option) {
                    formattedValue = option.label;
                }
            }
            
            // Специальное форматирование для некоторых полей
            switch (key) {
                case 'fio':
                    formattedValue = String(value).split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    break;
                case 'certificateCount':
                    formattedValue = `${value}`;
                    break;
                case 'eduGroup':
                case 'eduCode':
                case 'companyName':
                case 'companyPhone':
                    formattedValue = String(value).trim();
                    break;
                default:
                    if (typeof value === 'object') {
                        formattedValue = JSON.stringify(value, null, 2);
                    } else if (Array.isArray(value)) {
                        formattedValue = value.join(', ');
                    } else {
                        formattedValue = String(value);
                    }
            }
            
            const fieldData = {
                key,
                label,
                value: formattedValue,
                rawValue: value,
                type: schemaField.type || 'Text',
                required: schemaField.required || false,
                schemaField // сохраняем всю схему для дальнейшего использования
            };
            
            fields.push(fieldData);
            
            // Группируем поля по категориям для удобства
            const category = getFieldCategory(key, schemaField);
            if (!groupedFields[category]) {
                groupedFields[category] = [];
            }
            groupedFields[category].push(fieldData);
        });
        
        // Также обрабатываем поля, которые есть в formData, но не описаны в schema
        Object.entries(parsed).forEach(([key, value]) => {
            if (formSchema.find(f => f.name === key) || value === null || value === undefined || value === '') {
                return;
            }
            
            const label = key;
            let formattedValue = value;
            
            if (typeof value === 'object') {
                formattedValue = JSON.stringify(value, null, 2);
            } else if (Array.isArray(value)) {
                formattedValue = value.join(', ');
            } else {
                formattedValue = String(value);
            }
            
            const fieldData = {
                key,
                label,
                value: formattedValue,
                rawValue: value,
                type: 'Text',
                required: false,
                schemaField: null
            };
            
            fields.push(fieldData);
            
            const category = getFieldCategory(key, null);
            if (!groupedFields[category]) {
                groupedFields[category] = [];
            }
            groupedFields[category].push(fieldData);
        });

        // Извлекаем специальные поля
        const fioField = fields.find(f => f.key === 'fio');
        
        // Собираем студенческую информацию
        const studentFields = ['eduFaculty', 'eduGroup', 'eduCode'];
        const hasStudentInfo = studentFields.some(field => parsed[field]);
        const studentInfo = hasStudentInfo ? {
            faculty: fields.find(f => f.key === 'eduFaculty')?.value || 'Институт не указан',
            group: fields.find(f => f.key === 'eduGroup')?.value || 'Группа не указана',
            code: fields.find(f => f.key === 'eduCode')?.value || null
        } : null;

        // Собираем информацию о справках
        const certificateFields = fields.filter(f => 
            f.key.includes('certificate') || 
            f.key.includes('company') ||
            f.label.toLowerCase().includes('справк') ||
            f.label.toLowerCase().includes('организац')
        );
        
        const certificateInfo = certificateFields.length > 0 ? {
            type: fields.find(f => f.key === 'certificateType')?.rawValue,
            count: fields.find(f => f.key === 'certificateCount')?.rawValue || 0,
            companyName: fields.find(f => f.key === 'companyName')?.value,
            companyPhone: fields.find(f => f.key === 'companyPhone')?.value,
            fields: certificateFields
        } : null;

        return {
            fields,
            groupedFields,
            fioField,
            studentInfo,
            certificateInfo,
            hasCertificateInfo: certificateInfo !== null,
            hasStudentInfo: studentInfo !== null
        };
    };

    // Определяем категорию поля для группировки
    const getFieldCategory = (key, schemaField) => {
        if (schemaField?.category) {
            return schemaField.category;
        }
        
        const keyLower = key.toLowerCase();
        const labelLower = (schemaField?.label || '').toLowerCase();

        // Самый высокий приоритет — справки и организации
        if (
            keyLower.includes('certificate') ||
            keyLower.includes('company') ||
            labelLower.includes('справк') ||
            labelLower.includes('организац') ||
            labelLower.includes('в какую организацию')
        ) {
            return 'certificate';
        }

        // ФИО и имена людей
        if (
            keyLower.includes('fio') ||
            keyLower.includes('фио') ||
            (keyLower.includes('name') && !keyLower.includes('company'))
        ) {
            return 'personal';
        }

        if (keyLower.includes('edu') || keyLower.includes('group') || keyLower.includes('faculty')) {
            return 'education';
        }

        if (keyLower.includes('email') || keyLower.includes('phone') || keyLower.includes('contact') || keyLower === 'userphone') {
            return 'contacts';
        }

        if (keyLower.includes('description') || keyLower.includes('message') || 
            keyLower.includes('comment') || keyLower.includes('details')) {
            return 'details';
        }
        
        return 'other';
    };

    // Получение класса для типа справки (для обратной совместимости)
    const getCertificateTypeClass = (type) => {
        if (!type) return 'type-default';
        
        const map = {
            'ПФ': 'type-pfr',
            'PF': 'type-pfr',
            'Общая': 'type-general',
            'General': 'type-general'
        };
        return map[type] || 'type-default';
    };

    // Форматирование типа справки (для обратной совместимости)
    const formatCertificateType = (type) => {
        if (!type) return type;
        
        const map = {
            'ПФ': 'Для Пенсионного фонда',
            'Общая': 'Общая справка / По месту требования',
            'PF': 'Для Пенсионного фонда',
            'General': 'Общая справка / По месту требования'
        };
        return map[type] || type;
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

    // Генерация отображаемого имени для поля
    const getFieldDisplayName = (key, schemaField) => {
        if (schemaField?.label) {
            return schemaField.label;
        }
        
        const nameMap = {
            'fio': 'ФИО',
            'eduCode': 'Код направления',
            'eduGroup': 'Группа',
            'eduFaculty': 'Институт',
            'certificateType': 'Тип справки',
            'certificateCount': 'Количество',
            'companyName': 'Наименование организации',
            'companyPhone': 'Телефон организации',
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
        
        return nameMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    return {
        processFormData,
        getCertificateTypeClass,
        formatCertificateType,
        parseFormData,
        getFieldDisplayName
    };
};