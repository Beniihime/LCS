<script setup>
import { useNotificationStore } from '@/stores/notifications';
import { onMounted } from 'vue';
import formatDate from '@/utils/formatDate.js';  // Функция для форматирования даты

const notificationStore = useNotificationStore();

onMounted(() => {
    notificationStore.clearUnread();  // Сбрасываем счетчик непрочитанных уведомлений
});
</script>

<template>
    <main>
        <div class="content-wrap">
            <h2>Ваши уведомления</h2>
            <div class="notifications-list">
                <div v-for="notification in notificationStore.notifications" 
                     :key="notification.id" 
                     class="notification-card">
                    <div class="notification-header">
                        <span class="notification-summary">{{ notification.summary }}</span>
                        <span class="notification-timestamp">{{ formatDate(notification.timestamp) }}</span>
                    </div>
                    <div class="notification-detail">
                        <p>{{ notification.detail }} {{ notification.userName }}</p>
                        <p><strong>Отправлено со страницы:</strong> {{ notification.page }}</p>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}
.content-wrap {
    flex-grow: 1;
    padding: 20px;
    color: var(--p-text-color);
}

h2 {
    margin-bottom: 20px;
    font-size: 2rem;
    color: var(--p-text-color);
}

/* Оформление карточек уведомлений */
.notifications-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.notification-card {
    background-color: var(--p-grey-4);
    border-radius: 10px;
    padding: 15px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.notification-card:hover {
    transform: scale(1.01);
}

.notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.notification-summary {
    font-weight: bold;
    font-size: 1.2rem;
}

.notification-timestamp {
    font-size: 0.9rem;
    color: var(--p-grey-1);
}

.notification-detail {
    font-size: 1rem;
    color: var(--p-text-color);
}

.notification-detail p {
    margin: 5px 0;
}
</style>
