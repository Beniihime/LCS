import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationStore = defineStore('notifications', () => {
    const notifications = ref([]);
    const unreadCount = ref(0);

    function addNotification(notification) {
        notifications.value.push(notification);
        unreadCount.value++;
    }

    function clearUnread() {
        unreadCount.value = 0;
    }

    return { notifications, unreadCount, addNotification, clearUnread };
});
