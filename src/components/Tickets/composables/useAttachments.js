import { ref } from 'vue';

export const useAttachments = (axiosInstance) => {
    const downloadingAttachmentId = ref(null);

    // Скачивание вложения
    const downloadAttachment = async (attachmentId, fileName, mimeType = 'application/pdf') => {
        downloadingAttachmentId.value = attachmentId;
        
        try {
            const response = await axiosInstance.get(`/api/tickets/attachments/${attachmentId}`);
            const base64String = response.data;
            
            const cleanBase64 = base64String.includes('base64,') 
                ? base64String.split('base64,')[1] 
                : base64String.replace(/\s/g, '');
            
            if (!cleanBase64 || cleanBase64.trim() === '') {
                throw new Error('Получена пустая строка');
            }
            
            try {
                const binaryString = atob(cleanBase64);
                const bytes = new Uint8Array(binaryString.length);
                
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                const blob = new Blob([bytes], { type: mimeType });
                const url = window.URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
            } catch (decodeError) {
                console.error('Ошибка декодирования Base64:', decodeError);
                throw new Error('Неверный формат данных файла');
            }
        
        } catch (error) {
            console.error('Ошибка при скачивании файла:', error);
            // Здесь можно добавить уведомление пользователю
        } finally {
            downloadingAttachmentId.value = null;
        }
    };

    return {
        downloadingAttachmentId,
        downloadAttachment
    };
};