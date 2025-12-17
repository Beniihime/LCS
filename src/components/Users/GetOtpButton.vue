<template>
    <div class="otp-component">
        <!-- Кнопка для открытия OTP -->
        <Button 
            :icon="icon || 'pi pi-key'" 
            :label="showLabel ? 'Показать OTP' : ''"
            :loading="loadingOtp"
            :disabled="loadingOtp !== false"
            class="p-button-outlined w-100"
            :severity="buttonSeverity || 'help'"
            @click.stop="getOtpCode"
            :class="buttonClass"
        />
        
        <!-- Модальное окно для отображения OTP -->
        <Dialog 
            v-model:visible="otpDialogVisible" 
            :style="{ width: '450px' }" 
            :header="dialogTitle" 
            :modal="true" 
            class="p-fluid otp-dialog"
            @hide="onDialogClose"
        >
            <div class="otp-dialog-content">
                <div class="otp-display-container">
                    <div class="otp-label">Код подтверждения</div>
                    <div class="otp-code-display" :class="{ 'loading': loadingOtp }" @click="copyOtpCode">
                        {{ otpCode || (loadingOtp ? 'Загрузка...' : '••••••') }}
                    </div>
                </div>
            </div>
            
            <template #footer>
                <div class="d-flex justify-content-between w-100">
                    <Button 
                        icon="pi pi-refresh" 
                        label="Обновить" 
                        @click="refreshOtpCode"
                        :loading="loadingOtp !== false"
                        outlined
                        severity="secondary"
                    />
                    <Button 
                        icon="pi pi-check" 
                        label="Готово" 
                        @click="otpDialogVisible = false"
                        severity="success"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import axiosInstance from '@/utils/axios.js';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    userId: {
        type: String,
        required: true
    },
    buttonLabel: {
        type: String,
        default: 'Получить OTP'
    },
    showLabel: {
        type: Boolean,
        default: false
    },
    icon: {
        type: String,
        default: 'pi pi-key'
    },
    buttonSeverity: {
        type: String,
        default: 'help'
    },
    buttonClass: {
        type: String,
        default: ''
    },
    dialogTitle: {
        type: String,
        default: 'OTP Код'
    },
    autoCopy: {
        type: Boolean,
        default: true
    },
    autoShowDialog: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['otp-loaded', 'dialog-closed', 'error']);

const toast = useToast();
const otpDialogVisible = ref(false);
const otpCode = ref('');
const loadingOtp = ref(false);

const getOtpCode = async () => {
    try {
        loadingOtp.value = true;
        otpCode.value = '';
        
        if (props.autoShowDialog) {
            otpDialogVisible.value = true;
        }
        
        const response = await axiosInstance.get(`/api/max/opt/${props?.userId}`);
        otpCode.value = response.data;
        
        // Автоматическое копирование в буфер обмена
        if (props.autoCopy) {
            copyToClipboard(response.data);
        }
        
        emit('otp-loaded', response.data);
        
    } catch (error) {
        console.error('Ошибка при получении OTP:', error);
        
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось получить OTP код',
            life: 3000
        });
        
        emit('error', error);
        
    } finally {
        loadingOtp.value = false;
    }
};

const refreshOtpCode = async () => {
    await getOtpCode();
};

const copyOtpCode = () => {
    if (otpCode.value) {
        copyToClipboard(otpCode.value);
    }
};

const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'OTP код скопирован в буфер обмена',
            life: 2000
        });
    }).catch(err => {
        console.error('Ошибка копирования:', err);
            toast.add({
            severity: 'warn',
            summary: 'Ошибка',
            detail: 'Не удалось скопировать код',
            life: 2000
        });
    });
};

const closeDialog = () => {
    otpDialogVisible.value = false;
    emit('dialog-closed');
};

const onDialogClose = () => {
    emit('dialog-closed');
};
</script>

<style scoped>
.otp-component {
    display: inline-block;
    z-index: 1000;
}

.otp-dialog-content {
    padding: 1rem 0;
}

.otp-display-container {
    text-align: center;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.otp-label {
    font-size: 0.9rem;
    opacity: 0.9;
    margin-bottom: 0.5rem;
    letter-spacing: 1px;
}

.otp-code-display {
    font-size: 3rem;
    font-weight: 900;
    letter-spacing: 8px;
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.otp-code-display.loading {
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
}

.otp-code-display:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    cursor: pointer;
}

@media (max-width: 768px) {
    .otp-code-display {
        font-size: 2rem;
        letter-spacing: 6px;
        padding: 0.75rem;
    }
    
    .otp-display-container {
        padding: 1.5rem;
    }
}

:deep(.otp-dialog .p-dialog-header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

:deep(.otp-dialog .p-dialog-header .p-dialog-title) {
    color: white;
}
</style>