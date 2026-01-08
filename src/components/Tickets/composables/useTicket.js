import { ref } from 'vue';

export const useTicket = (axiosInstance) => {
    const selectedTicket = ref(null);
    const loading = ref(false);
    const error = ref(false);

    // Загрузка данных тикета
    const loadTicket = async (ticketId) => {
        if (!ticketId) return;
        
        loading.value = true;
        error.value = false;
        
        try {
            const response = await axiosInstance.get(`/api/tickets/${ticketId}`);
            selectedTicket.value = response.data;
        } catch (err) {
            console.error('Ошибка при загрузке деталей заявки:', err);
            error.value = true;
        } finally {
            loading.value = false;
        }
    };

    // Сброс состояния
    const resetTicket = () => {
        selectedTicket.value = null;
        loading.value = false;
        error.value = false;
    };

    return {
        selectedTicket,
        loading,
        error,
        loadTicket,
        resetTicket
    };
};