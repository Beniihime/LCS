import { ref } from 'vue';

export const useInfraCallDetails = ({ axiosInstance, loadCallById }) => {
    const isDialogVisible = ref(false);
    const selectedCall = ref(null);
    const documents = ref([]);
    const negotiations = ref([]);
    const errorOccurred = ref(false);
    const timelineEvents = ref([]);

    const fetchUserFullName = async (userId) => {
        if (!userId) return '';
        try {
            const response = await axiosInstance.get(`/api/infra-manager/users/${userId}`);
            return response?.data?.fullName || '';
        } catch (error) {
            console.debug(`Не удалось загрузить пользователя ${userId}:`, error);
            return '';
        }
    };

    const fetchDocuments = async (callId) => {
        try {
            const response = await axiosInstance.get(`/api/infra-manager/calls/${callId}/documents`);
            documents.value = response.data;
        } catch (error) {
            console.error('Ошибка при загрузке документов:', error);
        }
    };

    const fetchNegotiations = async (callId) => {
        try {
            const response = await axiosInstance.get(`/api/infra-manager/calls/${callId}/negotiations`);
            negotiations.value = response.data;
        } catch (error) {
            console.error('Ошибка при загрузке данных о согласованиях:', error);
        }
    };

    const openCallDetails = async (callId) => {
        isDialogVisible.value = true;
        errorOccurred.value = false;
        try {
            const callData = await loadCallById(callId);

            timelineEvents.value = [
                { date: callData.utcDateRegistered, label: 'Регистраиця' },
                { date: callData.utcDateOpened, label: 'Открытие' },
                { date: callData.utcDateAccomplished, label: 'Выполнение' },
                { date: callData.utcDateClosed, label: 'Закрытие' },
            ].filter(event => event.date);

            const [initiatorFullName, clientFullName, ownerFullName, executorFullName, accomplisherFullName] = await Promise.all([
                fetchUserFullName(callData.initiatorID),
                fetchUserFullName(callData.clientID),
                fetchUserFullName(callData.ownerID),
                fetchUserFullName(callData.executorID),
                fetchUserFullName(callData.accomplisherID),
            ]);

            selectedCall.value = {
                ...callData,
                initiatorFullName,
                clientFullName,
                ownerFullName,
                executorFullName,
                accomplisherFullName,
            };

            await fetchNegotiations(callId);
            await fetchDocuments(callId);
        } catch (error) {
            console.debug('Ошибка при загрузке информации о заявке:', error);
            errorOccurred.value = true;
        }
    };

    const closeDialog = () => {
        isDialogVisible.value = false;
        selectedCall.value = null;
    };

    return {
        isDialogVisible,
        selectedCall,
        documents,
        negotiations,
        errorOccurred,
        timelineEvents,
        openCallDetails,
        closeDialog,
    };
};
