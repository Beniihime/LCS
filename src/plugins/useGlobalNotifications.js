import { useNotificationStore } from '@/stores/notifications';
import { useToast } from 'primevue/usetoast';

export function useGlobalNotifications() {
    const notificationStore = useNotificationStore();
    const toast = useToast();

    function addToast({ severity, summary, detail, userName, page }) {
        const notification = {
            severity,
            summary,
            detail,
            userName,
            page,
            timestamp: new Date().toISOString(),
        };

        notificationStore.addNotification(notification);
        toast.add({ severity, summary, detail, life: 3000 });
    }

    return { addToast };
}
