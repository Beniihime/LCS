// composables/useTicketStatusChange.js
import { ref } from 'vue';

export function useTicketStatusChange(axios, toast) {
    const updatingStatus = ref(false);

    const updateTicketStatus = async (ticketId, newStatus) => {
        updatingStatus.value = true;
        try {
            await axios.patch(`/api/tickets/${ticketId}/status`, {
                ticketStatus: newStatus
            });

            toast.add({
                severity: 'success',
                summary: 'Статус обновлён',
                detail: `Новый статус: ${newStatus}`,
                life: 3000
            });

            return true;
        } catch (e) {
            toast.add({
                severity: 'error',
                summary: 'Ошибка',
                detail: 'Не удалось изменить статус заявки',
                life: 3000
            });
            return false;
        } finally {
            updatingStatus.value = false;
        }
    };

    return {
        updatingStatus,
        updateTicketStatus
    };
}
